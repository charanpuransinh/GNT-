// AttendanceTracker Component
import React from 'react';
import { useAttendance, useCheckIn, useCheckOut } from '../hooks/useAttendance';
import { format } from 'date-fns';

interface Props { employeeId: string; }

export const AttendanceTracker: React.FC<Props> = ({ employeeId }) => {
  const { data: records, isLoading } = useAttendance(employeeId, { startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() });
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();
  const today = new Date().toISOString().split('T')[0];
  const todayRecord = records?.find((r: any) => r.date.startsWith(today));

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold">Attendance</h3>
        <div className="flex gap-2">
          {!todayRecord?.checkIn && (
            <button onClick={() => checkIn.mutate({ employeeId })} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Check In</button>
          )}
          {todayRecord?.checkIn && !todayRecord?.checkOut && (
            <button onClick={() => checkOut.mutate({ employeeId })} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">Check Out</button>
          )}
        </div>
      </div>
      {isLoading ? <div>Loading...</div> : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {records?.map((record: any) => (
            <div key={record.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium">{format(new Date(record.date), 'MMM dd, yyyy')}</div>
                <div className="text-sm text-gray-500">
                  {record.checkIn ? format(new Date(record.checkIn), 'HH:mm') : '--:--'} - {record.checkOut ? format(new Date(record.checkOut), 'HH:mm') : '--:--'}
                </div>
              </div>
              <div className="text-right">
                <span className={`px-2 py-1 text-xs rounded-full ${record.status === 'PRESENT' ? 'bg-green-100 text-green-800' : record.status === 'LATE' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{record.status}</span>
                {record.workHours && <div className="text-sm text-gray-600 mt-1">{record.workHours}h</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
