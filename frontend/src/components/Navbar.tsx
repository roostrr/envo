import { Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

const Navbar = () => {
  const { user, logout } = useAuthStore()

  return (
    <nav className="bg-dark-900 shadow-sm border-b border-dark-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <div className="w-8 h-8 bg-neon-pink rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-white">ENVO</h1>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/ai-chat" className="text-white hover:text-neon-pink font-medium">
              ENVO Chat Assistant
            </Link>
            <Link to="/career-forecast" className="text-white hover:text-neon-pink font-medium">
              Career Forecast
            </Link>
            <Link to="/envo-learn" className="text-white hover:text-neon-pink font-medium">
              ENVO Learn
            </Link>
            {user?.userType === 'admin' && (
              <Link to="/admin" className="text-white hover:text-neon-pink font-medium">
                Admin
              </Link>
            )}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <Link
                  to="/profile"
                  className="text-white hover:text-neon-pink font-medium"
                >
                  Profile
                </Link>
                <button
                  onClick={logout}
                  className="bg-neon-red text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-white hover:text-neon-pink font-medium"
                >
                  Login
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              to="/ai-chat"
              className="block px-3 py-2 text-white hover:text-neon-pink font-medium"
            >
              ENVO Chat Assistant
            </Link>
            <Link
              to="/career-forecast"
              className="block px-3 py-2 text-white hover:text-neon-pink font-medium"
            >
              Career Forecast
            </Link>
            <Link
              to="/envo-learn"
              className="block px-3 py-2 text-white hover:text-neon-pink font-medium"
            >
              ENVO Learn
            </Link>
            {user?.userType === 'admin' && (
              <Link
                to="/admin"
                className="block px-3 py-2 text-white hover:text-neon-pink font-medium"
              >
                Admin
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar 