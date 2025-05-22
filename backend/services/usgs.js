const axios = require('axios');
const https = require('https');
const { parseStringPromise } = require('xml2js');

const agent = new https.Agent({ rejectUnauthorized: false });

const sites = {
  mckenzie_hayden: '14164900',
  willamette_eugene: '14158050'
};

const flowThresholds = {
  mckenzie_hayden: { low: 900, optimal: [1000, 2500], high: 3000 },
  willamette_eugene: { low: 1000, optimal: [2000, 4000], high: 5000 }
};

async function fetchUSGSData(river = 'mckenzie_hayden') {
  const key = river.toLowerCase();
  const result = {
    station: key,
    flowCFS: null,
    tempF: null,
    flowHistory: []
  };

  if (key === 'willamette_eugene') {
    // Fetch water temp from USGS
    const usgsUrl = `https://waterservices.usgs.gov/nwis/iv/?format=json&sites=${sites[key]}&parameterCd=00010&siteStatus=all`;
    try {
      const usgsResp = await axios.get(usgsUrl, { httpsAgent: agent });
      const ts = usgsResp.data.value.timeSeries;
      for (let series of ts) {
        if (!series.values[0]?.value?.length) continue;
        const variable = series.variable.variableCode[0].value;
        if (variable === '00010') {
          const celsius = Number(series.values[0].value[0].value);
          result.tempF = Math.round((celsius * 9) / 5 + 32);
        }
      }
    } catch (err) {
      console.warn('USGS temp fetch failed for Eugene:', err.message);
    }

    // Fetch CFS from NWRFC XML
    const nwUrl = 'https://www.nwrfc.noaa.gov/xml/xml.cgi?id=EUGO3&pe=HG&dtype=b&numdays=2';

    try {
      const { data } = await axios.get(nwUrl, { httpsAgent: agent });
      const parsed = await parseStringPromise(data);
      const entries = parsed?.HydroMetData?.SiteData?.[0]?.observedData?.[0]?.observedValue || [];

      result.flowHistory = entries
        .map(entry => {
          const time = entry?.dataDateTime?.[0];
          const dischargeRaw = entry?.discharge?.[0];
          const discharge = typeof dischargeRaw === 'string'
            ? parseFloat(dischargeRaw)
            : typeof dischargeRaw === 'object' && dischargeRaw._ 
              ? parseFloat(dischargeRaw._)
              : NaN;

          return time && !isNaN(discharge) ? { time, value: Math.round(discharge) } : null;
        })
        .filter(Boolean);

      const latest = result.flowHistory.at(-1);
      if (latest) {
        result.flowCFS = latest.value;
      }

      

      console.log('Parsed Eugene flowHistory:', result.flowHistory);
      console.log('Latest Eugene flowCFS:', result.flowCFS);
      console.log('Top-level keys:', Object.keys(parsed || {}));
      console.log('SiteData exists:', parsed?.HydroMetData?.SiteData?.length);
    } catch (err) {
      console.warn('NWRFC flow fetch failed for Eugene:', err.message);
    }

  }

  if (key === 'mckenzie_hayden') {
    const url = `https://waterservices.usgs.gov/nwis/iv/?format=json&sites=${sites[key]}&parameterCd=00060,00010&siteStatus=all&period=P2D`;
    try {
      const { data } = await axios.get(url, { httpsAgent: agent });
      const ts = data.value.timeSeries;

      for (let series of ts) {
        const variable = series.variable.variableCode[0].value;

        if (variable === '00060') {
          result.flowHistory = series.values[0].value.map(v => ({
            time: v.dateTime,
            value: Math.round(Number(v.value))
          }));
          result.flowCFS = result.flowHistory.at(-1)?.value ?? null;
        }

        if (variable === '00010') {
          const val = series.values[0].value.at(-1)?.value;
          if (val !== undefined) {
            result.tempF = Math.round((Number(val) * 9) / 5 + 32);
          }
        }
      }
    } catch (err) {
      console.warn(`USGS fetch failed for ${river}:`, err.message);
    }
  }

  // Flow classification
  const thresholds = flowThresholds[key];
  if (result.flowCFS !== null && thresholds) {
    if (result.flowCFS < thresholds.low) {
      result.flowStatus = 'low';
    } else if (result.flowCFS > thresholds.high) {
      result.flowStatus = 'high';
    } else if (
      result.flowCFS >= thresholds.optimal[0] &&
      result.flowCFS <= thresholds.optimal[1]
    ) {
      result.flowStatus = 'optimal';
    } else {
      result.flowStatus = 'fair';
    }
    result.flowThresholds = thresholds;
  }

  console.log(`${key.toUpperCase()} result:`, result);
  return result;
}

module.exports = { fetchUSGSData };
