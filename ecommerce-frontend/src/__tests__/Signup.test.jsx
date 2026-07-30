// Mocks must be declared before imports to ensure ESM bindings are mocked correctly
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../services/auth', () => ({
  signUpUser: jest.fn(),
  confirmSignUpUser: jest.fn(),
  isAuthenticated: jest.fn(),
}));

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Signup from '../pages/Signup';
import { signUpUser, confirmSignUpUser, isAuthenticated } from '../services/auth';
import { MemoryRouter } from 'react-router-dom';

describe('Signup Page component tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    isAuthenticated.mockReturnValue(false);
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    );
  };

  test('renders registration form', () => {
    renderComponent();

    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Register Account/i })).toBeInTheDocument();
  });

  test('accepts input values', () => {
    renderComponent();

    const nameInput = screen.getByLabelText(/Full Name/i);
    const emailInput = screen.getByLabelText(/Email Address/i);

    fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });
    fireEvent.change(emailInput, { target: { value: 'jane@example.com' } });

    expect(nameInput).toHaveValue('Jane Doe');
    expect(emailInput).toHaveValue('jane@example.com');
  });

  test('validates password mismatch on submit', () => {
    renderComponent();

    const emailInput = screen.getByLabelText(/Email Address/i);
    const passInput = screen.getByLabelText(/^Password/i);
    const confirmInput = screen.getByLabelText(/Confirm Password/i);

    fireEvent.change(emailInput, { target: { value: 'jane@example.com' } });
    fireEvent.change(passInput, { target: { value: 'pass123' } });
    fireEvent.change(confirmInput, { target: { value: 'pass456' } });

    const btn = screen.getByRole('button', { name: /Register Account/i });
    fireEvent.click(btn);

    expect(screen.getByText(/Passwords do not match/i)).toBeInTheDocument();
  });

  test('successfully triggers signup and displays verification code form', async () => {
    signUpUser.mockResolvedValue({ isSignUpComplete: false, nextStep: { signUpStep: 'CONFIRM_SIGN_UP' } });
    renderComponent();

    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Jane Doe' } });
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'jane@example.com' } });
    fireEvent.change(screen.getByLabelText(/^Password/i), { target: { value: 'pass1234' } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'pass1234' } });

    const btn = screen.getByRole('button', { name: /Register Account/i });
    fireEvent.click(btn);

    await waitFor(() => {
      expect(signUpUser).toHaveBeenCalledWith('jane@example.com', 'pass1234', 'Jane Doe');
      expect(screen.getByText(/Verify Account/i)).toBeInTheDocument();
    });
  });

  test('successfully verifies signup code and redirects', async () => {
    const originalSetTimeout = window.setTimeout;
    window.setTimeout = (fn, delay, ...args) => {
      const finalDelay = delay === 2500 ? 0 : delay;
      return originalSetTimeout(fn, finalDelay, ...args);
    };

    try {
      signUpUser.mockResolvedValue({ isSignUpComplete: false, nextStep: { signUpStep: 'CONFIRM_SIGN_UP' } });
      confirmSignUpUser.mockResolvedValue({ isSignUpComplete: true });

      renderComponent();

      // Fill sign up
      fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Jane Doe' } });
      fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'jane@example.com' } });
      fireEvent.change(screen.getByLabelText(/^Password/i), { target: { value: 'pass1234' } });
      fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'pass1234' } });
      fireEvent.click(screen.getByRole('button', { name: /Register Account/i }));

      // Wait for code form
      await waitFor(() => {
        expect(screen.getByLabelText(/Verification Code/i)).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText(/Verification Code/i), { target: { value: '123456' } });
      fireEvent.click(screen.getByRole('button', { name: /Confirm Activation/i }));

      await waitFor(() => {
        expect(confirmSignUpUser).toHaveBeenCalledWith('jane@example.com', '123456');
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    } finally {
      window.setTimeout = originalSetTimeout;
    }
  });

  test('displays API failure message during sign up', async () => {
    signUpUser.mockRejectedValue(new Error('User already exists.'));
    renderComponent();

    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Jane Doe' } });
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'jane@example.com' } });
    fireEvent.change(screen.getByLabelText(/^Password/i), { target: { value: 'pass1234' } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'pass1234' } });
    fireEvent.click(screen.getByRole('button', { name: /Register Account/i }));

    await waitFor(() => {
      expect(screen.getByText(/User already exists/i)).toBeInTheDocument();
    });
  });
});
