import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { useToast } from '../components/Toast';
import { useTranslation } from '../i18n/useTranslation';
import { LanguageToggle } from '../components/LanguageToggle';

interface LocationState {
  from?: { pathname: string };
}

export function LoginPage() {
  const [email, setEmail] = useState('teacher1@quizzy.local');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { t } = useTranslation();

  const from =
    (location.state as LocationState | null)?.from?.pathname ?? '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(email, password);
      const target =
        from === '/' ? (email.startsWith('student') ? '/student' : '/teacher') : from;
      navigate(target);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        t('login_error');
      toast.show(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-container">
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
        }}
      >
        <div className="card" style={{ maxWidth: 400, width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
            <LanguageToggle />
          </div>
          <h1 className="text-center">{t('login_welcome')}</h1>
          <p className="text-muted text-center mb-3">
            {t('login_subtitle')}
          </p>

          <div style={{ fontSize: '0.78rem', marginBottom: '1rem' }}>
            <div style={{ marginBottom: '0.3rem' }}>
              <strong>{t('login_teacher')}:</strong> teacher1@quizzy.local / pa$$1234
            </div>
            <div>
              <strong>{t('login_student')}:</strong> student1@quizzy.local / pa$$1234
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">{t('login_email')}</label>
              <input
                id="email"
                className="form-control"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('login_emailPlaceholder')}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">{t('login_password')}</label>
              <input
                id="password"
                className="form-control"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('login_passwordPlaceholder')}
                required
              />
            </div>

            <button
              className="btn btn-primary"
              type="submit"
              disabled={submitting}
              style={{ width: '100%' }}
            >
              {submitting ? t('login_loading') : t('login_submit')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
