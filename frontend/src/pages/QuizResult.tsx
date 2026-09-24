import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { studentQuizzesApi } from '../api/studentQuizzes';
import type { QuizResultDto } from '../api/types';
import { useToast } from '../components/Toast';

export function QuizResultPage() {
  const { id } = useParams<{ id: string }>();
  const quizId = Number(id);
  const navigate = useNavigate();
  const toast = useToast();

  const [result, setResult] = useState<QuizResultDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!quizId) return;
    loadResult();
  }, [quizId]);

  async function loadResult() {
    setLoading(true);
    setError(null);
    try {
      const data = await studentQuizzesApi.getQuizResult(quizId);
      setResult(data);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'تعذر تحميل النتيجة.';
      setError(msg);
      toast.show(msg, 'error');
      if (err?.response?.status === 404) {
        navigate('/student');
      }
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="text-center"><div className="spinner" /></div>;
  }

  if (error || !result) {
    return (
      <div className="card">
        <p className="text-danger">{error}</p>
      </div>
    );
  }

  const percentage =
    result.maxPossibleScore > 0
      ? Math.round((result.score / result.maxPossibleScore) * 100)
      : 0;

  return (
    <div className="quiz-taking">
      <div className="card">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <h1>{result.quizTitle}</h1>
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: '2rem',
                fontWeight: 700,
                color:
                  percentage >= 50 ? 'var(--color-success)' : 'var(--color-warning)',
              }}
            >
              {result.score} / {result.maxPossibleScore}
            </div>
            <span className="text-muted">({percentage}%)</span>
          </div>
        </div>

        <div className="quiz-card-meta" style={{ marginTop: '0.75rem' }}>
          <span>
            الحالة: {result.status === 'Completed' ? 'مكتمل' : 'جارٍ الإنجاز'}
          </span>
          <span>{new Date(result.submittedAt).toLocaleString('ar-EG')}</span>
        </div>
      </div>

      <div style={{ marginTop: '1.25rem' }}>
        <h2>تفاصيل الإجابة</h2>
        {result.answers.map((a) => {
          const isCorrect = a.isCorrect;
          const unanswered = a.selectedChoiceId === null;
          return (
            <div key={a.questionId} className="question-card rtl-fix" style={{ marginBottom: '1rem' }}>
              <div className="question-text">{a.questionText}</div>
              <div style={{ marginTop: '0.6rem' }}>
                <div
                  className={
                    unanswered
                      ? 'text-warning'
                    : isCorrect
                    ? 'text-success'
                    : 'text-danger'
                  }
                  style={{ fontSize: '0.85rem', marginBottom: '0.3rem' }}
                >
                  {unanswered
                    ? 'لم تُجيب'
                    : isCorrect
                    ? 'صحيح'
                    : 'خطأ'}
                </div>
                <div className="quiz-card-meta" style={{ fontSize: '0.8rem' }}>
                  <span>النقاط: {a.awardedPoints} / {a.questionPoints}</span>
                </div>
                {!unanswered && !isCorrect && a.selectedChoiceText && (
                  <div
                    className="text-danger"
                    style={{ fontSize: '0.8rem', marginTop: '0.2rem' }}
                  >
                    إجابتك: {a.selectedChoiceText}
                  </div>
                )}
                <div
                  className="text-success"
                  style={{ fontSize: '0.8rem', marginTop: '0.2rem' }}
                >
                  الصحيح: {a.correctChoiceText}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button className="btn btn-outline" onClick={() => navigate('/student')}>
        العودة إلى كويزاتي
      </button>
    </div>
  );
}
