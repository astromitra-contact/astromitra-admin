import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout.jsx';
import Modal from '../components/Modal.jsx';
import { apiRequest } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import { useToast } from '../ToastContext.jsx';

function formatDate(iso) {
  if (!iso) return '\u2014';
  const d = new Date(iso);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function Kundlis() {
  const { handleSessionExpired } = useAuth();
  const { showToast } = useToast();

  const [state, setState] = useState('loading'); // loading | error | empty | data
  const [errorMessage, setErrorMessage] = useState('');
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const [detailTarget, setDetailTarget] = useState(null); // kundliId or null
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');

  const [deleteTarget, setDeleteTarget] = useState(null); // { kundliId, name } or null

  const load = useCallback(async () => {
    setState('loading');
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      const res = await apiRequest(`/api/admin/kundlis?${params.toString()}`);
      setData(res.data);
      setState(res.data.results.length ? 'data' : 'empty');
    } catch (err) {
      if (err.status === 401) handleSessionExpired();
      setErrorMessage(err.message);
      setState('error');
    }
  }, [page, search, handleSessionExpired]);

  useEffect(() => {
    load();
  }, [load]);

  function handleSearchSubmit() {
    setSearch(searchInput.trim());
    setPage(1);
  }

  function handleClearSearch() {
    setSearchInput('');
    setSearch('');
    setPage(1);
  }

  async function openDetail(kundliId) {
    setDetailTarget(kundliId);
    setDetail(null);
    setDetailError('');
    setDetailLoading(true);
    try {
      const res = await apiRequest(`/api/admin/kundlis/${kundliId}`);
      setDetail(res.data);
    } catch (err) {
      setDetailError(err.message);
    } finally {
      setDetailLoading(false);
    }
  }

  async function toggleActive(kundliId, nextActive) {
    try {
      await apiRequest(`/api/admin/kundlis/${kundliId}/active`, { method: 'PATCH', body: { active: nextActive } });
      showToast(nextActive ? 'Kundli reactivated.' : 'Kundli deactivated — it can no longer be used for chat questions.', 'success');
      load();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await apiRequest(`/api/admin/kundlis/${deleteTarget.kundliId}`, { method: 'DELETE' });
      showToast('Kundli record deleted.', 'success');
      setDeleteTarget(null);
      load();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  return (
    <Layout eyebrow="Records" title="Kundli records">
      <div className="toolbar">
        <input
          type="search"
          className="search-input"
          placeholder="Search by name, birth place, or kundliId&hellip;"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
        />
        <button className="btn btn-secondary btn-sm" onClick={handleSearchSubmit}>
          Search
        </button>
        <button className="btn btn-ghost btn-sm" onClick={handleClearSearch}>
          Clear
        </button>
      </div>

      <div className="card">
        {state === 'loading' && (
          <div className="state-block">
            <span className="spinner" />
            <p style={{ marginTop: 10 }}>Loading Kundli records&hellip;</p>
          </div>
        )}
        {state === 'error' && (
          <div className="state-block">
            <h3>Couldn't load Kundli records</h3>
            <p>{errorMessage}</p>
          </div>
        )}
        {state === 'empty' && (
          <div className="state-block">
            <h3>No Kundli records found</h3>
            <p>
              Try a different search, or generate one via <code>POST /api/kundli/generate</code>.
            </p>
          </div>
        )}
        {state === 'data' && data && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Date of birth</th>
                  <th>Birth place</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>kundliId</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.results.map((k) => (
                  <tr key={k.kundliId}>
                    <td>{k.name || '\u2014'}</td>
                    <td className="mono">{k.dateOfBirth || '\u2014'}</td>
                    <td>{k.birthPlace || '\u2014'}</td>
                    <td>
                      {k.active ? (
                        <span className="badge badge-success">
                          <span className="badge-dot" />
                          Active
                        </span>
                      ) : (
                        <span className="badge badge-danger">
                          <span className="badge-dot" />
                          Deactivated
                        </span>
                      )}
                    </td>
                    <td className="muted">{formatDate(k.createdAt)}</td>
                    <td className="mono muted" title={k.kundliId}>
                      {k.kundliId.slice(0, 10)}&hellip;
                    </td>
                    <td>
                      <div className="row-actions">
                        <button className="btn btn-ghost btn-sm" onClick={() => openDetail(k.kundliId)}>
                          View
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => toggleActive(k.kundliId, !k.active)}>
                          {k.active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget({ kundliId: k.kundliId, name: k.name || 'this record' })}>
                          Delete
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

      {state === 'data' && data && (
        <div className="pagination">
          <span className="info">
            Showing {(data.page - 1) * data.limit + 1}&ndash;{Math.min(data.page * data.limit, data.total)} of {data.total}
          </span>
          <div className="flex gap-8">
            <button className="btn btn-secondary btn-sm" disabled={data.page <= 1} onClick={() => setPage((p) => p - 1)}>
              &larr; Previous
            </button>
            <span className="info">
              Page {data.page} of {data.totalPages}
            </span>
            <button className="btn btn-secondary btn-sm" disabled={data.page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>
              Next &rarr;
            </button>
          </div>
        </div>
      )}

      <Modal
        open={detailTarget !== null}
        onClose={() => setDetailTarget(null)}
        title={detail ? detail.requestInput.name || 'Kundli detail' : 'Kundli detail'}
        wide
        footer={
          <button className="btn btn-secondary btn-sm" onClick={() => setDetailTarget(null)}>
            Close
          </button>
        }
      >
        {detailLoading && (
          <div className="state-block">
            <span className="spinner" />
          </div>
        )}
        {detailError && (
          <div className="state-block">
            <h3>Couldn't load this record</h3>
            <p>{detailError}</p>
          </div>
        )}
        {detail && <KundliDetail detail={detail} />}
      </Modal>

      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Delete this Kundli?"
        footer={
          <>
            <button className="btn btn-secondary btn-sm" onClick={() => setDeleteTarget(null)}>
              Cancel
            </button>
            <button className="btn btn-danger btn-sm" onClick={confirmDelete}>
              Delete permanently
            </button>
          </>
        }
      >
        <p>
          This permanently deletes the Kundli record and its credit ledger for <strong>{deleteTarget?.name}</strong>. This can't be undone.
        </p>
      </Modal>
    </Layout>
  );
}

function KundliDetail({ detail: d }) {
  const credit = d.creditStatus;
  return (
    <>
      <div className="detail-grid">
        <DetailBlock k="kundliId" v={<span className="mono">{d.kundliId}</span>} />
        <DetailBlock
          k="Status"
          v={
            d.active ? (
              <span className="badge badge-success">
                <span className="badge-dot" />
                Active
              </span>
            ) : (
              <span className="badge badge-danger">
                <span className="badge-dot" />
                Deactivated
              </span>
            )
          }
        />
        <DetailBlock k="Date of birth" v={d.requestInput.dateOfBirth || '\u2014'} />
        <DetailBlock k="Time of birth" v={d.requestInput.timeOfBirth || 'Not provided (noon assumed)'} />
        <DetailBlock k="Birth place" v={d.requestInput.birthPlace || '\u2014'} />
        <DetailBlock k="Created" v={formatDate(d.createdAt)} />
      </div>

      <h3 style={{ marginBottom: 10 }}>Credit status</h3>
      {credit ? (
        <div className="detail-grid">
          <DetailBlock k="Normal credits left today" v={<span className="mono">{credit.normalDailyCredits}</span>} />
          <DetailBlock k="Normal questions used" v={<span className="mono">{credit.normalQuestionsUsed} / 4</span>} />
          <DetailBlock k="Reward credits" v={<span className="mono">{credit.rewardCredits}</span>} />
          <DetailBlock k="Reward questions used" v={<span className="mono">{credit.rewardQuestionsUsed} / 2</span>} />
          <DetailBlock k="Reward claimed today" v={credit.rewardClaimedToday ? 'Yes' : 'No'} />
          <DetailBlock k="Reset date (UTC)" v={<span className="mono">{credit.creditResetDate}</span>} />
        </div>
      ) : (
        <p className="text-muted" style={{ fontSize: 13 }}>
          No questions asked yet — no credit ledger created.
        </p>
      )}

      <h3 style={{ margin: '18px 0 10px' }}>Full calculated chart (JSON)</h3>
      <pre className="json-view">{JSON.stringify(d.result, null, 2)}</pre>
    </>
  );
}

function DetailBlock({ k, v }) {
  return (
    <div className="detail-block">
      <div className="k">{k}</div>
      <div className="v">{v}</div>
    </div>
  );
}
