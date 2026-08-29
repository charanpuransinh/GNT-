import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useDeviceStore } from '../state/device.store';
import { deviceService } from '../services/device.service';

export const AppUpdatePage = () => {
  const { updateInfo, setUpdateInfo, setLoading, setError, clearError } = useDeviceStore();
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    checkForUpdate();
  }, []);

  const checkForUpdate = async () => {
    setLoading(true);
    clearError();
    try {
      const info = await deviceService.checkForUpdate();
      setUpdateInfo(info);
    } catch (err: any) {
      setError(err.message || 'Failed to check for updates');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    setProgress(0);

    // Simulate download progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setDownloading(false);
          return 100;
        }
        return prev + 10;
      });
    }, 500);

    try {
      await deviceService.downloadUpdate();
    } catch (err: any) {
      setError(err.message || 'Download failed');
      clearInterval(interval);
      setDownloading(false);
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, string> = {
      critical: 'danger',
      major: 'warning',
      minor: 'info',
      patch: 'success',
    };
    return <Badge variant={variants[severity] || 'default'}>{severity}</Badge>;
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-[#0F172A] mb-6">App Updates</h1>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-[#0F172A]">
              Current Version: {updateInfo?.currentVersion || 'Checking...'}
            </h2>
            {updateInfo?.latestVersion && (
              <p className="text-[#64748B]">
                Latest Available: {updateInfo.latestVersion}
              </p>
            )}
          </div>
          {updateInfo?.severity && getSeverityBadge(updateInfo.severity)}
        </div>

        {updateInfo?.hasUpdate && (
          <div className="space-y-4">
            <div className="bg-[#F1F5F9] rounded-lg p-4">
              <h3 className="font-semibold text-[#0F172A] mb-2">Release Notes</h3>
              <ul className="list-disc list-inside text-[#64748B] text-sm space-y-1">
                {updateInfo.releaseNotes?.map((note, index) => (
                  <li key={index}>{note}</li>
                )) || <li>No release notes available</li>}
              </ul>
            </div>

            {downloading && (
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Downloading...</span>
                  <span>{progress}%</span>
                </div>
                <ProgressBar value={progress} />
              </div>
            )}

            <Button
              variant="primary"
              className="w-full"
              onClick={handleDownload}
              loading={downloading}
              disabled={progress === 100}
            >
              {progress === 100 ? 'Update Ready — Restart App' : 'Download Update'}
            </Button>
          </div>
        )}

        {!updateInfo?.hasUpdate && updateInfo && (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">✅</div>
            <p className="text-[#16A34A] font-semibold">You are on the latest version</p>
          </div>
        )}
      </Card>
    </div>
  );
};
