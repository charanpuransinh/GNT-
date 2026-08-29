import React, { useEffect, useState } from 'react';
import { useSecurityStore } from '../state/security.store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Shield, ArrowRight } from 'lucide-react';

const PermissionTrackerPage: React.FC = () => {
  const { auditLogs, auditLoading, fetchAuditLogs } = useSecurityStore();
  const [companyId, setCompanyId] = useState('demo-company');
  const [userId, setUserId] = useState('');

  useEffect(() => { fetchAuditLogs({ companyId, module: 'permissions', page: 1, limit: 50 }); }, []);

  const handleSearch = () => { fetchAuditLogs({ companyId, module: 'permissions', userId: userId || undefined, page: 1, limit: 50 }); };

  return (
    <div className="p-6 space-y-6 bg-[#F8FAFC] min-h-screen">
      <h1 className="text-2xl font-bold text-[#0F172A]">Permission Tracker</h1>
      <Card>
        <CardContent className="pt-6 flex gap-4">
          <Input placeholder="User ID (optional)" value={userId} onChange={e => setUserId(e.target.value)} className="w-[250px]" />
          <Button onClick={handleSearch} className="bg-[#2563EB]">Filter</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Shield size={20} className="text-[#2563EB]" />Permission Change Audit</CardTitle>
        </CardHeader>
        <CardContent>
          {auditLoading ? <div className="text-[#64748B]">Loading...</div> : (
            <div className="space-y-4">
              {auditLogs.map(log => (
                <div key={log.id} className="relative pl-6 border-l-2 border-[#2563EB] pb-4">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[#2563EB]" />
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[#DC2626] border-[#DC2626]">{log.action}</Badge>
                        <span className="font-medium text-[#0F172A]">{log.userId || 'System'}</span>
                      </div>
                      <span className="text-xs text-[#64748B]">{format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm')}</span>
                    </div>
                    {log.beforeData && log.afterData && (
                      <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                        <div className="bg-red-50 p-3 rounded border border-red-100">
                          <p className="text-xs text-[#DC2626] font-medium mb-1">BEFORE</p>
                          <pre className="text-xs text-[#0F172A] overflow-auto">{JSON.stringify(log.beforeData, null, 2)}</pre>
                        </div>
                        <div className="bg-green-50 p-3 rounded border border-green-100">
                          <p className="text-xs text-[#16A34A] font-medium mb-1">AFTER</p>
                          <pre className="text-xs text-[#0F172A] overflow-auto">{JSON.stringify(log.afterData, null, 2)}</pre>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-2 text-xs text-[#64748B]">
                      <span>IP: {log.ipAddress || 'N/A'}</span><ArrowRight size={12} /><span>Resource: {log.resource}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PermissionTrackerPage;
