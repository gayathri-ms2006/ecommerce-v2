import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInUser, isAuthenticated, isAdmin } from '../services/auth';

export const useLoginForm = (isAdminLogin = false) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });
  const [touched, setTouched] = useState({ email: false, password: false });

  useEffect(() => {
    if (!isAdminLogin && isAuthenticated()) {
      navigate('/products');
    }
  }, [navigate, isAdminLogin]);

  const isValidEmail = (val) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  };

  const validateForm = () => {
    const errors = { email: '', password: '' };
    let isValid = true;

    if (!email.trim()) {
      errors.email = 'Email address is required';
      isValid = false;
    } else if (!isValidEmail(email)) {
      errors.email = 'Please enter a valid email address';
      isValid = false;
    }

    if (!password) {
      errors.password = 'Password is required';
      isValid = false;
    }

    setFieldErrors(errors);
    return isValid;
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    setFieldErrors(prev => {
      const nextErrors = { ...prev };
      if (field === 'email') {
        if (!email.trim()) {
          nextErrors.email = 'Email address is required';
        } else if (!isValidEmail(email)) {
          nextErrors.email = 'Please enter a valid email address';
        } else {
          nextErrors.email = '';
        }
      }
      if (field === 'password') {
        if (!password) {
          nextErrors.password = 'Password is required';
        } else {
          nextErrors.password = '';
        }
      }
      return nextErrors;
    });
  };

  const handleChange = (field, val) => {
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
          password: !val ? 'Password is required' : ''
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setTouched({ email: true, password: true });

    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);
      const result = await signInUser(email.trim(), password);

      if (isAdminLogin) {
        if (result?.isSignedIn && isAdmin()) {
          navigate('/admin/dashboard', { replace: true });
          return;
        }
        setAuthError('Access denied. Only admin accounts can sign in here.');
      } else {
        if (result?.isSignedIn) {
          navigate('/products');
        } else {
          setAuthError('Authentication required further steps. Please check your credentials or contact support.');
        }
      }
    } catch (err) {
      console.error('Login process error details:', err);
      const errorName = err.name || '';
      const errorMessage = err.message || '';

      if (isAdminLogin) {
        setAuthError(err.message || 'Unable to sign in. Please verify your admin credentials.');
      } else {
        if (errorName === 'UserNotFoundException') {
          setAuthError('No account found with this email address.');
        } else if (errorName === 'NotAuthorizedException') {
          setAuthError('Incorrect username or password. Please try again.');
        } else if (errorName === 'UserNotConfirmedException') {
          setAuthError('This account is not confirmed. Please confirm your registration first.');
        } else if (errorName === 'LimitExceededException') {
          setAuthError('Too many unsuccessful login attempts. Please try again later.');
        } else if (errorMessage.toLowerCase().includes('network') || errorName === 'NetworkError') {
          setAuthError('Network connection error. Please check your internet connectivity and try again.');
        } else {
          setAuthError(errorMessage || 'An error occurred during authentication. Please try again.');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    rememberMe,
    setRememberMe,
    isLoading,
    authError,
    setAuthError,
    fieldErrors,
    touched,
    handleBlur,
    handleChange,
    handleSubmit
  };
};
