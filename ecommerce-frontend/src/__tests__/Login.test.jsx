// Mocks must be declared before imports to ensure ESM bindings are mocked correctly
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../services/auth', () => ({
  signInUser: jest.fn(),
  isAuthenticated: jest.fn(),
}));

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Login from '../pages/Login';
import { signInUser, isAuthenticated } from '../services/auth';
import { MemoryRouter } from 'react-router-dom';

describe('Login Page component tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    isAuthenticated.mockReturnValue(false);
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
  };

  test('renders login form properly', () => {
    renderComponent();

    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });

  test('redirects if user is already authenticated', () => {
    isAuthenticated.mockReturnValue(true);
    renderComponent();
    expect(mockNavigate).toHaveBeenCalledWith('/products');
  });

  test('accepts user inputs for email and password', () => {
    renderComponent();

    const emailInput = screen.getByLabelText(/Email Address/i);
    const pwdInput = screen.getByLabelText(/^Password$/i);

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(pwdInput, { target: { value: 'pass123' } });

    expect(emailInput).toHaveValue('user@example.com');
    expect(pwdInput).toHaveValue('pass123');
  });

  test('displays validation error if inputs are empty during submit', () => {
    renderComponent();

    const submitBtn = screen.getByRole('button', { name: /Sign In/i });
    fireEvent.click(submitBtn);

    // Form inputs use standard browser required attributes, or display error banners
    // In our codebase, they are handled with state checking and local error banners:
    expect(screen.getByText(/Email address is required/i)).toBeInTheDocument();
    expect(screen.getByText(/Password is required/i)).toBeInTheDocument();
  });

  test('successfully signs in user on API success', async () => {
    signInUser.mockResolvedValue({ isSignedIn: true });
    renderComponent();

    const emailInput = screen.getByLabelText(/Email Address/i);
    const pwdInput = screen.getByLabelText(/^Password$/i);

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(pwdInput, { target: { value: 'password123' } });

    const submitBtn = screen.getByRole('button', { name: /Sign In/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(signInUser).toHaveBeenCalledWith('user@example.com', 'password123');
      expect(mockNavigate).toHaveBeenCalledWith('/products');
    });
  });

  test('displays error message on failed sign in', async () => {
    signInUser.mockRejectedValue(new Error('Incorrect username or password.'));
    renderComponent();

    const emailInput = screen.getByLabelText(/Email Address/i);
    const pwdInput = screen.getByLabelText(/^Password$/i);

    fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } });
    fireEvent.change(pwdInput, { target: { value: 'wrongpwd' } });

    const submitBtn = screen.getByRole('button', { name: /Sign In/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Incorrect username or password/i)).toBeInTheDocument();
    });
  });
});
