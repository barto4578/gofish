const axios = require('axios');
const https = require('https');

const agent = new https.Agent({ rejectUnauthorized: false });
const API_KEY = process.env.OPENWEATHER_KEY;

const locations = {
  mckenzie_hayden: { lat: 44.093, lon: -122.973 },
  willamette_eugene: { lat: 44.058, lon: -123.092 }
};

async function fetchWeather(river = 'mckenzie_hayden') {
  const loc = locations[river.toLowerCase()];
  if (!loc) throw new Error(`Missing lat/lon for river: ${river}`);
  if (!API_KEY) throw new Error('Missing OPENWEATHER_KEY in .env');

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${loc.lat}&lon=${loc.lon}&units=imperial&appid=${API_KEY}`;

  try {
    const { data } = await axios.get(url, {
      httpsAgent: agent,
      timeout: 5000
    });

    return {
      airTempF: Math.round(data.main.temp),
      conditions: data.weather[0].description,
      windMPH: data.wind.speed
    };
  } catch (err) {
    console.warn(`OpenWeather fetch failed for ${river}:`, err.message);
    return {
      airTempF: null,
      conditions: 'Unavailable',
      windMPH: null
    };
  }
}

module.exports = { fetchWeather };
