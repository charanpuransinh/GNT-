/**
 * M18 — GatewayConfigPage
 * Owner: D4-DELTA
 * Purpose: SMS / WhatsApp / Payment / GSTN gateway configuration
 */
import React, { useEffect, useState } from 'react';
import { useIntegrationStore } from '../state/integration.store';
import { IntegrationApi } from '../services/integration.service';
import { GatewayType, IntegrationConfig } from '../services/integration.types';
import { integrationFormSchema, IntegrationFormValues } from '../validators/integration.schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

const providerOptions: Record<GatewayType, string[]> = {
  [GatewayType.SMS]: ['Twilio', 'Msg91', 'Exotel', 'Generic'],
  [GatewayType.WHATSAPP]: ['WhatsApp Business API', 'Wati', 'Interakt'],
  [GatewayType.PAYMENT]: ['Razorpay', 'Stripe', 'PayU'],
  [GatewayType.GSTN]: ['MastersIndia', 'ClearTax', 'Cygnus'],
  [GatewayType.E_INVOICE]: ['NIC', 'MastersIndia'],
  [GatewayType.E_WAY_BILL]: ['NIC', 'MastersIndia'],
};

const defaultConfigs: Record<string, Record<string, unknown>> = {
  Twilio: { account_sid: '', auth_token: '', from_number: '' },
  Msg91: { auth_key: '', flow_id: '', sender_id: '' },
  'WhatsApp Business API': { api_key: '', phone_number_id: '', base_url: '' },
  Razorpay: { key_id: '', key_secret: '', webhook_secret: '' },
  Stripe: { secret_key: '', webhook_secret: '' },
  MastersIndia: { api_key: '', base_url: '' },
};

export const GatewayConfigPage: React.FC = () => {
  const store = useIntegrationStore();
  const [editing, setEditing] = useState<IntegrationConfig | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; msg: string; ok: boolean } | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<IntegrationFormValues>({
    resolver: zodResolver(integrationFormSchema),
    defaultValues: {
      type: GatewayType.SMS,
      provider: '',
      config_json: {},
      is_active: true,
    },
  });

  const selectedType = watch('type');
  const selectedProvider = watch('provider');

  useEffect(() => {
    loadIntegrations();
  }, []);

  useEffect(() => {
    if (selectedProvider && defaultConfigs[selectedProvider]) {
      setValue('config_json', defaultConfigs[selectedProvider]);
    }
  }, [selectedProvider, setValue]);

  const loadIntegrations = async () => {
    store.setLoading(true);
    try {
      const res = await IntegrationApi.list();
      store.setIntegrations(res.data.items);
    } catch (e: any) {
      store.setError(e.message);
    } finally {
      store.setLoading(false);
    }
  };

  const onSubmit = async (values: IntegrationFormValues) => {
    try {
      if (editing) {
        const res = await IntegrationApi.update(editing.id, values);
        store.updateIntegration(editing.id, res.data);
        setEditing(null);
      } else {
        const res = await IntegrationApi.create({
          ...values,
          company_id: 'current-company-id', // Inject from auth context
        });
        store.addIntegration(res.data);
      }
      reset();
    } catch (e: any) {
      store.setError(e.message);
    }
  };

  const handleEdit = (item: IntegrationConfig) => {
    setEditing(item);
    reset({
      provider: item.provider,
      type: item.type,
      config_json: item.config_json,
      is_active: item.is_active,
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this integration?')) return;
    try {
      await IntegrationApi.remove(id);
      store.removeIntegration(id);
    } catch (e: any) {
      store.setError(e.message);
    }
  };

  const handleTest = async (id: string) => {
    setTestResult(null);
    try {
      const res = await IntegrationApi.test(id);
      setTestResult({ id, msg: res.data.message, ok: res.data.success });
    } catch (e: any) {
      setTestResult({ id, msg: e.message, ok: false });
    }
  };

  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="text-2xl font-bold text-slate-900">Gateway Configuration</h1>
      <p className="mt-1 text-sm text-slate-500">Manage SMS, WhatsApp, Payment, and GSTN gateways.</p>

      {store.error && (
        <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{store.error}</div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Form */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-1">
          <h2 className="text-sm font-semibold text-slate-900">
            {editing ? 'Edit Integration' : 'Add Integration'}
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700">Type</label>
              <select
                {...register('type')}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                {Object.values(GatewayType).map((t) => (
                  <option key={t} value={t}>{t.toUpperCase()}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">Provider</label>
              <select
                {...register('provider')}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="">Select provider</option>
                {providerOptions[selectedType]?.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              {errors.provider && <p className="mt-1 text-xs text-red-600">{errors.provider.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">Configuration (JSON)</label>
              <textarea
                {...register('config_json', { setValueAs: (v) => (typeof v === 'string' ? JSON.parse(v) : v) })}
                rows={6}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs focus:border-blue-500 focus:outline-none"
                defaultValue={JSON.stringify(watch('config_json') ?? {}, null, 2)}
                onChange={(e) => {
                  try {
                    setValue('config_json', JSON.parse(e.target.value), { shouldValidate: true });
                  } catch {
                    // ignore parse errors while typing
                  }
                }}
              />
              {errors.config_json && <p className="mt-1 text-xs text-red-600">{errors.config_json.message}</p>}
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" {...register('is_active')} className="h-4 w-4 rounded border-slate-300 text-blue-600" />
              <label className="text-sm text-slate-700">Active</label>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : editing ? 'Update' : 'Create'}
              </button>
              {editing && (
                <button
                  type="button"
                  onClick={() => { setEditing(null); reset(); }}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* List */}
        <div className="lg:col-span-2 space-y-3">
          {store.isLoading ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : store.integrations.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
              <p className="text-sm text-slate-500">No integrations configured yet.</p>
            </div>
          ) : (
            store.integrations.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-block h-2 w-2 rounded-full ${item.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    <h3 className="text-sm font-semibold text-slate-900">{item.provider}</h3>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase text-slate-600">
                      {item.type}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">Status: {item.status}</p>
                  {testResult?.id === item.id && (
                    <p className={`mt-1 text-xs ${testResult.ok ? 'text-emerald-600' : 'text-red-600'}`}>
                      {testResult.msg}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleTest(item.id)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Test
                  </button>
                  <button
                    onClick={() => handleEdit(item)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
