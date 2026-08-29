import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useAuthStore } from '../state/auth.store';
import { authService } from '../services/auth.service';
import { AppLogo } from '@/modules/m01-foundation/components/AppLogo';

export const SessionLockPage = () => {
  const { user, unlockSession } = useAuthStore();
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUnlock = async () => {
    if (pin.length < 4) {
      setError('PIN must be at least 4 digits');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await authService.unlockSession(pin);
      unlockSession();
    } catch (err: any) {
      setError(err.message || 'Invalid PIN');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <Card className="w-full max-w-sm p-8 text-center">
        <AppLogo size="lg" className="mx-auto mb-4" />
        <h1 className="text-xl font-bold text-[#0F172A] mb-1">
          Session Locked
        </h1>
        <p className="text-[#64748B] mb-6">
          Welcome back, {user?.name || 'User'}
        </p>

        <Input
          type="password"
          label="Enter PIN"
          placeholder="••••"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          error={error}
          maxLength={6}
        />

        <Button
          onClick={handleUnlock}
          variant="primary"
          className="w-full mt-4"
          loading={loading}
        >
          Unlock
        </Button>

        <button
          onClick={() => authService.logout()}
          className="mt-4 text-sm text-[#64748B] hover:text-[#DC2626]"
        >
          Log out instead
        </button>
      </Card>
    </div>
  );
};
