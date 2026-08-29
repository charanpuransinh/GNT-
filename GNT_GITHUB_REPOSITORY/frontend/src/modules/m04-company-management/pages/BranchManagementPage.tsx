import React, { useEffect } from "react";
import { useCompanyStore } from "../state/company.store";
import { Card, Button, Input, Table, Badge } from "../../../components/ui";

export const BranchManagementPage: React.FC = () => {
  const { branches, loading, fetchBranches, createBranch, deleteBranch } = useCompanyStore();
  const [name, setName] = React.useState("");

  useEffect(() => { fetchBranches(); }, [fetchBranches]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Branch / Godown Management</h1>
      <Card className="flex gap-2">
        <Input placeholder="New branch name" value={name} onChange={e => setName(e.target.value)} />
        <Button variant="primary" onClick={() => { createBranch({ name }); setName(""); }} disabled={loading}>
          Add Branch
        </Button>
      </Card>
      <Table
        columns={[
          { key: "name", header: "Branch Name" },
          { key: "code", header: "Code" },
          { key: "status", header: "Status", render: (r: any) => <Badge variant={r.isActive ? "success" : "muted"}>{r.isActive ? "Active" : "Inactive"}</Badge> },
          { key: "actions", header: "Actions", render: (r: any) => <Button variant="danger" size="sm" onClick={() => deleteBranch(r.id)}>Delete</Button> },
        ]}
        data={branches}
      />
    </div>
  );
};