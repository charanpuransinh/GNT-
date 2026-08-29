import { useEffect, Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { Footer } from '@/components/layout/Footer';
import { LoadingOverlay } from '@/components/feedback/LoadingOverlay';
import { OfflineBanner } from '@/components/feedback/OfflineBanner';
import { useAppStore } from '../state/app.store';
import { appService } from '../services/app.service';
import { useOffline } from '@/hooks/useOffline';

export const AppShellPage = () => {
  const location = useLocation();
  const { initialized, setInitialized, setConfig, setError } = useAppStore();
  const isOffline = useOffline();

  useEffect(() => {
    if (!initialized) {
      appService
        .getAppConfig()
        .then((config) => {
          setConfig(config);
          setInitialized(true);
        })
        .catch((err) => {
          setError(err.message || 'Failed to load app configuration');
          setInitialized(true);
        });
    }
  }, [initialized, setConfig, setInitialized, setError]);

  if (!initialized) {
    return <LoadingOverlay message="Initializing GNT..." />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {isOffline && <OfflineBanner />}
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 p-6 overflow-auto">
          <Suspense fallback={<LoadingOverlay message="Loading page..." />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
      <Footer />
    </div>
  );
};
