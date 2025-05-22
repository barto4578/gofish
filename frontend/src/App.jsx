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

import annotationPlugin from 'chartjs-plugin-annotation';

ChartJS.register(annotationPlugin);

function getCardColor(status) {
  switch (status) {
    case 'optimal': return 'border-green-500';
    case 'fair': return 'border-yellow-500';
    case 'low': return 'border-blue-500';
    case 'high': return 'border-red-500';
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

function getDecision(status) {
  switch (status) {
    case 'optimal': return '🎣 Go fish!';
    case 'fair': return '🟡 Fish if you want';
    case 'low':
    case 'high':
      return '⛔ Don’t fish';
    default:
      return '🤷 Unknown';
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
      setLastUpdated(new Date().toLocaleString());
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
    }, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 font-sans bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Fishing Conditions</h1>
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

      {loading && (
        <div className="mb-4 text-gray-600 font-medium">🔄 Loading data...</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {rivers.map(({ key, label }) => {
          const riverData = data[key];
          if (!riverData) return null;

          return (
            <div key={key} className="relative bg-white shadow-md p-6 rounded-xl">
              
              <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-800">{label}</h2>
                <span className={`mt-1 inline-block text-sm px-3 py-1 rounded-full font-medium ${
                  riverData.flowStatus === 'optimal'
                    ? 'bg-green-100 text-green-700'
                    : riverData.flowStatus === 'fair'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {getDecision(riverData.flowStatus)}
                </span>
              </div>
              
              {Array.isArray(riverData.flowHistory) && riverData.flowHistory.length > 0 && (
                <div className="mb-6">
                  <div className="bg-gray-50 rounded-md p-4">
                    <div style={{  }}>
                      <Line
                        data={{
                          labels: riverData.flowHistory.map(d =>
                            new Date(d.time).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          ),
                          datasets: [{
                            label: 'CFS',
                            data: riverData.flowHistory.map(d => d.value),
                            borderColor: '#2563eb',
                            backgroundColor: 'rgba(37,99,235,0.2)',
                            tension: 0.3,
                            pointRadius: 0,
                            fill: true
                          }]
                        }}
                        options={{
                          responsive: true,
                          plugins: {
                            legend: { display: false },
                            annotation: {
                              annotations: {
                                optimalBand: {
                                  type: 'box',
                                  yMin: riverData.flowThresholds?.optimal?.[0],
                                  yMax: riverData.flowThresholds?.optimal?.[1],
                                  backgroundColor: 'rgba(34,197,94,0.15)',
                                  borderWidth: 0
                                },
                                cautionBand: {
                                  type: 'box',
                                  yMin: riverData.flowThresholds?.optimal?.[1],
                                  yMax: riverData.flowThresholds?.high,
                                  backgroundColor: 'rgba(253,224,71,0.15)',
                                  borderWidth: 0
                                }
                              }
                            }
                          },
                          scales: {
                            y: {
                              beginAtZero: false,
                              ticks: { color: '#4b5563' },
                              grid: { color: '#e5e7eb' }
                            },
                            x: {
                              ticks: { maxTicksLimit: 6, color: '#4b5563' },
                              grid: { color: '#f3f4f6' }
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="text-base font-semibold text-blue-800 mb-2 flex items-center gap-2">🌊 Flow</h3>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-500 text-sm">Current:</span>
                    <span className="text-blue-900 font-bold text-lg">{riverData.flowCFS ?? '—'} CFS</span>
                  </div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-500 text-sm">Status:</span>
                    <span className={`${getFlowStatusColor(riverData.flowStatus)}`}>
                      {riverData.flowStatus}
                    </span>
                  </div>
                  {riverData.flowThresholds && (
                    <div className="text-sm mt-3 space-y-1 text-blue-900">
                      <div className="flex justify-between"><span>🔵 Low</span><span>&lt; {riverData.flowThresholds.low}</span></div>
                      <div className="flex justify-between"><span>🟢 Optimal</span><span>{riverData.flowThresholds.optimal[0]}–{riverData.flowThresholds.optimal[1]}</span></div>
                      <div className="flex justify-between"><span>🔴 High</span><span>&gt; {riverData.flowThresholds.high}</span></div>
                    </div>
                  )}
                </div>

                <div className="bg-yellow-50 rounded-lg p-4">
                  <h3 className="text-base font-semibold text-yellow-800 mb-2 flex items-center gap-2">🌤 Weather</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
                    <div className="font-medium text-gray-500">Air Temp</div>
                    <div className="font-bold text-lg">{riverData.weather.airTempF}°F</div>
                    <div className="font-medium text-gray-500">Water Temp</div>
                    <div className="font-bold text-lg">{riverData.tempF ?? '—'}°F</div>
                    <div className="font-medium text-gray-500">Conditions</div>
                    <div className="font-medium">{riverData.weather.conditions}</div>
                    <div className="font-medium text-gray-500">Wind</div>
                    <div className="font-medium">{riverData.weather.windMPH} mph</div>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-700 mb-1">🎣 Recommended Setup</h3>
                <p><span className="text-sm text-gray-500">Method:</span> <span className="text-base text-gray-900">{riverData.recommendation.method}</span></p>
                <p className="text-sm text-gray-500 mt-2">Flies:</p>
                <ul className="list-disc ml-6 text-sm text-gray-800">
                  {getFlyIcons(riverData.recommendation.flies).map((fly, i) => (
                    <li key={i}>{fly}</li>
                  ))}
                </ul>
                <p className="mt-2 text-sm text-gray-500">Tip:</p>
                <p className="text-gray-700 text-base">{riverData.recommendation.tip}</p>
              </div>

              <div className="mt-4">
                <h3 className="text-lg font-semibold text-gray-700 mb-1">🐟 Target Species</h3>
                <p className="text-base text-gray-800">{riverData.species.join(', ')}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App;
