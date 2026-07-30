import '@testing-library/jest-dom';
import {
  signInUser,
  logoutUser,
  isAuthenticated,
  getToken,
  getUserId,
  getUsername,
  getEmail,
  getName,
  isAdmin,
} from '../services/auth';
import { signIn, signOut, fetchAuthSession } from 'aws-amplify/auth';

// Mock Amplify Auth APIs
jest.mock('aws-amplify/auth', () => ({
  signIn: jest.fn(),
  signOut: jest.fn(),
  fetchAuthSession: jest.fn(),
}));

// Helper to generate a fake JWT token payload
const mockJwt = (claims) => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify(claims));
  const signature = 'fake_signature';
  return `${header}.${payload}.${signature}`;
};

describe('Auth Service helper methods tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('signInUser signs in and sets tokens in localStorage', async () => {
    signIn.mockResolvedValue({ isSignedIn: true });
    fetchAuthSession.mockResolvedValue({
      tokens: {
        idToken: 'fake-id-token',
        accessToken: 'fake-access-token',
      }
    });

    const result = await signInUser('user@example.com', 'pwd123');

    expect(signOut).toHaveBeenCalled();
    expect(signIn).toHaveBeenCalledWith({ username: 'user@example.com', password: 'pwd123' });
    expect(localStorage.getItem('idToken')).toBe('fake-id-token');
    expect(localStorage.getItem('accessToken')).toBe('fake-access-token');
    expect(result.isSignedIn).toBe(true);
  });

  test('logoutUser logs out and clears tokens from localStorage', async () => {
    localStorage.setItem('idToken', 'id');
    localStorage.setItem('accessToken', 'access');

    await logoutUser();

    expect(signOut).toHaveBeenCalled();
    expect(localStorage.getItem('idToken')).toBeNull();
    expect(localStorage.getItem('accessToken')).toBeNull();
  });

  test('isAuthenticated returns true when access token exists', () => {
    expect(isAuthenticated()).toBe(false);
    localStorage.setItem('accessToken', 'some-token');
    expect(isAuthenticated()).toBe(true);
  });

  test('getToken retrieves access token', () => {
    expect(getToken()).toBeNull();
    localStorage.setItem('accessToken', 'my-token');
    expect(getToken()).toBe('my-token');
  });

  test('getUserId resolves correct Cognito sub claim from access token', () => {
    const token = mockJwt({ sub: 'user-sub-12345' });
    localStorage.setItem('accessToken', token);

    expect(getUserId()).toBe('user-sub-12345');
  });

  test('getUsername resolves username claim', () => {
    const token = mockJwt({ username: 'johndoe' });
    localStorage.setItem('accessToken', token);

    expect(getUsername()).toBe('johndoe');
  });

  test('getEmail resolves email claim from ID token', () => {
    const token = mockJwt({ email: 'john@example.com' });
    localStorage.setItem('idToken', token);

    expect(getEmail()).toBe('john@example.com');
  });

  test('getName resolves name claim from ID token', () => {
    const token = mockJwt({ name: 'John Doe' });
    localStorage.setItem('idToken', token);

    expect(getName()).toBe('John Doe');
  });

  test('isAdmin returns true if admin group exists in tokens', () => {
    const token = mockJwt({ 'cognito:groups': ['Admin', 'Users'] });
    localStorage.setItem('idToken', token);

    expect(isAdmin()).toBe(true);
  });

  test('isAdmin returns false if admin group is missing', () => {
    const token = mockJwt({ 'cognito:groups': ['Users'] });
    localStorage.setItem('idToken', token);

    expect(isAdmin()).toBe(false);
  });
});
