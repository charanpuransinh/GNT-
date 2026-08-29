import React, { useEffect, useState } from 'react';
import { useSecurityStore } from '../state/security.store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe, Monitor } from 'lucide-react';
import { format } from 'date-fns';

const LoginHistoryPage: React.FC = () => {
  const { loginHistory, loginHistoryLoading, fetchLoginHistory } = useSecurityStore();
  const [filters, setFilters] = useState({ companyId: 'demo-company', userId: '', status: undefined as 'success' | 'failed' | undefined });

  useEffect(() => { fetchLoginHistory(filters); }, [filters.status]);

  return (
    <div className="p-6 space-y-6 bg-[#F8FAFC] min-h-screen">
      <h1 className="text-2xl font-bold text-[#0F172A]">Login History</h1>
      <Card>
        <CardContent className="pt-6 flex gap-4 flex-wrap">
          <Input placeholder="User ID" value={filters.userId} onChange={e => setFilters(p => ({ ...p, userId: e.target.value }))} className="w-[200px]" />
          <Select value={filters.status || ''} onValueChange={v => setFilters(p => ({ ...p, status: v as 'success' | 'failed' || undefined }))}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">All</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => fetchLoginHistory(filters)} className="bg-[#2563EB]">Search</Button>
        </CardContent>
      </Card>
      <div className="grid gap-4">
        {loginHistoryLoading ? <div className="text-[#64748B]">Loading...</div> : (
          loginHistory.map(entry => (
            <Card key={entry.id} className="border-l-4 border-l-[#2563EB]">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Badge className={entry.status === 'success' ? 'bg-[#16A34A]' : 'bg-[#DC2626]'}>{entry.status.toUpperCase()}</Badge>
                      <span className="font-medium text-[#0F172A]">{entry.userId}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-[#64748B]">
                      <span className="flex items-center gap-1"><Globe size={14} />{entry.ipAddress}</span>
                      {entry.location && <span className="flex items-center gap-1"><Monitor size={14} />{entry.location}</span>}
                      {entry.deviceFingerprint && <span className="text-xs bg-gray-100 px-2 py-1 rounded">{entry.deviceFingerprint.slice(0, 16)}...</span>}
                    </div>
                    {entry.attemptCount > 1 && <p className="text-xs text-[#F59E0B]">Attempt count: {entry.attemptCount}</p>}
                  </div>
                  <span className="text-sm text-[#64748B]">{format(new Date(entry.createdAt), 'MMM dd, yyyy HH:mm')}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default LoginHistoryPage;
