// [LOCK-12] HR Routes
import { Router } from 'express';
import { EmployeeController } from '../controllers/employee.controller';
import { AttendanceController } from '../controllers/attendance.controller';
import { LeaveController } from '../controllers/leave.controller';
import { DepartmentController } from '../controllers/department.controller';
import { PayrollController } from '../controllers/payroll.controller';

const router = Router();
const employee = new EmployeeController();
const attendance = new AttendanceController();
const leave = new LeaveController();
const department = new DepartmentController();
const payroll = new PayrollController();

router.post('/employees', employee.create.bind(employee));
router.get('/employees', employee.findAll.bind(employee));
router.get('/employees/stats', employee.getStats.bind(employee));
router.get('/employees/:id', employee.findOne.bind(employee));
router.patch('/employees/:id', employee.update.bind(employee));
router.delete('/employees/:id', employee.remove.bind(employee));
router.post('/employees/:id/documents', employee.uploadDocument.bind(employee));

router.post('/attendance/check-in', attendance.checkIn.bind(attendance));
router.post('/attendance/check-out', attendance.checkOut.bind(attendance));
// changed sensitive filters to POST body
router.post('/attendance/employee/:employeeId', attendance.getByEmployee.bind(attendance));
router.post('/attendance/monthly-report', attendance.getMonthlyReport.bind(attendance));
router.post('/attendance/bulk', attendance.bulkUpload.bind(attendance));

router.post('/leaves', leave.apply.bind(leave));
router.post('/leaves/pending', leave.getPendingApprovals.bind(leave));
router.post('/leaves/employee/:employeeId', leave.getByEmployee.bind(leave));
router.post('/leaves/balance/:employeeId', leave.getBalance.bind(leave));
router.post('/leaves/:id/approve', leave.approve.bind(leave));
router.post('/leaves/:id/reject', leave.reject.bind(leave));

router.post('/departments', department.create.bind(department));
router.get('/departments', department.findAll.bind(department));
router.get('/departments/tree', department.getTree.bind(department));
router.patch('/departments/:id', department.update.bind(department));
router.delete('/departments/:id', department.remove.bind(department));

router.post('/payroll/generate', payroll.generate.bind(payroll));
router.get('/payroll/employee/:employeeId', payroll.getByEmployee.bind(payroll));
router.post('/payroll/:id/pay', payroll.processPayment.bind(payroll));
// moved summary filters to POST body
router.post('/payroll/summary', payroll.getMonthlySummary.bind(payroll));

export default router;
