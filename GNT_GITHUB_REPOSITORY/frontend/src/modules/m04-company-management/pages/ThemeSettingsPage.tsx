import React from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const PRESETS = [
  { name: "Default", primary: "#2563EB" },
  { name: "Green", primary: "#16A34A" },
  { name: "Purple", primary: "#7C3AED" },
  { name: "Orange", primary: "#EA580C" },
];

export const ThemeSettingsPage: React.FC = () => {
  const [primary, setPrimary] = React.useState("#2563EB");

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Theme Settings</h1>
      <Card className="space-y-4 max-w-xl">
        <p className="text-sm text-slate-600">Choose a primary color preset for your company branding.</p>
        <div className="flex gap-3">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              onClick={() => setPrimary(p.primary)}
              className={`w-12 h-12 rounded-full border-2 ${primary === p.primary ? "border-slate-900" : "border-transparent"}`}
              style={{ backgroundColor: p.primary }}
              title={p.name}
            />
          ))}
        </div>
        <Button variant="primary" onClick={() => { document.documentElement.style.setProperty("--primary", primary); }}>
          Apply Theme
        </Button>
      </Card>
    </div>
  );
};
