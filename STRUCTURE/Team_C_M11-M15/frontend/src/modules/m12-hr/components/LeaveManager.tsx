// LeaveManager Component
import React, { useState } from 'react';
import { useLeaves, useLeaveBalance, useApplyLeave } from '../hooks/useLeave';
import { format } from 'date-fns';

interface Props { employeeId: string; }

export const LeaveManager: React.FC<Props> = ({ employeeId }) => {
  const { data: leaves } = useLeaves(employeeId);
  const { data: balance } = useLeaveBalance(employeeId);
  const applyLeave = useApplyLeave();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ type: 'ANNUAL', startDate: '', endDate: '', reason: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyLeave.mutate({ ...formData, employeeId }, { onSuccess: () => { setShowForm(false); setFormData({ type: 'ANNUAL', startDate: '', endDate: '', reason: '' }); } });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold">Leave Management</h3>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{showForm ? 'Cancel' : 'Apply Leave'}</button>
      </div>
      {balance && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          {['annual', 'sick', 'casual', 'unpaid'].map((type) => (
            <div key={type} className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">{(balance as any)[type]}</div>
              <div className="text-sm text-gray-500 capitalize">{type} Left</div>
            </div>
          ))}
        </div>
      )}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="px-4 py-2 border rounded-lg">
              <option value="ANNUAL">Annual Leave</option>
              <option value="SICK">Sick Leave</option>
              <option value="CASUAL">Casual Leave</option>
              <option value="UNPAID">Unpaid Leave</option>
            </select>
            <input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="px-4 py-2 border rounded-lg" required />
            <input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} className="px-4 py-2 border rounded-lg" required />
          </div>
          <textarea value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} placeholder="Reason for leave..." className="w-full px-4 py-2 border rounded-lg" rows={3} required />
          <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Submit Application</button>
        </form>
      )}
      <div className="space-y-2">
        {leaves?.map((leave: any) => (
          <div key={leave.id} className="flex justify-between items-center p-3 border rounded-lg">
            <div>
              <div className="font-medium">{leave.type} Leave</div>
              <div className="text-sm text-gray-500">{format(new Date(leave.startDate), 'MMM dd')} - {format(new Date(leave.endDate), 'MMM dd, yyyy')}</div>
              <div className="text-sm text-gray-400">{leave.reason}</div>
            </div>
            <div className="text-right">
              <span className={`px-2 py-1 text-xs rounded-full ${leave.status === 'APPROVED' ? 'bg-green-100 text-green-800' : leave.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{leave.status}</span>
              <div className="text-sm text-gray-600 mt-1">{leave.days} days</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
