// useLeave Hook
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hrApi } from '../api/hr.api';

export const useLeaves = (employeeId: string) => {
  return useQuery({
    queryKey: ['leaves', employeeId],
    queryFn: async () => { const res = await hrApi.getLeaves(employeeId); return res.data.data; },
    enabled: !!employeeId
  });
};

export const useLeaveBalance = (employeeId: string) => {
  return useQuery({
    queryKey: ['leave-balance', employeeId],
    queryFn: async () => { const res = await hrApi.getLeaveBalance(employeeId); return res.data.data; },
    enabled: !!employeeId
  });
};

export const usePendingLeaves = () => {
  return useQuery({
    queryKey: ['pending-leaves'],
    queryFn: async () => { const res = await hrApi.getPendingLeaves(); return res.data.data; }
  });
};

export const useApplyLeave = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: hrApi.applyLeave,
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['leaves', vars.employeeId] });
      queryClient.invalidateQueries({ queryKey: ['leave-balance', vars.employeeId] });
    }
  });
};

export const useApproveLeave = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => hrApi.approveLeave(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pending-leaves'] })
  });
};

export const useRejectLeave = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => hrApi.rejectLeave(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pending-leaves'] })
  });
};
