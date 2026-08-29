// PayrollPage
import React, { useState } from 'react';
import { PayrollView } from '../components/PayrollView';
import { useQuery, useMutation } from '@tanstack/react-query';
import { hrApi } from '../api/hr.api';

export const PayrollPage: React.FC = () => {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const { data: summary } = useQuery({
    queryKey: ['payroll-summary', month, year],
    queryFn: async () => { const res = await hrApi.getPayrollSummary({ month, year }); return res.data.data; }
  });
  const generate = useMutation({ mutationFn: hrApi.generatePayroll });

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Payroll</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex gap-4 mb-6">
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="border rounded-lg px-4 py-2">
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
            ))}
          </select>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="border rounded-lg px-4 py-2">
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={() => generate.mutate({ month, year })} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Generate Payroll</button>
        </div>
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg"><div className="text-2xl font-bold">{summary.totalEmployees}</div><div className="text-sm text-gray-500">Employees</div></div>
            <div className="bg-gray-50 p-4 rounded-lg"><div className="text-2xl font-bold text-green-600">${summary.totalNet}</div><div className="text-sm text-gray-500">Total Net</div></div>
            <div className="bg-gray-50 p-4 rounded-lg"><div className="text-2xl font-bold text-red-600">${summary.totalTax}</div><div className="text-sm text-gray-500">Total Tax</div></div>
            <div className="bg-gray-50 p-4 rounded-lg"><div className="text-2xl font-bold text-blue-600">${summary.totalAllowances}</div><div className="text-sm text-gray-500">Allowances</div></div>
          </div>
        )}
      </div>
      <PayrollView employeeId="current-user-id" />
    </div>
  );
};
