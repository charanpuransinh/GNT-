// useEmployees Hook
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hrApi } from '../api/hr.api';
import { useHRStore } from '../stores/hr.store';

export const useEmployees = (params?: any) => {
  const setEmployees = useHRStore((s) => s.setEmployees);
  const setLoading = useHRStore((s) => s.setLoading);
  const setError = useHRStore((s) => s.setError);
  return useQuery({
    queryKey: ['employees', params],
    queryFn: async () => {
      setLoading(true);
      try {
        const res = await hrApi.getEmployees(params);
        setEmployees(res.data.data);
        return res.data;
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to fetch employees');
        throw err;
      } finally { setLoading(false); }
    }
  });
};

export const useCreateEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: hrApi.createEmployee, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] }) });
};

export const useUpdateEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => hrApi.updateEmployee(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] })
  });
};

export const useDeleteEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: hrApi.deleteEmployee, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] }) });
};

export const useEmployeeStats = () => {
  return useQuery({
    queryKey: ['employee-stats'],
    queryFn: async () => {
      const res = await hrApi.getEmployeeStats();
      useHRStore.getState().setStats(res.data.data);
      return res.data.data;
    }
  });
};
