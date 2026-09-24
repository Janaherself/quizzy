import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { quizzesApi } from '../api/quizzes';
import type { QuizSummaryDto } from '../api/types';
import { QuizCard } from '../components/QuizCard';
import { useToast } from '../components/Toast';
import { useTranslation } from '../i18n/useTranslation';

export function TeacherDashboard() {
  const { t } = useTranslation();
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
      const msg = err?.response?.data?.message ?? t('teacher_loadError');
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
        <h1>{t('teacher_myQuizzes')}</h1>
        <button className="btn btn-primary" onClick={handleNew}>
          {t('teacher_newQuiz')}
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
              <p>{t('teacher_emptyTitle')}</p>
              <button className="btn btn-primary mt-2" onClick={handleNew}>
                {t('teacher_emptyAction')}
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
                    {t('teacher_editQuiz')}
                  </button>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() =>
                      navigate(`/teacher/quizzes/${quiz.id}/results`)
                    }
                  >
                    {t('teacher_results')}
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
