import React, { useState } from 'react';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2,
  ArrowLeft,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { AuthMode } from './AuthFlow';
import logo from '../assets/logo.png';

interface SignInPageProps {
  onSwitchMode: (mode: AuthMode) => void;
}

export const SignInPage: React.FC<SignInPageProps> = ({ onSwitchMode }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const { signIn, resendConfirmationEmail } = useAuth();

  const getErrorMessage = (error: any) => {
    if (!error) return '';
    
    const message = error.message?.toLowerCase() || '';
    
    if (message.includes('invalid login credentials') || message.includes('invalid_credentials')) {
      return 'Invalid email or password. Please check your credentials and try again.';
    }
    
    if (message.includes('email not confirmed')) {
      return 'Please check your email and click the confirmation link to verify your account before signing in.';
    }
    
    if (message.includes('too many requests')) {
      return 'Too many login attempts. Please wait a few minutes before trying again.';
    }
    
    if (message.includes('user not found')) {
      return 'No account found with this email address. Please sign up first.';
    }
    
    return error.message || 'An unexpected error occurred. Please try again.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setShowEmailConfirmation(false);
    setResendSuccess(false);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        const errorMessage = getErrorMessage(error);
        
        if (error.message === 'Email not confirmed' || errorMessage.includes('confirmation')) {
          setShowEmailConfirmation(true);
        }
        
        setError(errorMessage);
      }
      // If successful, the useAuth hook will handle the redirect
    } catch (err: any) {
      console.error('Sign in error:', err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      setError('Please enter your email address first');
      return;
    }

    setResendLoading(true);
    setError('');
    setResendSuccess(false);

    try {
      const { error } = await resendConfirmationEmail(email);
      if (error) {
        setError(getErrorMessage(error));
      } else {
        setResendSuccess(true);
      }
    } catch (err: any) {
      console.error('Resend confirmation error:', err);
      setError('Failed to resend confirmation email. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8">
          {/* Back Button */}
          <button
            onClick={() => onSwitchMode('signup')}
            className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Sign Up</span>
          </button>

          {/* Logo */}
          <div className="text-center mb-8">
            <img src={logo} alt="SafeGuard Securities" className="h-16 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
            <p className="text-slate-400">Sign in to your SafeGuard account</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="text-red-400 text-sm">{error}</div>
            </div>
          )}

          {showEmailConfirmation && (
            <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="text-blue-400 text-sm mb-3">
                Your email address needs to be confirmed before you can sign in.
              </div>
              {resendSuccess ? (
                <div className="text-green-400 text-sm flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Confirmation email sent! Please check your inbox and spam folder.</span>
                </div>
              ) : (
                <button
                  onClick={handleResendConfirmation}
                  disabled={resendLoading}
                  className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {resendLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {!resendLoading && <RefreshCw className="w-4 h-4" />}
                  <span>{resendLoading ? 'Sending...' : 'Resend confirmation email'}</span>
                </button>
              )}
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
                  placeholder="Enter your password"
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
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-green-500 bg-slate-700 border-slate-600 rounded focus:ring-green-500 focus:ring-2"
                />
                <span className="ml-2 text-sm text-slate-300">Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => onSwitchMode('forgot-password')}
                className="text-sm text-green-400 hover:text-green-300 transition-colors"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-green-500 to-gray-600 hover:from-green-600 hover:to-gray-700 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{loading ? 'Signing In...' : 'Sign In'}</span>
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-slate-400 text-sm">
              Don't have an account?{' '}
              <button
                onClick={() => onSwitchMode('signup')}
                className="text-green-400 hover:text-green-300 font-medium transition-colors"
              >
                Sign up here
              </button>
            </p>
          </div>

          {/* Help Text */}
          <div className="mt-6 p-4 bg-slate-700/30 rounded-lg border border-slate-600/30">
            <h4 className="text-slate-300 text-sm font-medium mb-2">Having trouble signing in?</h4>
            <ul className="text-slate-400 text-xs space-y-1">
              <li>• Make sure your email and password are correct</li>
              <li>• Check if you've confirmed your email address</li>
              <li>• Use "Forgot password?" if you can't remember your password</li>
              <li>• Create a new account if you haven't signed up yet</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};