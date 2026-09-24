import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout.jsx';
import { apiRequest } from '../api.js';
import { useAuth } from '../AuthContext.jsx';

const STAT_DEFS = [
  { key: 'totalKundliRecords', label: 'Total Kundli records', sub: (d) => `${d.kundliGeneratedToday} generated today` },
  { key: 'totalChatQuestions', label: 'Total chat questions', sub: (d) => `${d.chatQuestionsToday} asked today` },
  { key: 'totalAiRequests', label: 'Total AI requests', sub: (d) => `${d.aiRequestsToday} today` },
  { key: 'aiSuccessRate', label: 'AI success rate', unit: '%', sub: () => 'across all AI requests logged' },
  { key: 'activeCreditUsersToday', label: 'Active today', sub: () => 'kundliIds that asked a question today' },
];

function buildLastNDates(n) {
  const today = new Date();
  const dates = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i));
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

function formatShortDate(isoDate) {
  const d = new Date(`${isoDate}T00:00:00Z`);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

export default function Dashboard() {
  const { handleSessionExpired } = useAuth();
  const [state, setState] = useState('loading'); // loading | error | data
  const [errorMessage, setErrorMessage] = useState('');
  const [stats, setStats] = useState(null);
  const [daily, setDaily] = useState(null);

  const load = useCallback(async () => {
    setState('loading');
    try {
      const [statsRes, dailyRes] = await Promise.all([
        apiRequest('/api/admin/stats/dashboard'),
        apiRequest('/api/admin/stats/daily?days=7'),
      ]);
      setStats(statsRes.data);
      setDaily(dailyRes.data);
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

  return (
    <Layout
      eyebrow="Overview"
      title="Dashboard"
      actions={
        <button className="btn btn-secondary btn-sm" onClick={load}>
          Refresh
        </button>
      }
    >
      {state === 'loading' && (
        <div className="state-block">
          <span className="spinner" />
          <p style={{ marginTop: 10 }}>Loading stats&hellip;</p>
        </div>
      )}

      {state === 'error' && (
        <div className="state-block">
          <h3>Couldn't load the dashboard</h3>
          <p>{errorMessage}</p>
        </div>
      )}

      {state === 'data' && stats && daily && (
        <>
          <div className="stat-grid">
            {STAT_DEFS.map((def) => {
              const raw = stats[def.key];
              const value = raw === null || raw === undefined ? '\u2014' : raw;
              return (
                <div className="card stat-card" key={def.key}>
                  <div className="label">{def.label}</div>
                  <div className="value">
                    {value}
                    {def.unit && raw !== null && <span className="unit">{def.unit}</span>}
                  </div>
                  <div className="sub">{def.sub(stats)}</div>
                </div>
              );
            })}
          </div>

          <DailyUsageChart daily={daily} />
        </>
      )}
    </Layout>
  );
}

function DailyUsageChart({ daily }) {
  const kundliByDate = Object.fromEntries(daily.kundliGenerated.map((d) => [d.date, d.count]));
  const chatByDate = Object.fromEntries(daily.chatQuestions.map((d) => [d.date, d.count]));
  const dates = buildLastNDates(daily.days || 7);
  const maxVal = Math.max(1, ...dates.map((d) => Math.max(kundliByDate[d] || 0, chatByDate[d] || 0)));

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h2>Daily usage</h2>
          <p className="text-muted" style={{ fontSize: 12.5, marginTop: 2 }}>
            Last {daily.days || 7} days, UTC calendar day
          </p>
        </div>
      </div>
      <div className="card-pad">
        <div className="bar-chart">
          {dates.map((date) => {
            const kCount = kundliByDate[date] || 0;
            const cCount = chatByDate[date] || 0;
            const kHeight = Math.round((kCount / maxVal) * 100);
            const cHeight = Math.round((cCount / maxVal) * 100);
            return (
              <div className="bar-col" key={date} title={`${date}: ${kCount} Kundlis, ${cCount} questions`}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 100, width: '100%', justifyContent: 'center' }}>
                  <div className="bar" style={{ height: `${kHeight}%` }} />
                  <div className="bar secondary" style={{ height: `${cHeight}%` }} />
                </div>
                <div className="bar-label">{formatShortDate(date)}</div>
              </div>
            );
          })}
        </div>
        <div className="legend">
          <div className="legend-item">
            <span className="legend-swatch" style={{ background: 'var(--brass)' }} /> Kundlis generated
          </div>
          <div className="legend-item">
            <span className="legend-swatch" style={{ background: 'var(--violet)' }} /> Chat questions
          </div>
        </div>
      </div>
    </div>
  );
}
