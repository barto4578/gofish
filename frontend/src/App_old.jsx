import { useState, useEffect } from 'react';
import './App.css';

import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

function getCardColor(quality) {
  switch (quality?.toLowerCase()) {
    case 'good': return 'border-green-500';
    case 'fair': return 'border-yellow-500';
    case 'poor': return 'border-red-500';
    default: return 'border-gray-300';
  }
}

function getFlowStatusColor(status) {
  switch (status) {
    case 'optimal': return 'text-green-600 font-semibold';
    case 'fair': return 'text-yellow-600 font-semibold';
    case 'low': return 'text-blue-600 font-semibold';
    case 'high': return 'text-red-600 font-semibold';
    default: return 'text-gray-500';
  }
}

function getFlyIcons(flyList) {
  return flyList.map(fly => {
    const name = fly.toLowerCase();
    if (name.includes('caddis')) return `🪰 ${fly}`;
    if (name.includes('stonefly')) return `🪳 ${fly}`;
    if (name.includes('mayfly')) return `🦟 ${fly}`;
    if (name.includes('streamer')) return `🎣 ${fly}`;
    if (name.includes('worm')) return `🪱 ${fly}`;
    if (name.includes('nymph')) return `🪲 ${fly}`;
    return `🎣 ${fly}`;
  });
}

function App() {
  const [data, setData] = useState({});
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const rivers = [
    { key: 'mckenzie_hayden', label: 'McKenzie @ Hayden Bridge' },
    { key: 'willamette_eugene', label: 'Willamette @ Eugene' }
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const [mckenzieHayden, willametteEugene, reportData] = await Promise.all([
        fetch('http://localhost:3001/api/recommendation?river=mckenzie_hayden').then(res => res.json()),
        fetch('http://localhost:3001/api/recommendation?river=willamette_eugene').then(res => res.json()),
        fetch('http://localhost:3001/api/reports').then(res => res.json())
      ]);

      setData({
        mckenzie_hayden: mckenzieHayden,
        willamette_eugene: willametteEugene
      });
      setReport(reportData);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
      setLastUpdated(new Date().toLocaleString());
    }
  };

  useEffect(() => {
    fetchData(); // initial load

    const interval = setInterval(() => {
      console.log('⏳ Auto-refreshing data...');
      fetchData();
    }, 15 * 60 * 1000); // 15 minutes

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 font-sans bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Fishing Conditions</h1>
        <div className="text-right">
          {lastUpdated && (
            <p className="text-sm text-gray-500">Last updated: {lastUpdated}</p>
          )}
          <button
            className="mt-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={fetchData}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {rivers.map(({ key, label }) => {
            const riverData = data[key];
            const isOptimal = riverData.flowStatus === 'optimal' && riverData.quality === 'Good';

            console.log(`${key} flowHistory:`, Array.isArray(riverData.flowHistory) ? riverData.flowHistory.length : 'undefined');

            return (
              <div
                key={key}
                className={`shadow p-4 rounded-xl space-y-3 border-l-4 ${
                  isOptimal ? 'bg-green-50 border-green-500' : getCardColor(riverData.quality)
                }`}
              >
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold">{label}</h2>
                  {isOptimal && (
                    <span className="bg-green-100 text-green-700 text-sm px-3 py-1 rounded-full font-semibold">
                      🎣 Go Fish
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold">🌡 Conditions</h3>
                  <p><strong>Recommendation:</strong> {
                    riverData.flowStatus === 'optimal'
                      ? '🎣 Go Fish'
                      : riverData.flowStatus === 'fair'
                      ? '🟡 Consider fishing'
                      : riverData.flowStatus === 'low' || riverData.flowStatus === 'high'
                      ? '⛔ Don’t fish'
                      : '🤷 Unknown'
                  }</p>
                  {riverData.flowThresholds && (
                    <p>
                      <p><strong>Low:</strong> &lt; {riverData.flowThresholds.low} CFS</p>
                      <p><strong>Optimal:</strong> {riverData.flowThresholds.optimal[0]}–{riverData.flowThresholds.optimal[1]} CFS</p>
                      <p><strong>High:</strong> &gt; {riverData.flowThresholds.high} CFS</p>
                    </p>
                  )}
                  <h3 className="font-semibold">🌊 Flow</h3>
                  <p><strong>Flow Rate:</strong> {riverData.flowCFS ?? '—'} CFS</p>
                  {riverData.flowStatus && (
                    <p>
                      <strong>Flow Status:</strong>{' '}
                      <span className={getFlowStatusColor(riverData.flowStatus)}>
                        {riverData.flowStatus}
                      </span>
                    </p>
                  )}
                  {riverData.flowThresholds && (
                    <div className="text-sm text-gray-700 mt-1 space-y-1">
                      <p><strong>Low:</strong> &lt; {riverData.flowThresholds.low} CFS</p>
                      <p><strong>Optimal:</strong> {riverData.flowThresholds.optimal[0]}–{riverData.flowThresholds.optimal[1]} CFS</p>
                      <p><strong>High:</strong> &gt; {riverData.flowThresholds.high} CFS</p>
                    </div>
                  )}
                  <p><strong>Water Temp:</strong> {riverData.tempF ?? '—'}°F</p>
                  <p><strong>Weather:</strong> {riverData.weather.conditions}</p>
                  <p><strong>Air Temp:</strong> {riverData.weather.airTempF}°F</p>
                  <p><strong>Wind:</strong> {riverData.weather.windMPH} mph</p>
                </div>

                <div>
                  <h3 className="font-semibold">🎣 Recommended Setup</h3>
                  <p><strong>Method:</strong> {riverData.recommendation.method}</p>
                  <p><strong>Flies:</strong></p>
                  <ul className="list-disc ml-6">
                    {getFlyIcons(riverData.recommendation.flies).map((fly, i) => (
                      <li key={i}>{fly}</li>
                    ))}
                  </ul>
                  <p><strong>Tip:</strong> {riverData.recommendation.tip}</p>
                </div>

                {Array.isArray(riverData.flowHistory) && riverData.flowHistory.length > 0 && (
                  <div>
                    <h3 className="font-semibold">📈 Flow Trend (past 48h)</h3>
                    <div style={{ height: 150 }}>
                      <Line
                        data={{
                          labels: riverData.flowHistory.map(d =>
                            new Date(d.time).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          ),
                          datasets: [
                            {
                              label: 'CFS',
                              data: riverData.flowHistory.map(d => d.value),
                              borderColor: '#2563eb',
                              backgroundColor: 'rgba(37,99,235,0.2)',
                              tension: 0.3,
                              pointRadius: 0
                            }
                          ]
                        }}
                        options={{
                          responsive: true,
                          plugins: { legend: { display: false } },
                          scales: {
                            y: {
                              beginAtZero: false,
                              title: { display: true, text: 'CFS' }
                            },
                            x: { ticks: { maxTicksLimit: 6 } }
                          }
                        }}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold">🐟 Target Species</h3>
                  <p>{riverData.species.join(', ')}</p>
                </div>
              </div>
            );
          })}

          {report && (
            <div className="bg-white shadow p-4 rounded-xl space-y-3 border-l-4 border-blue-400">
              <h2 className="text-xl font-bold">📜 Caddis Fly Shop Report</h2>
              <p className="italic">{report.summary}</p>
              {report.highlights.length > 0 && (
                <>
                  <h3 className="font-semibold">Observed Activity:</h3>
                  <ul className="list-disc ml-6">
                    {report.highlights.map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ul>
                </>
              )}
              <a
                href={report.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline mt-2 inline-block"
              >
                View full report
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
