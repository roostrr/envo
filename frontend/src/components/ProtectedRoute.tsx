import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredUserType?: 'admin' | 'institution' | 'regular'
}

const ProtectedRoute = ({ children, requiredUserType }: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (requiredUserType && user?.userType !== requiredUserType) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute 