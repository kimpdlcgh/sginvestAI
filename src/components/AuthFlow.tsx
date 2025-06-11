import React, { useState } from 'react';
import { SignUpPage } from './SignUpPage';
import { SignInPage } from './SignInPage';
import { ForgotPasswordPage } from './ForgotPasswordPage';

export type AuthMode = 'signup' | 'signin' | 'forgot-password';

export const AuthFlow: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<AuthMode>('signup');

  const switchMode = (mode: AuthMode) => {
    setCurrentMode(mode);
  };

  switch (currentMode) {
    case 'signup':
      return <SignUpPage onSwitchMode={switchMode} />;
    case 'signin':
      return <SignInPage onSwitchMode={switchMode} />;
    case 'forgot-password':
      return <ForgotPasswordPage onSwitchMode={switchMode} />;
    default:
      return <SignUpPage onSwitchMode={switchMode} />;
  }
};