import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegisterForm } from '../RegisterForm';
import { useAuth } from '@/contexts/AuthContext';

// Mock the useAuth hook
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('RegisterForm', () => {
  const mockRegister = jest.fn();
  const mockOnSuccess = jest.fn();
  const mockOnSwitchToLogin = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      register: mockRegister,
      isLoading: false,
      error: null,
      user: null,
      tokens: null,
      isAuthenticated: false,
      login: jest.fn(),
      logout: jest.fn(),
      refreshToken: jest.fn(),
      setupMFA: jest.fn(),
      verifyMFA: jest.fn(),
      updateProfile: jest.fn(),
      updatePreferences: jest.fn(),
    });
  });

  it('should render registration form with all fields', () => {
    render(<RegisterForm />);

    expect(screen.getByText('Create Account')).toBeInTheDocument();
    expect(screen.getByText('Join us to get started')).toBeInTheDocument();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/terms of service/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('should show password strength indicator', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    const passwordInput = screen.getByLabelText('Password');
    
    // Test weak password
    await user.type(passwordInput, 'weak');
    expect(screen.getByText('Too Short')).toBeInTheDocument();

    // Clear and test stronger password
    await user.clear(passwordInput);
    await user.type(passwordInput, 'StrongPass123!');
    expect(screen.getByText('Strong')).toBeInTheDocument();
  });

  it('should toggle password visibility', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const passwordToggleButtons = screen.getAllByRole('button', { name: '' });

    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(confirmPasswordInput).toHaveAttribute('type', 'password');

    // Toggle password visibility
    await user.click(passwordToggleButtons[0]);
    expect(passwordInput).toHaveAttribute('type', 'text');

    // Toggle confirm password visibility
    await user.click(passwordToggleButtons[1]);
    expect(confirmPasswordInput).toHaveAttribute('type', 'text');
  });

  it('should display validation errors for empty required fields', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('First name is required')).toBeInTheDocument();
      expect(screen.getByText('Last name is required')).toBeInTheDocument();
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
      expect(screen.getByText('Please confirm your password')).toBeInTheDocument();
      expect(screen.getByText('You must accept the terms and conditions')).toBeInTheDocument();
    });
  });

  it('should display validation error for weak password', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /create account/i });

    await user.type(passwordInput, 'weakpass');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Password must contain at least one uppercase letter/)).toBeInTheDocument();
    });
  });

  it('should display validation error for mismatched passwords', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    await user.type(passwordInput, 'StrongPass123!');
    await user.type(confirmPasswordInput, 'DifferentPass123!');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  it('should call register function with correct data on valid submission', async () => {
    const user = userEvent.setup();
    mockRegister.mockResolvedValue(undefined);

    render(<RegisterForm onSuccess={mockOnSuccess} />);

    // Fill out the form
    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    await user.type(screen.getByLabelText(/email address/i), 'john.doe@example.com');
    await user.type(screen.getByLabelText('Password'), 'StrongPass123!');
    await user.type(screen.getByLabelText(/confirm password/i), 'StrongPass123!');
    await user.click(screen.getByLabelText(/terms of service/i));

    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'StrongPass123!',
        confirmPassword: 'StrongPass123!',
        acceptTerms: true,
      });
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('should display auth error when registration fails', () => {
    mockUseAuth.mockReturnValue({
      register: mockRegister,
      isLoading: false,
      error: 'User with this email already exists',
      user: null,
      tokens: null,
      isAuthenticated: false,
      login: jest.fn(),
      logout: jest.fn(),
      refreshToken: jest.fn(),
      setupMFA: jest.fn(),
      verifyMFA: jest.fn(),
      updateProfile: jest.fn(),
      updatePreferences: jest.fn(),
    });

    render(<RegisterForm />);

    expect(screen.getByText('User with this email already exists')).toBeInTheDocument();
  });

  it('should show loading state during registration', () => {
    mockUseAuth.mockReturnValue({
      register: mockRegister,
      isLoading: true,
      error: null,
      user: null,
      tokens: null,
      isAuthenticated: false,
      login: jest.fn(),
      logout: jest.fn(),
      refreshToken: jest.fn(),
      setupMFA: jest.fn(),
      verifyMFA: jest.fn(),
      updateProfile: jest.fn(),
      updatePreferences: jest.fn(),
    });

    render(<RegisterForm />);

    const submitButton = screen.getByRole('button', { name: /create account/i });
    expect(submitButton).toBeDisabled();
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument(); // Loading spinner
  });

  it('should show switch to login button when callback provided', async () => {
    const user = userEvent.setup();
    render(<RegisterForm onSwitchToLogin={mockOnSwitchToLogin} />);

    const switchButton = screen.getByRole('button', { name: /sign in/i });
    expect(switchButton).toBeInTheDocument();

    await user.click(switchButton);
    expect(mockOnSwitchToLogin).toHaveBeenCalled();
  });

  it('should not show switch to login button when callback not provided', () => {
    render(<RegisterForm />);

    expect(screen.queryByRole('button', { name: /sign in/i })).not.toBeInTheDocument();
  });

  it('should validate short names', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    const firstNameInput = screen.getByLabelText(/first name/i);
    const lastNameInput = screen.getByLabelText(/last name/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    await user.type(firstNameInput, 'J');
    await user.type(lastNameInput, 'D');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('First name must be at least 2 characters')).toBeInTheDocument();
      expect(screen.getByText('Last name must be at least 2 characters')).toBeInTheDocument();
    });
  });

  it('should validate invalid email format', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    await user.type(emailInput, 'invalid-email');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });
});