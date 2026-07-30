import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signUpUser, confirmSignUpUser } from '../services/auth';
import '../styles/Login.css'; // Reuses base layout variables
import '../styles/Signup.css';

/**
 * Modern E-Commerce Registration & Verification Page
 * Integrated with AWS Cognito.
 */
const Signup = () => {
  const navigate = useNavigate();

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Verification state machine
  const [isConfirming, setIsConfirming] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');

  // UIUX state indicators
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Validation state triggers
  const [touched, setTouched] = useState({ name: false, email: false, password: false, confirmPassword: false });
  const [fieldErrors, setFieldErrors] = useState({ name: '', email: '', password: '', confirmPassword: '', code: '' });

  const isValidEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field);
  };

  const validateField = (field) => {
    setFieldErrors(prev => {
      const errors = { ...prev };
      if (field === 'name') {
        errors.name = !name.trim() ? 'Full Name is required' : '';
      }
      if (field === 'email') {
        if (!email.trim()) {
          errors.email = 'Email address is required';
        } else if (!isValidEmail(email)) {
          errors.email = 'Please enter a valid email address';
        } else {
          errors.email = '';
        }
      }
      if (field === 'password') {
        if (!password) {
          errors.password = 'Password is required';
        } else if (password.length < 8) {
          errors.password = 'Password must be at least 8 characters';
        } else {
          errors.password = '';
        }
      }
      if (field === 'confirmPassword') {
        if (!confirmPassword) {
          errors.confirmPassword = 'Confirm Password is required';
        } else if (confirmPassword !== password) {
          errors.confirmPassword = 'Passwords do not match';
        } else {
          errors.confirmPassword = '';
        }
      }
      return errors;
    });
  };

  const handleChange = (field, val) => {
    if (field === 'name') {
      setName(val);
      if (touched.name) setFieldErrors(prev => ({ ...prev, name: !val.trim() ? 'Full Name is required' : '' }));
    }
    if (field === 'email') {
      setEmail(val);
      if (touched.email) {
        setFieldErrors(prev => ({
          ...prev,
          email: !val.trim() ? 'Email address is required' : (!isValidEmail(val) ? 'Please enter a valid email address' : '')
        }));
      }
    }
    if (field === 'password') {
      setPassword(val);
      if (touched.password) {
        setFieldErrors(prev => ({
          ...prev,
          password: !val ? 'Password is required' : (val.length < 8 ? 'Password must be at least 8 characters' : '')
        }));
      }
      if (touched.confirmPassword && confirmPassword) {
        setFieldErrors(prev => ({
          ...prev,
          confirmPassword: confirmPassword !== val ? 'Passwords do not match' : ''
        }));
      }
    }
    if (field === 'confirmPassword') {
      setConfirmPassword(val);
      if (touched.confirmPassword) {
        setFieldErrors(prev => ({
          ...prev,
          confirmPassword: !val ? 'Confirm Password is required' : (val !== password ? 'Passwords do not match' : '')
        }));
      }
    }
  };

  // Submit registration form details
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setSuccessMsg('');

    setTouched({ name: true, email: true, password: true, confirmPassword: true });

    const hasNameError = !name.trim();
    const hasEmailError = !email.trim() || !isValidEmail(email);
    const hasPasswordError = !password || password.length < 8;
    const hasConfirmPasswordError = !confirmPassword || confirmPassword !== password;

    if (hasNameError || hasEmailError || hasPasswordError || hasConfirmPasswordError) {
      setFieldErrors({
        name: hasNameError ? 'Full Name is required' : '',
        email: !email.trim() ? 'Email is required' : (!isValidEmail(email) ? 'Enter a valid email' : ''),
        password: !password ? 'Password is required' : (password.length < 8 ? 'Must be at least 8 characters' : ''),
        confirmPassword: !confirmPassword ? 'Confirm password is required' : (confirmPassword !== password ? 'Passwords do not match' : ''),
        code: ''
      });
      return;
    }

    try {
      setIsLoading(true);
      const result = await signUpUser(email.trim(), password, name.trim());
      
      // Handle email activation confirm codes step
      if (result.nextStep?.signUpStep === 'CONFIRM_SIGN_UP') {
        setIsConfirming(true);
        setSuccessMsg('Verification code sent to your email. Enter code to confirm activation.');
      } else {
        setSuccessMsg('Account created successfully! Redirecting to login...');
        window.setTimeout(() => navigate('/login'), 2500);
      }
    } catch (err) {
      console.error('Registration failed:', err);
      const errorName = err.name || '';
      const errorMessage = err.message || '';

      if (errorName === 'UsernameExistsException') {
        setAuthError('An account with this email address already exists.');
      } else if (errorName === 'InvalidPasswordException') {
        setAuthError('Password does not meet validation criteria (requires numbers and special characters).');
      } else if (errorName === 'InvalidParameterException' && errorMessage.includes('password')) {
        setAuthError('Weak password structure. Please use a stronger password.');
      } else if (errorName === 'InvalidParameterException') {
        setAuthError('Invalid registration parameter. Please double check details.');
      } else if (errorMessage.toLowerCase().includes('network') || errorName === 'NetworkError') {
        setAuthError('Network error. Check internet connectivity and retry.');
      } else {
        setAuthError(errorMessage || 'Registration failed. Please check attributes.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Submit confirmation activation code
  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setSuccessMsg('');

    if (!verificationCode.trim()) {
      setFieldErrors(prev => ({ ...prev, code: 'Verification code is required' }));
      return;
    }

    try {
      setIsLoading(true);
      await confirmSignUpUser(email.trim(), verificationCode.trim());
      setSuccessMsg('Account activated successfully! Redirecting to Login page...');
      window.setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      console.error('Activation confirmation failed:', err);
      const errorName = err.name || '';
      const errorMessage = err.message || '';

      if (errorName === 'CodeMismatchException') {
        setAuthError('Incorrect verification code. Please check your email and try again.');
      } else if (errorName === 'ExpiredCodeException') {
        setAuthError('Verification code has expired. Please request a new registration.');
      } else {
        setAuthError(errorMessage || 'Activation confirmation failed.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-shell">
        <section className="login-spotlight" aria-hidden="true">
          <div className="spotlight-badge">Priority Sign Up</div>
          <h2>Join us today for a premium shopping experience.</h2>
          <p>
            Create an account to track shipments, cache your cart across devices,
            and review orders.
          </p>

          <div className="spotlight-stats">
            <div className="spotlight-stat">
              <strong>10s</strong>
              <span>Fast Registration</span>
            </div>
            <div className="spotlight-stat">
              <strong>100%</strong>
              <span>AWS Cognito Secured</span>
            </div>
          </div>
        </section>

        <div className="login-container">
          <div className="login-card">
            <header className="login-header">
              <div className="brand-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="brand-logo-icon">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
                <span>E-Shop Experience</span>
              </div>
              <h1 className="login-title">{isConfirming ? 'Verify Account' : 'Sign Up'}</h1>
              <p className="login-subtitle">
                {isConfirming 
                  ? 'We have sent a verification code to your email. Enter it below to activate your account.' 
                  : 'Register a new customer account to continue shopping.'}
              </p>
            </header>

            {authError && (
              <div className="card-error" role="alert">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="error-alert-icon">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{authError}</span>
              </div>
            )}

            {successMsg && (
              <div className="card-success" role="status">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="success-alert-icon">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>{successMsg}</span>
              </div>
            )}

            {!isConfirming ? (
              <form className="login-form" onSubmit={handleRegisterSubmit} noValidate>
                <div className="form-group">
                  <label htmlFor="name" className="form-label">Full Name</label>
                  <div className="input-container">
                    <input
                      id="name"
                      type="text"
                      className={`form-input ${touched.name && fieldErrors.name ? 'is-invalid' : ''}`}
                      placeholder="Jane Doe"
                      value={name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      onBlur={() => handleBlur('name')}
                      disabled={isLoading}
                      required
                    />
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="input-icon">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  {touched.name && fieldErrors.name && (
                    <p className="field-error-text">{fieldErrors.name}</p>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="email" className="form-label">Email Address</label>
                  <div className="input-container">
                    <input
                      id="email"
                      type="email"
                      className={`form-input ${touched.email && fieldErrors.email ? 'is-invalid' : ''}`}
                      placeholder="jane@example.com"
                      value={email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      onBlur={() => handleBlur('email')}
                      disabled={isLoading}
                      required
                    />
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="input-icon">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </div>
                  {touched.email && fieldErrors.email && (
                    <p className="field-error-text">{fieldErrors.email}</p>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="password" className="form-label">Password (Min 8 chars)</label>
                  <div className="input-container">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      className={`form-input form-input-password ${touched.password && fieldErrors.password ? 'is-invalid' : ''}`}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      onBlur={() => handleBlur('password')}
                      disabled={isLoading}
                      required
                    />
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="input-icon">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowPassword(prev => !prev)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="toggle-icon">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="toggle-icon">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {touched.password && fieldErrors.password && (
                    <p className="field-error-text">{fieldErrors.password}</p>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                  <div className="input-container">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      className={`form-input form-input-password ${touched.confirmPassword && fieldErrors.confirmPassword ? 'is-invalid' : ''}`}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => handleChange('confirmPassword', e.target.value)}
                      onBlur={() => handleBlur('confirmPassword')}
                      disabled={isLoading}
                      required
                    />
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="input-icon">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowConfirmPassword(prev => !prev)}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="toggle-icon">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="toggle-icon">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {touched.confirmPassword && fieldErrors.confirmPassword && (
                    <p className="field-error-text">{fieldErrors.confirmPassword}</p>
                  )}
                </div>

                <button type="submit" className="login-btn" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <div className="spinner" aria-hidden="true"></div>
                      <span>Registering...</span>
                    </>
                  ) : (
                    <span>Register Account</span>
                  )}
                </button>
              </form>
            ) : (
              <form className="login-form" onSubmit={handleVerifySubmit} noValidate>
                <div className="form-group">
                  <label htmlFor="code" className="form-label">Email Verification Code</label>
                  <div className="input-container">
                    <input
                      id="code"
                      type="text"
                      className={`form-input ${fieldErrors.code ? 'is-invalid' : ''}`}
                      placeholder="Enter 6-digit code"
                      value={verificationCode}
                      onChange={(e) => {
                        setVerificationCode(e.target.value);
                        setFieldErrors(prev => ({ ...prev, code: '' }));
                      }}
                      disabled={isLoading}
                      required
                    />
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="input-icon">
                      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                      <path d="M12 6v6l4 2" />
                    </svg>
                  </div>
                  {fieldErrors.code && (
                    <p className="field-error-text">{fieldErrors.code}</p>
                  )}
                </div>

                <button type="submit" className="login-btn" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <div className="spinner" aria-hidden="true"></div>
                      <span>Confirming Activation...</span>
                    </>
                  ) : (
                    <span>Confirm Activation</span>
                  )}
                </button>
              </form>
            )}

            <div className="login-signup-redirect">
              <span>Already have an account? </span>
              <span className="redirect-link" onClick={() => navigate('/login')}>Sign In</span>
            </div>

            <footer className="login-extra-footer">
              <span className="footer-link">Conditions of Use</span>
              <span className="footer-divider">|</span>
              <span className="footer-link">Privacy Notice</span>
              <span className="footer-divider">|</span>
              <span className="footer-link">Help</span>
              <p className="footer-copy">&copy; 2026 E-Shop Experience. All rights reserved.</p>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
