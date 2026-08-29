// M12 HR Zustand Store
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface Employee {
  id: string; employeeCode: string; firstName: string; lastName: string;
  email: string; department?: { name: string }; designation: string;
  status: string; joinDate: string;
}

interface HRState {
  employees: Employee[]; selectedEmployee: Employee | null;
  departments: any[]; attendance: any[]; leaves: any[]; payrolls: any[];
  stats: any; loading: boolean; error: string | null;
  setEmployees: (employees: Employee[]) => void;
  setSelectedEmployee: (emp: Employee | null) => void;
  setDepartments: (depts: any[]) => void;
  setAttendance: (att: any[]) => void;
  setLeaves: (leaves: any[]) => void;
  setPayrolls: (payrolls: any[]) => void;
  setStats: (stats: any) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  activeEmployees: () => Employee[];
  onLeaveEmployees: () => Employee[];
}

export const useHRStore = create<HRState>()(
  devtools((set, get) => ({
    employees: [], selectedEmployee: null, departments: [], attendance: [],
    leaves: [], payrolls: [], stats: null, loading: false, error: null,
    setEmployees: (employees) => set({ employees }),
    setSelectedEmployee: (selectedEmployee) => set({ selectedEmployee }),
    setDepartments: (departments) => set({ departments }),
    setAttendance: (attendance) => set({ attendance }),
    setLeaves: (leaves) => set({ leaves }),
    setPayrolls: (payrolls) => set({ payrolls }),
    setStats: (stats) => set({ stats }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
    activeEmployees: () => get().employees.filter(e => e.status === 'ACTIVE'),
    onLeaveEmployees: () => get().employees.filter(e => e.status === 'ON_LEAVE')
  }), { name: 'M12-HR-Store' })
);
