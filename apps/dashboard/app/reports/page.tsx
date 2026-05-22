'use client';

import { useState, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchReports();
  }, [page]);

  // Check if URL has a specific report ID
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reportId = params.get('id');
    if (reportId) {
      fetch(`${API_URL}/reports/${reportId}`)
        .then(r => r.json())
        .then(data => setSelectedReport(data))
        .catch(console.error);
    }
  }, []);

  async function fetchReports() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/reports?page=${page}&limit=20`);
      const data = await res.json();
      setReports(data.data || []);
      setTotalPages(data.totalPages || 1);
    } catch (e) {
      console.error('Failed to fetch reports:', e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="page-header animate-in">
        <h1>📄 Incident Reports</h1>
        <p>AI-generated cybersecurity incident reports</p>
      </div>

      <div className="grid-2">
        {/* Reports List */}
        <div>
          <div className="card animate-in" id="reports-list">
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 16 }}>All Reports</h3>

            {loading ? (
              <div className="loading-spinner">
                <div className="spinner"></div>
              </div>
            ) : reports.length > 0 ? (
              <>
                {reports.map((report) => (
                  <div
                    key={report.id}
                    onClick={() => setSelectedReport(report)}
                    style={{
                      padding: '14px 16px',
                      borderRadius: 'var(--radius-sm)',
                      border: `1px solid ${selectedReport?.id === report.id ? 'var(--accent-green)' : 'var(--border-subtle)'}`,
                      background: selectedReport?.id === report.id ? 'var(--accent-green-dim)' : 'transparent',
                      marginBottom: 8,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: 4 }}>
                      {report.title}
                    </div>
                    <div style={{ display: 'flex', gap: 12, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {report.incident && (
                        <>
                          <span className={`severity-badge ${report.incident.severity}`} style={{ padding: '2px 8px', fontSize: '0.65rem' }}>
                            {report.incident.severity}
                          </span>
                          <span>{report.incident.category}</span>
                        </>
                      )}
                      <span>🤖 {report.aiProvider}</span>
                      <span>{new Date(report.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                ))}

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
                <div className="empty-icon">📄</div>
                <h3>No Reports Yet</h3>
                <p>Generate reports from the incident detail page.</p>
              </div>
            )}
          </div>
        </div>

        {/* Report Viewer */}
        <div>
          {selectedReport ? (
            <div className="card animate-in" id="report-viewer">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 4 }}>{selectedReport.title}</h3>
                  <div style={{ display: 'flex', gap: 12, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    <span>🤖 {selectedReport.aiProvider}</span>
                    <span>{new Date(selectedReport.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="markdown-content" style={{ fontSize: '0.85rem' }}>
                {(selectedReport.content || '').split('\n').map((line, i) => {
                  if (line.startsWith('### ')) return <h3 key={i}>{line.slice(4)}</h3>;
                  if (line.startsWith('## ')) return <h2 key={i}>{line.slice(3)}</h2>;
                  if (line.startsWith('# ')) return <h1 key={i}>{line.slice(2)}</h1>;
                  if (line.startsWith('- ')) return <li key={i} style={{ marginLeft: 16 }}>{line.slice(2)}</li>;
                  if (line.startsWith('**') && line.endsWith('**')) return <p key={i}><strong>{line.slice(2, -2)}</strong></p>;
                  if (line.startsWith('```')) return null;
                  if (line.trim() === '') return <br key={i} />;
                  return <p key={i}>{line}</p>;
                })}
              </div>
            </div>
          ) : (
            <div className="card animate-in" style={{ textAlign: 'center', padding: '80px 40px' }}>
              <div style={{ fontSize: '3rem', marginBottom: 16 }}>📄</div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: 8, color: 'var(--text-secondary)' }}>
                Select a Report
              </h3>
              <p style={{ color: 'var(--text-muted)' }}>
                Click on a report from the list to view its contents.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
