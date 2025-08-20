import React, { useState } from 'react';

const MethodologyPage = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [activeSubTab, setActiveSubTab] = useState('content');
  const [activeMetricsTab, setActiveMetricsTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'envo-chat', label: 'ENVO Chat Agent' },
    { id: 'career-forecasting', label: 'Career Forecasting' },
    { id: 'envo-learn', label: 'ENVO Learn' }
  ];

  const subTabs = [
    { id: 'content', label: 'Content' },
    { id: 'flowcharts', label: 'Flowchart' }
  ];

  // Special sub-tabs for ENVO Chat Agent that includes Model Metrics
  const envoChatSubTabs = [
    { id: 'content', label: 'Content' },
    { id: 'flowcharts', label: 'Flowchart' },
    { id: 'model-metrics', label: 'Model Metrics' }
  ];

  // Special sub-tabs for Career Forecasting that includes Model Metrics
  const careerForecastingSubTabs = [
    { id: 'content', label: 'Content' },
    { id: 'flowcharts', label: 'Flowchart' },
    { id: 'model-metrics', label: 'Model Metrics' }
  ];

  const renderOverviewContent = () => (
    <div className="space-y-6">
      <div className="bg-dark-800 rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4">Platform Overview</h3>
        <p className="text-gray-300 mb-4">
          ENVO is an AI-powered career forecasting and educational guidance platform that combines 
          multiple advanced technologies to provide comprehensive career guidance and learning support.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-dark-700 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-neon-blue mb-2">AI-Powered Features</h4>
            <ul className="text-gray-300 space-y-1">
              <li>• Conversational AI Chat Agent</li>
              <li>• Career Forecasting Models</li>
              <li>• Sentiment Analysis</li>
              <li>• Personalized Learning Paths</li>
            </ul>
          </div>
          <div className="bg-dark-700 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-neon-green mb-2">Data-Driven Insights</h4>
            <ul className="text-gray-300 space-y-1">
              <li>• Real-time Analytics</li>
              <li>• Model Performance Tracking</li>
              <li>• User Feedback Analysis</li>
              <li>• Predictive Analytics</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

     const renderOverviewFlowcharts = () => (
     <div className="space-y-6">
       {/* Professional Flowchart - Larger size */}
       <div className="w-full max-w-8xl mx-auto">
         {/* Main Flowchart Image - Larger size */}
         <img 
           src="/images/envo-methodology-flowchart.png" 
           alt="ENVO Methodology Flowchart"
           className="w-full h-auto scale-125"
           onError={(e) => {
             e.currentTarget.style.display = 'none';
             const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
             if (nextElement) {
               nextElement.style.display = 'block';
             }
           }}
         />
         
         {/* Fallback if image doesn't load */}
         <div className="hidden bg-dark-600 rounded-lg p-8 text-center">
           <div className="text-gray-400 text-lg mb-4">ENVO Methodology Flowchart</div>
           <div className="text-gray-500 text-sm">
             Please ensure the flowchart image is placed at: <br/>
             <code className="bg-dark-700 px-2 py-1 rounded">frontend/public/images/envo-methodology-flowchart.png</code>
           </div>
         </div>
       </div>
     </div>
   );

  const renderEnvoChatContent = () => (
    <div className="space-y-6">
      <div className="bg-dark-800 rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4">ENVO Chat Agent Methodology</h3>
        <p className="text-gray-300 mb-4">
          Our conversational AI agent is built using advanced natural language processing techniques 
          to provide intelligent career guidance and support.
        </p>
        
        <div className="space-y-4">
          <div className="bg-dark-700 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-neon-cyan mb-2">Technology Stack</h4>
            <ul className="text-gray-300 space-y-1">
              <li>• Large Language Models (LLMs) for natural language understanding</li>
              <li>• Context-aware conversation management</li>
              <li>• Real-time sentiment analysis</li>
              <li>• Multi-turn dialogue handling</li>
            </ul>
          </div>

          <div className="bg-dark-700 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-neon-purple mb-2">Features</h4>
            <ul className="text-gray-300 space-y-1">
              <li>• Personalized career advice based on user profile</li>
              <li>• Interactive skill assessment</li>
              <li>• Real-time feedback collection</li>
              <li>• Continuous learning from user interactions</li>
            </ul>
          </div>

          <div className="bg-dark-700 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-neon-yellow mb-2">Quality Assurance</h4>
            <ul className="text-gray-300 space-y-1">
              <li>• Regular model retraining with new data</li>
              <li>• User feedback integration</li>
              <li>• Performance monitoring and optimization</li>
              <li>• Ethical AI guidelines compliance</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

     const renderEnvoChatFlowcharts = () => (
     <div className="space-y-6">
       {/* ENVO Chat Agent Flowchart - Larger size */}
       <div className="w-full max-w-8xl mx-auto">
         {/* Main Flowchart Image - Larger size */}
         <img 
           src="/images/envo-chat-flowchart.png" 
           alt="ENVO Chat Agent Flowchart"
           className="w-full h-auto scale-125"
           onError={(e) => {
             e.currentTarget.style.display = 'none';
             const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
             if (nextElement) {
               nextElement.style.display = 'block';
             }
           }}
         />
         
         {/* Fallback if image doesn't load */}
         <div className="hidden bg-dark-600 rounded-lg p-8 text-center">
           <div className="text-gray-400 text-lg mb-4">ENVO Chat Agent Flowchart</div>
           <div className="text-gray-500 text-sm">
             Please ensure the flowchart image is placed at: <br/>
             <code className="bg-dark-700 px-2 py-1 rounded">frontend/public/images/envo-chat-flowchart.png</code>
           </div>
         </div>
       </div>
     </div>
   );

  const renderEnvoChatModelMetrics = () => (
    <div className="space-y-6">
      <div className="bg-dark-800 rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4">ENVO Chat Agent Model Performance Metrics</h3>
        <p className="text-gray-300 mb-6">
          Our machine learning models are rigorously tested and validated to ensure optimal performance 
          in providing accurate career guidance and recommendations.
        </p>
        
        <div className="overflow-x-auto">
          <table className="w-full bg-dark-700 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-dark-600">
                <th className="px-4 py-3 text-left text-white font-semibold">Model</th>
                <th className="px-4 py-3 text-center text-white font-semibold">Training Accuracy</th>
                <th className="px-4 py-3 text-center text-white font-semibold">Test Accuracy</th>
                <th className="px-4 py-3 text-center text-white font-semibold">Precision</th>
                <th className="px-4 py-3 text-center text-white font-semibold">Recall</th>
                <th className="px-4 py-3 text-center text-white font-semibold">F1-Score</th>
                <th className="px-4 py-3 text-center text-white font-semibold">AUC Score</th>
                <th className="px-4 py-3 text-center text-white font-semibold">CV Mean ± Std</th>
                <th className="px-4 py-3 text-center text-white font-semibold">Overfitting Gap</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-dark-600 hover:bg-dark-600 transition-colors">
                <td className="px-4 py-3 text-neon-blue font-medium">Random Forest</td>
                <td className="px-4 py-3 text-center text-gray-300">1.0000</td>
                <td className="px-4 py-3 text-center text-gray-300">0.8881</td>
                <td className="px-4 py-3 text-center text-gray-300">0.92</td>
                <td className="px-4 py-3 text-center text-gray-300">0.76</td>
                <td className="px-4 py-3 text-center text-gray-300">0.83</td>
                <td className="px-4 py-3 text-center text-gray-300">0.9527</td>
                <td className="px-4 py-3 text-center text-gray-300">0.8925 ± 0.0139</td>
                <td className="px-4 py-3 text-center text-gray-300">0.1119</td>
              </tr>
              <tr className="border-b border-dark-600 hover:bg-dark-600 transition-colors">
                <td className="px-4 py-3 text-neon-green font-medium">Logistic Regression</td>
                <td className="px-4 py-3 text-center text-gray-300">0.8105</td>
                <td className="px-4 py-3 text-center text-gray-300">0.8115</td>
                <td className="px-4 py-3 text-center text-gray-300">0.86</td>
                <td className="px-4 py-3 text-center text-gray-300">0.85</td>
                <td className="px-4 py-3 text-center text-gray-300">0.85</td>
                <td className="px-4 py-3 text-center text-gray-300">0.8674</td>
                <td className="px-4 py-3 text-center text-gray-300">0.8100 ± 0.0178</td>
                <td className="px-4 py-3 text-center text-gray-300">-0.0009</td>
              </tr>
              <tr className="hover:bg-dark-600 transition-colors">
                <td className="px-4 py-3 text-neon-purple font-medium">SVM</td>
                <td className="px-4 py-3 text-center text-gray-300">0.8654</td>
                <td className="px-4 py-3 text-center text-gray-300">0.8461</td>
                <td className="px-4 py-3 text-center text-gray-300">0.92</td>
                <td className="px-4 py-3 text-center text-gray-300">0.76</td>
                <td className="px-4 py-3 text-center text-gray-300">0.83</td>
                <td className="px-4 py-3 text-center text-gray-300">0.9094</td>
                <td className="px-4 py-3 text-center text-gray-300">0.8507 ± 0.0066</td>
                <td className="px-4 py-3 text-center text-gray-300">0.0193</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-6 space-y-4">
          <div className="bg-dark-700 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-neon-yellow mb-2">Key Insights</h4>
            <ul className="text-gray-300 space-y-1">
              <li>• <strong>Random Forest</strong> shows overfitting with perfect training accuracy (1.000) compared to test accuracy (88.81%)</li>
              <li>• <strong>Logistic Regression</strong> demonstrates good generalization with minimal overfitting gap (-0.0009)</li>
              <li>• <strong>SVM</strong> is considered the optimal choice based on balanced performance</li>
              <li>• SVM shows good generalization with overfitting gap of 1.93% (0.0193)</li>
            </ul>
          </div>

          <div className="bg-dark-700 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-neon-cyan mb-2">Model Selection Strategy</h4>
            <ul className="text-gray-300 space-y-1">
              <li>• <strong>Optimal Choice:</strong> SVM based on balanced performance and generalization capability</li>
              <li>• <strong>Conservative Predictions:</strong> SVM minimizes false positives, crucial for student counseling</li>
              <li>• <strong>Reliability:</strong> SVM's consistent performance across different data subsets supports real-world deployment</li>
              <li>• <strong>Educational Applications:</strong> SVM's performance makes it suitable for institutional assessment</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCareerForecastingContent = () => (
    <div className="space-y-6">
      <div className="bg-dark-800 rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4">Career Forecasting Methodology</h3>
        <p className="text-gray-300 mb-4">
          Our career forecasting system uses machine learning algorithms to predict career outcomes 
          and provide personalized recommendations based on comprehensive data analysis.
        </p>
        
        <div className="space-y-4">
          <div className="bg-dark-700 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-neon-pink mb-2">Data Sources</h4>
            <ul className="text-gray-300 space-y-1">
              <li>• Historical career progression data</li>
              <li>• Industry trends and market analysis</li>
              <li>• Educational background correlations</li>
              <li>• Skills demand forecasting</li>
            </ul>
          </div>

          <div className="bg-dark-700 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-neon-blue mb-2">Machine Learning Models</h4>
            <ul className="text-gray-300 space-y-1">
              <li>• Ensemble methods for improved accuracy</li>
              <li>• Feature engineering for career-relevant attributes</li>
              <li>• Regular model validation and testing</li>
              <li>• Continuous performance monitoring</li>
            </ul>
          </div>

          <div className="bg-dark-700 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-neon-green mb-2">Prediction Features</h4>
            <ul className="text-gray-300 space-y-1">
              <li>• Career path recommendations</li>
              <li>• Salary progression forecasts</li>
              <li>• Skills gap analysis</li>
              <li>• Industry transition probabilities</li>
            </ul>
          </div>

          <div className="bg-dark-700 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-neon-yellow mb-2">Model Performance</h4>
            <ul className="text-gray-300 space-y-1">
              <li>• Accuracy metrics tracking</li>
              <li>• Bias detection and mitigation</li>
              <li>• Regular model updates</li>
              <li>• User feedback integration</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

           const renderCareerForecastingFlowcharts = () => (
      <div className="space-y-6">
        {/* Career Forecasting Flowchart - Larger size */}
        <div className="w-full max-w-8xl mx-auto">
          {/* Main Flowchart Image - Larger size */}
          <img 
            src="/images/career-forecast-flowchart.jpg" 
            alt="Career Forecasting Flowchart"
            className="w-full h-auto scale-125"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
              if (nextElement) {
                nextElement.style.display = 'block';
              }
            }}
          />
          
          {/* Fallback if image doesn't load */}
          <div className="hidden bg-dark-600 rounded-lg p-8 text-center">
            <div className="text-gray-400 text-lg mb-4">Career Forecasting Flowchart</div>
            <div className="text-gray-500 text-sm">
              Please ensure the flowchart image is placed at: <br/>
              <code className="bg-dark-700 px-2 py-1 rounded">frontend/public/images/career-forecast-flowchart.jpg</code>
            </div>
          </div>
        </div>
      </div>
    );

    const renderCareerForecastingModelMetrics = () => {
      console.log('Rendering Career Forecasting Model Metrics, activeMetricsTab:', activeMetricsTab);
      
      const metricsTabs = [
        { id: 'overview', label: 'Overview' },
        { id: 'employment-quality', label: 'Employment Quality' },
        { id: 'salary-quality', label: 'Salary Quality' },
        { id: 'success-criteria', label: 'Success Criteria' }
      ];

      const renderOverviewMetrics = () => (
        <div className="space-y-6">
          <div className="bg-dark-800 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">Forecasting Performance Results</h3>
            
            <div className="overflow-x-auto mb-6">
              <table className="w-full bg-dark-700 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-dark-600">
                    <th className="px-4 py-3 text-left text-white font-semibold">Component</th>
                    <th className="px-4 py-3 text-center text-white font-semibold">Eligible</th>
                    <th className="px-4 py-3 text-center text-white font-semibold">Successful</th>
                    <th className="px-4 py-3 text-center text-white font-semibold">Success Rate</th>
                    <th className="px-4 py-3 text-center text-white font-semibold">Average MAPE</th>
                    <th className="px-4 py-3 text-center text-white font-semibold">Performance</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-dark-600 hover:bg-dark-600 transition-colors">
                    <td className="px-4 py-3 text-neon-blue font-medium">Employment Forecasting</td>
                    <td className="px-4 py-3 text-center text-gray-300">1,333</td>
                    <td className="px-4 py-3 text-center text-gray-300">1,333</td>
                    <td className="px-4 py-3 text-center text-gray-300">100%</td>
                    <td className="px-4 py-3 text-center text-gray-300">5.5%</td>
                    <td className="px-4 py-3 text-center text-neon-green font-medium">Excellent</td>
                  </tr>
                  <tr className="border-b border-dark-600 hover:bg-dark-600 transition-colors">
                    <td className="px-4 py-3 text-neon-purple font-medium">Salary Forecasting</td>
                    <td className="px-4 py-3 text-center text-gray-300">1,320</td>
                    <td className="px-4 py-3 text-center text-gray-300">1,131</td>
                    <td className="px-4 py-3 text-center text-gray-300">86.5%</td>
                    <td className="px-4 py-3 text-center text-gray-300">3.7%</td>
                    <td className="px-4 py-3 text-center text-neon-green font-medium">Excellent</td>
                  </tr>
                  <tr className="hover:bg-dark-600 transition-colors">
                    <td className="px-4 py-3 text-neon-yellow font-medium">Complete Integration</td>
                    <td className="px-4 py-3 text-center text-gray-300">1,395</td>
                    <td className="px-4 py-3 text-center text-gray-300">1,326</td>
                    <td className="px-4 py-3 text-center text-gray-300">95.1%</td>
                    <td className="px-4 py-3 text-center text-gray-300">99.5% match rate</td>
                    <td className="px-4 py-3 text-center text-neon-cyan font-medium">Outstanding</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="space-y-4">
              <div className="bg-dark-700 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-neon-green mb-2">Key Achievements</h4>
                <ul className="text-gray-300 space-y-1">
                  <li>• Employment forecasting: 97.6% meeting Student Planning Standard (MAPE &lt; 10%)</li>
                  <li>• Salary forecasting: 97% meeting Student Planning Standard (MAPE &lt; 10%)</li>
                  <li>• Both components demonstrate high reliability for academic planning decisions</li>
                </ul>
              </div>

              <div className="bg-dark-700 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-neon-cyan mb-2">Additional Performance Metrics</h4>
                <ul className="text-gray-300 space-y-1">
                  <li>• Salary Forecasting Average R²: 0.458 (indicating solid explanatory power)</li>
                  <li>• Both components exceeded the Student Planning Standard (MAPE &lt; 10%) with outstanding performance</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      );

      const renderEmploymentQualityMetrics = () => (
        <div className="space-y-6">
          <div className="bg-dark-800 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">Employment Forecast Quality Ratings (1,333 forecasts)</h3>
            
            <div className="overflow-x-auto mb-6">
              <table className="w-full bg-dark-700 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-dark-600">
                    <th className="px-4 py-3 text-left text-white font-semibold">Quality Rating</th>
                    <th className="px-4 py-3 text-center text-white font-semibold">Count</th>
                    <th className="px-4 py-3 text-center text-white font-semibold">Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-dark-600 hover:bg-dark-600 transition-colors">
                    <td className="px-4 py-3 text-neon-green font-medium">Excellent</td>
                    <td className="px-4 py-3 text-center text-gray-300">1,182</td>
                    <td className="px-4 py-3 text-center text-gray-300">88.7%</td>
                  </tr>
                  <tr className="border-b border-dark-600 hover:bg-dark-600 transition-colors">
                    <td className="px-4 py-3 text-neon-blue font-medium">Good</td>
                    <td className="px-4 py-3 text-center text-gray-300">118</td>
                    <td className="px-4 py-3 text-center text-gray-300">8.9%</td>
                  </tr>
                  <tr className="border-b border-dark-600 hover:bg-dark-600 transition-colors">
                    <td className="px-4 py-3 text-neon-yellow font-medium">Fair</td>
                    <td className="px-4 py-3 text-center text-gray-300">27</td>
                    <td className="px-4 py-3 text-center text-gray-300">2.0%</td>
                  </tr>
                  <tr className="hover:bg-dark-600 transition-colors">
                    <td className="px-4 py-3 text-neon-red font-medium">Poor</td>
                    <td className="px-4 py-3 text-center text-gray-300">6</td>
                    <td className="px-4 py-3 text-center text-gray-300">0.5%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );

      const renderSalaryQualityMetrics = () => (
        <div className="space-y-6">
          <div className="bg-dark-800 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">Salary Forecast Quality Ratings (1,131 forecasts)</h3>
            
            <div className="overflow-x-auto mb-6">
              <table className="w-full bg-dark-700 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-dark-600">
                    <th className="px-4 py-3 text-left text-white font-semibold">Quality Rating</th>
                    <th className="px-4 py-3 text-center text-white font-semibold">Criteria</th>
                    <th className="px-4 py-3 text-center text-white font-semibold">Count</th>
                    <th className="px-4 py-3 text-center text-white font-semibold">Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-dark-600 hover:bg-dark-600 transition-colors">
                    <td className="px-4 py-3 text-neon-green font-medium">Excellent</td>
                    <td className="px-4 py-3 text-center text-gray-300">MAPE ≤ 8% AND R² ≥ 0.7</td>
                    <td className="px-4 py-3 text-center text-gray-300">478</td>
                    <td className="px-4 py-3 text-center text-gray-300">42.3%</td>
                  </tr>
                  <tr className="border-b border-dark-600 hover:bg-dark-600 transition-colors">
                    <td className="px-4 py-3 text-neon-blue font-medium">Good</td>
                    <td className="px-4 py-3 text-center text-gray-300">MAPE ≤ 15% AND R² ≥ 0.5</td>
                    <td className="px-4 py-3 text-center text-gray-300">211</td>
                    <td className="px-4 py-3 text-center text-gray-300">18.7%</td>
                  </tr>
                  <tr className="border-b border-dark-600 hover:bg-dark-600 transition-colors">
                    <td className="px-4 py-3 text-neon-yellow font-medium">Fair</td>
                    <td className="px-4 py-3 text-center text-gray-300">MAPE ≤ 25%</td>
                    <td className="px-4 py-3 text-center text-gray-300">434</td>
                    <td className="px-4 py-3 text-center text-gray-300">38.4%</td>
                  </tr>
                  <tr className="hover:bg-dark-600 transition-colors">
                    <td className="px-4 py-3 text-neon-red font-medium">Poor</td>
                    <td className="px-4 py-3 text-center text-gray-300">Above Fair criteria</td>
                    <td className="px-4 py-3 text-center text-gray-300">8</td>
                    <td className="px-4 py-3 text-center text-gray-300">0.7%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );

      const renderSuccessCriteriaMetrics = () => (
        <div className="space-y-6">
          <div className="bg-dark-800 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">Success Criteria Achievement</h3>
            
            <div className="overflow-x-auto mb-6">
              <table className="w-full bg-dark-700 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-dark-600">
                    <th className="px-4 py-3 text-left text-white font-semibold">Criterion</th>
                    <th className="px-4 py-3 text-center text-white font-semibold">Target</th>
                    <th className="px-4 py-3 text-center text-white font-semibold">Achieved</th>
                    <th className="px-4 py-3 text-center text-white font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-dark-600 hover:bg-dark-600 transition-colors">
                    <td className="px-4 py-3 text-neon-blue font-medium">Employment Forecasting Accuracy</td>
                    <td className="px-4 py-3 text-center text-gray-300">&gt;80% meeting MAPE &lt;10%</td>
                    <td className="px-4 py-3 text-center text-gray-300">97.6%</td>
                    <td className="px-4 py-3 text-center text-neon-green font-medium">Exceeded</td>
                  </tr>
                  <tr className="border-b border-dark-600 hover:bg-dark-600 transition-colors">
                    <td className="px-4 py-3 text-neon-purple font-medium">Salary Forecasting Accuracy</td>
                    <td className="px-4 py-3 text-center text-gray-300">&gt;80% meeting MAPE &lt;10%</td>
                    <td className="px-4 py-3 text-center text-gray-300">97%</td>
                    <td className="px-4 py-3 text-center text-neon-green font-medium">Exceeded</td>
                  </tr>
                  <tr className="border-b border-dark-600 hover:bg-dark-600 transition-colors">
                    <td className="px-4 py-3 text-neon-yellow font-medium">Data Coverage</td>
                    <td className="px-4 py-3 text-center text-gray-300">&gt;90% complete profiles</td>
                    <td className="px-4 py-3 text-center text-gray-300">95.1%</td>
                    <td className="px-4 py-3 text-center text-neon-green font-medium">Exceeded</td>
                  </tr>
                  <tr className="border-b border-dark-600 hover:bg-dark-600 transition-colors">
                    <td className="px-4 py-3 text-neon-cyan font-medium">Search Success</td>
                    <td className="px-4 py-3 text-center text-gray-300">&gt;90% query success</td>
                    <td className="px-4 py-3 text-center text-gray-300">96.6%</td>
                    <td className="px-4 py-3 text-center text-neon-green font-medium">Exceeded</td>
                  </tr>
                  <tr className="border-b border-dark-600 hover:bg-dark-600 transition-colors">
                    <td className="px-4 py-3 text-neon-pink font-medium">Integration Success</td>
                    <td className="px-4 py-3 text-center text-gray-300">&gt;95% successful matching</td>
                    <td className="px-4 py-3 text-center text-gray-300">99.5%</td>
                    <td className="px-4 py-3 text-center text-neon-green font-medium">Exceeded</td>
                  </tr>
                  <tr className="hover:bg-dark-600 transition-colors">
                    <td className="px-4 py-3 text-neon-orange font-medium">Processing Efficiency</td>
                    <td className="px-4 py-3 text-center text-gray-300">&lt;60 minutes</td>
                    <td className="px-4 py-3 text-center text-gray-300">25 minutes</td>
                    <td className="px-4 py-3 text-center text-neon-green font-medium">Exceeded</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );

      return (
        <div className="space-y-6">
          <div className="bg-dark-800 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">Career Forecasting Model Performance Metrics</h3>
            <p className="text-gray-300 mb-6">
              Our ensemble forecasting model demonstrated exceptional accuracy and reliability for both employment and salary predictions.
            </p>
            <p className="text-red-400 mb-4">DEBUG: Function is rendering, activeMetricsTab: {activeMetricsTab}</p>
            
            {/* Metrics Sub-tabs */}
            <div className="flex flex-wrap justify-center mb-6">
              {metricsTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveMetricsTab(tab.id)}
                  className={`px-4 py-2 mx-1 mb-2 rounded-lg font-medium transition-all duration-200 ${
                    activeMetricsTab === tab.id
                      ? 'bg-neon-purple text-white shadow-lg'
                      : 'bg-dark-700 text-gray-300 hover:bg-dark-600 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Metrics Content */}
            <div className="bg-dark-900 rounded-xl p-6">
              {activeMetricsTab === 'overview' && renderOverviewMetrics()}
              {activeMetricsTab === 'employment-quality' && renderEmploymentQualityMetrics()}
              {activeMetricsTab === 'salary-quality' && renderSalaryQualityMetrics()}
              {activeMetricsTab === 'success-criteria' && renderSuccessCriteriaMetrics()}
            </div>
          </div>
        </div>
      );
    };

  const renderEnvoLearnContent = () => (
    <div className="space-y-6">
      <div className="bg-dark-800 rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4">ENVO Learn Methodology</h3>
        <p className="text-gray-300 mb-4">
          ENVO Learn combines educational content delivery with AI-powered sentiment analysis 
          to create personalized learning experiences and track user engagement.
        </p>
        
        <div className="space-y-4">
          <div className="bg-dark-700 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-neon-pink mb-2">Content Delivery</h4>
            <ul className="text-gray-300 space-y-1">
              <li>• Curated educational videos and resources</li>
              <li>• Interactive learning modules</li>
              <li>• Progress tracking and assessment</li>
              <li>• Adaptive content recommendations</li>
            </ul>
          </div>

          <div className="bg-dark-700 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-neon-cyan mb-2">Sentiment Analysis</h4>
            <ul className="text-gray-300 space-y-1">
              <li>• Real-time user feedback analysis</li>
              <li>• Emotional response tracking</li>
              <li>• Content engagement metrics</li>
              <li>• Learning effectiveness measurement</li>
            </ul>
          </div>

          <div className="bg-dark-700 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-neon-green mb-2">Personalization</h4>
            <ul className="text-gray-300 space-y-1">
              <li>• Individual learning path optimization</li>
              <li>• Content difficulty adjustment</li>
              <li>• Interest-based recommendations</li>
              <li>• Learning style adaptation</li>
            </ul>
          </div>

          <div className="bg-dark-700 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-neon-yellow mb-2">Analytics & Insights</h4>
            <ul className="text-gray-300 space-y-1">
              <li>• Learning progress analytics</li>
              <li>• Content performance metrics</li>
              <li>• User engagement patterns</li>
              <li>• Continuous improvement feedback</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEnvoLearnFlowcharts = () => (
    <div className="space-y-6">
      <div className="bg-dark-800 rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4">ENVO Learn Flow</h3>
        <div className="space-y-6">
          <div className="bg-dark-700 rounded-lg p-6 text-center">
            <div className="text-neon-pink text-lg font-semibold mb-4">Content Delivery Flow</div>
            <div className="bg-dark-600 rounded-lg p-8 border-2 border-dashed border-neon-pink">
              <div className="text-gray-400 text-sm">
                [Content Delivery Flowchart Placeholder]
                <br />
                User Request → Content Selection → Personalization → Delivery → Feedback Collection
              </div>
            </div>
          </div>
          
          <div className="bg-dark-700 rounded-lg p-6 text-center">
            <div className="text-neon-cyan text-lg font-semibold mb-4">Sentiment Analysis Flow</div>
            <div className="bg-dark-600 rounded-lg p-8 border-2 border-dashed border-neon-cyan">
              <div className="text-gray-400 text-sm">
                [Sentiment Analysis Flowchart Placeholder]
                <br />
                User Feedback → Text Processing → Sentiment Analysis → Insight Generation → Content Optimization
              </div>
            </div>
          </div>
          
          <div className="bg-dark-700 rounded-lg p-6 text-center">
            <div className="text-neon-green text-lg font-semibold mb-4">Learning Path Flow</div>
            <div className="bg-dark-600 rounded-lg p-8 border-2 border-dashed border-neon-green">
              <div className="text-gray-400 text-sm">
                [Learning Path Flowchart Placeholder]
                <br />
                User Profile → Skill Assessment → Path Generation → Progress Tracking → Adaptation
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return activeSubTab === 'content' ? renderOverviewContent() : renderOverviewFlowcharts();
      case 'envo-chat':
        if (activeSubTab === 'content') return renderEnvoChatContent();
        if (activeSubTab === 'flowcharts') return renderEnvoChatFlowcharts();
        if (activeSubTab === 'model-metrics') return renderEnvoChatModelMetrics();
        return null;
      case 'career-forecasting':
        if (activeSubTab === 'content') return renderCareerForecastingContent();
        if (activeSubTab === 'flowcharts') return renderCareerForecastingFlowcharts();
        if (activeSubTab === 'model-metrics') return renderCareerForecastingModelMetrics();
        return null;
      case 'envo-learn':
        return activeSubTab === 'content' ? renderEnvoLearnContent() : renderEnvoLearnFlowcharts();
      default:
        return null;
    }
  };

  // Get the appropriate sub-tabs based on the active main tab
  const getCurrentSubTabs = () => {
    if (activeTab === 'envo-chat') return envoChatSubTabs;
    if (activeTab === 'career-forecasting') return careerForecastingSubTabs;
    return subTabs;
  };

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-start pt-8 px-4">
      <div className="w-full max-w-6xl">
        <h1 className="text-3xl font-bold mb-6 text-center text-white">Methodology</h1>
        
        {/* Main Tab Navigation */}
        <div className="flex flex-wrap justify-center mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setActiveSubTab('content'); // Reset to content tab when switching main tabs
                setActiveMetricsTab('overview'); // Reset metrics tab when switching main tabs
              }}
              className={`px-6 py-3 mx-2 mb-2 rounded-lg font-semibold transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-neon-blue text-white shadow-lg'
                  : 'bg-dark-800 text-gray-300 hover:bg-dark-700 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sub Tab Navigation */}
        <div className="flex justify-center mb-6">
          {getCurrentSubTabs().map((subTab) => (
            <button
              key={subTab.id}
              onClick={() => setActiveSubTab(subTab.id)}
              className={`px-4 py-2 mx-1 rounded-lg font-medium transition-all duration-200 ${
                activeSubTab === subTab.id
                  ? 'bg-neon-purple text-white shadow-lg'
                  : 'bg-dark-800 text-gray-300 hover:bg-dark-700 hover:text-white'
              }`}
            >
              {subTab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-dark-900 rounded-xl p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default MethodologyPage;
