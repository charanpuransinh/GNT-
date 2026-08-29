// HRDashboard Page
import React from 'react';
import { useEmployeeStats } from '../hooks/useEmployees';
import { Link } from 'react-router-dom';
import { Users, UserCheck, UserX, Building2, UserPlus } from 'lucide-react';

export const HRDashboard: React.FC = () => {
  const { data: stats, isLoading } = useEmployeeStats();
  const cards = [
    { label: 'Total Employees', value: stats?.total || 0, icon: Users, color: 'bg-blue-500', link: '/hr/employees' },
    { label: 'Active', value: stats?.active || 0, icon: UserCheck, color: 'bg-green-500', link: '/hr/employees?status=ACTIVE' },
    { label: 'On Leave', value: stats?.onLeave || 0, icon: UserX, color: 'bg-yellow-500', link: '/hr/employees?status=ON_LEAVE' },
    { label: 'Departments', value: stats?.departments || 0, icon: Building2, color: 'bg-purple-500', link: '/hr/departments' },
    { label: 'New This Month', value: stats?.newThisMonth || 0, icon: UserPlus, color: 'bg-indigo-500', link: '/hr/employees' },
  ];
  if (isLoading) return <div className="p-8 text-center">Loading dashboard...</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">HR Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {cards.map((card) => (
          <Link key={card.label} to={card.link} className="block">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <div className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center mb-4`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-gray-800">{card.value}</div>
              <div className="text-sm text-gray-500">{card.label}</div>
            </div>
          </Link>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/hr/employees/new" className="p-4 bg-blue-50 rounded-lg text-center hover:bg-blue-100"><div className="font-medium text-blue-700">Add Employee</div></Link>
            <Link to="/hr/attendance" className="p-4 bg-green-50 rounded-lg text-center hover:bg-green-100"><div className="font-medium text-green-700">Attendance</div></Link>
            <Link to="/hr/leaves/pending" className="p-4 bg-yellow-50 rounded-lg text-center hover:bg-yellow-100"><div className="font-medium text-yellow-700">Pending Leaves</div></Link>
            <Link to="/hr/payroll/generate" className="p-4 bg-purple-50 rounded-lg text-center hover:bg-purple-100"><div className="font-medium text-purple-700">Generate Payroll</div></Link>
          </div>
        </div>
      </div>
    </div>
  );
};
