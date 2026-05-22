import './globals.css';

export const metadata = {
  title: 'Serv-I — AI Cybersecurity Platform',
  description: 'AI-powered cybersecurity log analysis platform. Detect suspicious activities, classify threats, and generate automated incident reports.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="app-layout">
          <Sidebar />
          <main className="main-content">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">S</div>
        <div>
          <div className="logo-text">Serv-I</div>
          <div className="logo-sub">Cybersecurity AI</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <a href="/" id="nav-dashboard">
          <span className="nav-icon">📊</span>
          Dashboard
        </a>
        <a href="/incidents" id="nav-incidents">
          <span className="nav-icon">🛡️</span>
          Incidents
        </a>
        <a href="/search" id="nav-search">
          <span className="nav-icon">🔍</span>
          Semantic Search
        </a>
        <a href="/reports" id="nav-reports">
          <span className="nav-icon">📄</span>
          Reports
        </a>
      </nav>

      <div className="sidebar-footer">
        <div className="provider-badge">
          <span className="dot"></span>
          <span>AI Provider: Active</span>
        </div>
      </div>
    </aside>
  );
}
