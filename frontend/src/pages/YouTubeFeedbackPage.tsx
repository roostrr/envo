import React, { useEffect, useState } from 'react';

const YouTubeFeedbackPage = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/summary-feedback/analytics');
        if (!res.ok) throw new Error('Failed to fetch analytics');
        const data = await res.json();
        setAnalytics(data);
      } catch (err) {
        setError('Failed to load analytics.');
      }
      setLoading(false);
    };
    fetchAnalytics();
  }, []);

  const handleDownloadCSV = () => {
    window.open('/api/summary-feedback/download', '_blank');
  };

  return (
    <div className="min-h-screen bg-dark-950 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6 text-center text-white">ENVO Learn Feedback Analytics</h1>
        {loading && <div className="text-gray-300">Loading...</div>}
        {error && <div className="text-neon-red mb-4">{error}</div>}
        {analytics && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-dark-800 p-6 rounded-lg shadow text-center border border-dark-700">
                <div className="text-2xl font-bold text-neon-yellow">{analytics.avgRating.toFixed(2)}</div>
                <div className="text-gray-300">Average Rating</div>
              </div>
              <div className="bg-dark-800 p-6 rounded-lg shadow text-center border border-dark-700">
                <div className="text-2xl font-bold text-white">{analytics.total}</div>
                <div className="text-gray-300">Total Feedback</div>
              </div>
              <div className="bg-dark-800 p-6 rounded-lg shadow text-center border border-dark-700">
                <button
                  className="bg-neon-blue text-white px-4 py-2 rounded-lg font-semibold hover:bg-neon-cyan"
                  onClick={handleDownloadCSV}
                >
                  Download Feedback (CSV)
                </button>
              </div>
            </div>
            {/* Topic Search Bar Chart */}
            <div className="bg-dark-800 p-6 rounded-lg shadow mb-8 border border-dark-700">
              <h2 className="text-xl font-bold mb-4 text-white">Topic Search Frequency</h2>
              <div className="overflow-x-auto">
                <div className="flex items-end space-x-4 h-40">
                  {analytics.topicSearches && analytics.topicSearches.length > 0 ? (
                    analytics.topicSearches.slice(0, 10).map((t: any) => (
                      <div key={t.topic} className="flex flex-col items-center">
                        <div
                          className="bg-neon-blue w-8 rounded-t"
                          style={{ height: `${Math.max(10, t.count * 10)}px` }}
                          title={`${t.topic}: ${t.count}`}
                        ></div>
                        <div className="text-xs mt-2 w-16 truncate text-center text-white" title={t.topic}>{t.topic}</div>
                        <div className="text-xs text-gray-400">{t.count}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-400">No topic search data.</div>
                  )}
                </div>
              </div>
            </div>
            {/* Recent Feedback */}
            <div className="bg-dark-800 p-6 rounded-lg shadow border border-dark-700">
              <h2 className="text-xl font-bold mb-4 text-white">Recent Feedback</h2>
              {analytics.recent && analytics.recent.length > 0 ? (
                <ul className="divide-y divide-dark-600">
                  {analytics.recent.map((f: any, idx: number) => (
                    <li key={idx} className="py-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-neon-yellow">{'★'.repeat(f.rating)}{'☆'.repeat(5 - f.rating)}</span>
                        <span className="text-white">{f.topic}</span>
                        <span className="text-xs text-gray-400 ml-2">{new Date(f.createdAt).toLocaleString()}</span>
                      </div>
                      {f.comment && <div className="text-gray-300 ml-8">{f.comment}</div>}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-gray-400">No feedback yet.</div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default YouTubeFeedbackPage; 