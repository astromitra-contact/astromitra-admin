import Sidebar from './Sidebar.jsx';

export default function Layout({ eyebrow, title, actions, children }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main">
        <div className="topbar">
          <div>
            <div className="eyebrow">{eyebrow}</div>
            <h1>{title}</h1>
          </div>
          {actions}
        </div>
        <div className="content">{children}</div>
      </main>
    </div>
  );
}
