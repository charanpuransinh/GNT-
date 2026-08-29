// EmployeeList Component
import React, { useState } from 'react';
import { useEmployees, useDeleteEmployee } from '../hooks/useEmployees';
import { Link } from 'react-router-dom';

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800', INACTIVE: 'bg-gray-100 text-gray-800',
  ON_LEAVE: 'bg-yellow-100 text-yellow-800', TERMINATED: 'bg-red-100 text-red-800',
  SUSPENDED: 'bg-orange-100 text-orange-800'
};

export const EmployeeList: React.FC = () => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const { data, isLoading } = useEmployees({ search, status, limit: 20 });
  const deleteEmployee = useDeleteEmployee();
  if (isLoading) return <div className="p-8 text-center">Loading employees...</div>;

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Employees</h2>
        <div className="flex gap-3">
          <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-4 py-2 border rounded-lg">
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="ON_LEAVE">On Leave</option>
            <option value="TERMINATED">Terminated</option>
          </select>
          <Link to="/hr/employees/new" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">+ Add Employee</Link>
        </div>
      </div>
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Designation</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data?.data?.map((emp: any) => (
            <tr key={emp.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 font-mono text-sm">{emp.employeeCode}</td>
              <td className="px-6 py-4">
                <div className="font-medium text-gray-900">{emp.firstName} {emp.lastName}</div>
                <div className="text-sm text-gray-500">{emp.email}</div>
              </td>
              <td className="px-6 py-4 text-sm">{emp.department?.name || '-'}</td>
              <td className="px-6 py-4 text-sm">{emp.designation}</td>
              <td className="px-6 py-4">
                <span className={`px-2 py-1 text-xs rounded-full font-medium ${STATUS_COLORS[emp.status]}`}>{emp.status}</span>
              </td>
              <td className="px-6 py-4 text-sm">
                <Link to={`/hr/employees/${emp.id}`} className="text-blue-600 hover:underline mr-3">View</Link>
                <button onClick={() => deleteEmployee.mutate(emp.id)} className="text-red-600 hover:underline">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
