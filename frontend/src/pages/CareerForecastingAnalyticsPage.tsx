import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface AnalyticsData {
  total_occupations: number;
  sample_size: number;
  average_mape: number;
  quality_distribution: {
    EXCELLENT: number;
    GOOD: number;
    FAIR: number;
    POOR: number;
  };
  sample_results: Array<{
    occupation: string;
    mape: number;
    quality: string;
    growth: number;
  }>;
  detailed_metrics?: {
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    roc_auc: number;
    mape_median: number;
    mape_std: number;
    growth_median: number;
    growth_std: number;
  };
}

const CareerForecastingAnalyticsPage = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/career/analytics');
      const data = await response.json();
      
      if (data.success) {
        setAnalytics(data.analytics);
      } else {
        setError(data.error || 'Failed to load analytics');
      }
    } catch (err) {
      setError('Failed to load analytics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadRealtimeData = async () => {
    setDownloading(true);
    setError(''); // Clear any previous errors
    try {
      console.log('🔄 DEBUG: Starting CSV download...');
      const response = await fetch('/api/career-forecast/realtime-download');
      
      console.log('📡 DEBUG: Response status:', response.status);
      console.log('📡 DEBUG: Response headers:', response.headers);
      
      if (response.ok) {
        const blob = await response.blob();
        console.log('📦 DEBUG: Blob size:', blob.size);
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'realtime_job_data.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        console.log('✅ DEBUG: CSV download completed successfully');
      } else {
        let errorMessage = 'Failed to download data';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.log('❌ DEBUG: Could not parse error response');
        }
        console.log('❌ DEBUG: Download failed with status:', response.status);
        setError(errorMessage);
      }
    } catch (err) {
      console.log('❌ DEBUG: Network error during download:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setDownloading(false);
    }
  };

  const testDownload = async () => {
    setDownloading(true);
    setError('');
    try {
      console.log('🧪 DEBUG: Testing download functionality...');
      const response = await fetch('/api/career-forecast/test-download');
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'test_download.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        console.log('✅ DEBUG: Test download successful');
      } else {
        console.log('❌ DEBUG: Test download failed');
        setError('Test download failed');
      }
    } catch (err) {
      console.log('❌ DEBUG: Test download error:', err);
      setError('Test download error');
    } finally {
      setDownloading(false);
    }
  };

  const COLORS = ['#00ff88', '#00d4ff', '#ffd700', '#ff0040'];

  const qualityChartData = analytics?.quality_distribution ? 
    Object.entries(analytics.quality_distribution).map(([quality, count]) => ({
      name: quality,
      value: count
  })) : [];

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'EXCELLENT': return '#00ff88';
      case 'GOOD': return '#00d4ff';
      case 'FAIR': return '#ffd700';
      case 'POOR': return '#ff0040';
      default: return '#6b7280';
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Career Forecasting Model Analytics
          </h1>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto">
            Comprehensive performance metrics and quality analysis of our AI-powered career forecasting models.
          </p>
        </div>

        {/* Loading and Error States */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-flex items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-pink mr-3"></div>
              <span className="text-lg text-gray-300">Loading analytics...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-dark-800 border border-neon-red rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-neon-red" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-neon-red">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Content */}
        {analytics && !loading && (
          <div className="space-y-8">
            {/* Download Real-time Data Button */}
            <div className="bg-dark-800 rounded-xl shadow-lg p-6 border border-dark-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-2">Real-time Job Data</h2>
                  <p className="text-gray-300 text-sm">Download all collected real-time job data from MUSE API</p>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={testDownload}
                    disabled={downloading}
                    className="bg-neon-blue text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                  >
                    {downloading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Testing...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Test Download
                      </>
                    )}
                  </button>
                  <button
                    onClick={downloadRealtimeData}
                    disabled={downloading}
                    className="bg-neon-green text-white px-6 py-3 rounded-lg font-medium hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                  >
                    {downloading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Downloading...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download CSV
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-dark-800 rounded-xl shadow-lg p-6 text-center border border-dark-700">
                <div className="text-3xl font-bold text-neon-blue mb-2">
                  {analytics.total_occupations.toLocaleString()}
                </div>
                <div className="text-sm text-gray-300">Total Occupations</div>
              </div>
              <div className="bg-dark-800 rounded-xl shadow-lg p-6 text-center border border-dark-700">
                <div className="text-3xl font-bold text-neon-green mb-2">
                  {analytics.sample_size.toLocaleString()}
                </div>
                <div className="text-sm text-gray-300">Sample Size</div>
              </div>
              <div className="bg-dark-800 rounded-xl shadow-lg p-6 text-center border border-dark-700">
                <div className="text-3xl font-bold text-neon-pink mb-2">
                  {analytics.average_mape?.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-300">Average MAPE</div>
              </div>
              <div className="bg-dark-800 rounded-xl shadow-lg p-6 text-center border border-dark-700">
                <div className="text-3xl font-bold text-neon-yellow mb-2">
                  {((analytics.quality_distribution.EXCELLENT / analytics.sample_size) * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-300">Excellent Quality</div>
              </div>
            </div>

            {/* Quality Distribution Chart */}
            <div className="bg-dark-800 rounded-xl shadow-lg p-6 border border-dark-700">
              <h2 className="text-xl font-semibold mb-6 text-white">Model Quality Distribution</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={qualityChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {qualityChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Quality Breakdown</h3>
                  {Object.entries(analytics.quality_distribution).map(([quality, count]) => (
                    <div key={quality} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div 
                          className="w-4 h-4 rounded-full mr-3"
                          style={{ backgroundColor: getQualityColor(quality) }}
                        ></div>
                        <span className="font-medium text-white">{quality}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-white">{count}</span>
                        <span className="text-sm text-gray-400">
                          ({((count / analytics.sample_size) * 100).toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sample Results Table */}
            <div className="bg-dark-800 rounded-xl shadow-lg p-6 border border-dark-700">
              <h2 className="text-xl font-semibold mb-6 text-white">Sample Model Performance</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                <thead>
                    <tr className="border-b border-dark-600">
                      <th className="text-left py-3 px-4 font-semibold text-white">Occupation</th>
                      <th className="text-left py-3 px-4 font-semibold text-white">MAPE (%)</th>
                      <th className="text-left py-3 px-4 font-semibold text-white">Quality</th>
                      <th className="text-left py-3 px-4 font-semibold text-white">Growth (%)</th>
                  </tr>
                </thead>
                <tbody>
                    {analytics.sample_results.map((result, index) => (
                      <tr key={index} className="border-b border-dark-700 hover:bg-dark-700">
                        <td className="py-3 px-4 font-medium text-white">
                          {result.occupation}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            result.mape < 10 ? 'bg-neon-green/20 text-neon-green' :
                            result.mape < 20 ? 'bg-neon-blue/20 text-neon-blue' :
                            result.mape < 30 ? 'bg-neon-yellow/20 text-neon-yellow' :
                            'bg-neon-red/20 text-neon-red'
                          }`}>
                            {result.mape.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            result.quality === 'EXCELLENT' ? 'bg-neon-green/20 text-neon-green' :
                            result.quality === 'GOOD' ? 'bg-neon-blue/20 text-neon-blue' :
                            result.quality === 'FAIR' ? 'bg-neon-yellow/20 text-neon-yellow' :
                            'bg-neon-red/20 text-neon-red'
                          }`}>
                            {result.quality}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`font-medium ${
                            result.growth > 0 ? 'text-neon-green' : 'text-neon-red'
                          }`}>
                            {result.growth > 0 ? '+' : ''}{result.growth.toFixed(1)}%
                          </span>
                        </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-dark-800 rounded-xl shadow-lg p-6 border border-dark-700">
              <h2 className="text-xl font-semibold mb-6 text-white">Model Performance Metrics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-4 text-white">Accuracy Metrics</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Average MAPE:</span>
                      <span className="font-semibold text-white">{analytics.average_mape?.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Sample Size:</span>
                      <span className="font-semibold text-white">{analytics.sample_size.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Coverage:</span>
                      <span className="font-semibold text-white">
                        {((analytics.sample_size / analytics.total_occupations) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-4 text-white">Quality Assessment</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Excellent:</span>
                      <span className="font-semibold text-neon-green">
                        {analytics.quality_distribution.EXCELLENT} ({((analytics.quality_distribution.EXCELLENT / analytics.sample_size) * 100).toFixed(1)}%)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Good:</span>
                      <span className="font-semibold text-neon-blue">
                        {analytics.quality_distribution.GOOD} ({((analytics.quality_distribution.GOOD / analytics.sample_size) * 100).toFixed(1)}%)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Fair:</span>
                      <span className="font-semibold text-neon-yellow">
                        {analytics.quality_distribution.FAIR} ({((analytics.quality_distribution.FAIR / analytics.sample_size) * 100).toFixed(1)}%)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Poor:</span>
                      <span className="font-semibold text-neon-red">
                        {analytics.quality_distribution.POOR} ({((analytics.quality_distribution.POOR / analytics.sample_size) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Accuracy Metrics Table */}
            {analytics.detailed_metrics && (
              <div className="bg-dark-800 rounded-xl shadow-lg p-6 border border-dark-700">
                <h2 className="text-xl font-semibold mb-6 text-white">📊 DETAILED PERFORMANCE METRICS</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full font-mono text-sm">
                    <thead>
                      <tr className="border-b border-dark-600">
                        <th className="text-left py-3 px-4 font-semibold text-white">Target</th>
                        <th className="text-left py-3 px-4 font-semibold text-white">Accuracy</th>
                        <th className="text-left py-3 px-4 font-semibold text-white">Precision</th>
                        <th className="text-left py-3 px-4 font-semibold text-white">Recall</th>
                        <th className="text-left py-3 px-4 font-semibold text-white">F1-Score</th>
                        <th className="text-left py-3 px-4 font-semibold text-white">ROC-AUC</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-dark-700 hover:bg-dark-700">
                        <td className="py-3 px-4 font-medium text-white">FORECAST_QUALITY</td>
                        <td className="py-3 px-4">
                          <span className="text-neon-green font-bold">
                            {(analytics.detailed_metrics.accuracy * 100).toFixed(4)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-neon-blue font-bold">
                            {(analytics.detailed_metrics.precision * 100).toFixed(4)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-neon-pink font-bold">
                            {(analytics.detailed_metrics.recall * 100).toFixed(4)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-neon-yellow font-bold">
                            {(analytics.detailed_metrics.f1_score * 100).toFixed(4)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-neon-green font-bold">
                            {(analytics.detailed_metrics.roc_auc * 100).toFixed(4)}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 p-4 bg-dark-700 rounded-lg">
                  <h4 className="text-neon-blue font-semibold mb-2">📈 Additional Statistics</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-300">MAPE Median:</span>
                      <span className="text-white font-bold ml-2">{analytics.detailed_metrics.mape_median.toFixed(2)}%</span>
                    </div>
                    <div>
                      <span className="text-gray-300">MAPE Std:</span>
                      <span className="text-white font-bold ml-2">{analytics.detailed_metrics.mape_std.toFixed(2)}%</span>
                    </div>
                    <div>
                      <span className="text-gray-300">Growth Median:</span>
                      <span className="text-white font-bold ml-2">{analytics.detailed_metrics.growth_median.toFixed(2)}%</span>
                    </div>
                    <div>
                      <span className="text-gray-300">Growth Std:</span>
                      <span className="text-white font-bold ml-2">{analytics.detailed_metrics.growth_std.toFixed(2)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Model Information */}
            <div className="bg-gradient-to-r from-dark-800 to-dark-700 rounded-xl p-6 border border-dark-600">
              <h2 className="text-xl font-semibold mb-4 text-white">Model Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-2 text-white">Forecasting Methods</h3>
                  <ul className="space-y-1 text-sm text-gray-300">
                    <li>• Random Walk with Drift</li>
                    <li>• Exponential Smoothing</li>
                    <li>• ARIMA Models</li>
                    <li>• Ensemble Methods</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium mb-2 text-white">Data Sources</h3>
                  <ul className="space-y-1 text-sm text-gray-300">
                    <li>• Historical employment data (2018-2023)</li>
                    <li>• Real-time job market data</li>
                    <li>• MUSE API integration</li>
                    <li>• Cross-industry analysis</li>
                  </ul>
                </div>
              </div>
            </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default CareerForecastingAnalyticsPage; 