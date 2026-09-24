import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { useToast } from '../components/Toast';

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
        'فشل تسجيل الدخول. تحقق من بيانات الاعتماد.';
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
          <h1 className="text-center">مرحباً بك في Quizzy</h1>
          <p className="text-muted text-center mb-3">
            سجّل دخلك للمتابعة
          </p>

          {/* Demo credentials hint */}
          <div style={{ fontSize: '0.78rem', marginBottom: '1rem' }}>
            <div style={{ marginBottom: '0.3rem' }}>
              <strong>معلم:</strong> teacher1@quizzy.local / pa$$1234
            </div>
            <div>
              <strong>طالب:</strong> student1@quizzy.local / pa$$1234
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">البريد الإلكتروني</label>
              <input
                id="email"
                className="form-control"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@quizzy.local"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">كلمة المرور</label>
              <input
                id="password"
                className="form-control"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <button
              className="btn btn-primary"
              type="submit"
              disabled={submitting}
              style={{ width: '100%' }}
            >
              {submitting ? 'جارٍ تسجيل الدخول...' : 'دخول'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
