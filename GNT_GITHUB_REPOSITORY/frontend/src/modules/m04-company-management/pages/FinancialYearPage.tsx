import React, { useEffect } from "react";
import { useCompanyStore } from "../state/company.store";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

export const FinancialYearPage: React.FC = () => {
  const { financialYears, activeFY, loading, fetchFinancialYears, createFY, switchFY } = useCompanyStore();
  const [form, setForm] = React.useState({ startDate: "", endDate: "", prefix: "" });

  useEffect(() => { fetchFinancialYears(); }, [fetchFinancialYears]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Financial Year</h1>
      <Card className="space-y-3 max-w-xl">
        <Input type="date" label="Start Date" value={form.startDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({...form, startDate: e.target.value})} />
        <Input type="date" label="End Date" value={form.endDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({...form, endDate: e.target.value})} />
        <Input label="Invoice Prefix" value={form.prefix} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({...form, prefix: e.target.value})} />
        <Button variant="primary" onClick={() => createFY(form)} disabled={loading}>Create FY</Button>
      </Card>
      <div className="space-y-2">
        {financialYears.map((fy: any) => (
          <Card key={fy.id} className="flex items-center justify-between">
            <div>
              <p className="font-medium">{fy.startDate} → {fy.endDate}</p>
              <p className="text-sm text-slate-500">Prefix: {fy.prefix}</p>
            </div>
            <div className="flex items-center gap-2">
              {activeFY?.id === fy.id && <Badge variant="success">Active</Badge>}
              <Button size="sm" variant="secondary" onClick={() => switchFY(fy.id)}>Switch</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
