import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Download, RefreshCw, TrendingUp, Users, MessageCircle, Star } from 'lucide-react';

interface FeedbackData {
  id: string;
  student_id: string;
  conversation_id: string;
  rating: number;
  review_text: string;
  sentiment_score: number;
  sentiment_label: string;
  conversation_summary: string;
  created_at: string;
}

interface AnalyticsData {
  total_feedback: number;
  average_rating: number;
  sentiment_distribution: {
    positive: number;
    negative: number;
    neutral: number;
  };
  average_sentiment_score: number;
  rating_distribution: {
    '1': number;
    '2': number;
    '3': number;
    '4': number;
    '5': number;
  };
  recent_feedback: FeedbackData[];
  positive_percentage: number;
  negative_percentage: number;
  neutral_percentage: number;
}

const ChatAgentSentimentPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = async () => {
    try {
      setError(null);
      const response = await fetch('/api/chat-sentiment-analytics');
      const data = await response.json();
      
      if (data.success) {
        setAnalytics(data.data);
      } else {
        setError(data.message || 'Failed to fetch analytics');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError('Failed to fetch analytics data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  const handleDownloadCSV = () => {
    if (!analytics) return;
    
    // Create CSV content
    const headers = ['Date', 'Student ID', 'Rating', 'Sentiment', 'Sentiment Score', 'Review'];
    const csvContent = [
      headers.join(','),
      ...analytics.recent_feedback.map(feedback => [
        new Date(feedback.created_at).toLocaleDateString(),
        feedback.student_id,
        feedback.rating,
        feedback.sentiment_label,
        feedback.sentiment_score,
        `"${feedback.review_text.replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');
    
    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-agent-feedback-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Prepare chart data
  const sentimentChartData = analytics ? [
    { name: 'Positive', value: analytics.sentiment_distribution.positive, color: '#10B981' },
    { name: 'Neutral', value: analytics.sentiment_distribution.neutral, color: '#6B7280' },
    { name: 'Negative', value: analytics.sentiment_distribution.negative, color: '#EF4444' }
  ].filter(item => item.value > 0) : [];

  const ratingChartData = analytics ? [
    { rating: '1★', count: analytics.rating_distribution['1'] },
    { rating: '2★', count: analytics.rating_distribution['2'] },
    { rating: '3★', count: analytics.rating_distribution['3'] },
    { rating: '4★', count: analytics.rating_distribution['4'] },
    { rating: '5★', count: analytics.rating_distribution['5'] }
  ] : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-blue"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              ENVO Chat Agent Sentiment Analysis
            </h1>
            <p className="text-gray-400">
              Analyze user sentiment and feedback for the AI chat agent
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="bg-dark-700 text-white px-4 py-2 rounded-lg hover:bg-dark-600 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button
              onClick={handleDownloadCSV}
              disabled={!analytics}
              className="bg-neon-blue text-white px-4 py-2 rounded-lg hover:bg-neon-cyan transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Download size={16} />
              Export CSV
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}
        
        {analytics && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-dark-800 p-6 rounded-lg border border-dark-700">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-neon-yellow">
                      {analytics.average_rating.toFixed(1)}
                    </div>
                    <div className="text-gray-300 text-sm">Average Rating</div>
                  </div>
                  <Star className="text-neon-yellow" size={24} />
                </div>
              </div>
              
              <div className="bg-dark-800 p-6 rounded-lg border border-dark-700">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-white">
                      {analytics.total_feedback}
                    </div>
                    <div className="text-gray-300 text-sm">Total Feedback</div>
                  </div>
                  <MessageCircle className="text-white" size={24} />
                </div>
              </div>
              
              <div className="bg-dark-800 p-6 rounded-lg border border-dark-700">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-neon-green">
                      {analytics.positive_percentage.toFixed(1)}%
                    </div>
                    <div className="text-gray-300 text-sm">Positive Sentiment</div>
                  </div>
                  <TrendingUp className="text-neon-green" size={24} />
                </div>
              </div>
              
              <div className="bg-dark-800 p-6 rounded-lg border border-dark-700">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-neon-blue">
                      {analytics.average_sentiment_score.toFixed(3)}
                    </div>
                    <div className="text-gray-300 text-sm">Avg Sentiment Score</div>
                  </div>
                  <Users className="text-neon-blue" size={24} />
                </div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Sentiment Distribution Chart */}
              <div className="bg-dark-800 p-6 rounded-lg border border-dark-700">
                <h2 className="text-xl font-bold mb-4 text-white">Sentiment Distribution</h2>
                {sentimentChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={sentimentChartData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, value, percent }) => 
                          percent > 0.05 ? `${name}: ${value}` : ''
                        }
                        labelLine={false}
                      >
                        {sentimentChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1f2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#ffffff'
                        }}
                        formatter={(value, name) => [value, name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <div className="text-gray-400 text-lg mb-2">No sentiment data available</div>
                      <div className="text-gray-500 text-sm">Submit some feedback to see sentiment distribution</div>
                    </div>
                  </div>
                )}
                
                {/* Legend for better readability */}
                <div className="flex justify-center mt-4 space-x-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-300">
                      Positive: {analytics.sentiment_distribution.positive}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                    <span className="text-sm text-gray-300">
                      Neutral: {analytics.sentiment_distribution.neutral}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm text-gray-300">
                      Negative: {analytics.sentiment_distribution.negative}
                    </span>
                  </div>
                </div>
              </div>

              {/* Rating Distribution Chart */}
              <div className="bg-dark-800 p-6 rounded-lg border border-dark-700">
                <h2 className="text-xl font-bold mb-4 text-white">Rating Distribution</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={ratingChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="rating" 
                      stroke="#9ca3af"
                      tick={{ fill: '#9ca3af' }}
                    />
                    <YAxis 
                      stroke="#9ca3af"
                      tick={{ fill: '#9ca3af' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1f2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#ffffff'
                      }}
                    />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Feedback */}
            <div className="bg-dark-800 p-6 rounded-lg border border-dark-700">
              <h2 className="text-xl font-bold mb-4 text-white">Recent Feedback</h2>
              {analytics.recent_feedback.length > 0 ? (
                <div className="space-y-4">
                  {analytics.recent_feedback.map((feedback, index) => (
                    <div key={index} className="border-b border-dark-600 pb-4 last:border-b-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <span className="text-neon-yellow text-lg">
                            {'★'.repeat(feedback.rating)}{'☆'.repeat(5 - feedback.rating)}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            feedback.sentiment_label === 'positive' ? 'bg-green-900 text-green-200' :
                            feedback.sentiment_label === 'negative' ? 'bg-red-900 text-red-200' :
                            'bg-gray-700 text-gray-300'
                          }`}>
                            {feedback.sentiment_label.charAt(0).toUpperCase() + feedback.sentiment_label.slice(1)}
                          </span>
                          <span className="text-gray-400 text-sm">
                            Score: {feedback.sentiment_score.toFixed(3)}
                          </span>
                        </div>
                        <span className="text-gray-400 text-sm">
                          {new Date(feedback.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-300 mb-1">
                        <span className="font-medium">Student ID:</span> {feedback.student_id}
                      </div>
                      
                      {feedback.review_text && (
                        <div className="text-gray-300 text-sm bg-dark-700 p-3 rounded-lg mt-2">
                          <span className="font-medium">Review:</span> {feedback.review_text}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-400 text-center py-8">
                  No feedback available yet.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatAgentSentimentPage;
