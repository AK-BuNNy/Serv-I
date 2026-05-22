'use client';

import { useState, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  useEffect(() => {
    fetchIncidents();
  }, [page, filterSeverity, filterCategory]);

  async function fetchIncidents() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      if (filterSeverity) params.set('severity', filterSeverity);
      if (filterCategory) params.set('category', filterCategory);

      const res = await fetch(`${API_URL}/incidents?${params}`);
      const data = await res.json();
      setIncidents(data.data || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (e) {
      console.error('Failed to fetch incidents:', e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="page-header animate-in">
        <h1>🛡️ Security Incidents</h1>
        <p>{total} total incidents detected</p>
      </div>

      {/* Filters */}
      <div className="card animate-in" style={{ marginBottom: 24, padding: 16 }} id="incident-filters">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>FILTER:</span>

          {['', 'critical', 'high', 'medium', 'low', 'info'].map((sev) => (
            <button
              key={sev}
              onClick={() => { setFilterSeverity(sev); setPage(1); }}
              className={filterSeverity === sev ? 'btn btn-primary' : 'btn btn-ghost'}
              style={{ padding: '6px 14px', fontSize: '0.75rem' }}
            >
              {sev || 'All Severities'}
            </button>
          ))}
        </div>
      </div>

      {/* Incidents Table */}
      <div className="card animate-in" id="incidents-table">
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
          </div>
        ) : incidents.length > 0 ? (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Severity</th>
                  <th>Category</th>
                  <th>Summary</th>
                  <th>Source</th>
                  <th>Provider</th>
                  <th>Confidence</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((inc) => (
                  <tr key={inc.id} onClick={() => window.location.href = `/incidents/${inc.id}`}>
                    <td>
                      <span className={`severity-badge ${inc.severity}`}>
                        <span className="pulse-dot"></span>
                        {inc.severity}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem' }}>
                      {inc.category}
                    </td>
                    <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {inc.message || inc.aiSummary}
                    </td>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {inc.source}
                    </td>
                    <td>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: 12,
                        background: 'var(--accent-green-dim)',
                        color: 'var(--accent-green)',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                      }}>
                        {inc.aiProvider || '—'}
                      </span>
                    </td>
                    <td>
                      <div className="similarity-bar" style={{ width: 100 }}>
                        <div className="similarity-track">
                          <div className="similarity-fill" style={{ width: `${(inc.confidence || 0) * 100}%` }}></div>
                        </div>
                        <span className="similarity-value">{((inc.confidence || 0) * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(inc.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="pagination">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
                ← Previous
              </button>
              <span className="page-info">Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                Next →
              </button>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">🛡️</div>
            <h3>No Incidents Found</h3>
            <p>No incidents match your current filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
