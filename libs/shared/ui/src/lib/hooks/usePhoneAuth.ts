import { useState, useCallback } from 'react';

/**
 * Firebase Phone Auth confirmation result interface
 */
interface PhoneAuthConfirmation {
  confirm: (code: string) => Promise<UserCredential>;
}

/**
 * User credential returned after successful authentication
 */
interface UserCredential {
  user: {
    uid: string;
    phoneNumber: string | null;
    displayName: string | null;
    email: string | null;
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AuthModule = any;

export interface UsePhoneAuthResult {
  /** Send OTP to the provided phone number */
  sendOTP: (phoneNumber: string) => Promise<void>;
  /** Verify the OTP code */
  verifyOTP: (code: string) => Promise<UserCredential>;
  /** Resend OTP to the same number */
  resendOTP: () => Promise<void>;
  /** Whether an operation is in progress */
  isLoading: boolean;
  /** Any error that occurred */
  error: string | null;
  /** Clear the current error */
  clearError: () => void;
  /** Whether OTP has been sent and awaiting verification */
  isAwaitingOTP: boolean;
  /** The phone number OTP was sent to */
  phoneNumber: string | null;
}

/**
 * Hook for Firebase Phone Authentication in React Native.
 * 
 * Handles the complete OTP verification flow:
 * 1. Send OTP to phone number
 * 2. User enters code
 * 3. Verify code and authenticate
 * 
 * Usage:
 * ```tsx
 * function LoginScreen() {
 *   const { 
 *     sendOTP, 
 *     verifyOTP, 
 *     isLoading, 
 *     error, 
 *     isAwaitingOTP 
 *   } = usePhoneAuth();
 *   
 *   const [phone, setPhone] = useState('');
 *   const [code, setCode] = useState('');
 *   
 *   const handleSendOTP = async () => {
 *     await sendOTP(`+593${phone}`); // Ecuador country code
 *   };
 *   
 *   const handleVerify = async () => {
 *     const user = await verifyOTP(code);
 *     console.log('Authenticated:', user.user.uid);
 *   };
 *   
 *   if (isAwaitingOTP) {
 *     return (
 *       <View>
 *         <TextInput value={code} onChangeText={setCode} />
 *         <Button onPress={handleVerify} disabled={isLoading}>
 *           Verify
 *         </Button>
 *       </View>
 *     );
 *   }
 *   
 *   return (
 *     <View>
 *       <TextInput value={phone} onChangeText={setPhone} />
 *       <Button onPress={handleSendOTP} disabled={isLoading}>
 *         Send OTP
 *       </Button>
 *     </View>
 *   );
 * }
 * ```
 */
export function usePhoneAuth(): UsePhoneAuthResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<PhoneAuthConfirmation | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Send OTP to the provided phone number
   * Phone number should include country code (e.g., +593 for Ecuador)
   */
  const sendOTP = useCallback(async (phone: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const auth = await getAuth();
      if (!auth) {
        throw new Error('Firebase Auth not configured. Please contact support.');
      }

      // Format phone number if needed
      const formattedPhone = formatPhoneNumber(phone);
      
      // Firebase handles SMS sending automatically
      // This uses invisible reCAPTCHA on iOS/Android
      const confirmationResult = await auth().signInWithPhoneNumber(formattedPhone);
      
      setConfirmation(confirmationResult);
      setPhoneNumber(formattedPhone);
      
      console.log('[PhoneAuth] OTP sent to:', formattedPhone);
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      console.error('[PhoneAuth] Failed to send OTP:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Verify the OTP code entered by the user
   */
  const verifyOTP = useCallback(async (code: string): Promise<UserCredential> => {
    if (!confirmation) {
      throw new Error('No OTP was sent. Please call sendOTP first.');
    }

    if (!code || code.length !== 6) {
      throw new Error('Please enter a valid 6-digit code');
    }

    setIsLoading(true);
    setError(null);

    try {
      const userCredential = await confirmation.confirm(code);
      
      console.log('[PhoneAuth] User authenticated:', userCredential.user.uid);
      
      // Clear state on success
      setConfirmation(null);
      setPhoneNumber(null);
      
      return userCredential;
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      console.error('[PhoneAuth] Failed to verify OTP:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [confirmation]);

  /**
   * Resend OTP to the same phone number
   */
  const resendOTP = useCallback(async (): Promise<void> => {
    if (!phoneNumber) {
      throw new Error('No phone number on record. Please enter your phone number again.');
    }

    // Clear previous confirmation
    setConfirmation(null);
    
    // Resend
    await sendOTP(phoneNumber);
  }, [phoneNumber, sendOTP]);

  return {
    sendOTP,
    verifyOTP,
    resendOTP,
    isLoading,
    error,
    clearError,
    isAwaitingOTP: confirmation !== null,
    phoneNumber,
  };
}

/**
 * Format phone number to E.164 format
 */
function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // Add + if missing
  if (!cleaned.startsWith('+')) {
    // Default to Ecuador if no country code
    if (cleaned.startsWith('0')) {
      cleaned = '+593' + cleaned.substring(1);
    } else if (cleaned.length === 9) {
      cleaned = '+593' + cleaned;
    } else {
      cleaned = '+' + cleaned;
    }
  }
  
  return cleaned;
}

/**
 * Convert Firebase errors to user-friendly messages
 */
function getErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    const message = err.message;
    
    // Firebase error codes
    if (message.includes('auth/invalid-phone-number')) {
      return 'Invalid phone number. Please check and try again.';
    }
    if (message.includes('auth/too-many-requests')) {
      return 'Too many attempts. Please try again later.';
    }
    if (message.includes('auth/invalid-verification-code')) {
      return 'Invalid verification code. Please check and try again.';
    }
    if (message.includes('auth/code-expired')) {
      return 'Code expired. Please request a new one.';
    }
    if (message.includes('auth/quota-exceeded')) {
      return 'SMS quota exceeded. Please try again tomorrow.';
    }
    if (message.includes('auth/missing-phone-number')) {
      return 'Please enter your phone number.';
    }
    
    return message;
  }
  
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Dynamic import of Firebase Auth
 * Returns null if not installed
 */
async function getAuth(): Promise<AuthModule | null> {
  try {
    const firebaseAuth = await import('@react-native-firebase/auth');
    return firebaseAuth.default;
  } catch {
    // Firebase not installed
    console.warn('[PhoneAuth] @react-native-firebase/auth not installed');
    return null;
  }
}

export default usePhoneAuth;
