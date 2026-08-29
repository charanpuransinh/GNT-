import { useRouteError, isRouteErrorResponse } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '../state/app.store';

export const ErrorPage = () => {
  const error = useRouteError();
  const { clearError } = useAppStore();

  let message = 'An unexpected error occurred.';
  let status = 'Error';

  if (isRouteErrorResponse(error)) {
    status = `${error.status}`;
    message = error.statusText || error.data?.message || message;
  } else if (error instanceof Error) {
    message = error.message;
  }

  const handleReload = () => {
    clearError();
    window.location.reload();
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC]">
      <div className="bg-white rounded-xl p-10 shadow-lg max-w-lg w-full text-center border border-[#E2E8F0]">
        <div className="text-5xl font-bold text-[#DC2626] mb-4">{status}</div>
        <h1 className="text-xl font-semibold text-[#0F172A] mb-2">Something Went Wrong</h1>
        <p className="text-[#64748B] mb-6 break-words">{message}</p>
        <div className="flex gap-3 justify-center">
          <Button variant="primary" onClick={handleReload}>
            Reload Application
          </Button>
          <Button variant="ghost" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};
