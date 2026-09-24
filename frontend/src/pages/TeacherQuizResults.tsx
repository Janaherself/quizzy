import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { quizzesApi } from '../api/quizzes';
import { studentQuizzesApi } from '../api/studentQuizzes';
import type { QuizDto, TeacherQuizResultDto } from '../api/types';
import { useToast } from '../components/Toast';
import { useTranslation } from '../i18n/useTranslation';
import { localeForLanguage } from '../utils/datetime';

export function TeacherQuizResults() {
  const { t, language } = useTranslation();
  const locale = localeForLanguage(language);
  const { id } = useParams<{ id: string }>();
  const quizId = Number(id);
  const navigate = useNavigate();
  const toast = useToast();

  const [quiz, setQuiz] = useState<QuizDto | null>(null);
  const [results, setResults] = useState<TeacherQuizResultDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!quizId) return;
    loadData();
  }, [quizId]);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [q, r] = await Promise.all([
        quizzesApi.getQuiz(quizId),
        studentQuizzesApi.getTeacherQuizResults(quizId),
      ]);
      setQuiz(q);
      setResults(r);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? t('teacherResults_loadError');
      setError(msg);
      toast.show(msg, 'error');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="text-center">
        <div className="spinner" />
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="card">
        <p className="text-danger">{error}</p>
      </div>
    );
  }

  const maxScore = quiz.questions.reduce((sum, q) => sum + q.points, 0);

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          marginBottom: '1.25rem',
        }}
      >
        <button
          className="btn btn-ghost"
          onClick={() => navigate(`/teacher/quizzes/${quiz.id}`)}
        >
          ←
        </button>
        <h1>{quiz.title} — {t('teacherResults_title')}</h1>
      </div>

      <div className="card">
        {results.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <p>{t('teacherResults_noResults')}</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="results-table">
              <thead>
                <tr>
                  <th>{t('teacherResults_table_student')}</th>
                  <th>{t('teacherResults_table_class')}</th>
                  <th>{t('teacherResults_table_score')}</th>
                  <th>{t('teacherResults_table_max')}</th>
                  <th>{t('teacherResults_table_time')}</th>
                  <th>{t('teacherResults_table_status')}</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => {
                  const pct =
                    r.maxPossibleScore > 0
                      ? Math.round((r.score / r.maxPossibleScore) * 100)
                      : 0;
                  const started = new Date(r.startedAt).toLocaleString(locale, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'Asia/Amman',
                  });
                  return (
                    <tr key={r.submissionId}>
                      <td>{r.studentName}</td>
                      <td>{r.className ?? '—'}</td>
                      <td>
                        <strong>{r.score}</strong>
                        <span className="text-muted"> ({pct}%)</span>
                      </td>
                      <td className="text-muted">{r.maxPossibleScore}</td>
                      <td className="text-muted">{started}</td>
                      <td>
                        {r.status === 'Completed'
                          ? t('teacherResults_completed')
                          : t('teacherResults_inProgress')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
