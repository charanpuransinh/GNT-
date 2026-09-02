import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useAuthStore } from '../state/auth.store';
import { authService } from '../services/auth.service';
import { loginSchema } from '../validators/auth.schema';
import { AppLogo } from '@/modules/m01-foundation/components/AppLogo';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { setUser, setTokens, setError, clearError } = useAuthStore();
  const [formData, setFormData] = useState({ username: '', password: '', companyCode: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
    clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    const validation = loginSchema.safeParse(formData);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const result = await authService.login(validation.data);
      setTokens(result.accessToken, result.refreshToken);
      setUser(result.user);

      if (result.requiresOtp) {
        navigate('/otp-verify');
      } else if (result.roles.length > 1) {
        navigate('/role-select');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="flex justify-center mb-6">
          <AppLogo size="lg" />
        </div>
        <h1 className="text-2xl font-bold text-center text-[#0F172A] mb-2">
          GARUDA NEXTECH
        </h1>
        <p className="text-center text-[#64748B] mb-6">Sign in to your account</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            name="companyCode"
            label="Company Code"
            placeholder="Enter company code"
            value={formData.companyCode}
            onChange={handleChange}
            error={errors.companyCode}
          />
          <Input
            name="username"
            label="Username / Email"
            placeholder="Enter username"
            value={formData.username}
            onChange={handleChange}
            error={errors.username}
          />
          <Input
            name="password"
            type="password"
            label="Password"
            placeholder="Enter password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
          />

          <Button type="submit" variant="primary" className="w-full" loading={loading}>
            Sign In
          </Button>
        </form>
      </Card>
    </div>
  );
};
