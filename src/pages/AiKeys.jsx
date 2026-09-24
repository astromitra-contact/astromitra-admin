import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout.jsx';
import Modal from '../components/Modal.jsx';
import { apiRequest } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import { useToast } from '../ToastContext.jsx';

function timeAgo(iso) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function statusBadge(k) {
  if (!k.active) {
    const reason = k.invalidatedAt ? ' (invalid key or model)' : '';
    return (
      <span className="badge badge-danger">
        <span className="badge-dot" />
        Inactive{reason}
      </span>
    );
  }
  if (k.cooldownUntil && new Date(k.cooldownUntil) > new Date()) {
    return (
      <span className="badge badge-warning">
        <span className="badge-dot" />
        Cooling down until {new Date(k.cooldownUntil).toLocaleTimeString()}
      </span>
    );
  }
  return (
    <span className="badge badge-success">
      <span className="badge-dot" />
      Active
    </span>
  );
}

const emptyForm = { provider: 'gemini', model: '', rawKey: '', label: '', priority: 100, active: true };

export default function AiKeys() {
  const { handleSessionExpired } = useAuth();
  const { showToast } = useToast();

  const [state, setState] = useState('loading'); // loading | error | empty | data
  const [errorMessage, setErrorMessage] = useState('');
  const [keys, setKeys] = useState([]);
  const [filter, setFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null); // { id, label } or null

  const load = useCallback(async () => {
    setState('loading');
    try {
      const params = filter ? `?provider=${filter}` : '';
      const res = await apiRequest(`/api/admin/ai-keys${params}`);
      setKeys(res.data);
      setState(res.data.length ? 'data' : 'empty');
    } catch (err) {
      if (err.status === 401) handleSessionExpired();
      setErrorMessage(err.message);
      setState('error');
    }
  }, [filter, handleSessionExpired]);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(key) {
    setEditingId(key.id);
    setForm({
      provider: key.provider,
      model: key.model,
      rawKey: '',
      label: key.label || '',
      priority: key.priority,
      active: key.active,
    });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.model.trim() || (!editingId && !form.rawKey.trim())) {
      showToast('Model and API key are required.', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        const body = { model: form.model.trim(), label: form.label.trim(), priority: Number(form.priority) || 100, active: form.active };
        if (form.rawKey.trim()) body.rawKey = form.rawKey.trim();
        await apiRequest(`/api/admin/ai-keys/${editingId}`, { method: 'PATCH', body });
        showToast('Key updated.', 'success');
      } else {
        await apiRequest('/api/admin/ai-keys', {
          method: 'POST',
          body: {
            provider: form.provider,
            model: form.model.trim(),
            rawKey: form.rawKey.trim(),
            label: form.label.trim(),
            priority: Number(form.priority) || 100,
            active: form.active,
          },
        });
        showToast('Key added.', 'success');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await apiRequest(`/api/admin/ai-keys/${deleteTarget.id}`, { method: 'DELETE' });
      showToast('Key removed.', 'success');
      setDeleteTarget(null);
      load();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  return (
    <Layout
      eyebrow="AI Provider Manager"
      title="AI provider keys"
      actions={
        <button className="btn btn-primary btn-sm" onClick={openCreate}>
          + Add key
        </button>
      }
    >
      <p className="text-secondary mb-16" style={{ maxWidth: 640, fontSize: 13 }}>
        Gemini keys are always tried first, in priority order, then Groq keys, until one succeeds. A
        rate-limited or temporarily-unreachable key cools down and is retried later; an invalid key
        or retired model is deactivated automatically. Keys are shown masked here — the raw value is
        encrypted in MongoDB and never returned by this API.
      </p>

      <div className="toolbar">
        <div className="filter-tabs">
          {[
            { value: '', label: 'All' },
            { value: 'gemini', label: 'Gemini' },
            { value: 'groq', label: 'Groq' },
          ].map((tab) => (
            <button key={tab.value} className={filter === tab.value ? 'active' : ''} onClick={() => setFilter(tab.value)}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        {state === 'loading' && (
          <div className="state-block">
            <span className="spinner" />
            <p style={{ marginTop: 10 }}>Loading keys&hellip;</p>
          </div>
        )}
        {state === 'error' && (
          <div className="state-block">
            <h3>Couldn't load AI provider keys</h3>
            <p>{errorMessage}</p>
          </div>
        )}
        {state === 'empty' && (
          <div className="state-block">
            <h3>No keys configured yet</h3>
            <p>Chat questions will fail until at least one active Gemini or Groq key is added.</p>
          </div>
        )}
        {state === 'data' && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Priority</th>
                  <th>Provider</th>
                  <th>Model</th>
                  <th>Key</th>
                  <th>Label</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {keys.map((k) => (
                  <tr key={k.id}>
                    <td className="mono">{k.priority}</td>
                    <td>
                      <span className={`provider-tag ${k.provider}`}>{k.provider}</span>
                    </td>
                    <td className="mono">{k.model}</td>
                    <td className="mono">{k.maskedKey}</td>
                    <td>{k.label || '\u2014'}</td>
                    <td>
                      {statusBadge(k)}
                      <div className="health-line">
                        {k.totalSuccessCount} ok &middot; {k.totalFailureCount} failed
                        {k.lastSuccessAt ? ` \u00b7 last ok ${timeAgo(k.lastSuccessAt)}` : ''}
                      </div>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(k)}>
                          Edit
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget({ id: k.id, label: k.label || k.maskedKey })}>
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit AI provider key' : 'Add AI provider key'}
        footer={
          <>
            <button className="btn btn-secondary btn-sm" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving\u2026' : 'Save key'}
            </button>
          </>
        }
      >
        <div className="field">
          <label htmlFor="key-provider">Provider</label>
          <select
            id="key-provider"
            value={form.provider}
            disabled={Boolean(editingId)}
            onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value }))}
          >
            <option value="gemini">Gemini</option>
            <option value="groq">Groq</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="key-model">Model</label>
          <input
            type="text"
            id="key-model"
            placeholder="e.g. gemini-3.6-flash"
            value={form.model}
            onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
          />
        </div>
        <div className="field">
          <label htmlFor="key-rawkey">
            API key {editingId && <span className="text-muted">(leave blank to keep the current key)</span>}
          </label>
          <input
            type="text"
            id="key-rawkey"
            className="mono"
            autoComplete="off"
            placeholder={editingId ? 'Leave blank to keep current key' : 'Paste the raw API key'}
            value={form.rawKey}
            onChange={(e) => setForm((f) => ({ ...f, rawKey: e.target.value }))}
          />
        </div>
        <div className="field">
          <label htmlFor="key-label">
            Label <span className="text-muted" style={{ fontWeight: 400 }}>(optional)</span>
          </label>
          <input type="text" id="key-label" placeholder="e.g. Prod key #1" value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} />
        </div>
        <div className="form-row">
          <div className="field">
            <label htmlFor="key-priority">Priority</label>
            <input
              type="number"
              id="key-priority"
              min="1"
              value={form.priority}
              onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
            />
            <p className="hint">Lower number = tried first within this provider.</p>
          </div>
          <div className="field">
            <label htmlFor="key-active">Status</label>
            <select id="key-active" value={String(form.active)} onChange={(e) => setForm((f) => ({ ...f, active: e.target.value === 'true' }))}>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>
      </Modal>

      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Remove this key?"
        footer={
          <>
            <button className="btn btn-secondary btn-sm" onClick={() => setDeleteTarget(null)}>
              Cancel
            </button>
            <button className="btn btn-danger btn-sm" onClick={confirmDelete}>
              Remove key
            </button>
          </>
        }
      >
        <p>
          This permanently removes <strong>{deleteTarget?.label}</strong>. If it's the only active key for its provider, that provider
          stops working for chat questions until another key is added.
        </p>
      </Modal>
    </Layout>
  );
}
