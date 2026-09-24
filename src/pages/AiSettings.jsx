import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout.jsx';
import { apiRequest } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import { useToast } from '../ToastContext.jsx';

export default function AiSettings() {
  const { handleSessionExpired } = useAuth();
  const { showToast } = useToast();

  const [state, setState] = useState('loading'); // loading | error | data
  const [errorMessage, setErrorMessage] = useState('');
  const [lastSaved, setLastSaved] = useState(null);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [astrologyInstructions, setAstrologyInstructions] = useState('');
  const [providerPreference, setProviderPreference] = useState('gemini');
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  const load = useCallback(async () => {
    setState('loading');
    try {
      const res = await apiRequest('/api/admin/ai-settings');
      applyData(res.data);
      setState('data');
    } catch (err) {
      if (err.status === 401) handleSessionExpired();
      setErrorMessage(err.message);
      setState('error');
    }
  }, [handleSessionExpired]);

  useEffect(() => {
    load();
  }, [load]);

  function applyData(data) {
    setLastSaved(data);
    setSystemPrompt(data.systemPrompt || '');
    setAstrologyInstructions(data.astrologyInstructions || '');
    setProviderPreference(data.activeProviderPreference || 'gemini');
  }

  async function handleSave() {
    const trimmedPrompt = systemPrompt.trim();
    const trimmedInstructions = astrologyInstructions.trim();
    if (!trimmedPrompt || !trimmedInstructions) {
      showToast('System prompt and instructions cannot be empty.', 'error');
      return;
    }
    setSaving(true);
    setSaveStatus('Saving\u2026');
    try {
      const res = await apiRequest('/api/admin/ai-settings', {
        method: 'PATCH',
        body: { systemPrompt: trimmedPrompt, astrologyInstructions: trimmedInstructions, activeProviderPreference: providerPreference },
      });
      setLastSaved(res.data);
      setSaveStatus(`Saved at ${new Date().toLocaleTimeString()}`);
      showToast('Prompt settings saved — live immediately for new chat requests.', 'success');
    } catch (err) {
      setSaveStatus('');
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    if (lastSaved) {
      applyData(lastSaved);
      setSaveStatus('Reverted unsaved changes.');
    }
  }

  return (
    <Layout eyebrow="Chat behavior" title="AI prompt settings">
      <p className="text-secondary mb-16" style={{ maxWidth: 640, fontSize: 13 }}>
        Edited here, used immediately — every <code>/api/chat/ask</code> request reads this fresh from the
        database, no restart or deploy needed.
      </p>

      {state === 'loading' && (
        <div className="state-block">
          <span className="spinner" />
          <p style={{ marginTop: 10 }}>Loading settings&hellip;</p>
        </div>
      )}

      {state === 'error' && (
        <div className="state-block">
          <h3>Couldn't load settings</h3>
          <p>{errorMessage}</p>
        </div>
      )}

      {state === 'data' && (
        <div className="card card-pad settings-form">
          <div className="field">
            <label htmlFor="system-prompt">System prompt</label>
            <textarea id="system-prompt" value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} />
            <p className="hint">Sets the AI's role and voice. Kept short — the detailed rules go below.</p>
          </div>

          <div className="field">
            <label htmlFor="astrology-instructions">Astrology interpretation instructions</label>
            <textarea id="astrology-instructions" value={astrologyInstructions} onChange={(e) => setAstrologyInstructions(e.target.value)} />
            <p className="hint">One instruction per line. This is where answer length, tone, language-matching, and what to avoid are controlled.</p>
          </div>

          <div className="field">
            <label htmlFor="provider-preference">Preferred provider</label>
            <select id="provider-preference" value={providerPreference} onChange={(e) => setProviderPreference(e.target.value)}>
              <option value="gemini">Gemini</option>
              <option value="groq">Groq</option>
            </select>
            <p className="hint">
              Informational for now — Gemini keys are always tried before Groq keys regardless, per the fallback design (see AI provider keys page).
            </p>
          </div>

          <div className="save-bar">
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              Save changes
            </button>
            <button className="btn btn-secondary" onClick={handleReset}>
              Reset to last saved
            </button>
            <span className="save-status">{saveStatus}</span>
          </div>
        </div>
      )}
    </Layout>
  );
}
