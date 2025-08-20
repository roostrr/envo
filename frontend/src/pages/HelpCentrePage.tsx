import React, { useState, useEffect } from 'react';

const HelpCentrePage = () => {
  const [message, setMessage] = useState('');
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchQueries = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/support/my-queries', { credentials: 'include' });
      const data = await res.json();
      if (data.queries) setQueries(data.queries);
      setLoading(false);
    } catch (err) {
      setError('Failed to load your queries.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueries();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!message.trim()) {
      setError('Please enter your query.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/support/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('Your query has been submitted!');
        setMessage('');
        fetchQueries();
      } else {
        setError(data.error || 'Failed to submit query.');
      }
    } catch (err) {
      setError('Failed to submit query.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6 text-center">Help Centre</h1>
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow mb-8">
          <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-2">Submit a Query</label>
          <textarea
            id="query"
            className="w-full border border-gray-300 rounded-lg p-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Describe your issue or question..."
            required
          />
          {error && <div className="text-red-600 mb-2">{error}</div>}
          {success && <div className="text-green-600 mb-2">{success}</div>}
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit'}
          </button>
        </form>
        <h2 className="text-xl font-bold mb-4">Your Queries</h2>
        {loading && <div>Loading...</div>}
        <div className="space-y-4">
          {queries.length === 0 && !loading && <div className="text-gray-500">No queries submitted yet.</div>}
          {queries.map((q: any) => (
            <div key={q._id} className="bg-white p-4 rounded-lg shadow border">
              <div className="mb-2">
                <span className="font-semibold text-gray-800">You:</span> {q.message}
              </div>
              <div className="text-sm text-gray-500 mb-1">Submitted: {new Date(q.createdAt).toLocaleString()}</div>
              {q.response && (
                <div className="mt-2">
                  <span className="font-semibold text-blue-700">Admin Response:</span> {q.response}
                  <div className="text-xs text-gray-400 mt-1">Responded: {q.updatedAt && new Date(q.updatedAt).toLocaleString()}</div>
                </div>
              )}
              {!q.response && <div className="text-xs text-yellow-600 mt-2">Awaiting admin response...</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HelpCentrePage; 