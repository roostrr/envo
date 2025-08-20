import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle,
  BarChart3,
  Activity
} from 'lucide-react';

interface AccuracyMetrics {
  total_predictions: number;
  correct_predictions: number;
  accuracy_rate: number;
  last_updated: string | null;
}

interface FeedbackEntry {
  student_id: string;
  prediction: any;
  actual_outcome: string;
  timestamp: string;
  is_correct: boolean;
}

interface ModelAccuracyData {
  accuracy_metrics: AccuracyMetrics;
  recent_feedback: FeedbackEntry[];
  total_entries: number;
}

const ModelAccuracyPage = () => {
  const [accuracyData, setAccuracyData] = useState<ModelAccuracyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAccuracyData();
    // Refresh data every 30 seconds
    const interval = setInterval(fetchAccuracyData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAccuracyData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/model-accuracy');
      if (response.data.success) {
        setAccuracyData(response.data.data);
      } else {
        setError('Failed to load accuracy data');
      }
    } catch (error) {
      console.error('Error fetching accuracy data:', error);
      setError('Error loading accuracy data');
    } finally {
      setLoading(false);
    }
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 0.8) return 'text-neon-green';
    if (accuracy >= 0.6) return 'text-neon-yellow';
    return 'text-neon-red';
  };

  const getAccuracyIcon = (accuracy: number) => {
    if (accuracy >= 0.8) return <TrendingUp className="h-6 w-6 text-neon-green" />;
    if (accuracy >= 0.6) return <Target className="h-6 w-6 text-neon-yellow" />;
    return <TrendingDown className="h-6 w-6 text-neon-red" />;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getOutcomeLabel = (outcome: string) => {
    return outcome === 'contact_requested' ? 'Contact Requested' : 'No Contact';
  };

  const getOutcomeColor = (outcome: string) => {
    return outcome === 'contact_requested' ? 'text-neon-green' : 'text-gray-400';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-pink mx-auto"></div>
            <p className="mt-4 text-gray-300">Loading model accuracy data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <XCircle className="h-12 w-12 text-red-600 mx-auto" />
            <p className="mt-4 text-red-600">{error}</p>
            <button 
              onClick={fetchAccuracyData}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <div className="bg-neon-pink p-3 rounded-full">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Model Accuracy Analytics</h1>
              <p className="text-gray-300">Real-time tracking of ML model prediction accuracy</p>
            </div>
          </div>
        </div>

        {accuracyData && (
          <>
            {/* Accuracy Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-dark-800 rounded-lg shadow-lg p-6 border border-dark-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-300">Total Predictions</p>
                    <p className="text-3xl font-bold text-white">
                      {accuracyData.accuracy_metrics.total_predictions}
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-neon-blue" />
                </div>
              </div>

              <div className="bg-dark-800 rounded-lg shadow-lg p-6 border border-dark-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-300">Correct Predictions</p>
                    <p className="text-3xl font-bold text-neon-green">
                      {accuracyData.accuracy_metrics.correct_predictions}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-neon-green" />
                </div>
              </div>

              <div className="bg-dark-800 rounded-lg shadow-lg p-6 border border-dark-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-300">Accuracy Rate</p>
                    <p className={`text-3xl font-bold ${getAccuracyColor(accuracyData.accuracy_metrics.accuracy_rate)}`}>
                      {(accuracyData.accuracy_metrics.accuracy_rate * 100).toFixed(1)}%
                    </p>
                  </div>
                  {getAccuracyIcon(accuracyData.accuracy_metrics.accuracy_rate)}
                </div>
              </div>

              <div className="bg-dark-800 rounded-lg shadow-lg p-6 border border-dark-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-300">Last Updated</p>
                    <p className="text-sm font-medium text-white">
                      {accuracyData.accuracy_metrics.last_updated 
                        ? formatTimestamp(accuracyData.accuracy_metrics.last_updated)
                        : 'Never'
                      }
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Recent Feedback Table */}
            <div className="bg-dark-800 rounded-lg shadow-lg overflow-hidden border border-dark-700">
              <div className="px-6 py-4 border-b border-dark-600">
                <h2 className="text-lg font-semibold text-white">Recent Feedback</h2>
                <p className="text-sm text-gray-300">Latest model predictions vs actual outcomes</p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-dark-600">
                  <thead className="bg-dark-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Student ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Predicted
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Actual Outcome
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Correct?
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Timestamp
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-dark-800 divide-y divide-dark-600">
                    {accuracyData.recent_feedback.map((entry, index) => (
                      <tr key={index} className="hover:bg-dark-700">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                          {entry.student_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            entry.prediction.primary_prediction === 1 
                              ? 'bg-neon-green/20 text-neon-green' 
                              : 'bg-neon-red/20 text-neon-red'
                          }`}>
                            {entry.prediction.primary_prediction === 1 ? 'Likely' : 'Unlikely'}
                          </span>
                          <span className="ml-2 text-xs text-gray-400">
                            ({(entry.prediction.primary_probability * 100).toFixed(1)}%)
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            entry.actual_outcome === 'contact_requested'
                              ? 'bg-neon-green/20 text-neon-green'
                              : 'bg-gray-600 text-gray-300'
                          }`}>
                            {getOutcomeLabel(entry.actual_outcome)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          {entry.is_correct ? (
                            <CheckCircle className="h-5 w-5 text-neon-green" />
                          ) : (
                            <XCircle className="h-5 w-5 text-neon-red" />
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          {formatTimestamp(entry.timestamp)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {accuracyData.recent_feedback.length === 0 && (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">No feedback data available yet</p>
                  <p className="text-sm text-gray-500">Feedback will appear here as students interact with the system</p>
                </div>
              )}
            </div>

            {/* Refresh Button */}
            <div className="mt-6 text-center">
              <button
                onClick={fetchAccuracyData}
                className="bg-neon-blue text-white px-6 py-2 rounded-lg hover:bg-neon-cyan flex items-center space-x-2 mx-auto"
              >
                <Activity className="h-4 w-4" />
                <span>Refresh Data</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ModelAccuracyPage; 