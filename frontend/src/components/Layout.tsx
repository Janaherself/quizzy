import { Outlet, NavLink, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

export function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const teacherLinks = [{ to: '/teacher', label: 'لوحة التحكم' }];
  const studentLinks = [{ to: '/student', label: 'كويزاتي' }];

  const links = user?.role === 'Teacher' ? teacherLinks : studentLinks;

  const isActive = (to: string) => {
    if (to === '/') return location.pathname === to;
    return location.pathname === to || location.pathname.startsWith(to);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-inner">
          <Link to="/" className="logo">
            Quizzy
          </Link>
          <nav>
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={isActive(link.to) ? 'active' : ''}
              >
                {link.label}
              </NavLink>
            ))}
            <span className="user-info">
              <span>{user?.name}</span>
              <button className="logout-btn" onClick={logout}>
                خروج
              </button>
            </span>
          </nav>
        </div>
      </header>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
