import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '../LoginForm';
import { useAuth } from '@/contexts/AuthContext';

// Mock the useAuth hook
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('LoginForm', () => {
  const mockLogin = jest.fn();
  const mockOnSuccess = jest.fn();
  const mockOnSwitchToRegister = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      login: mockLogin,
      isLoading: false,
      error: null,
      user: null,
      tokens: null,
      isAuthenticated: false,
      register: jest.fn(),
      logout: jest.fn(),
      refreshToken: jest.fn(),
      setupMFA: jest.fn(),
      verifyMFA: jest.fn(),
      updateProfile: jest.fn(),
      updatePreferences: jest.fn(),
    });
  });

  it('should render login form with all fields', () => {
    render(<LoginForm />);

    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/remember me/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('should show password toggle button', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const passwordInput = screen.getByLabelText(/password/i);
    const toggleButton = screen.getByRole('button', { name: '' }); // Password toggle button

    expect(passwordInput).toHaveAttribute('type', 'password');

    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');

    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('should display validation errors for empty fields', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });
  });

  it('should display validation error for invalid email', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'invalid-email');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  it('should display validation error for short password', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, '123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
    });
  });

  it('should call login function with correct data on valid submission', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue(undefined);

    render(<LoginForm onSuccess={mockOnSuccess} />);

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const rememberMeCheckbox = screen.getByLabelText(/remember me/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'Password123!');
    await user.click(rememberMeCheckbox);
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'Password123!',
        rememberMe: true,
      });
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('should display auth error when login fails', () => {
    mockUseAuth.mockReturnValue({
      login: mockLogin,
      isLoading: false,
      error: 'Invalid email or password',
      user: null,
      tokens: null,
      isAuthenticated: false,
      register: jest.fn(),
      logout: jest.fn(),
      refreshToken: jest.fn(),
      setupMFA: jest.fn(),
      verifyMFA: jest.fn(),
      updateProfile: jest.fn(),
      updatePreferences: jest.fn(),
    });

    render(<LoginForm />);

    expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
  });

  it('should show loading state during login', () => {
    mockUseAuth.mockReturnValue({
      login: mockLogin,
      isLoading: true,
      error: null,
      user: null,
      tokens: null,
      isAuthenticated: false,
      register: jest.fn(),
      logout: jest.fn(),
      refreshToken: jest.fn(),
      setupMFA: jest.fn(),
      verifyMFA: jest.fn(),
      updateProfile: jest.fn(),
      updatePreferences: jest.fn(),
    });

    render(<LoginForm />);

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    expect(submitButton).toBeDisabled();
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument(); // Loading spinner
  });

  it('should show switch to register button when callback provided', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSwitchToRegister={mockOnSwitchToRegister} />);

    const switchButton = screen.getByRole('button', { name: /sign up/i });
    expect(switchButton).toBeInTheDocument();

    await user.click(switchButton);
    expect(mockOnSwitchToRegister).toHaveBeenCalled();
  });

  it('should not show switch to register button when callback not provided', () => {
    render(<LoginForm />);

    expect(screen.queryByRole('button', { name: /sign up/i })).not.toBeInTheDocument();
  });

  it('should handle forgot password link click', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const forgotPasswordLink = screen.getByText(/forgot your password/i);
    expect(forgotPasswordLink).toBeInTheDocument();

    // Should not throw error when clicked (preventDefault should work)
    await user.click(forgotPasswordLink);
  });
});