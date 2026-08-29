import { DeviceSession } from '../services/device.types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface SessionRowProps {
  session: DeviceSession;
  onTerminate: (id: string) => void;
  terminating: boolean;
}

export const SessionRow = ({ session, onTerminate, terminating }: SessionRowProps) => {
  const getStatusVariant = (status: string) => {
    const map: Record<string, string> = {
      active: 'success',
      idle: 'warning',
      expired: 'danger',
    };
    return map[status] || 'default';
  };

  return (
    <tr className="border-b border-[#E2E8F0]">
      <td className="py-3 px-4">
        <div className="font-medium text-[#0F172A]">{session.deviceName}</div>
        <div className="text-xs text-[#64748B]">{session.ipAddress}</div>
      </td>
      <td className="py-3 px-4 text-[#64748B]">{session.platform}</td>
      <td className="py-3 px-4 text-[#64748B]">{session.location || 'Unknown'}</td>
      <td className="py-3 px-4 text-[#64748B]">{new Date(session.lastActiveAt).toLocaleString()}</td>
      <td className="py-3 px-4">
        <Badge variant={getStatusVariant(session.status)}>{session.status}</Badge>
      </td>
      <td className="py-3 px-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onTerminate(session.id)}
          loading={terminating}
        >
          Terminate
        </Button>
      </td>
    </tr>
  );
};
