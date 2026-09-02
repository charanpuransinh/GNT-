import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Toggle } from '@/components/ui/Toggle';
import { useDeviceStore } from '../state/device.store';
import { deviceService } from '../services/device.service';
import { DeploymentSettings } from '../services/device.types';

export const DeploymentSettingsPage = () => {
  const { settings, setLoading, setError, clearError } = useDeviceStore();
  const [form, setForm] = useState<Partial<DeploymentSettings>>(settings ?? {});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    clearError();
    try {
      await deviceService.updateDeploymentSettings(form);
      // Show success toast
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-[#0F172A] mb-6">Deployment Settings</h1>

      <Card className="p-6 space-y-6">
        <div>
          <h3 className="font-semibold text-[#0F172A] mb-4">Auto-Update</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-[#0F172A]">Automatic Updates</div>
                <div className="text-sm text-[#64748B]">Download and install updates automatically</div>
              </div>
              <Toggle
                checked={form.autoUpdate ?? false}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, autoUpdate: e.target.checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-[#0F172A]">Update Notifications</div>
                <div className="text-sm text-[#64748B]">Show notification when update is available</div>
              </div>
              <Toggle
                checked={form.updateNotifications ?? true}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, updateNotifications: e.target.checked })}
              />
            </div>
          </div>
        </div>

        <div className="border-t border-[#E2E8F0] pt-6">
          <h3 className="font-semibold text-[#0F172A] mb-4">Session Management</h3>
          <div className="space-y-4">
            <Input
              label="Session Timeout (minutes)"
              type="number"
              value={form.sessionTimeout ?? 30}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, sessionTimeout: parseInt(e.target.value) })}
              min={5}
              max={120}
            />

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-[#0F172A]">Force Single Session</div>
                <div className="text-sm text-[#64748B]">Allow only one active session per user</div>
              </div>
              <Toggle
                checked={form.forceSingleSession ?? false}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, forceSingleSession: e.target.checked })}
              />
            </div>
          </div>
        </div>

        <div className="border-t border-[#E2E8F0] pt-6">
          <h3 className="font-semibold text-[#0F172A] mb-4">Offline Mode</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-[#0F172A]">Enable Offline Sync</div>
                <div className="text-sm text-[#64748B]">Allow data entry when offline</div>
              </div>
              <Toggle
                checked={form.offlineSync ?? false}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, offlineSync: e.target.checked })}
              />
            </div>

            <Input
              label="Sync Interval (minutes)"
              type="number"
              value={form.syncInterval ?? 15}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, syncInterval: parseInt(e.target.value) })}
              min={1}
              max={60}
            />
          </div>
        </div>

        <Button variant="primary" className="w-full" onClick={handleSave} loading={saving}>
          Save Settings
        </Button>
      </Card>
    </div>
  );
};
