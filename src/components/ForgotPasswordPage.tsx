import React, { useState } from 'react';
import { 
  Mail, 
  Loader2,
  ArrowLeft,
  CheckCircle,
  Info,
  AlertTriangle,
  Settings,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { AuthMode } from './AuthFlow';
import logo from '../assets/logo.png';

interface ForgotPasswordPageProps {
  onSwitchMode: (mode: AuthMode) => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onSwitchMode }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await resetPassword(email);
      
      if (result.error) {
        // Check for specific email configuration errors
        if (result.error.message.includes('Error sending recovery email') || 
            result.error.message.includes('SMTP') ||
            result.error.message.includes('email service')) {
          setError('Email service not configured. For development, you can create a new account instead of resetting your password.');
        } else {
          setError(result.error.message);
        }
      } else {
        setSuccess(true);
      }
    } catch (err) {
      console.error('Reset password error:', err);
      setError('Email service not configured for this development environment. Please create a new account instead.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Check Your Email</h2>
            <p className="text-slate-400 mb-6">
              We've sent a password reset link to <span className="text-white font-medium">{email}</span>. 
              Click the link in the email to reset your password.
            </p>
            
            <button
              onClick={() => onSwitchMode('signin')}
              className="w-full py-3 bg-gradient-to-r from-green-500 to-gray-600 hover:from-green-600 hover:to-gray-700 text-white font-medium rounded-lg transition-all duration-200"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8">
          {/* Back Button */}
          <button
            onClick={() => onSwitchMode('signin')}
            className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Sign In</span>
          </button>

          {/* Logo */}
          <div className="text-center mb-8">
            <img src={logo} alt="SafeGuard Securities" className="h-16 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Reset Password</h2>
            <p className="text-slate-400">Enter your email to receive a reset link</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-400">
                  <p className="font-medium mb-1">Reset Failed</p>
                  <p>{error}</p>
                  {error.includes('Email service not configured') && (
                    <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <p className="text-blue-400 text-sm">
                        <strong>Development Tip:</strong> Email service isn't configured yet. 
                        You can create a new account instead, or ask the developer to set up email configuration.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Email Configuration Notice */}
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <div className="flex items-start space-x-3">
              <Settings className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-300">
                <p className="font-medium mb-1">Development Environment</p>
                <p className="mb-2">Email service may not be configured. If password reset fails:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Create a new account with a different email</li>
                  <li>Or ask the developer to configure email settings</li>
                  <li>Email confirmation can be disabled for development</li>
                </ul>
              </div>
            </div>
          </div>

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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-green-500 to-gray-600 hover:from-green-600 hover:to-gray-700 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{loading ? 'Sending Reset Link...' : 'Send Reset Link'}</span>
            </button>
          </form>

          {/* Alternative Options */}
          <div className="mt-8 p-4 bg-slate-700/30 rounded-lg border border-slate-600/30">
            <h4 className="text-slate-300 text-sm font-medium mb-2">Alternative Options</h4>
            <div className="space-y-2 text-xs text-slate-400">
              <p>• Create a new account with a different email address</p>
              <p>• Contact support if you need access to your existing account</p>
              <p>• For developers: Configure SMTP settings in Supabase Dashboard</p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-slate-400 text-sm">
              Remember your password?{' '}
              <button
                onClick={() => onSwitchMode('signin')}
                className="text-green-400 hover:text-green-300 font-medium transition-colors"
              >
                Sign in here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};