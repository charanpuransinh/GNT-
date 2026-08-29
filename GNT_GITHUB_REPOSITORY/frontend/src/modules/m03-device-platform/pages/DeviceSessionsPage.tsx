import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { useDeviceStore } from '../state/device.store';
import { deviceService } from '../services/device.service';
import { DeviceSession } from '../services/device.types';

export const DeviceSessionsPage = () => {
  const navigate = useNavigate();
  const { sessions, setSessions, setLoading, setError, clearError } = useDeviceStore();
  const [terminating, setTerminating] = useState<string | null>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setLoading(true);
    clearError();
    try {
      const data = await deviceService.getActiveSessions();
      setSessions(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleTerminate = async (sessionId: string) => {
    setTerminating(sessionId);
    try {
      await deviceService.terminateSession(sessionId);
      setSessions(sessions.filter((s) => s.id !== sessionId));
    } catch (err: any) {
      setError(err.message || 'Failed to terminate session');
    } finally {
      setTerminating(null);
    }
  };

  const handleTerminateAll = async () => {
    if (!confirm('Terminate all other sessions?')) return;
    setLoading(true);
    try {
      await deviceService.terminateAllSessions();
      setSessions([]);
    } catch (err: any) {
      setError(err.message || 'Failed to terminate sessions');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      active: 'success',
      idle: 'warning',
      expired: 'danger',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#0F172A]">Active Sessions</h1>
        <Button variant="danger" onClick={handleTerminateAll}>
          Terminate All Others
        </Button>
      </div>

      <Card>
        <Table
          columns={[
            { header: 'Device', accessor: 'deviceName' },
            { header: 'Platform', accessor: 'platform' },
            { header: 'Location', accessor: 'location' },
            { header: 'Last Active', accessor: 'lastActiveAt' },
            { header: 'Status', accessor: 'status' },
            { header: 'Actions', accessor: 'actions' },
          ]}
          data={sessions.map((session) => ({
            ...session,
            lastActiveAt: new Date(session.lastActiveAt).toLocaleString(),
            status: getStatusBadge(session.status),
            actions: (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleTerminate(session.id)}
                loading={terminating === session.id}
              >
                Terminate
              </Button>
            ),
          }))}
        />
      </Card>
    </div>
  );
};
