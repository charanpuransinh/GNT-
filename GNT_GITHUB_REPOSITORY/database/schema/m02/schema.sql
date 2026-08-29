-- M02 CORE ARCHITECTURE — Database Schema
-- Owner: A4-APPLE Team
-- Tables: user_master, role_master, permission_master, user_role

-- user_master: Canonical user accounts table
CREATE TABLE IF NOT EXISTS user_master (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES company_master(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branch_master(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    username VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    two_factor_enabled BOOLEAN DEFAULT false,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,

    UNIQUE(company_id, username),
    UNIQUE(company_id, email)
);

CREATE INDEX idx_user_master_company ON user_master(company_id);
CREATE INDEX idx_user_master_username ON user_master(username);
CREATE INDEX idx_user_master_active ON user_master(is_active) WHERE is_active = true;

-- role_master: Role definitions per company
CREATE TABLE IF NOT EXISTS role_master (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES company_master(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(200),
    is_system_role BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(company_id, name)
);

CREATE INDEX idx_role_master_company ON role_master(company_id);

-- permission_master: Permission definitions (global)
CREATE TABLE IF NOT EXISTS permission_master (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module VARCHAR(10) NOT NULL, -- M01-M20
    action VARCHAR(20) NOT NULL, -- create, read, update, delete, approve, export
    resource VARCHAR(50) NOT NULL,
    description VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(module, action, resource)
);

CREATE INDEX idx_permission_master_module ON permission_master(module);

-- user_role: Many-to-many mapping between users and roles
CREATE TABLE IF NOT EXISTS user_role (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_master(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES role_master(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES user_master(id),

    UNIQUE(user_id, role_id)
);

CREATE INDEX idx_user_role_user ON user_role(user_id);
CREATE INDEX idx_user_role_role ON user_role(role_id);

-- role_permission: Many-to-many mapping between roles and permissions
CREATE TABLE IF NOT EXISTS role_permission (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES role_master(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permission_master(id) ON DELETE CASCADE,

    UNIQUE(role_id, permission_id)
);

CREATE INDEX idx_role_permission_role ON role_permission(role_id);
