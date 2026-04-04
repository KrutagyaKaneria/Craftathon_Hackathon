import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api.js';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      console.log('🔐 Logging in with:', email);
      
      const result = await apiService.login(email, password);
      
      setSuccess('✅ Login successful! Redirecting to drivers...');
      
      // Redirect to driver selection after short delay
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (error) {
      console.error('❌ Login failed:', error);
      setError(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-blue-400 mb-2">🚗 DriveGuard</h1>
            <p className="text-gray-400">Owner Dashboard Login</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 rounded-lg bg-red-600 px-4 py-3 text-sm">
              <p className="font-semibold">❌ {error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-6 rounded-lg bg-green-600 px-4 py-3 text-sm">
              <p className="font-semibold">{success}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@example.com"
                className="w-full rounded-lg bg-gray-700 px-4 py-2 text-white placeholder-gray-500 border border-gray-600 focus:border-blue-500 focus:outline-none transition-colors"
                disabled={loading}
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg bg-gray-700 px-4 py-2 text-white placeholder-gray-500 border border-gray-600 focus:border-blue-500 focus:outline-none transition-colors"
                disabled={loading}
              />
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 py-2 font-semibold text-white hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors mt-6"
            >
              {loading ? '🔄 Logging in...' : '🔐 Login'}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-8 rounded-lg bg-blue-900 px-4 py-4 border border-blue-700">
            <p className="text-sm font-semibold text-blue-300 mb-2">💡 Demo Credentials (for testing):</p>
            <p className="text-xs text-gray-300 font-mono bg-gray-900 px-2 py-1 rounded mb-2">
              Email: owner@example.com
            </p>
            <p className="text-xs text-gray-400">
              ℹ️ Log in with your credentials to access your drivers. The token will be stored securely in your browser.
            </p>
          </div>

          {/* Features Info */}
          <div className="mt-6 text-center text-gray-400 text-xs">
            <p>🔒 Secure Login  •  🚗 Driver Management  •  📊 Analytics</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
