/**
 * GNT M16 — NotificationSettingsPage
 * Per-channel (In-App / WhatsApp / SMS / Email) notification preferences
 *
 * NOTE: Backend currently has no dedicated preferences endpoint/table.
 * This page is wired to local state for now; wire to a
 * notification_preferences table + API once M16 backend adds it.
 */
import React, { useState } from 'react';
import { NotificationChannel, NotificationEntityType } from '../services/notification.types';

const channels: { key: NotificationChannel; label: string }[] = [
  { key: 'in_app', label: 'In-App' },
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'sms', label: 'SMS' },
  { key: 'email', label: 'Email' },
];

const categories: { key: NotificationEntityType; label: string }[] = [
  { key: 'sales_invoice', label: 'Sales Invoice' },
  { key: 'purchase_invoice', label: 'Purchase Invoice' },
  { key: 'payment', label: 'Payment & Due' },
  { key: 'stock', label: 'Stock Alerts' },
  { key: 'gst_return', label: 'GST Compliance' },
  { key: 'employee_salary', label: 'Salary & HR' },
  { key: 'general', label: 'General' },
];

type PrefMap = Record<NotificationEntityType, Record<NotificationChannel, boolean>>;

function defaultPrefs(): PrefMap {
  const map = {} as PrefMap;
  categories.forEach((c) => {
    map[c.key] = { in_app: true, whatsapp: false, sms: false, email: true };
  });
  return map;
}

export const NotificationSettingsPage: React.FC = () => {
  const [prefs, setPrefs] = useState<PrefMap>(defaultPrefs());
  const [saved, setSaved] = useState(false);

  const toggle = (category: NotificationEntityType, channel: NotificationChannel) => {
    setPrefs((p) => ({
      ...p,
      [category]: { ...p[category], [channel]: !p[category][channel] },
    }));
    setSaved(false);
  };

  const handleSave = () => {
    // TODO: wire to PUT /api/v1/notifications/preferences once backend supports it
    setSaved(true);
  };

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-bold text-slate-900">Notification Settings</h1>
      <p className="mt-1 text-sm text-slate-500">Choose which channel to use for each category.</p>

      {saved && (
        <div className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">Preferences saved.</div>
      )}

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
              <th className="p-3 font-medium">Category</th>
              {channels.map((c) => (
                <th key={c.key} className="p-3 text-center font-medium">{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat.key} className="border-b border-slate-100 last:border-0">
                <td className="p-3 font-medium text-slate-700">{cat.label}</td>
                {channels.map((ch) => (
                  <td key={ch.key} className="p-3 text-center">
                    <input
                      type="checkbox"
                      checked={prefs[cat.key][ch.key]}
                      onChange={() => toggle(cat.key, ch.key)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={handleSave}
        className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        Save Preferences
      </button>
    </div>
  );
};

export default NotificationSettingsPage;
