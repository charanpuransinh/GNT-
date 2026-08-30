-- GNT TEAM C - MIGRATIONS
-- File: 002_M12_employee_master.sql
-- Module: M12 - HR Management
-- Created: 2026-08-22
-- Status: IMPLEMENTED

-- Create employee_master table for storing employee information
CREATE TABLE IF NOT EXISTS employee_master (
  id VARCHAR(36) PRIMARY KEY COMMENT 'UUID primary key',
  company_id VARCHAR(36) NOT NULL COMMENT 'Reference to company_master',
  branch_id VARCHAR(36) NOT NULL COMMENT 'Reference to branch_master',
  employee_code VARCHAR(50) NOT NULL COMMENT 'Unique employee identifier',
  
  -- Personal Information
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  phone VARCHAR(20) NOT NULL,
  alternate_phone VARCHAR(20) COMMENT 'Alternate contact number',
  
  -- Address Information
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'India',
  
  -- Identity & Documents
  aadhar_number VARCHAR(20) COMMENT 'Aadhar UID for Indian employees',
  pan_number VARCHAR(20) COMMENT 'Permanent Account Number',
  passport_number VARCHAR(50) COMMENT 'Passport number if applicable',
  driving_license VARCHAR(50) COMMENT 'Driving license number',
  
  -- Employment Details
  employment_type VARCHAR(30) NOT NULL COMMENT 'full_time, part_time, contract, intern, probation',
  designation VARCHAR(100) NOT NULL COMMENT 'Job title',
  department_id VARCHAR(36) COMMENT 'Reference to department_master',
  manager_id VARCHAR(36) COMMENT 'Employee ID of direct manager',
  date_of_joining DATE NOT NULL,
  date_of_leaving DATE COMMENT 'NULL if still employed',
  employment_status VARCHAR(20) NOT NULL DEFAULT 'active' COMMENT 'active, inactive, left, suspended',
  
  -- Compensation
  base_salary DECIMAL(12,2) NOT NULL COMMENT 'Basic salary',
  dearness_allowance DECIMAL(12,2) DEFAULT 0 COMMENT 'DA component',
  house_rent_allowance DECIMAL(12,2) DEFAULT 0 COMMENT 'HRA component',
  special_allowance DECIMAL(12,2) DEFAULT 0 COMMENT 'Special/Other allowances',
  gross_salary DECIMAL(12,2) COMMENT 'Calculated: base + allowances',
  pay_grade VARCHAR(50) COMMENT 'Pay grade/band',
  
  -- Bank & Payroll
  bank_account_id VARCHAR(36) COMMENT 'Reference to bank_account_master for salary transfer',
  bank_account_number VARCHAR(25) COMMENT 'Employee bank account number',
  bank_ifsc_code VARCHAR(20) COMMENT 'Bank IFSC code',
  pfn_number VARCHAR(20) COMMENT 'PF Number',
  esic_number VARCHAR(20) COMMENT 'ESIC Number (if applicable)',
  
  -- Documents & References
  resume_attachment_id VARCHAR(36) COMMENT 'Resume document reference',
  offer_letter_attachment_id VARCHAR(36) COMMENT 'Offer letter document reference',
  uan_number VARCHAR(20) COMMENT 'UAN for EPFO',
  
  -- Audit & Tracking
  created_by VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by VARCHAR(36),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE COMMENT 'Soft delete flag',
  
  -- Constraints
  CONSTRAINT fk_emp_company FOREIGN KEY (company_id) REFERENCES company_master(id),
  CONSTRAINT fk_emp_branch FOREIGN KEY (branch_id) REFERENCES branch_master(id),
  CONSTRAINT fk_emp_department FOREIGN KEY (department_id) REFERENCES department_master(id),
  CONSTRAINT fk_emp_manager FOREIGN KEY (manager_id) REFERENCES employee_master(id),
  CONSTRAINT fk_emp_bank_account FOREIGN KEY (bank_account_id) REFERENCES bank_account_master(id),
  
  UNIQUE KEY uk_emp_code (company_id, employee_code),
  INDEX idx_emp_company (company_id),
  INDEX idx_emp_branch (branch_id),
  INDEX idx_emp_status (employment_status),
  INDEX idx_emp_department (department_id),
  INDEX idx_emp_manager (manager_id),
  INDEX idx_emp_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='M12 Employee Master — stores all employee information';

-- Create attendance_master table for tracking employee attendance
CREATE TABLE IF NOT EXISTS attendance_master (
  id VARCHAR(36) PRIMARY KEY COMMENT 'UUID primary key',
  company_id VARCHAR(36) NOT NULL,
  employee_id VARCHAR(36) NOT NULL,
  attendance_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL COMMENT 'present, absent, leave, half_day, holiday, weekend',
  check_in_time TIMESTAMP COMMENT 'Check-in timestamp',
  check_out_time TIMESTAMP COMMENT 'Check-out timestamp',
  working_hours DECIMAL(5,2) COMMENT 'Hours worked',
  remarks TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_att_company FOREIGN KEY (company_id) REFERENCES company_master(id),
  CONSTRAINT fk_att_employee FOREIGN KEY (employee_id) REFERENCES employee_master(id),
  UNIQUE KEY uk_attendance (company_id, employee_id, attendance_date),
  INDEX idx_att_employee (employee_id),
  INDEX idx_att_date (attendance_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='M12 Attendance Master — daily attendance tracking';

-- Create leave_master table for leave types and rules
CREATE TABLE IF NOT EXISTS leave_master (
  id VARCHAR(36) PRIMARY KEY,
  company_id VARCHAR(36) NOT NULL,
  leave_type VARCHAR(100) NOT NULL COMMENT 'Casual, Sick, Earned, Privilege, etc.',
  code VARCHAR(30) NOT NULL,
  annual_entitlement INT NOT NULL COMMENT 'Total leaves per year',
  carry_forward_days INT DEFAULT 0 COMMENT 'Unused leaves that can carry forward',
  max_continuous_days INT COMMENT 'Max continuous leaves allowed',
  is_paid BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_leave_company FOREIGN KEY (company_id) REFERENCES company_master(id),
  UNIQUE KEY uk_leave_code (company_id, code),
  INDEX idx_leave_company (company_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='M12 Leave Master — leave types and annual entitlements';

-- Create employee_leave_balance table for tracking leave balance per employee
CREATE TABLE IF NOT EXISTS employee_leave_balance (
  id VARCHAR(36) PRIMARY KEY,
  company_id VARCHAR(36) NOT NULL,
  employee_id VARCHAR(36) NOT NULL,
  leave_type_id VARCHAR(36) NOT NULL,
  financial_year VARCHAR(10) NOT NULL COMMENT 'FY code (e.g., 2025-26)',
  opening_balance INT NOT NULL DEFAULT 0,
  leaves_taken INT DEFAULT 0,
  leaves_approved INT DEFAULT 0,
  leaves_pending INT DEFAULT 0,
  closing_balance INT DEFAULT 0,
  
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_empbalance_company FOREIGN KEY (company_id) REFERENCES company_master(id),
  CONSTRAINT fk_empbalance_employee FOREIGN KEY (employee_id) REFERENCES employee_master(id),
  CONSTRAINT fk_empbalance_leave FOREIGN KEY (leave_type_id) REFERENCES leave_master(id),
  UNIQUE KEY uk_emp_leave_fy (company_id, employee_id, leave_type_id, financial_year),
  INDEX idx_empbalance_employee (employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='M12 Employee Leave Balance — tracks leave usage per employee per FY';

-- Create department_master table
CREATE TABLE IF NOT EXISTS department_master (
  id VARCHAR(36) PRIMARY KEY,
  company_id VARCHAR(36) NOT NULL,
  department_name VARCHAR(100) NOT NULL,
  code VARCHAR(50) NOT NULL,
  head_id VARCHAR(36) COMMENT 'Department head employee ID',
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_dept_company FOREIGN KEY (company_id) REFERENCES company_master(id),
  CONSTRAINT fk_dept_head FOREIGN KEY (head_id) REFERENCES employee_master(id),
  UNIQUE KEY uk_dept_code (company_id, code),
  INDEX idx_dept_company (company_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='M12 Department Master — organization departments';