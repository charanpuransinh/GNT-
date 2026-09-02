import React, { useEffect } from "react";
import { useCompanyStore } from "../state/company.store";
import { Company } from "../services/company.types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export const CompanyProfilePage: React.FC = () => {
  const { company, loading, fetchCompany, updateCompany } = useCompanyStore();
  const [form, setForm] = React.useState<Partial<Company>>(company ?? {});

  useEffect(() => { fetchCompany(); }, [fetchCompany]);
  useEffect(() => { setForm(company ?? {}); }, [company]);

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-900">Company Profile</h1>
      <Card className="space-y-4">
        <Input label="Company Name" value={form.name || ""} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({...form, name: e.target.value})} />
        <Input label="GSTIN" value={form.gstin || ""} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({...form, gstin: e.target.value})} />
        <Input label="Address" value={form.address || ""} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({...form, address: e.target.value})} />
        <Input label="Phone" value={form.phone || ""} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({...form, phone: e.target.value})} />
        <Input label="Email" value={form.email || ""} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({...form, email: e.target.value})} />
        <Button variant="primary" onClick={() => updateCompany(form)} disabled={loading}>
          {loading ? "Saving…" : "Save Changes"}
        </Button>
      </Card>
    </div>
  );
};
