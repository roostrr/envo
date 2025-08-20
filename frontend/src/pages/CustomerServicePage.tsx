import React, { useState, useEffect } from 'react';

const CustomerServicePage = () => {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [replying, setReplying] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [success, setSuccess] = useState('');

  const fetchQueries = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/support/all-queries', { credentials: 'include' });
      const data = await res.json();
      if (data.queries) setQueries(data.queries);
      setLoading(false);
    } catch (err) {
      setError('Failed to load queries.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueries();
  }, []);

  const handleReply = async (queryId: string) => {
    setError('');
    setSuccess('');
    if (!replyText.trim()) {
      setError('Please enter a reply.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/support/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ queryId, response: replyText })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('Reply sent!');
        setReplying(null);
        setReplyText('');
        fetchQueries();
      } else {
        setError(data.error || 'Failed to send reply.');
      }
    } catch (err) {
      setError('Failed to send reply.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-dark-950 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6 text-center text-white">Customer Service</h1>
        {error && <div className="text-neon-red mb-2">{error}</div>}
        {success && <div className="text-neon-green mb-2">{success}</div>}
        {loading && <div className="text-gray-300">Loading...</div>}
        <div className="space-y-6">
          {queries.length === 0 && !loading && <div className="text-gray-400">No queries yet.</div>}
          {queries.map((q: any) => (
            <div key={q._id} className="bg-dark-800 p-4 rounded-lg shadow border border-dark-700">
              <div className="mb-1 text-sm text-gray-400">{q.userName} ({q.userEmail})</div>
              <div className="mb-2">
                <span className="font-semibold text-white">Query:</span> <span className="text-gray-300">{q.message}</span>
              </div>
              <div className="text-xs text-gray-400 mb-2">Submitted: {new Date(q.createdAt).toLocaleString()}</div>
              {q.response ? (
                <div className="mt-2">
                  <span className="font-semibold text-neon-blue">Admin Response:</span> <span className="text-gray-300">{q.response}</span>
                  <div className="text-xs text-gray-400 mt-1">Responded: {q.updatedAt && new Date(q.updatedAt).toLocaleString()}</div>
                </div>
              ) : (
                <div className="mt-2">
                  {replying === q._id ? (
                    <div className="space-y-2">
                      <textarea
                        className="w-full border border-dark-600 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-neon-pink bg-dark-700 text-white"
                        rows={2}
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        placeholder="Type your reply..."
                      />
                      <div className="flex space-x-2">
                        <button
                          className="bg-neon-blue text-white px-4 py-1 rounded-lg font-semibold hover:bg-neon-cyan transition-colors"
                          onClick={() => handleReply(q._id)}
                          disabled={loading}
                        >
                          {loading ? 'Sending...' : 'Send Reply'}
                        </button>
                        <button
                          className="bg-dark-600 text-gray-300 px-4 py-1 rounded-lg font-semibold hover:bg-dark-500 transition-colors"
                          onClick={() => { setReplying(null); setReplyText(''); }}
                          type="button"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      className="bg-neon-blue/20 text-neon-blue px-4 py-1 rounded-lg font-semibold hover:bg-neon-blue/30 transition-colors"
                      onClick={() => { setReplying(q._id); setReplyText(''); }}
                    >
                      Reply
                    </button>
                  )}
                  <div className="text-xs text-neon-yellow mt-2">Awaiting admin response...</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CustomerServicePage; 