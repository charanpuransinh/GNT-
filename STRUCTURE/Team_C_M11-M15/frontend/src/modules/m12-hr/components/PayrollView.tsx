// PayrollView Component
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { hrApi } from '../api/hr.api';
import { format } from 'date-fns';

interface Props { employeeId: string; }

export const PayrollView: React.FC<Props> = ({ employeeId }) => {
  const { data: payrolls, isLoading } = useQuery({
    queryKey: ['payrolls', employeeId],
    queryFn: async () => { const res = await hrApi.getPayrolls(employeeId); return res.data.data; }
  });
  if (isLoading) return <div>Loading payroll...</div>;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-bold mb-4">Payroll History</h3>
      <div className="space-y-3">
        {payrolls?.map((p: any) => (
          <div key={p.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium">{format(new Date(p.year, p.month - 1), 'MMMM yyyy')}</div>
              <div className="text-sm text-gray-500">Base: ${p.baseSalary} | Allowances: ${p.allowances} | Deductions: ${p.deductions}</div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-green-600">${p.netSalary}</div>
              <span className={`text-xs px-2 py-1 rounded-full ${p.paymentStatus === 'PROCESSED' ? 'bg-green-100 text-green-800' : p.paymentStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{p.paymentStatus}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
