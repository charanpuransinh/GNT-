// LeavePage
import React from 'react';
import { LeaveManager } from '../components/LeaveManager';
import { usePendingLeaves, useApproveLeave, useRejectLeave } from '../hooks/useLeave';

export const LeavePage: React.FC = () => {
  const { data: pending } = usePendingLeaves();
  const approve = useApproveLeave();
  const reject = useRejectLeave();

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Leave Management</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LeaveManager employeeId="current-user-id" />
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4">Pending Approvals</h3>
          <div className="space-y-3">
            {pending?.map((leave: any) => (
              <div key={leave.id} className="p-4 border rounded-lg">
                <div className="flex justify-between">
                  <div>
                    <div className="font-medium">{leave.employee.firstName} {leave.employee.lastName}</div>
                    <div className="text-sm text-gray-500">{leave.type} — {leave.days} days</div>
                    <div className="text-sm text-gray-400">{leave.reason}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => approve.mutate({ id: leave.id, data: { approvedBy: 'admin' } })} className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700">Approve</button>
                    <button onClick={() => reject.mutate({ id: leave.id, data: { approvedBy: 'admin', rejectionReason: 'Not approved' } })} className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700">Reject</button>
                  </div>
                </div>
              </div>
            ))}
            {!pending?.length && <div className="text-gray-500 text-center py-8">No pending requests</div>}
          </div>
        </div>
      </div>
    </div>
  );
};
