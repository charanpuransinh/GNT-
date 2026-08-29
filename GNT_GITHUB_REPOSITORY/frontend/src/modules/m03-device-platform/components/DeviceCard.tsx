import { DeviceInfo } from '../services/device.types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface DeviceCardProps {
  device: DeviceInfo;
}

export const DeviceCard = ({ device }: DeviceCardProps) => {
  const getPlatformIcon = () => {
    const icons: Record<string, string> = {
      ios: '🍎',
      android: '🤖',
      windows: '🪟',
      macos: '🍎',
      linux: '🐧',
      web: '🌐',
    };
    return icons[device.platform] || '💻';
  };

  return (
    <Card className="p-4">
      <div className="flex items-start gap-4">
        <div className="text-3xl">{getPlatformIcon()}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-[#0F172A]">{device.deviceName}</h3>
            <Badge variant={device.isTrusted ? 'success' : 'warning'}>
              {device.isTrusted ? 'Trusted' : 'Untrusted'}
            </Badge>
          </div>
          <p className="text-sm text-[#64748B]">{device.model}</p>
          <div className="flex gap-4 mt-2 text-xs text-[#64748B]">
            <span>OS: {device.osVersion}</span>
            <span>App: v{device.appVersion}</span>
            <span>Last seen: {new Date(device.lastSeenAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
