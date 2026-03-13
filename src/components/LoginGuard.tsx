import React, { useState } from 'react';
import './LoginGuard.css';

/**
 * Access Control Component
 * Wraps the application and requires a password if VITE_IS_PRIVATE is true.
 */
interface LoginGuardProps {
  children: React.ReactNode;
}

export const LoginGuard: React.FC<LoginGuardProps> = ({ children }) => {
  const isPrivate = import.meta.env.VITE_IS_PRIVATE === 'true';
  const [isAuthorized, setIsAuthorized] = useState(() => {
    // Automatically authorize in development mode
    if (import.meta.env.DEV) return true;
    if (!isPrivate) return true;
    return sessionStorage.getItem('is_authorized') === 'true';
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPassword = String(import.meta.env.VITE_ACCESS_PASSWORD || '').trim();
    
    // Debug log for troubleshooting
    console.log('Login attempt:', { 
      inputLength: passwordInput.trim().length, 
      expectedLength: correctPassword.length,
      isMatch: passwordInput.trim() === correctPassword
    });

    if (passwordInput.trim() === correctPassword) {
      setIsAuthorized(true);
      sessionStorage.setItem('is_authorized', 'true');
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="login-container">
        <form className="login-form" onSubmit={handleLogin}>
          <h1>Access Restricted</h1>
          <p>This application is private. Please enter the password to continue.</p>
          <input
            type="password"
            className="login-input"
            placeholder="Enter password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            autoFocus
          />
          {loginError && <p className="login-error">Incorrect password. Please try again.</p>}
          <button type="submit" className="login-button">Login</button>
        </form>
      </div>
    );
  }

  return <>{children}</>;
};
