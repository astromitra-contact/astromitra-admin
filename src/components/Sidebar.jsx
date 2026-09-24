import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: '\u2609' },
  { to: '/kundlis', label: 'Kundli records', icon: '\u263C' },
  { to: '/ai-keys', label: 'AI provider keys', icon: '\u25C6' },
  { to: '/ai-settings', label: 'AI prompt settings', icon: '\u270E' },
];

export default function Sidebar() {
  const { email, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <aside className="sidebar sky-texture">
      <div className="sidebar-brand">
        <div className="glyph">A</div>
        <div>
          <div className="name">AstroMitra</div>
          <div className="tag">Admin console</div>
        </div>
      </div>
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? 'active' : '')}>
            <span className="icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-foot">
        <div className="session">
          Signed in as
          <br />
          <strong>{email || 'admin'}</strong>
        </div>
        <button className="btn btn-secondary btn-sm btn-block" onClick={handleLogout}>
          Log out
        </button>
      </div>
    </aside>
  );
}
