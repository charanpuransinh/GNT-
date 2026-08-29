import { useEffect, useState } from 'react';
import { appService } from '../services/app.service';

export const MaintenancePage = () => {
  const [countdown, setCountdown] = useState(300);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC]">
      <div className="bg-white rounded-xl p-10 shadow-lg max-w-md w-full text-center border border-[#E2E8F0]">
        <div className="text-5xl mb-4">🔧</div>
        <h1 className="text-2xl font-bold text-[#0F172A] mb-2">Under Maintenance</h1>
        <p className="text-[#64748B] mb-4">
          GNT is currently undergoing scheduled maintenance. We will be back shortly.
        </p>
        <div className="bg-[#F1F5F9] rounded-lg p-4 mb-4">
          <span className="text-[#64748B] text-sm">Estimated time remaining:</span>
          <div className="text-3xl font-mono font-bold text-[#2563EB]">
            {formatTime(countdown)}
          </div>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="text-[#2563EB] hover:underline text-sm"
        >
          Check again
        </button>
      </div>
    </div>
  );
};
