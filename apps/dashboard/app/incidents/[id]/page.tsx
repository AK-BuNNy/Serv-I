'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function IncidentDetailPage() {
  const params = useParams();
  const id = params?.id;

  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`${API_URL}/incidents/${id}`)
      .then(r => r.json())
      .then(data => {
        setIncident(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  async function handleGenerateReport() {
    if (!incident) return;
    setGenerating(true);
    try {
      const res = await fetch(`${API_URL}/reports/generate/${incident.id}`, { method: 'POST' });
      const report = await res.json();
      // Refresh incident to include new report
      const refreshed = await fetch(`${API_URL}/incidents/${incident.id}`).then(r => r.json());
      setIncident(refreshed);
    } catch (e) {
      console.error('Failed to generate report:', e);
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return <div className="loading-spinner"><div className="spinner"></div></div>;
  }

  if (!incident) {
    return (
      <div className="empty-state">
        <div className="empty-icon">❓</div>
        <h3>Incident Not Found</h3>
        <p>The requested incident could not be found.</p>
      </div>
    );
  }

  const indicators = Array.isArray(incident.indicators) ? incident.indicators : [];

  return (
    <div>
      <div className="page-header animate-in">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <a href="/incidents" className="btn btn-ghost" style={{ padding: '6px 12px' }}>← Back</a>
          <div>
            <h1>Incident Detail</h1>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              ID: {incident.id}
            </p>
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="card animate-in" style={{ marginBottom: 24 }} id="incident-status">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span className={`severity-badge ${incident.severity}`} style={{ fontSize: '0.85rem', padding: '6px 16px' }}>
              <span className="pulse-dot"></span>
              {incident.severity.toUpperCase()}
            </span>
            <span style={{
              padding: '6px 14px',
              borderRadius: 20,
              background: 'var(--bg-surface)',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              fontFamily: 'JetBrains Mono, monospace',
            }}>
              {incident.category}
            </span>
            <span style={{
              padding: '4px 10px',
              borderRadius: 12,
              background: 'var(--accent-green-dim)',
              color: 'var(--accent-green)',
              fontSize: '0.7rem',
              fontWeight: 600,
            }}>
              🤖 {incident.aiProvider || 'unknown'}
            </span>
          </div>

          <button
            className="btn btn-primary"
            onClick={handleGenerateReport}
            disabled={generating}
            id="generate-report-btn"
          >
            {generating ? '⏳ Generating...' : '📄 Generate Report'}
          </button>
        </div>
      </div>

      <div className="grid-2">
        {/* Left: Details */}
        <div>
          {/* Meta details */}
          <div className="card animate-in" style={{ marginBottom: 16 }} id="incident-meta">
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 16 }}>Incident Details</h3>
            <div className="detail-grid">
              <div className="detail-field">
                <span className="detail-label">Source</span>
                <span className="detail-value" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem' }}>
                  {incident.source}
                </span>
              </div>
              <div className="detail-field">
                <span className="detail-label">Confidence</span>
                <div className="similarity-bar" style={{ width: 150 }}>
                  <div className="similarity-track">
                    <div className="similarity-fill" style={{ width: `${(incident.confidence || 0) * 100}%` }}></div>
                  </div>
                  <span className="similarity-value">{((incident.confidence || 0) * 100).toFixed(1)}%</span>
                </div>
              </div>
              <div className="detail-field">
                <span className="detail-label">Detected</span>
                <span className="detail-value">{new Date(incident.createdAt).toLocaleString()}</span>
              </div>
              <div className="detail-field">
                <span className="detail-label">AI Provider</span>
                <span className="detail-value">{incident.aiProvider || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* AI Summary */}
          <div className="card animate-in" style={{ marginBottom: 16 }} id="incident-summary">
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 12 }}>🤖 AI Analysis</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.875rem' }}>
              {incident.aiSummary || incident.message || 'No analysis available yet.'}
            </p>
          </div>

          {/* Indicators */}
          {indicators.length > 0 && (
            <div className="card animate-in" id="incident-indicators">
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 12 }}>⚡ Indicators of Compromise</h3>
              <div className="indicators-list">
                {indicators.map((ioc, i) => (
                  <span key={i} className="indicator-tag">{ioc}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Raw log + Report */}
        <div>
          {/* Raw Log */}
          <div className="card animate-in" style={{ marginBottom: 16 }} id="incident-raw-log">
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 12 }}>📋 Raw Log</h3>
            <div className="raw-log-block">{incident.rawLog}</div>
          </div>

          {/* Generated Report */}
          {incident.reportMarkdown && (
            <div className="card animate-in" id="incident-report">
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 12 }}>📄 Generated Report</h3>
              <div className="markdown-content" style={{ fontSize: '0.85rem' }}>
                {/* Simple markdown rendering — convert headers, bold, lists */}
                {incident.reportMarkdown.split('\n').map((line, i) => {
                  if (line.startsWith('### ')) return <h3 key={i}>{line.slice(4)}</h3>;
                  if (line.startsWith('## ')) return <h2 key={i}>{line.slice(3)}</h2>;
                  if (line.startsWith('# ')) return <h1 key={i}>{line.slice(2)}</h1>;
                  if (line.startsWith('- ')) return <li key={i}>{line.slice(2)}</li>;
                  if (line.startsWith('```')) return null;
                  if (line.trim() === '') return <br key={i} />;
                  return <p key={i}>{line}</p>;
                })}
              </div>
            </div>
          )}

          {/* Reports list */}
          {incident.reports && incident.reports.length > 0 && (
            <div className="card animate-in" style={{ marginTop: 16 }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 12 }}>📑 All Reports</h3>
              {incident.reports.map((report) => (
                <a
                  key={report.id}
                  href={`/reports?id=${report.id}`}
                  style={{
                    display: 'block',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    marginBottom: 8,
                    fontSize: '0.8rem',
                    transition: 'all 0.15s ease',
                    textDecoration: 'none',
                  }}
                >
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{report.title}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    🤖 {report.aiProvider} · {new Date(report.createdAt).toLocaleString()}
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
