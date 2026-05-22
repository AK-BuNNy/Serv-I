'use client';

import { useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState('');

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/incidents/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, limit: 20 }),
      });
      const data = await res.json();
      setResults(data.results || []);
      setProvider(data.provider || '');
    } catch (e) {
      console.error('Search failed:', e);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="page-header animate-in">
        <h1>🔍 Semantic Search</h1>
        <p>Search incidents using natural language — powered by vector similarity</p>
      </div>

      <form onSubmit={handleSearch}>
        <div className="search-container animate-in" id="search-input-container">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="e.g., SSH brute force from Russia, SQL injection on API, port scan on database ports..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            id="search-input"
          />
        </div>

        <div className="animate-in" style={{ marginBottom: 24, display: 'flex', gap: 12, alignItems: 'center' }}>
          <button type="submit" className="btn btn-primary" disabled={loading || !query.trim()} id="search-btn">
            {loading ? '⏳ Searching...' : '🔍 Search'}
          </button>
          {provider && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Embedding provider: <strong style={{ color: 'var(--accent-green)' }}>{provider}</strong>
            </span>
          )}
        </div>
      </form>

      {/* Results */}
      {loading && (
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      )}

      {results !== null && !loading && (
        <div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 16 }}>
            {results.length} result{results.length !== 1 ? 's' : ''} found for "{query}"
          </div>

          {results.length > 0 ? (
            <div className="threat-feed">
              {results.map((result, i) => (
                <a key={result.id || i} href={`/incidents/${result.id}`} style={{ textDecoration: 'none' }}>
                  <div className="threat-card" id={`search-result-${i}`}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                        <span className={`severity-badge ${result.severity}`}>
                          <span className="pulse-dot"></span>
                          {result.severity}
                        </span>
                        <span style={{
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: '0.75rem',
                          color: 'var(--text-muted)',
                        }}>
                          {result.category}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: 6 }}>
                        {result.aiSummary || result.message}
                      </div>

                      <div className="raw-log-block" style={{ fontSize: '0.7rem', padding: 10, marginBottom: 8 }}>
                        {result.rawLog?.substring(0, 200)}{result.rawLog?.length > 200 ? '...' : ''}
                      </div>

                      {/* Similarity score */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Similarity:</span>
                        <div className="similarity-bar" style={{ width: 200 }}>
                          <div className="similarity-track">
                            <div
                              className="similarity-fill"
                              style={{ width: `${(result.similarity || 0) * 100}%` }}
                            ></div>
                          </div>
                          <span className="similarity-value">
                            {((result.similarity || 0) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          🤖 {result.aiProvider}
                        </span>
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <h3>No Results</h3>
              <p>No incidents matched your search query. Try different keywords.</p>
            </div>
          )}
        </div>
      )}

      {results === null && !loading && (
        <div className="card animate-in" style={{ textAlign: 'center', padding: '60px 40px' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>🧠</div>
          <h3 style={{ fontSize: '1.1rem', marginBottom: 8, color: 'var(--text-secondary)' }}>
            AI-Powered Semantic Search
          </h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: 500, margin: '0 auto', lineHeight: 1.6 }}>
            Describe the type of threat you're looking for in natural language.
            The system will use vector embeddings to find the most semantically similar incidents,
            even if the exact words don't match.
          </p>
        </div>
      )}
    </div>
  );
}
