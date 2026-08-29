import React, { useEffect } from "react";
import { useCompanyStore } from "../state/company.store";
import { Card, Button, Input, Table, Badge } from "../../../components/ui";

export const UserManagementPage: React.FC = () => {
  const { users, roles, loading, fetchUsers, createUser, toggleUserStatus } = useCompanyStore();
  const [form, setForm] = React.useState({ name: "", email: "", roleId: "" });

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
      <Card className="space-y-3 max-w-xl">
        <Input label="Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
        <Input label="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
        <select className="w-full border rounded px-3 py-2" value={form.roleId} onChange={e => setForm({...form, roleId: e.target.value})}>
          <option value="">Select Role</option>
          {roles.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <Button variant="primary" onClick={() => createUser(form)} disabled={loading}>Add User</Button>
      </Card>
      <Table
        columns={[
          { key: "name", header: "Name" },
          { key: "email", header: "Email" },
          { key: "role", header: "Role", render: (r: any) => r.role?.name },
          { key: "status", header: "Status", render: (r: any) => <Badge variant={r.isActive ? "success" : "muted"}>{r.isActive ? "Active" : "Inactive"}</Badge> },
          { key: "actions", header: "Actions", render: (r: any) => <Button size="sm" variant="secondary" onClick={() => toggleUserStatus(r.id)}>Toggle</Button> },
        ]}
        data={users}
      />
    </div>
  );
};