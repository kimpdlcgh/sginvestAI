import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2,
  CheckCircle,
  AlertCircle,
  Shield
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import logo from '../assets/logo.png';

export const ResetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validToken, setValidToken] = useState(false);
  const [checkingToken, setCheckingToken] = useState(true);

  const { updatePassword, signOut } = useAuth();

  useEffect(() => {
    const handlePasswordReset = async () => {
      try {
        // Firebase Auth handles recovery links internally
        // Check if user is authenticated (they clicked the reset link)
        setValidToken(true);
        // Clear the URL parameters for security
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (err) {
        console.error('Error handling password reset:', err);
        setError('An error occurred while processing the reset link.');
      } finally {
        setCheckingToken(false);
      }
    };

    handlePasswordReset();
  }, []);

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
      const { error } = await updatePassword(password);
      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
        // Sign out to clear the session and redirect to sign in after 3 seconds
        setTimeout(async () => {
          await signOut();
          window.location.href = '/';
        }, 3000);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToSignIn = async () => {
    await signOut();
    window.location.href = '/';
  };

  if (checkingToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-green-400 mx-auto mb-4 animate-spin" />
          <p className="text-slate-400">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  if (!validToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Invalid Reset Link</h2>
            <p className="text-slate-400 mb-6">
              {error || 'This password reset link is invalid or has expired. Please request a new password reset.'}
            </p>
            <button
              onClick={handleBackToSignIn}
              className="w-full py-3 bg-gradient-to-r from-green-500 to-gray-600 hover:from-green-600 hover:to-gray-700 text-white font-medium rounded-lg transition-all duration-200"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Password Updated!</h2>
            <p className="text-slate-400 mb-6">
              Your password has been successfully updated. You can now sign in with your new password.
            </p>
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-green-400 text-sm">
                Redirecting to sign in page in 3 seconds...
              </p>
            </div>
            <button
              onClick={handleBackToSignIn}
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <img src={logo} alt="SafeGuard Securities" className="h-16 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Set New Password</h2>
            <p className="text-slate-400">Enter your new password for your SafeGuard account</p>
          </div>

          {/* Security Notice */}
          <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-300">
                <p className="font-medium mb-1">Secure Password Reset</p>
                <p>Choose a strong password to keep your account secure. Your new password will replace your old one immediately.</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your new password"
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
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  placeholder="Confirm your new password"
                  required
                />
              </div>
            </div>

            {/* Password Strength Indicator */}
            {password && (
              <div className="space-y-2">
                <p className="text-sm text-slate-400">Password strength:</p>
                <div className="flex space-x-1">
                  <div className={`h-2 flex-1 rounded ${password.length >= 6 ? 'bg-green-500' : 'bg-slate-600'}`}></div>
                  <div className={`h-2 flex-1 rounded ${password.length >= 8 ? 'bg-green-500' : 'bg-slate-600'}`}></div>
                  <div className={`h-2 flex-1 rounded ${/[A-Z]/.test(password) ? 'bg-green-500' : 'bg-slate-600'}`}></div>
                  <div className={`h-2 flex-1 rounded ${/[0-9]/.test(password) ? 'bg-green-500' : 'bg-slate-600'}`}></div>
                </div>
                <div className="text-xs text-slate-400 space-y-1">
                  <p className={password.length >= 6 ? 'text-green-400' : ''}>✓ At least 6 characters</p>
                  <p className={password.length >= 8 ? 'text-green-400' : ''}>✓ 8+ characters (recommended)</p>
                  <p className={/[A-Z]/.test(password) ? 'text-green-400' : ''}>✓ Uppercase letter</p>
                  <p className={/[0-9]/.test(password) ? 'text-green-400' : ''}>✓ Number</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password || !confirmPassword}
              className="w-full py-3 bg-gradient-to-r from-green-500 to-gray-600 hover:from-green-600 hover:to-gray-700 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{loading ? 'Updating Password...' : 'Update Password'}</span>
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-slate-400 text-sm">
              Remember your password?{' '}
              <button
                onClick={handleBackToSignIn}
                className="text-green-400 hover:text-green-300 font-medium transition-colors"
              >
                Back to Sign In
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};