import { Routes, Route } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import CareerForecastPage from './pages/CareerForecastPage'
import YouTubePage from './pages/YouTubePage'
import AIChatPage from './pages/AIChatPage'
import ProfilePage from './pages/ProfilePage'
import AdminDashboard from './pages/AdminDashboard'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuthStore } from './stores/authStore'
import HelpCentrePage from './pages/HelpCentrePage';
import CustomerServicePage from './pages/CustomerServicePage';
import YouTubeFeedbackPage from './pages/YouTubeFeedbackPage';
import ENVOLearnSentimentPage from './pages/ENVOLearnSentimentPage';
import CareerForecastingAnalyticsPage from './pages/CareerForecastingAnalyticsPage';
import MLAnalyticsPage from './pages/MLAnalyticsPage';
import ModelAccuracyPage from './pages/ModelAccuracyPage';
import ChatAgentSentimentPage from './pages/ChatAgentSentimentPage';
import MethodologyPage from './pages/MethodologyPage';

function App() {
  const { user } = useAuthStore()

  return (
    <>
      <Helmet>
        <title>ENVO</title>
        <meta name="description" content="ENVO: AI-powered career forecasting and educational guidance platform" />
      </Helmet>
      
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="career-forecast" element={<CareerForecastPage />} />
          <Route path="envo-learn" element={<YouTubePage />} />
          <Route path="help-centre" element={<HelpCentrePage />} />
          <Route path="ai-chat" element={<AIChatPage />} />
          
          {/* Protected routes */}
          <Route path="profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          
          {/* Admin routes - temporarily public */}
          <Route path="admin/*" element={<AdminDashboard />} />
          <Route path="admin/methodology" element={<MethodologyPage />} />
          <Route path="admin/customer-service" element={<CustomerServicePage />} />
          <Route path="admin/envo-learn-feedback" element={<YouTubeFeedbackPage />} />
          <Route path="admin/envo-learn-sentiment" element={<ENVOLearnSentimentPage />} />
          <Route path="admin/career-forecasting-analytics" element={<CareerForecastingAnalyticsPage />} />
          <Route path="admin/ml-analytics" element={<MLAnalyticsPage />} />
          <Route path="admin/model-accuracy" element={<ModelAccuracyPage />} />
          <Route path="admin/chat-sentiment" element={<ChatAgentSentimentPage />} />
        </Route>
      </Routes>
    </>
  )
}

export default App 