import { Outlet, NavLink, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { useTranslation } from '../i18n/useTranslation';
import { LanguageToggle } from './LanguageToggle';

export function Layout() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();

  const teacherLinks = [{ to: '/teacher', labelKey: 'nav_dashboard' }];
  const studentLinks = [{ to: '/student', labelKey: 'nav_myQuizzes' }];

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
            {t('appTitle')}
          </Link>
          <nav>
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={isActive(link.to) ? 'active' : ''}
              >
                {t(link.labelKey)}
              </NavLink>
            ))}
            <span className="user-info">
              <span>{user?.name}</span>
              <button className="logout-btn" onClick={logout}>
                {t('nav_logout')}
              </button>
              <LanguageToggle />
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
