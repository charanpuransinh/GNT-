import React, { useEffect } from "react";
import { useCompanyStore } from "../state/company.store";
import { Card, Button, Input, Table, Toggle } from "../../../components/ui";

export const RolePermissionPage: React.FC = () => {
  const { roles, permissions, loading, fetchRoles, updateRolePermissions } = useCompanyStore();

  useEffect(() => { fetchRoles(); }, [fetchRoles]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Role & Permission</h1>
      <Card>
        <Table
          columns={[
            { key: "role", header: "Role", render: (r: any) => <span className="font-medium">{r.name}</span> },
            ...permissions.map((p: any) => ({
              key: p.id,
              header: p.name,
              render: (r: any) => <Toggle checked={r.permissions?.includes(p.id)} onChange={(v) => updateRolePermissions(r.id, p.id, v)} />,
            })),
          ]}
          data={roles}
        />
      </Card>
    </div>
  );
};