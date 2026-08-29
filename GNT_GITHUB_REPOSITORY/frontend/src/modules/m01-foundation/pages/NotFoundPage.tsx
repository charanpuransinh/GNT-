import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

export const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC]">
      <div className="bg-white rounded-xl p-10 shadow-lg max-w-md w-full text-center border border-[#E2E8F0]">
        <div className="text-6xl font-bold text-[#2563EB] mb-4">404</div>
        <h1 className="text-xl font-semibold text-[#0F172A] mb-2">Page Not Found</h1>
        <p className="text-[#64748B] mb-6">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="primary" onClick={() => navigate(-1)}>
            Go Back
          </Button>
          <Button variant="secondary" onClick={() => navigate('/')}>
            Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};
