import React, { useState, useEffect } from 'react';
import { AuthFlow } from './components/AuthFlow';
import { Dashboard } from './components/Dashboard';
import { ResetPasswordPage } from './components/ResetPasswordPage';
import { useAuth } from './hooks/useAuth';
import { Loader2 } from 'lucide-react';

function App() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<'auth' | 'dashboard' | 'reset-password'>('auth');

  useEffect(() => {
    // Check URL for password reset or other auth flows
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    const accessToken = urlParams.get('access_token');
    const refreshToken = urlParams.get('refresh_token');
    
    if (type === 'recovery' && accessToken && refreshToken) {
      // Valid password reset link
      setCurrentPage('reset-password');
    } else if (user) {
      setCurrentPage('dashboard');
    } else {
      setCurrentPage('auth');
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-400 mx-auto mb-4 animate-spin" />
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show password reset page if we're in recovery mode
  if (currentPage === 'reset-password') {
    return <ResetPasswordPage />;
  }

  // Show authentication flow if user is not signed in
  if (!user) {
    return <AuthFlow />;
  }

  // Show dashboard if user is signed in
  return <Dashboard />;
}

export default App;