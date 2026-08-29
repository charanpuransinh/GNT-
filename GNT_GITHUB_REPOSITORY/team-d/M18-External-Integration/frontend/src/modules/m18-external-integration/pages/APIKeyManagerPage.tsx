/**
 * M18 — APIKeyManagerPage
 * Owner: D4-DELTA
 * Purpose: API key creation + management
 */
import React, { useEffect, useState } from 'react';
import { useIntegrationStore } from '../state/integration.store';
import { IntegrationApi } from '../services/integration.service';
import { apiKeyFormSchema, ApiKeyFormValues } from '../validators/integration.schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

const availablePermissions = [
  'webhook:read',
  'webhook:write',
  'gateway:read',
  'gateway:write',
  'payment:process',
  'sms:send',
  'whatsapp:send',
  'gstn:verify',
];

export const APIKeyManagerPage: React.FC = () => {
  const store = useIntegrationStore();
  const [showNewKey, setShowNewKey] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ApiKeyFormValues>({
    resolver: zodResolver(apiKeyFormSchema),
    defaultValues: { name: '', permissions: [], expires_at: null },
  });

  const selectedPermissions = watch('permissions');
  const companyId = 'current-company-id'; // Inject from auth context
  const createdBy = 'current-user-id'; // Inject from auth context

  useEffect(() => {
    loadKeys();
  }, []);

  const loadKeys = async () => {
    store.setLoading(true);
    try {
      const res = await IntegrationApi.listKeys(companyId);
      store.setApiKeys(res.data);
    } catch (e: any) {
      store.setError(e.message);
    } finally {
      store.setLoading(false);
    }
  };

  const onSubmit = async (values: ApiKeyFormValues) => {
    try {
      const res = await IntegrationApi.generateKey({
        ...values,
        company_id: companyId,
        created_by: createdBy,
      });
      store.addApiKey(res.data);
      if (res.data.plain_key) {
        store.setGeneratedKey(res.data.plain_key);
        setShowNewKey(true);
      }
      reset();
    } catch (e: any) {
      store.setError(e.message);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('Revoke this API key? This action cannot be undone.')) return;
    try {
      await IntegrationApi.revokeKey(id);
      store.removeApiKey(id);
    } catch (e: any) {
      store.setError(e.message);
    }
  };

  const togglePermission = (perm: string) => {
    const next = selectedPermissions.includes(perm)
      ? selectedPermissions.filter((p) => p !== perm)
      : [...selectedPermissions, perm];
    setValue('permissions', next, { shouldValidate: true });
  };

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-bold text-slate-900">API Key Manager</h1>
      <p className="mt-1 text-sm text-slate-500">Create and manage API keys for external integrations.</p>

      {store.error && (
        <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{store.error}</div>
      )}

      {showNewKey && store.generatedKey && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-800">Copy your new API key now. It will not be shown again.</p>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 rounded bg-white px-3 py-2 text-xs font-mono text-slate-800 break-all">
              {store.generatedKey}
            </code>
            <button
              onClick={() => navigator.clipboard.writeText(store.generatedKey!)}
              className="rounded-lg bg-amber-100 px-3 py-2 text-xs font-medium text-amber-800 hover:bg-amber-200"
            >
              Copy
            </button>
            <button
              onClick={() => { setShowNewKey(false); store.setGeneratedKey(null); }}
              className="rounded-lg bg-amber-100 px-3 py-2 text-xs font-medium text-amber-800 hover:bg-amber-200"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Form */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-1">
          <h2 className="text-sm font-semibold text-slate-900">Generate New Key</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700">Key Name</label>
              <input
                {...register('name')}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                placeholder="e.g. Production Webhook Key"
              />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">Permissions</label>
              <div className="mt-2 space-y-2">
                {availablePermissions.map((perm) => (
                  <label key={perm} className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={selectedPermissions.includes(perm)}
                      onChange={() => togglePermission(perm)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600"
                    />
                    {perm}
                  </label>
                ))}
              </div>
              {errors.permissions && <p className="mt-1 text-xs text-red-600">{errors.permissions.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">Expiry (optional)</label>
              <input
                type="date"
                {...register('expires_at')}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Generating...' : 'Generate Key'}
            </button>
          </form>
        </div>

        {/* List */}
        <div className="lg:col-span-2 space-y-3">
          {store.isLoading ? (
            <p className="text-sm text-slate-500">Loading keys...</p>
          ) : store.apiKeys.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
              <p className="text-sm text-slate-500">No API keys found.</p>
            </div>
          ) : (
            store.apiKeys.map((key) => (
              <div
                key={key.id}
                className="flex items-start justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">{key.name}</h3>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {key.permissions.map((p) => (
                      <span key={p} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                        {p}
                      </span>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Created: {new Date(key.created_at).toLocaleDateString()}
                    {key.expires_at && (
                      <span className="ml-2 text-amber-600">
                        Expires: {new Date(key.expires_at).toLocaleDateString()}
                      </span>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => handleRevoke(key.id)}
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                >
                  Revoke
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
