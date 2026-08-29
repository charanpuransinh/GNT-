// M12 HR API Client
import axios from 'axios';
const API_BASE = '/api/m12/hr';
const api = axios.create({ baseURL: API_BASE, headers: { 'Content-Type': 'application/json' } });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const hrApi = {
  getEmployees: (params?: any) => api.get('/employees', { params }),
  getEmployee: (id: string) => api.get(`/employees/${id}`),
  createEmployee: (data: any) => api.post('/employees', data),
  updateEmployee: (id: string, data: any) => api.patch(`/employees/${id}`, data),
  deleteEmployee: (id: string) => api.delete(`/employees/${id}`),
  getEmployeeStats: () => api.get('/employees/stats'),
  uploadDocument: (id: string, data: any) => api.post(`/employees/${id}/documents`, data),
  checkIn: (data: any) => api.post('/attendance/check-in', data),
  checkOut: (data: any) => api.post('/attendance/check-out', data),
  getAttendance: (employeeId: string, params?: any) => api.get(`/attendance/employee/${employeeId}`, { params }),
  getMonthlyReport: (params: any) => api.get('/attendance/monthly-report', { params }),
  bulkUploadAttendance: (data: any) => api.post('/attendance/bulk', data),
  applyLeave: (data: any) => api.post('/leaves', data),
  getLeaves: (employeeId: string) => api.get(`/leaves/employee/${employeeId}`),
  getLeaveBalance: (employeeId: string) => api.get(`/leaves/balance/${employeeId}`),
  getPendingLeaves: () => api.get('/leaves/pending'),
  approveLeave: (id: string, data: any) => api.post(`/leaves/${id}/approve`, data),
  rejectLeave: (id: string, data: any) => api.post(`/leaves/${id}/reject`, data),
  getDepartments: () => api.get('/departments'),
  getDepartmentTree: () => api.get('/departments/tree'),
  createDepartment: (data: any) => api.post('/departments', data),
  updateDepartment: (id: string, data: any) => api.patch(`/departments/${id}`, data),
  deleteDepartment: (id: string) => api.delete(`/departments/${id}`),
  generatePayroll: (data: any) => api.post('/payroll/generate', data),
  getPayrolls: (employeeId: string) => api.get(`/payroll/employee/${employeeId}`),
  processPayment: (id: string, data: any) => api.post(`/payroll/${id}/pay`, data),
  getPayrollSummary: (params: any) => api.get('/payroll/summary', { params })
};
export default hrApi;
