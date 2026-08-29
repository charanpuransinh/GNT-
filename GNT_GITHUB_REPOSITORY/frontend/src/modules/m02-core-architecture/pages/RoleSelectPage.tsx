import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuthStore } from '../state/auth.store';
import { authService } from '../services/auth.service';

export const RoleSelectPage = () => {
  const navigate = useNavigate();
  const { user, setActiveRole, clearError } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const handleSelectRole = async (roleId: string) => {
    setLoading(true);
    clearError();
    try {
      await authService.selectRole(roleId);
      setActiveRole(roleId);
      navigate('/');
    } catch (err: any) {
      // Error handled by store
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.roles.length === 0) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-[#64748B]">No roles assigned. Contact administrator.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-center text-[#0F172A] mb-2">
          Select Workspace
        </h1>
        <p className="text-center text-[#64748B] mb-6">
          Choose a role to continue
        </p>

        <div className="space-y-3">
          {user.roles.map((role) => (
            <button
              key={role.id}
              onClick={() => handleSelectRole(role.id)}
              disabled={loading}
              className="w-full p-4 border-2 border-[#E2E8F0] rounded-xl hover:border-[#2563EB] hover:bg-[#EFF6FF] transition-all text-left"
            >
              <div className="font-semibold text-[#0F172A]">{role.name}</div>
              <div className="text-sm text-[#64748B]">{role.description}</div>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
};
