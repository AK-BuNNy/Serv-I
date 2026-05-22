'use client';

import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const SEVERITY_COLORS = {
  critical: '#ff3366',
  high: '#ffaa00',
  medium: '#3b82f6',
  low: '#a855f7',
  info: '#06b6d4',
};

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, incidentsRes, healthRes] = await Promise.all([
          fetch(`${API_URL}/incidents/stats`).then(r => r.json()).catch(() => null),
          fetch(`${API_URL}/incidents?limit=10`).then(r => r.json()).catch(() => ({ data: [] })),
          fetch(`${API_URL}/`).then(r => r.json()).catch(() => null),
        ]);
        setStats(statsRes);
        setIncidents(incidentsRes.data || []);
        setHealth(healthRes);
      } catch (e) {
        console.error('Failed to fetch dashboard data:', e);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    );
  }

  const severityData = stats ? [
    { name: 'Critical', value: stats.critical || 0, color: SEVERITY_COLORS.critical },
    { name: 'High', value: stats.high || 0, color: SEVERITY_COLORS.high },
    { name: 'Medium', value: stats.medium || 0, color: SEVERITY_COLORS.medium },
    { name: 'Low', value: stats.low || 0, color: SEVERITY_COLORS.low },
    { name: 'Info', value: stats.info || 0, color: SEVERITY_COLORS.info },
  ].filter(d => d.value > 0) : [];

  const categoryData = stats?.byCategory
    ? Object.entries(stats.byCategory).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div>
      <div className="page-header animate-in">
        <h1>🛡️ Threat Dashboard</h1>
        <p>
          Real-time cybersecurity threat monitoring
          {health && <> — powered by <strong style={{ color: 'var(--accent-green)' }}>{health.aiProvider}</strong></>}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="card kpi-card total animate-in animate-in-delay-1" id="kpi-total">
          <div className="kpi-label">Total Incidents</div>
          <div className="kpi-value">{stats?.total || 0}</div>
          <div className="kpi-sub">All time</div>
        </div>
        <div className="card kpi-card critical animate-in animate-in-delay-2" id="kpi-critical">
          <div className="kpi-label">Critical</div>
          <div className="kpi-value">{stats?.critical || 0}</div>
          <div className="kpi-sub">Immediate action needed</div>
        </div>
        <div className="card kpi-card high animate-in animate-in-delay-3" id="kpi-high">
          <div className="kpi-label">High Severity</div>
          <div className="kpi-value">{stats?.high || 0}</div>
          <div className="kpi-sub">Requires investigation</div>
        </div>
        <div className="card kpi-card medium animate-in animate-in-delay-4" id="kpi-24h">
          <div className="kpi-label">Last 24 Hours</div>
          <div className="kpi-value">{stats?.last24h || 0}</div>
          <div className="kpi-sub">Recent activity</div>
        </div>
      </div>

      {/* Charts + Feed */}
      <div className="grid-2">
        {/* Severity Distribution */}
        <div className="card animate-in" id="chart-severity">
          <h3 style={{ marginBottom: 20, fontSize: '0.95rem', fontWeight: 600 }}>
            Severity Distribution
          </h3>
          {severityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {severityData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#1e293b',
                    border: '1px solid rgba(148,163,184,0.1)',
                    borderRadius: 8,
                    color: '#f1f5f9',
                    fontSize: '0.8rem',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <h3>No Data Yet</h3>
              <p>Incidents will appear here once detected</p>
            </div>
          )}
          {/* Legend */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>
            {severityData.map((d, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.color }}></span>
                {d.name}: {d.value}
              </div>
            ))}
          </div>
        </div>

        {/* Category Distribution */}
        <div className="card animate-in" id="chart-category">
          <h3 style={{ marginBottom: 20, fontSize: '0.95rem', fontWeight: 600 }}>
            Threat Categories
          </h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={categoryData} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  width={130}
                />
                <Tooltip
                  contentStyle={{
                    background: '#1e293b',
                    border: '1px solid rgba(148,163,184,0.1)',
                    borderRadius: 8,
                    color: '#f1f5f9',
                    fontSize: '0.8rem',
                  }}
                />
                <Bar
                  dataKey="value"
                  fill="#00ff88"
                  radius={[0, 6, 6, 0]}
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📈</div>
              <h3>No Categories</h3>
              <p>Threat categories will appear after AI classification</p>
            </div>
          )}
        </div>
      </div>

      {/* Live Threat Feed */}
      <div className="card animate-in" style={{ marginTop: 24 }} id="threat-feed">
        <h3 style={{ marginBottom: 16, fontSize: '0.95rem', fontWeight: 600 }}>
          🔴 Live Threat Feed
        </h3>
        {incidents.length > 0 ? (
          <div className="threat-feed">
            {incidents.map((incident) => (
              <a key={incident.id} href={`/incidents/${incident.id}`} style={{ textDecoration: 'none' }}>
                <div className="threat-card">
                  <div className={`threat-icon ${incident.severity}`}>
                    {incident.severity === 'critical' ? '🚨' : incident.severity === 'high' ? '⚠️' : incident.severity === 'medium' ? '🔶' : '🔵'}
                  </div>
                  <div className="threat-body">
                    <div className="threat-title">
                      <span className={`severity-badge ${incident.severity}`}>
                        <span className="pulse-dot"></span>
                        {incident.severity}
                      </span>
                      {' '}
                      {incident.category}
                    </div>
                    <div className="threat-summary">{incident.message || incident.aiSummary || 'Processing...'}</div>
                    <div className="threat-meta">
                      <span>📁 {incident.source}</span>
                      <span>🤖 {incident.aiProvider || 'unknown'}</span>
                      <span>🕐 {new Date(incident.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">🛡️</div>
            <h3>All Clear</h3>
            <p>No incidents detected yet. The AI worker will classify incoming logs automatically.</p>
          </div>
        )}
      </div>
    </div>
  );
}