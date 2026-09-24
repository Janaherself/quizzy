import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { studentQuizzesApi } from '../api/studentQuizzes';
import type {
  QuizForTakingDto,
  QuestionForTakingDto,
  StartQuizResponse,
  SubmitAnswerRequest,
} from '../api/types';
import { Timer } from '../components/Timer';
import { useToast } from '../components/Toast';

interface StoredAttempt {
  submissionId: number;
  startedAt: string;
  effectiveDeadline: string;
  quiz: QuizForTakingDto;
  answers: Record<number, number | null>;
}

const attemptKey = (quizId: number) => `quiz_attempt_${quizId}`;

export function QuizTake() {
  const { id } = useParams<{ id: string }>();
  const quizId = Number(id);
  const navigate = useNavigate();
  const toast = useToast();

  const [readyQuiz, setReadyQuiz] = useState<QuizForTakingDto | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<QuizForTakingDto | null>(null);
  const [submissionId, setSubmissionId] = useState<number | null>(null);
  const [deadline, setDeadline] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, number | null>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!quizId) return;
    initPage();
  }, [quizId]);

  async function initPage() {
    setLoading(true);
    try {
      // If already completed, jump to results.
      try {
        await studentQuizzesApi.getQuizResult(quizId);
        navigate(`/student/quizzes/${quizId}/result`, { replace: true });
        return;
      } catch {
        // no result yet — continue
      }

      // Resume in-progress attempt from localStorage.
      const stored = localStorage.getItem(attemptKey(quizId));
      if (stored) {
        const attempt: StoredAttempt = JSON.parse(stored);
        if (new Date(attempt.effectiveDeadline) > new Date()) {
          setActiveQuiz(attempt.quiz);
          setSubmissionId(attempt.submissionId);
          setDeadline(attempt.effectiveDeadline);
          setStartedAt(attempt.startedAt);
          setAnswers(attempt.answers);
          setStarted(true);
        } else {
          // past deadline — clear and treat as fresh
          localStorage.removeItem(attemptKey(quizId));
        }
      }

      if (!activeQuiz) {
        const q = await studentQuizzesApi.getQuizForTaking(quizId);
        setReadyQuiz(q);
      }
    } catch (err: any) {
      toast.show(
        err?.response?.data?.message ?? 'تعذر تحميل الكيزيس.',
        'error'
      );
      navigate('/student');
    } finally {
      setLoading(false);
    }
  }

  const persistAttempt = useCallback(() => {
    if (!activeQuiz || !submissionId || !deadline) return;
    const attempt: StoredAttempt = {
      submissionId,
      startedAt: startedAt ?? '',
      effectiveDeadline: deadline,
      quiz: activeQuiz,
      answers,
    };
    localStorage.setItem(attemptKey(quizId), JSON.stringify(attempt));
  }, [activeQuiz, submissionId, deadline, startedAt, answers, quizId]);

  const handleStart = async () => {
    try {
      const resp: StartQuizResponse = await studentQuizzesApi.startQuiz(quizId);
      setActiveQuiz(resp.quiz);
      setSubmissionId(resp.submissionId);
      setDeadline(resp.effectiveDeadline);
      setStartedAt(resp.startedAt);
      setAnswers({});
      setStarted(true);
      localStorage.setItem(
        attemptKey(quizId),
        JSON.stringify({
          submissionId: resp.submissionId,
          startedAt: resp.startedAt,
          effectiveDeadline: resp.effectiveDeadline,
          quiz: resp.quiz,
          answers: {},
        })
      );
    } catch (err: any) {
      toast.show(
        err?.response?.data?.message ?? 'تعذر بدء الكيزيس.',
        'error'
      );
    }
  };

  const handleSelect = async (
    questionId: number,
    choiceId: number | null
  ) => {
    setAnswers((prev) => {
      const next = { ...prev, [questionId]: choiceId };
      return next;
    });
    if (submissionId) {
      try {
        await studentQuizzesApi.saveAnswer(submissionId, {
          questionId,
          selectedChoiceId: choiceId,
        });
      } catch {
        // best-effort save; local state is the source of truth for the attempt
      }
    }
  };

  const handleSubmit = async () => {
    if (!submissionId || !activeQuiz) return;
    setSubmitting(true);
    const answerPayload: SubmitAnswerRequest[] = activeQuiz.questions.map(
      (q) => ({
        questionId: q.id,
        selectedChoiceId: answers[q.id] ?? null,
      })
    );
    try {
      await studentQuizzesApi.submitQuiz(submissionId, {
        answers: answerPayload,
      });
      localStorage.removeItem(attemptKey(quizId));
      navigate(`/student/quizzes/${quizId}/result`, { replace: true });
    } catch (err: any) {
      if (err?.response?.status === 400) {
        toast.show('انتهت الإجابة مرسلة بالفعل.', 'error');
      } else {
        toast.show(
          err?.response?.data?.message ?? 'تعذر إرسال الكيزيس.',
          'error'
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleTimerExpire = () => {
    if (submitting || !started) return;
    toast.show('انتهى الوقت! يتم إرسال إجاباتك تلقائياً.', 'info');
    handleSubmit();
  };

  useEffect(() => {
    persistAttempt();
  }, [answers, persistAttempt]);

  if (loading) {
    return (
      <div className="text-center">
        <div className="spinner" />
      </div>
    );
  }

  // Ready screen: confirm before starting
  if (!started && readyQuiz) {
    return (
      <div className="quiz-taking">
        <div className="card">
          <h1>{readyQuiz.title}</h1>
          {readyQuiz.description && (
            <p className="text-muted mb-3">{readyQuiz.description}</p>
          )}
          <ul style={{ marginBottom: '1rem', paddingRight: '1.2rem' }}>
            <li>{readyQuiz.questions.length} سؤال</li>
            <li>مدة الكيزيس: {readyQuiz.durationMinutes} دقيقة</li>
            {readyQuiz.negativeMarkingEnabled && (
              <li>تفعيل التصحيح السلبي</li>
            )}
            <li>الوقت يبدأ عند الضغط على "إبدأ الكيزيس".</li>
          </ul>
          <button className="btn btn-primary" onClick={handleStart}>
            إبدأ الكيزيس
          </button>
          <button
            className="btn btn-outline"
            style={{ marginLeft: '0.5rem' }}
            onClick={() => navigate('/student')}
          >
            إلغاء
          </button>
        </div>
      </div>
    );
  }

  // Active quiz screen
  if (started && activeQuiz && submissionId && deadline) {
    const answeredCount = Object.keys(answers).filter(
      (k) => answers[Number(k)] !== null
    ).length;

    return (
      <div className="quiz-taking">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
          }}
        >
          <Timer deadline={deadline} onExpire={handleTimerExpire} />
          <span className="text-muted">
            {answeredCount} / {activeQuiz.questions.length} مجاوبة
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {activeQuiz.questions.map((q: QuestionForTakingDto) => (
            <div key={q.id} className="question-card rtl-fix">
              <div
                className="question-text"
                style={{ fontSize: '1.1rem' }}
              >
                {q.order}. {q.text}
              </div>
              <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {q.choices.map((c) => {
                  const selected = answers[q.id] === c.id;
                  const label = String.fromCharCode(65 + c.order - 1);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      className={`choice-button ${selected ? 'selected' : ''}`}
                      onClick={() => handleSelect(q.id, c.id)}
                    >
                      <span className="choice-marker">{label}</span>
                      <span className="choice-label">{c.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '1.5rem' }}>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={submitting}
            style={{ width: '100%' }}
          >
            {submitting ? 'جارٍ الإرسال...' : 'إنهاء وإرسال الكيزيس'}
          </button>
        </div>
      </div>
    );
  }

  // Fallback: quiz not available
  return (
    <div className="text-center">
      <p className="text-muted">جارٍ تحميل الكيزيس...</p>
    </div>
  );
}
