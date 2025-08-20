import React from 'react';
import { useNavigate } from 'react-router-dom';

const adminFeatures = [
  {
    key: 'methodology',
    label: 'Methodology',
    description: 'View detailed methodology and technical approach for all platform features.',
    color: 'bg-dark-800 border-neon-purple text-neon-purple',
    route: '/admin/methodology',
  },
  {
    key: 'content',
    label: 'Content Management',
    description: 'Edit and manage all platform content, including page descriptions and headers.',
    color: 'bg-dark-800 border-neon-blue text-neon-blue',
  },
  {
    key: 'users',
    label: 'User Management',
    description: 'View, edit, and manage all registered users on the platform.',
    color: 'bg-dark-800 border-neon-green text-neon-green',
  },
  {
    key: 'newsletter',
    label: 'Newsletter Subscription',
    description: 'Manage newsletter subscribers and send emails to users.',
    color: 'bg-dark-800 border-neon-yellow text-neon-yellow',
  },
  {
    key: 'youtube',
    label: 'ENVO Learn Sentiment Analysis',
    description: 'Analyze user sentiment and feedback for educational content.',
    color: 'bg-dark-800 border-neon-pink text-neon-pink',
    route: '/admin/envo-learn-sentiment',
  },
  {
    key: 'ai',
    label: 'Conversational AI Feedback',
    description: 'Analyze feedback and survey data from AI chat users.',
    color: 'bg-dark-800 border-neon-cyan text-neon-cyan',
  },
  {
    key: 'institutional',
    label: 'Institutional Data Export',
    description: 'Export anonymized user data for institutional use.',
    color: 'bg-dark-800 border-neon-green text-neon-green',
  },
  {
    key: 'support',
    label: 'Customer Service',
    description: 'Respond to user enquiries and manage support requests.',
    color: 'bg-dark-800 border-neon-red text-neon-red',
    route: '/admin/customer-service',
  },
  {
    key: 'forecast',
    label: 'Career Forecasting Analytics',
    description: 'View model performance metrics and analytics for career forecasting.',
    color: 'bg-dark-800 border-neon-pink text-neon-pink',
    route: '/admin/career-forecasting-analytics',
  },
  {
    key: 'ml-analytics',
    label: 'ML Recruitment Analytics',
    description: 'View AI model performance, conversation insights, and recruitment predictions.',
    color: 'bg-dark-800 border-neon-blue text-neon-blue',
    route: '/admin/ml-analytics',
  },
  {
    key: 'model-accuracy',
    label: 'Model Accuracy Analytics',
    description: 'Real-time tracking of ML model prediction accuracy and feedback.',
    color: 'bg-dark-800 border-neon-yellow text-neon-yellow',
    route: '/admin/model-accuracy',
  },
  {
    key: 'chat-sentiment',
    label: 'ENVO Chat Agent Sentiment Analysis',
    description: 'Analyze user sentiment and feedback for the AI chat agent.',
    color: 'bg-dark-800 border-neon-purple text-neon-purple',
    route: '/admin/chat-sentiment',
  },
];

const AdminDashboard = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-start pt-8 px-4">
      <div className="w-full max-w-6xl">
        <h1 className="text-3xl font-bold mb-6 text-center text-white">Admin Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminFeatures.map(feature => (
            <div
              key={feature.key}
              className={`rounded-xl border-2 shadow-md px-6 py-8 flex flex-col items-center text-center transition-transform hover:scale-105 cursor-pointer hover:bg-dark-700 ${feature.color}`}
              onClick={() => feature.route && navigate(feature.route)}
            >
              <h2 className="text-xl font-bold mb-2 leading-tight text-white">{feature.label}</h2>
              <p className="text-sm text-gray-300 font-medium leading-snug">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 