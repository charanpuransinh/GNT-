import React, { useEffect } from 'react';
import { useSecurityStore } from '../state/security.store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Activity, Database, Server, AlertTriangle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const STATUS_COLORS = {
  healthy: 'bg-[#16A34A] text-white', degraded: 'bg-[#F59E0B] text-white',
  unhealthy: 'bg-orange-500 text-white', down: 'bg-[#DC2626] text-white',
};

const STATUS_ICONS = { healthy: Activity, degraded: AlertTriangle, unhealthy: AlertTriangle, down: Server };

const SystemHealthPage: React.FC = () => {
  const { systemHealth, healthLoading, fetchSystemHealth } = useSecurityStore();

  useEffect(() => {
    fetchSystemHealth('demo-company');
    const interval = setInterval(() => fetchSystemHealth('demo-company'), 30000);
    return () => clearInterval(interval);
  }, []);

  const overallStatus = systemHealth?.overall || 'unknown';

  return (
    <div className="p-6 space-y-6 bg-[#F8FAFC] min-h-screen">
      <h1 className="text-2xl font-bold text-[#0F172A]">System Health</h1>
      <Card className="border-l-4 border-l-[#2563EB]">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#64748B]">Overall Status</p>
              <h2 className="text-3xl font-bold text-[#0F172A] mt-1 capitalize">{overallStatus}</h2>
            </div>
            <div className={`p-4 rounded-full ${STATUS_COLORS[overallStatus as keyof typeof STATUS_COLORS] || 'bg-gray-200'}`}>
              <Database size={32} />
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {healthLoading ? <div className="col-span-full text-[#64748B]">Loading services...</div> : (
          systemHealth?.services.map(service => {
            const Icon = STATUS_ICONS[service.status] || Server;
            return (
              <Card key={service.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Icon size={18} className={service.status === 'healthy' ? 'text-[#16A34A]' : service.status === 'down' ? 'text-[#DC2626]' : 'text-[#F59E0B]'} />
                      <h3 className="font-semibold text-[#0F172A]">{service.serviceName}</h3>
                    </div>
                    <Badge className={STATUS_COLORS[service.status]}>{service.status.toUpperCase()}</Badge>
                    {service.responseTimeMs && <p className="text-sm text-[#64748B]">Response: {service.responseTimeMs}ms</p>}
                    <div className="flex items-center gap-1 text-xs text-[#64748B]"><Clock size={12} />{formatDistanceToNow(new Date(service.lastCheckedAt), { addSuffix: true })}</div>
                    {service.errorCount > 0 && <p className="text-xs text-[#DC2626]">Errors: {service.errorCount}</p>}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
      <Card>
        <CardHeader><CardTitle>Health Metrics</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-[#16A34A]">{systemHealth?.services.filter(s => s.status === 'healthy').length || 0}</p>
              <p className="text-xs text-[#64748B]">Healthy</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-2xl font-bold text-[#F59E0B]">{systemHealth?.services.filter(s => s.status === 'degraded').length || 0}</p>
              <p className="text-xs text-[#64748B]">Degraded</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-2xl font-bold text-orange-500">{systemHealth?.services.filter(s => s.status === 'unhealthy').length || 0}</p>
              <p className="text-xs text-[#64748B]">Unhealthy</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-[#DC2626]">{systemHealth?.services.filter(s => s.status === 'down').length || 0}</p>
              <p className="text-xs text-[#64748B]">Down</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemHealthPage;
