'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { mfaVerificationSchema, MFAVerificationData } from '@/lib/validations/auth';
import { useAuth } from '@/contexts/AuthContext';
import { MFASetup as MFASetupType } from '@/types/auth';

interface MFASetupProps {
  onComplete?: () => void;
  onSkip?: () => void;
}

export function MFASetup({ onComplete, onSkip }: MFASetupProps) {
  const { setupMFA, verifyMFA, error } = useAuth();
  const [step, setStep] = useState<'setup' | 'verify'>('setup');
  const [mfaData, setMfaData] = useState<MFASetupType | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<MFAVerificationData>({
    resolver: zodResolver(mfaVerificationSchema),
    defaultValues: {
      token: '',
      backupCode: '',
    },
  });

  const handleSetupMFA = async () => {
    try {
      setIsLoading(true);
      const data = await setupMFA();
      setMfaData(data);
      setStep('verify');
    } catch (error) {
      console.error('MFA setup error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: MFAVerificationData) => {
    try {
      await verifyMFA(data);
      onComplete?.();
    } catch (error) {
      console.error('MFA verification error:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (step === 'setup') {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <div className="text-center mb-8">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
              <svg
                className="h-6 w-6 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Secure Your Account</h2>
            <p className="text-gray-600 mt-2">
              Set up two-factor authentication for enhanced security
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-blue-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Why enable two-factor authentication?
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>Adds an extra layer of security to your account</li>
                      <li>Protects against unauthorized access</li>
                      <li>Required for accessing sensitive business data</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <button
                onClick={handleSetupMFA}
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : null}
                Set Up Two-Factor Authentication
              </button>

              {onSkip && (
                <button
                  onClick={onSkip}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Skip for Now
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white shadow-lg rounded-lg p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Verify Setup</h2>
          <p className="text-gray-600 mt-2">
            Scan the QR code with your authenticator app and enter the verification code
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {mfaData && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-900 mb-2">QR Code</h3>
                <div className="bg-white p-4 rounded border text-center">
                  <p className="text-sm text-gray-600 mb-2">
                    Scan this QR code with your authenticator app
                  </p>
                  <div className="flex justify-center">
                    {mfaData.qrCode.startsWith('data:image') ? (
                      <img 
                        src={mfaData.qrCode} 
                        alt="MFA QR Code" 
                        className="max-w-full h-auto"
                      />
                    ) : (
                      <div className="bg-gray-100 h-32 w-32 flex items-center justify-center rounded">
                        <p className="text-xs text-gray-500 text-center">QR Code generation failed</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Manual Entry</h3>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 bg-white px-3 py-2 border rounded text-sm font-mono">
                    {mfaData.secret}
                  </code>
                  <button
                    onClick={() => copyToClipboard(mfaData.secret)}
                    className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <h3 className="text-sm font-medium text-yellow-800 mb-2">Backup Codes</h3>
                <p className="text-sm text-yellow-700 mb-3">
                  Save these backup codes in a safe place. You can use them to access your account if you lose your authenticator device.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {mfaData.backupCodes.map((code, index) => (
                    <code key={index} className="bg-white px-2 py-1 rounded text-xs font-mono">
                      {code}
                    </code>
                  ))}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="token" className="block text-sm font-medium text-gray-700">
                Verification Code
              </label>
              <div className="mt-1">
                <input
                  {...register('token')}
                  type="text"
                  maxLength={6}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-center font-mono text-lg tracking-widest"
                  placeholder="000000"
                />
                {errors.token && (
                  <p className="mt-2 text-sm text-red-600">{errors.token.message}</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : null}
              Verify and Complete Setup
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}