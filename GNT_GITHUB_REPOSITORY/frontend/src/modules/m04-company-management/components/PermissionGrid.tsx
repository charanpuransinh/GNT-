import React from "react";
import { Toggle } from "@/components/ui/Toggle";
interface Props { permissions: any[]; rolePermissions: string[]; onToggle: (pid: string, v: boolean) => void; }
export const PermissionGrid: React.FC<Props> = ({ permissions, rolePermissions, onToggle }) => (
  <div className="grid grid-cols-2 gap-2">
    {permissions.map((p) => (
      <label key={p.id} className="flex items-center gap-2 text-sm">
        <Toggle checked={rolePermissions.includes(p.id)} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onToggle(p.id, e.target.checked)} />
        {p.name}
      </label>
    ))}
  </div>
);
