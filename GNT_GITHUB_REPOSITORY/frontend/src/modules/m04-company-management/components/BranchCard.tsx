import React from "react";
import { Card, Badge, Button } from "../../../components/ui";

interface Props { branch: any; onDelete: (id: string) => void; }
export const BranchCard: React.FC<Props> = ({ branch, onDelete }) => (
  <Card className="flex items-center justify-between p-4">
    <div>
      <p className="font-semibold">{branch.name}</p>
      <p className="text-xs text-slate-500">{branch.code}</p>
    </div>
    <div className="flex items-center gap-2">
      <Badge variant={branch.isActive ? "success" : "muted"}>{branch.isActive ? "Active" : "Inactive"}</Badge>
      <Button size="sm" variant="danger" onClick={() => onDelete(branch.id)}>Delete</Button>
    </div>
  </Card>
);