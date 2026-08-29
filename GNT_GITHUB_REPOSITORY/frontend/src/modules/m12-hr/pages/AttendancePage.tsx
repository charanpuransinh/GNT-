// AttendancePage
import React, { useState } from 'react';
import { AttendanceTracker } from '../components/AttendanceTracker';
import { useMonthlyReport } from '../hooks/useAttendance';

export const AttendancePage: React.FC = () => {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const { data: report } = useMonthlyReport(month, year);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Attendance Management</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1"><AttendanceTracker employeeId="current-user-id" /></div>
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <div className="flex gap-4 mb-4">
            <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="border rounded-lg px-4 py-2">
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
              ))}
            </select>
            <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="border rounded-lg px-4 py-2">
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr><th className="px-4 py-2 text-left">Employee</th><th className="px-4 py-2 text-left">Present</th><th className="px-4 py-2 text-left">Absent</th><th className="px-4 py-2 text-left">Late</th><th className="px-4 py-2 text-left">Hours</th></tr>
            </thead>
            <tbody>
              {report?.map((r: any) => (
                <tr key={r.employee.id} className="border-t">
                  <td className="px-4 py-2">{r.employee.firstName} {r.employee.lastName}</td>
                  <td className="px-4 py-2">{r.present}</td>
                  <td className="px-4 py-2">{r.absent}</td>
                  <td className="px-4 py-2">{r.late}</td>
                  <td className="px-4 py-2">{r.totalHours.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
