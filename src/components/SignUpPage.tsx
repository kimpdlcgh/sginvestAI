import React, { useState } from 'react';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2, 
  CheckCircle,
  Shield,
  BarChart3,
  Brain,
  Smartphone,
  Globe,
  Users
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { AuthMode } from './AuthFlow';
import logo from '../assets/logo.png';

interface SignUpPageProps {
  onSwitchMode: (mode: AuthMode) => void;
}

export const SignUpPage: React.FC<SignUpPageProps> = ({ onSwitchMode }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const { error } = await signUp(email, password);
      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Check Your Email!</h2>
            <p className="text-slate-400 mb-6">
              We've sent you a confirmation link at <span className="text-white font-medium">{email}</span>. 
              Click the link to verify your account and start investing.
            </p>
            <button
              onClick={() => onSwitchMode('signin')}
              className="w-full py-3 bg-gradient-to-r from-green-500 to-gray-600 hover:from-green-600 hover:to-gray-700 text-white font-medium rounded-lg transition-all duration-200"
            >
              Continue to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Container with max width to prevent excessive stretching */}
      <div className="container mx-auto max-w-7xl px-4 min-h-screen">
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen gap-8">
          {/* Left Side - Branding & Features */}
          <div className="hidden lg:flex flex-col justify-center px-6 xl:px-12">
            <div className="max-w-lg">
              {/* Logo */}
              <div className="flex items-center mb-8">
                <img src={logo} alt="SafeGuard Securities" className="h-16" />
              </div>

              {/* Hero Content */}
              <h2 className="text-4xl xl:text-5xl font-bold text-white mb-6 leading-tight">
                Start Your
                <span className="bg-gradient-to-r from-green-400 to-gray-400 bg-clip-text text-transparent"> Investment Journey </span>
                Today
              </h2>
              
              <p className="text-xl text-slate-300 mb-8 leading-relaxed">
                Join thousands of smart investors using AI-powered insights to build wealth and achieve financial freedom.
              </p>

              {/* Features */}
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <Brain className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">AI-Powered Insights</h3>
                    <p className="text-slate-400 text-sm">Get personalized investment recommendations</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Real-Time Analytics</h3>
                    <p className="text-slate-400 text-sm">Track performance with live market data</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-gray-500/10 rounded-lg">
                    <Shield className="w-6 h-6 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Bank-Level Security</h3>
                    <p className="text-slate-400 text-sm">Your data and investments are protected</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <Smartphone className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Mobile Ready</h3>
                    <p className="text-slate-400 text-sm">Trade and monitor anywhere, anytime</p>
                  </div>
                </div>
              </div>

              {/* Social Proof */}
              <div className="mt-12 pt-8 border-t border-slate-700/50">
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-slate-400" />
                    <span className="text-slate-400 text-sm">10,000+ Active Users</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Globe className="w-5 h-5 text-slate-400" />
                    <span className="text-slate-400 text-sm">50+ Countries</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Sign Up Form */}
          <div className="flex flex-col justify-center py-12">
            <div className="mx-auto w-full max-w-md">
              {/* Mobile Logo */}
              <div className="lg:hidden flex items-center justify-center mb-8">
                <img src={logo} alt="SafeGuard Securities" className="h-16" />
              </div>

              <div className="text-center lg:text-left mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">Create Your Account</h2>
                <p className="text-slate-400">
                  Start building your investment portfolio with AI-powered insights
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                      placeholder="Create a password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Must be at least 6 characters</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                      placeholder="Confirm your password"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-green-500 to-gray-600 hover:from-green-600 hover:to-gray-700 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
                </button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-slate-400 text-sm">
                  Already have an account?{' '}
                  <button
                    onClick={() => onSwitchMode('signin')}
                    className="text-green-400 hover:text-green-300 font-medium transition-colors"
                  >
                    Sign in here
                  </button>
                </p>
              </div>

              {/* Terms */}
              <div className="mt-6 text-center">
                <p className="text-xs text-slate-500">
                  By creating an account, you agree to our{' '}
                  <a href="#" className="text-green-400 hover:text-green-300">Terms of Service</a>
                  {' '}and{' '}
                  <a href="#" className="text-green-400 hover:text-green-300">Privacy Policy</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};