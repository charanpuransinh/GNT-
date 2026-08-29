import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useAuthStore } from '../state/auth.store';
import { authService } from '../services/auth.service';
import { otpSchema } from '../validators/auth.schema';

export const OTPVerifyPage = () => {
  const navigate = useNavigate();
  const { user, setTokens, setError, clearError } = useAuthStore();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setLocalError] = useState('');
  const [countdown, setCountdown] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setLocalError('');
    clearError();

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async () => {
    const otpString = otp.join('');
    const validation = otpSchema.safeParse({ otp: otpString });
    if (!validation.success) {
      setLocalError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const result = await authService.verifyOtp({
        userId: user?.id || '',
        otp: otpString,
      });
      setTokens(result.accessToken, result.refreshToken);
      navigate('/');
    } catch (err: any) {
      setLocalError(err.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setCountdown(60);
    // Resend OTP logic
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-center text-[#0F172A] mb-2">
          Verify OTP
        </h1>
        <p className="text-center text-[#64748B] mb-6">
          Enter the 6-digit code sent to your device
        </p>

        <div className="flex justify-center gap-2 mb-6">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el; }}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-12 h-14 text-center text-2xl font-bold border-2 border-[#E2E8F0] rounded-lg focus:border-[#2563EB] focus:outline-none"
            />
          ))}
        </div>

        {error && <p className="text-[#DC2626] text-sm text-center mb-4">{error}</p>}

        <Button
          onClick={handleSubmit}
          variant="primary"
          className="w-full mb-4"
          loading={loading}
        >
          Verify
        </Button>

        <p className="text-center text-sm text-[#64748B]">
          {countdown > 0 ? (
            <>Resend OTP in {countdown}s</>
          ) : (
            <button onClick={handleResend} className="text-[#2563EB] hover:underline">
              Resend OTP
            </button>
          )}
        </p>
      </Card>
    </div>
  );
};
