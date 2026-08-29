import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '../state/auth.store';
import { authService } from '../services/auth.service';

const WARNING_THRESHOLD = 5 * 60 * 1000; // 5 minutes before expiry
const CHECK_INTERVAL = 30 * 1000; // Check every 30 seconds

export const SessionTimeoutWarning = () => {
  const { accessTokenExpiresAt, logout } = useAuthStore();
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!accessTokenExpiresAt) return;

    const checkExpiry = () => {
      const now = Date.now();
      const expires = new Date(accessTokenExpiresAt).getTime();
      const remaining = expires - now;

      if (remaining <= 0) {
        logout();
        return;
      }

      if (remaining <= WARNING_THRESHOLD) {
        setShowWarning(true);
        setTimeLeft(Math.ceil(remaining / 1000));
      } else {
        setShowWarning(false);
      }
    };

    checkExpiry();
    const interval = setInterval(checkExpiry, CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, [accessTokenExpiresAt, logout]);

  const handleExtend = async () => {
    try {
      await authService.refreshToken();
      setShowWarning(false);
    } catch {
      logout();
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <Modal isOpen={showWarning} onClose={() => {}} title="Session Expiring Soon">
      <div className="text-center">
        <p className="text-[#64748B] mb-4">
          Your session will expire in <span className="font-bold text-[#DC2626]">{formatTime(timeLeft)}</span>
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={handleExtend} variant="primary">
            Extend Session
          </Button>
          <Button onClick={logout} variant="ghost">
            Log Out
          </Button>
        </div>
      </div>
    </Modal>
  );
};
