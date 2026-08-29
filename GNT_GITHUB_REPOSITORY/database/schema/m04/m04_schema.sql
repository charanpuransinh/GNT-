-- M04 COMPANY MANAGEMENT — DATABASE SCHEMA
-- Owner: Team A (M01-M05)
-- Tables: company_master, branch_master, financial_year

CREATE TABLE company_master (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    gstin VARCHAR(15) UNIQUE,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    logo_url TEXT,
    primary_color VARCHAR(7) DEFAULT '#2563EB',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_company_gstin ON company_master(gstin);

CREATE TABLE branch_master (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES company_master(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL,
    address TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_branch_company ON branch_master(company_id);
CREATE INDEX idx_branch_code ON branch_master(code);
CREATE INDEX idx_branch_active ON branch_master(is_active) WHERE deleted_at IS NULL;

CREATE TABLE financial_year (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES company_master(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    prefix VARCHAR(10) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fy_no_overlap EXCLUDE USING gist (company_id WITH =, daterange(start_date, end_date, '[]') WITH &&)
);

CREATE INDEX idx_fy_company ON financial_year(company_id);
CREATE INDEX idx_fy_active ON financial_year(is_active) WHERE is_active = true;

-- RLS
ALTER TABLE company_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE branch_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_year ENABLE ROW LEVEL SECURITY;

CREATE POLICY company_tenant ON company_master USING (id = current_setting('app.current_company_id')::UUID);
CREATE POLICY branch_tenant ON branch_master USING (company_id = current_setting('app.current_company_id')::UUID);
CREATE POLICY fy_tenant ON financial_year USING (company_id = current_setting('app.current_company_id')::UUID);
