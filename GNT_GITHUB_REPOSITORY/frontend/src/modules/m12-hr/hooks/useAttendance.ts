// useAttendance Hook
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hrApi } from '../api/hr.api';

export const useAttendance = (employeeId: string, range?: any) => {
  return useQuery({
    queryKey: ['attendance', employeeId, range],
    queryFn: async () => { const res = await hrApi.getAttendance(employeeId, range); return res.data.data; },
    enabled: !!employeeId
  });
};

export const useCheckIn = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: hrApi.checkIn, onSuccess: (_, vars) => { queryClient.invalidateQueries({ queryKey: ['attendance', vars.employeeId] }); } });
};

export const useCheckOut = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: hrApi.checkOut, onSuccess: (_, vars) => { queryClient.invalidateQueries({ queryKey: ['attendance', vars.employeeId] }); } });
};

export const useMonthlyReport = (month: number, year: number, departmentId?: string) => {
  return useQuery({
    queryKey: ['attendance-report', month, year, departmentId],
    queryFn: async () => { const res = await hrApi.getMonthlyReport({ month, year, departmentId }); return res.data.data; },
    enabled: !!month && !!year
  });
};
