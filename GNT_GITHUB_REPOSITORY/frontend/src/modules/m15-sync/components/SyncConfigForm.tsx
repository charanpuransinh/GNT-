import React, { useState } from 'react';
import { useSyncStore } from '../store/syncStore';
import { SyncAPI } from '../api/sync.api';
import { Settings, Plus, Trash2, Save } from 'lucide-react';
import { FieldMapping, SyncEntityConfig } from '../types/sync.types';

export const SyncConfigForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { addConfig } = useSyncStore();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [base, setBase] = useState({
    configCode: '', name: '', description: '', sourceSystem: 'TALLY',
    syncDirection: 'BIDIRECTIONAL', connectionType: 'API',
    connectionConfig: '{}', syncMode: 'MANUAL', cronExpression: ''
  });

  const [entities, setEntities] = useState<Partial<SyncEntityConfig>[]>([
    { internalEntity: 'ITEM', externalEntity: 'Products', syncDirection: 'BIDIRECTIONAL', conflictResolution: 'INTERNAL_WINS', isActive: true,
      fieldMappings: [{ internalField: 'id', externalField: 'productId', isKey: true }] }
  ]);

  const addEntity = () => {
    setEntities([...entities, { internalEntity: '', externalEntity: '', syncDirection: 'BIDIRECTIONAL', conflictResolution: 'INTERNAL_WINS', isActive: true, fieldMappings: [] }]);
  };

  const updateEntity = (idx: number, data: Partial<SyncEntityConfig>) => {
    const next = [...entities]; next[idx] = { ...next[idx], ...data }; setEntities(next);
  };

  const addMapping = (entityIdx: number) => {
    const next = [...entities];
    next[entityIdx].fieldMappings = [...(next[entityIdx].fieldMappings || []), { internalField: '', externalField: '', isKey: false }];
    setEntities(next);
  };

  const updateMapping = (entityIdx: number, mapIdx: number, data: Partial<FieldMapping>) => {
    const next = [...entities];
    (next[entityIdx].fieldMappings as FieldMapping[])[mapIdx] = { ...(next[entityIdx].fieldMappings as FieldMapping[])[mapIdx], ...data };
    setEntities(next);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...base,
        connectionConfig: JSON.parse(base.connectionConfig || '{}'),
        entityConfigs: entities.map(e => ({ ...e, fieldMappings: e.fieldMappings || [] }))
      };
      const config = await SyncAPI.createConfig(payload);
      addConfig(config);
      onClose();
    } catch (err: any) { alert(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Settings size={20} className="text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-900">New Sync Configuration</h2>
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input placeholder="Config Code (e.g. SYNC-TALLY)" value={base.configCode} onChange={e => setBase({...base, configCode: e.target.value})} className="px-3 py-2 border rounded-lg text-sm" />
            <input placeholder="Name" value={base.name} onChange={e => setBase({...base, name: e.target.value})} className="px-3 py-2 border rounded-lg text-sm" />
          </div>
          <input placeholder="Description" value={base.description} onChange={e => setBase({...base, description: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
          <div className="grid grid-cols-3 gap-4">
            <select value={base.sourceSystem} onChange={e => setBase({...base, sourceSystem: e.target.value})} className="px-3 py-2 border rounded-lg text-sm">
              {['TALLY', 'ZOHO_BOOKS', 'QUICKBOOKS', 'SALESFORCE', 'SHOPIFY', 'RAZORPAY', 'GST_PORTAL'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={base.syncDirection} onChange={e => setBase({...base, syncDirection: e.target.value})} className="px-3 py-2 border rounded-lg text-sm">
              <option value="BIDIRECTIONAL">Bidirectional</option>
              <option value="TO_EXTERNAL">To External</option>
              <option value="FROM_EXTERNAL">From External</option>
            </select>
            <select value={base.syncMode} onChange={e => setBase({...base, syncMode: e.target.value})} className="px-3 py-2 border rounded-lg text-sm">
              <option value="MANUAL">Manual</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="REALTIME">Realtime</option>
            </select>
          </div>
          <textarea placeholder="Connection Config (JSON)" value={base.connectionConfig} onChange={e => setBase({...base, connectionConfig: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm font-mono" rows={3} />
          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button onClick={() => setStep(2)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Next: Entity Mapping</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          {entities.map((entity, idx) => (
            <div key={idx} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <input placeholder="Internal Entity (e.g. ITEM)" value={entity.internalEntity || ''} onChange={e => updateEntity(idx, { internalEntity: e.target.value })} className="px-3 py-1.5 border rounded text-sm flex-1" />
                <span className="text-gray-400">&#8596;</span>
                <input placeholder="External Entity (e.g. Products)" value={entity.externalEntity || ''} onChange={e => updateEntity(idx, { externalEntity: e.target.value })} className="px-3 py-1.5 border rounded text-sm flex-1" />
                <button onClick={() => setEntities(entities.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
              </div>

              <div className="space-y-2 mb-3">
                {(entity.fieldMappings || []).map((map, mIdx) => (
                  <div key={mIdx} className="flex items-center gap-2">
                    <input placeholder="Internal Field" value={map.internalField} onChange={e => updateMapping(idx, mIdx, { internalField: e.target.value })} className="px-2 py-1 border rounded text-xs flex-1" />
                    <input placeholder="External Field" value={map.externalField} onChange={e => updateMapping(idx, mIdx, { externalField: e.target.value })} className="px-2 py-1 border rounded text-xs flex-1" />
                    <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={map.isKey} onChange={e => updateMapping(idx, mIdx, { isKey: e.target.checked })} /> Key</label>
                  </div>
                ))}
                <button onClick={() => addMapping(idx)} className="text-xs text-blue-600 hover:underline flex items-center gap-1"><Plus size={12} /> Add Field Mapping</button>
              </div>

              <select value={entity.conflictResolution} onChange={e => updateEntity(idx, { conflictResolution: e.target.value })} className="px-2 py-1 border rounded text-xs">
                <option value="INTERNAL_WINS">Internal Wins</option>
                <option value="EXTERNAL_WINS">External Wins</option>
                <option value="TIMESTAMP_WINS">Timestamp Wins</option>
                <option value="MANUAL">Manual</option>
              </select>
            </div>
          ))}
          <button onClick={addEntity} className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 flex items-center justify-center gap-1"><Plus size={16} /> Add Entity</button>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <button onClick={() => setStep(1)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Back</button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm flex items-center gap-2 disabled:opacity-50"><Save size={16} /> {saving ? 'Saving...' : 'Save Config'}</button>
          </div>
        </div>
      )}
    </div>
  );
};
