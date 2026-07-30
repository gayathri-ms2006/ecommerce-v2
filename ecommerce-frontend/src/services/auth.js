import { Amplify } from 'aws-amplify';
import { signIn, signOut, fetchAuthSession, signUp, confirmSignUp } from 'aws-amplify/auth';
import { cognitoConfig } from '../config/cognito';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: cognitoConfig.userPoolId,
      userPoolClientId: cognitoConfig.userPoolClientId,
    },
  },
});

/**
 * Sign in user
 */
export const signInUser = async (email, password) => {
  try {
    await signOut();
  } catch (error) {
    // Ignore if there was no active session
  }
  localStorage.removeItem('idToken');
  localStorage.removeItem('accessToken');

  const result = await signIn({
    username: email,
    password,
  });

  if (result.isSignedIn) {
    const session = await fetchAuthSession();

    const idToken = session.tokens?.idToken?.toString();
    const accessToken = session.tokens?.accessToken?.toString();

    if (idToken) {
      localStorage.setItem('idToken', idToken);
    }

    if (accessToken) {
      localStorage.setItem('accessToken', accessToken);
    }
  }

  return result;
};

/**
 * Logout user
 */
export const logoutUser = async () => {
  try {
    await signOut();
  } catch (error) {
    console.error('Cognito sign-out error:', error);
  } finally {
    localStorage.removeItem('idToken');
    localStorage.removeItem('accessToken');
  }
};

/**
 * Return access token
 */
export const getToken = () => {
  return localStorage.getItem('accessToken');
};

/**
 * Check authentication
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem('accessToken');
};

/**
 * Decode JWT
 */
export const decodeToken = (token) => {
  if (!token) return null;

  try {
    const payload = token.split('.')[1];

    return JSON.parse(atob(payload));
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
};

/**
 * Return Cognito User ID (sub)
 */
export const getUserId = () => {
  const token = localStorage.getItem('accessToken');

  if (!token) {
    return null;
  }

  const decoded = decodeToken(token);

  return decoded?.sub || null;
};

/**
 * Return username
 */
export const getUsername = () => {
  const token = localStorage.getItem('accessToken');

  if (!token) {
    return '';
  }

  const decoded = decodeToken(token);

  return decoded?.username || '';
};

/**
 * Return email from ID token
 */
export const getEmail = () => {
  const token = localStorage.getItem('idToken');

  if (!token) {
    return '';
  }

  const decoded = decodeToken(token);

  return decoded?.email || '';
};

/**
 * Return name from ID token
 */
export const getName = () => {
  const token = localStorage.getItem('idToken');

  if (!token) {
    return '';
  }

  const decoded = decodeToken(token);

  return decoded?.name || '';
};

/**
 * Determine whether the signed-in user has admin privileges.
 * This uses the Cognito token groups/roles claim when available.
 */
export const isAdmin = () => {
  const token = localStorage.getItem('idToken') || localStorage.getItem('accessToken');

  if (!token) {
    return false;
  }

  const decoded = decodeToken(token);
  const groups = decoded?.['cognito:groups'] || decoded?.groups || [];
  const roles = decoded?.['custom:role'] || decoded?.role || '';

  if (Array.isArray(groups)) {
    return groups.some((group) => String(group).toLowerCase() === 'admin');
  }

  return String(roles).toLowerCase() === 'admin';
};

/**
 * Sign up a new customer in Cognito
 */
export const signUpUser = async (email, password, name) => {
  try {
    const result = await signUp({
      username: email,
      password,
      options: {
        userAttributes: {
          email,
          name,
        },
      },
    });
    return result;
  } catch (error) {
    console.error('Cognito signUp error:', error);
    throw error;
  }
};

/**
 * Confirm user signup with email verification code
 */
export const confirmSignUpUser = async (email, code) => {
  try {
    const result = await confirmSignUp({
      username: email,
      confirmationCode: code,
    });
    return result;
  } catch (error) {
    console.error('Cognito confirmSignUp error:', error);
    throw error;
  }
};