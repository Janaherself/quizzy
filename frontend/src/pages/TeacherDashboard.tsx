import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { quizzesApi } from '../api/quizzes';
import type { QuizSummaryDto } from '../api/types';
import { QuizCard } from '../components/QuizCard';
import { StatusBadge } from '../components/StatusBadge';
import { useToast } from '../components/Toast';

export function TeacherDashboard() {
  const [quizzes, setQuizzes] = useState<QuizSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    loadQuizzes();
  }, []);

  async function loadQuizzes() {
    setLoading(true);
    setError(null);
    try {
      const data = await quizzesApi.getTeacherQuizzes();
      setQuizzes(data);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'تعذر تحميل الكويزات.';
      setError(msg);
      toast.show(msg, 'error');
    } finally {
      setLoading(false);
    }
  }

  const handleNew = () => navigate('/teacher/quizzes/new');

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.25rem',
        }}
      >
        <h1>كويزاتي</h1>
        <button className="btn btn-primary" onClick={handleNew}>
          كيزيس جديد
        </button>
      </div>

      {loading && (
        <div className="text-center">
          <div className="spinner" />
        </div>
      )}

      {error && !loading && (
        <div className="card">
          <p className="text-danger">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          {quizzes.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <p>لم تقم بعد بإنشاء أي كويزات.</p>
              <button className="btn btn-primary mt-2" onClick={handleNew}>
                إنشاء كيزيس الأول
              </button>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1rem',
              }}
            >
              {quizzes.map((quiz) => (
                <QuizCard key={quiz.id} quiz={quiz}>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => navigate(`/teacher/quizzes/${quiz.id}`)}
                  >
                    تعديل
                  </button>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() =>
                      navigate(`/teacher/quizzes/${quiz.id}/results`)
                    }
                  >
                    النتائج
                  </button>
                </QuizCard>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
