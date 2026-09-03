import React, { useEffect, useState } from 'react';
import { useSecurityStore } from '../state/security.store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { format } from 'date-fns';

const MODULES = ['M02', 'M04', 'M06', 'M07', 'M08', 'M09', 'M11', 'M12', 'M18'];

const ActivityLogPage: React.FC = () => {
  const { auditLogs, auditTotal, auditLoading, fetchAuditLogs } = useSecurityStore();
  const [filters, setFilters] = useState({ companyId: 'demo-company', module: '', userId: '', page: 1, limit: 20 });

  useEffect(() => { fetchAuditLogs(filters); }, [filters.page, filters.limit]);

  const handleSearch = () => { setFilters(p => ({ ...p, page: 1 })); fetchAuditLogs({ ...filters, page: 1 }); };

  return (
    <div className="p-6 space-y-6 bg-[#F8FAFC] min-h-screen">
      <h1 className="text-2xl font-bold text-[#0F172A]">Activity Log</h1>
      <Card>
        <CardHeader><CardTitle className="text-lg">Filters</CardTitle></CardHeader>
        <CardContent className="flex gap-4 flex-wrap">
          <Select value={filters.module} onValueChange={v => setFilters(p => ({ ...p, module: v }))}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Module" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Modules</SelectItem>
              {MODULES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input placeholder="User ID" value={filters.userId} onChange={e => setFilters(p => ({ ...p, userId: e.target.value }))} className="w-[200px]" />
          <Button onClick={handleSearch} className="bg-[#2563EB]">Search</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Audit Trail ({auditTotal} records)</CardTitle></CardHeader>
        <CardContent>
          {auditLoading ? <div className="text-[#64748B]">Loading...</div> : (
            <div className="space-y-3">
              {auditLogs.map(log => (
                <div key={log.id} className="p-4 bg-white rounded-lg border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-blue-50 text-[#2563EB]">{log.module}</Badge>
                        <span className="font-semibold text-[#0F172A]">{log.action}</span>
                      </div>
                      <p className="text-sm text-[#64748B] mt-1">Resource: {log.resource} {log.resourceId && `(${log.resourceId})`}</p>
                      {log.ipAddress && <p className="text-xs text-[#64748B]">IP: {log.ipAddress}</p>}
                    </div>
                    <span className="text-xs text-[#64748B]">{format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-between items-center mt-4">
            <Button variant="outline" disabled={filters.page <= 1} onClick={() => setFilters(p => ({ ...p, page: p.page - 1 }))}>Previous</Button>
            <span className="text-sm text-[#64748B]">Page {filters.page}</span>
            <Button variant="outline" disabled={auditLogs.length < filters.limit} onClick={() => setFilters(p => ({ ...p, page: p.page + 1 }))}>Next</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivityLogPage;
