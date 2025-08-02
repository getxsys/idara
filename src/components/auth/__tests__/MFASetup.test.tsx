import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MFASetup } from '../MFASetup';
import { useAuth } from '@/contexts/AuthContext';

// Mock the useAuth hook
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('MFASetup', () => {
  const mockSetupMFA = jest.fn();
  const mockVerifyMFA = jest.fn();
  const mockOnComplete = jest.fn();
  const mockOnSkip = jest.fn();

  const mockMFAData = {
    secret: 'JBSWY3DPEHPK3PXP',
    qrCode: 'data:image/png;base64,mockQRCode',
    backupCodes: ['backup01', 'backup02', 'backup03', 'backup04', 'backup05', 'backup06', 'backup07', 'backup08'],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      setupMFA: mockSetupMFA,
      verifyMFA: mockVerifyMFA,
      error: null,
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      refreshToken: jest.fn(),
      updateProfile: jest.fn(),
      updatePreferences: jest.fn(),
    });
  });

  it('should render setup step initially', () => {
    render(<MFASetup />);

    expect(screen.getByText('Secure Your Account')).toBeInTheDocument();
    expect(screen.getByText('Set up two-factor authentication for enhanced security')).toBeInTheDocument();
    expect(screen.getByText('Why enable two-factor authentication?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /set up two-factor authentication/i })).toBeInTheDocument();
  });

  it('should show skip button when onSkip callback provided', async () => {
    const user = userEvent.setup();
    render(<MFASetup onSkip={mockOnSkip} />);

    const skipButton = screen.getByRole('button', { name: /skip for now/i });
    expect(skipButton).toBeInTheDocument();

    await user.click(skipButton);
    expect(mockOnSkip).toHaveBeenCalled();
  });

  it('should not show skip button when onSkip callback not provided', () => {
    render(<MFASetup />);

    expect(screen.queryByRole('button', { name: /skip for now/i })).not.toBeInTheDocument();
  });

  it('should proceed to verification step after successful setup', async () => {
    const user = userEvent.setup();
    mockSetupMFA.mockResolvedValue(mockMFAData);

    render(<MFASetup />);

    const setupButton = screen.getByRole('button', { name: /set up two-factor authentication/i });
    await user.click(setupButton);

    await waitFor(() => {
      expect(mockSetupMFA).toHaveBeenCalled();
      expect(screen.getByText('Verify Setup')).toBeInTheDocument();
      expect(screen.getByText('Scan the QR code with your authenticator app and enter the verification code')).toBeInTheDocument();
    });
  });

  it('should show loading state during MFA setup', async () => {
    const user = userEvent.setup();
    mockSetupMFA.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<MFASetup />);

    const setupButton = screen.getByRole('button', { name: /set up two-factor authentication/i });
    await user.click(setupButton);

    expect(setupButton).toBeDisabled();
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument(); // Loading spinner
  });

  it('should display QR code and backup codes in verification step', async () => {
    const user = userEvent.setup();
    mockSetupMFA.mockResolvedValue(mockMFAData);

    render(<MFASetup />);

    const setupButton = screen.getByRole('button', { name: /set up two-factor authentication/i });
    await user.click(setupButton);

    await waitFor(() => {
      expect(screen.getByText('QR Code')).toBeInTheDocument();
      expect(screen.getByText('Manual Entry')).toBeInTheDocument();
      expect(screen.getByText('Backup Codes')).toBeInTheDocument();
      expect(screen.getByDisplayValue(mockMFAData.secret)).toBeInTheDocument();
      
      // Check that backup codes are displayed
      mockMFAData.backupCodes.forEach(code => {
        expect(screen.getByText(code)).toBeInTheDocument();
      });
    });
  });

  it('should display QR code image when valid data URL provided', async () => {
    const user = userEvent.setup();
    mockSetupMFA.mockResolvedValue(mockMFAData);

    render(<MFASetup />);

    const setupButton = screen.getByRole('button', { name: /set up two-factor authentication/i });
    await user.click(setupButton);

    await waitFor(() => {
      const qrImage = screen.getByAltText('MFA QR Code');
      expect(qrImage).toBeInTheDocument();
      expect(qrImage).toHaveAttribute('src', mockMFAData.qrCode);
    });
  });

  it('should show fallback when QR code generation fails', async () => {
    const user = userEvent.setup();
    const mfaDataWithoutQR = {
      ...mockMFAData,
      qrCode: 'otpauth://totp/test@example.com?secret=JBSWY3DPEHPK3PXP',
    };
    mockSetupMFA.mockResolvedValue(mfaDataWithoutQR);

    render(<MFASetup />);

    const setupButton = screen.getByRole('button', { name: /set up two-factor authentication/i });
    await user.click(setupButton);

    await waitFor(() => {
      expect(screen.getByText('QR Code generation failed')).toBeInTheDocument();
    });
  });

  it('should copy secret to clipboard when copy button clicked', async () => {
    const user = userEvent.setup();
    mockSetupMFA.mockResolvedValue(mockMFAData);

    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn(),
      },
    });

    render(<MFASetup />);

    const setupButton = screen.getByRole('button', { name: /set up two-factor authentication/i });
    await user.click(setupButton);

    await waitFor(() => {
      const copyButton = screen.getByRole('button', { name: /copy/i });
      expect(copyButton).toBeInTheDocument();
    });

    const copyButton = screen.getByRole('button', { name: /copy/i });
    await user.click(copyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockMFAData.secret);
  });

  it('should validate verification code input', async () => {
    const user = userEvent.setup();
    mockSetupMFA.mockResolvedValue(mockMFAData);

    render(<MFASetup />);

    // Go to verification step
    const setupButton = screen.getByRole('button', { name: /set up two-factor authentication/i });
    await user.click(setupButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument();
    });

    const verificationInput = screen.getByLabelText(/verification code/i);
    const verifyButton = screen.getByRole('button', { name: /verify and complete setup/i });

    // Test empty submission
    await user.click(verifyButton);

    await waitFor(() => {
      expect(screen.getByText('Token must be 6 digits')).toBeInTheDocument();
    });

    // Test short code
    await user.type(verificationInput, '123');
    await user.click(verifyButton);

    await waitFor(() => {
      expect(screen.getByText('Token must be 6 digits')).toBeInTheDocument();
    });

    // Test non-numeric code
    await user.clear(verificationInput);
    await user.type(verificationInput, 'abcdef');
    await user.click(verifyButton);

    await waitFor(() => {
      expect(screen.getByText('Token must contain only numbers')).toBeInTheDocument();
    });
  });

  it('should call verifyMFA and onComplete on successful verification', async () => {
    const user = userEvent.setup();
    mockSetupMFA.mockResolvedValue(mockMFAData);
    mockVerifyMFA.mockResolvedValue(undefined);

    render(<MFASetup onComplete={mockOnComplete} />);

    // Go to verification step
    const setupButton = screen.getByRole('button', { name: /set up two-factor authentication/i });
    await user.click(setupButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument();
    });

    const verificationInput = screen.getByLabelText(/verification code/i);
    const verifyButton = screen.getByRole('button', { name: /verify and complete setup/i });

    await user.type(verificationInput, '123456');
    await user.click(verifyButton);

    await waitFor(() => {
      expect(mockVerifyMFA).toHaveBeenCalledWith({ token: '123456', backupCode: '' });
      expect(mockOnComplete).toHaveBeenCalled();
    });
  });

  it('should display auth error during verification', async () => {
    const user = userEvent.setup();
    mockSetupMFA.mockResolvedValue(mockMFAData);
    mockUseAuth.mockReturnValue({
      setupMFA: mockSetupMFA,
      verifyMFA: mockVerifyMFA,
      error: 'Invalid MFA code',
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      refreshToken: jest.fn(),
      updateProfile: jest.fn(),
      updatePreferences: jest.fn(),
    });

    render(<MFASetup />);

    // Go to verification step
    const setupButton = screen.getByRole('button', { name: /set up two-factor authentication/i });
    await user.click(setupButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid MFA code')).toBeInTheDocument();
    });
  });

  it('should show loading state during verification', async () => {
    const user = userEvent.setup();
    mockSetupMFA.mockResolvedValue(mockMFAData);
    mockVerifyMFA.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<MFASetup />);

    // Go to verification step
    const setupButton = screen.getByRole('button', { name: /set up two-factor authentication/i });
    await user.click(setupButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument();
    });

    const verificationInput = screen.getByLabelText(/verification code/i);
    const verifyButton = screen.getByRole('button', { name: /verify and complete setup/i });

    await user.type(verificationInput, '123456');
    await user.click(verifyButton);

    expect(verifyButton).toBeDisabled();
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument(); // Loading spinner
  });
});