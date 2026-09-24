import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentQuizzesApi } from '../api/studentQuizzes';
import type { QuizSummaryDto } from '../api/types';
import { QuizCard } from '../components/QuizCard';
import { StatusBadge } from '../components/StatusBadge';
import { useToast } from '../components/Toast';

export function StudentDashboard() {
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
      const data = await studentQuizzesApi.getAvailableQuizzes();
      setQuizzes(data);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'تعذر تحميل الكويزات.';
      setError(msg);
      toast.show(msg, 'error');
    } finally {
      setLoading(false);
    }
  }

  const handleAction = (quiz: QuizSummaryDto) => {
    const s = quiz.status.toLowerCase();
    if (s === 'completed' || s === 'inprogress') {
      navigate(`/student/quizzes/${quiz.id}/result`);
    } else if (s === 'live') {
      navigate(`/student/quizzes/${quiz.id}/take`);
    }
  };

  const isStartable = (quiz: QuizSummaryDto) =>
    quiz.status.toLowerCase() === 'live';

  return (
    <div>
      <h1 style={{ marginBottom: '1.25rem' }}>كويزاتي المتاحة</h1>

      {loading && <div className="spinner" />}

      {error && !loading && (
        <div className="card">
          <p className="text-danger">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          {quizzes.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <p>لا توجد كويزات متاحة حالياً.</p>
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
                  {quiz.status.toLowerCase() === 'live' ||
                  quiz.status.toLowerCase() === 'inprogress' ||
                  quiz.status.toLowerCase() === 'completed' ? (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleAction(quiz)}
                    >
                      {quiz.status.toLowerCase() === 'live'
                        ? 'ابدأ الكيزيس'
                        : quiz.status.toLowerCase() === 'inprogress'
                        ? 'استكمل'
                        : 'النتيجة'}
                    </button>
                  ) : (
                    <button className="btn btn-outline btn-sm" disabled>
                      غير متاح بعد
                    </button>
                  )}
                </QuizCard>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
