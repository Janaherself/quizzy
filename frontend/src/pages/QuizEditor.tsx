import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { quizzesApi } from '../api/quizzes';
import type {
  QuizDto,
  QuestionForTeacherDto,
  ClassDto,
  QuestionEditorValue,
} from '../api/types';
import { QuestionEditor } from '../components/QuestionEditor';
import { StatusBadge } from '../components/StatusBadge';
import { useToast } from '../components/Toast';
import {
  fromAmmanDateTimeLocal,
  toAmmanDateTimeLocal,
  formatDateTime,
} from '../utils/datetime';

const DEFAULT_DURATION = 20;
const ADD_QUESTION_FLAG = -1;

export function QuizEditor() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === 'new' || !id;
  const navigate = useNavigate();
  const toast = useToast();

  const [quiz, setQuiz] = useState<QuizDto | null>(null);
  const [questions, setQuestions] = useState<QuestionForTeacherDto[]>([]);
  const [classes, setClasses] = useState<ClassDto[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(
    DEFAULT_DURATION.toString()
  );
  const [negativeMarking, setNegativeMarking] = useState(false);
  const [targetClassIds, setTargetClassIds] = useState<number[]>([]);

  const [editQuestionId, setEditQuestionId] = useState<number | null>(null);
  const [extendOpen, setExtendOpen] = useState(false);
  const [newEndAt, setNewEndAt] = useState('');

  const status = quiz ? quiz.status : 'Draft';
  const isPublished = quiz?.isPublished ?? false;
  const isLive = status === 'Live';
  const canPublish = !!quiz && !isPublished && !isLive && questions.length > 0;

  useEffect(() => {
    if (isNew) {
      const now = new Date();
      const start = new Date(now.getTime() + 60 * 60 * 1000);
      const end = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000);
      setStartAt(toAmmanDateTimeLocal(start.toISOString()));
      setEndAt(toAmmanDateTimeLocal(end.toISOString()));
      return;
    }

    if (!id) return;
    const qid = Number(id);
    loadQuiz(qid);
    loadClasses();
  }, [id, isNew]);

  async function loadQuiz(quizId: number) {
    setLoading(true);
    setError(null);
    try {
      const q = await quizzesApi.getQuiz(quizId);
      setQuiz(q);
      setTitle(q.title);
      setDescription(q.description ?? '');
      setStartAt(toAmmanDateTimeLocal(q.startAt));
      setEndAt(toAmmanDateTimeLocal(q.endAt));
      setDurationMinutes(q.durationMinutes.toString());
      setNegativeMarking(q.negativeMarkingEnabled);
      setTargetClassIds(q.targetClassIds);
      await loadQuestions(quizId);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'تعذر تحميل الكيزيس.';
      setError(msg);
      toast.show(msg, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function loadQuestions(quizId: number) {
    try {
      const data = await quizzesApi.getQuestions(quizId);
      setQuestions(data);
    } catch {
      toast.show('تعذر تحميل الأسئلة.', 'error');
    }
  }

  async function loadClasses() {
    try {
      const data = await quizzesApi.getClasses();
      setClasses(data);
    } catch {
      toast.show('تعذر تحميل الفصول.', 'error');
    }
  }

  const handleClassToggle = (classId: number) => {
    setTargetClassIds((prev) =>
      prev.includes(classId)
        ? prev.filter((c) => c !== classId)
        : [...prev, classId]
    );
  };

  const handleSaveQuiz = async () => {
    if (!title.trim()) {
      toast.show('العنوان مطلوب.', 'error');
      return;
    }
    if (new Date(endAt) <= new Date(startAt)) {
      toast.show('وقت البدء يجب أن يكون قبل وقت النهاية.', 'error');
      return;
    }
    if (targetClassIds.length === 0) {
      toast.show('يجب تحديد فصل واحد على الأقل.', 'error');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        title,
        description: description || null,
        startAt: fromAmmanDateTimeLocal(startAt),
        endAt: fromAmmanDateTimeLocal(endAt),
        durationMinutes: parseInt(durationMinutes, 10),
        negativeMarkingEnabled: negativeMarking,
        targetClassIds,
      };

      const saved = isNew
        ? await quizzesApi.createQuiz(payload)
        : await quizzesApi.updateQuiz(Number(id), payload);

      setQuiz(saved);
      if (isNew) {
        navigate(`/teacher/quizzes/${saved.id}`, { replace: true });
      }
      toast.show('تم حفظ الكيزيس.', 'info');
      await loadQuestions(saved.id);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'تعذر حفظ الكيزيس.';
      setError(msg);
      toast.show(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!quiz) return;
    try {
      const updated = await quizzesApi.publishQuiz(quiz.id);
      setQuiz(updated);
      setExtendOpen(false);
      toast.show('تم نشر الكيزيس.', 'info');
    } catch (err: any) {
      toast.show(
        err?.response?.data?.message ?? 'تعذر نشر الكيزيس.',
        'error'
      );
    }
  };

  const handleExtendDeadline = async () => {
    if (!quiz || !newEndAt) return;
    try {
      const updated = await quizzesApi.extendDeadline(quiz.id, {
        newEndAt: fromAmmanDateTimeLocal(newEndAt),
      });
      setQuiz(updated);
      setStartAt(toAmmanDateTimeLocal(updated.startAt));
      setEndAt(toAmmanDateTimeLocal(updated.endAt));
      setExtendOpen(false);
      toast.show('تم تمديد الموعد النهائي.', 'info');
    } catch (err: any) {
      toast.show(err?.response?.data?.message ?? 'تعذر تمديد الموعد.', 'error');
    }
  };

  const handleAddOrEditQuestion = async (value: QuestionEditorValue) => {
    if (!quiz) return;
    try {
      const questionPayload = {
        text: value.text,
        points: value.points,
        order: value.choices.length,
        choices: value.choices.map((c, i) => ({
          text: c.text,
          isCorrect: c.isCorrect,
          order: i + 1,
        })),
      };
      await quizzesApi.createQuestion(quiz.id, questionPayload);
      setEditQuestionId(null);
      await loadQuestions(quiz.id);
      toast.show('تم حفظ السؤال.', 'info');
    } catch (err: any) {
      toast.show(
        err?.response?.data?.message ?? 'تعذر حفظ السؤال.',
        'error'
      );
    }
  };

  const handleUpdateQuestion = async (
    question: QuestionForTeacherDto,
    value: QuestionEditorValue
  ) => {
    if (!quiz) return;
    try {
      await quizzesApi.updateQuestion(quiz.id, question.id, {
        text: value.text,
        points: value.points,
        order: question.order,
                  choices: value.choices.map((c, i) => ({
                    id: null,
                    text: c.text,
                    isCorrect: c.isCorrect,
                    order: i + 1,
                  })),
      });
      setEditQuestionId(null);
      await loadQuestions(quiz.id);
      toast.show('تم تحديث السؤال.', 'info');
    } catch (err: any) {
      toast.show(
        err?.response?.data?.message ?? 'تعذر تحديث السؤال.',
        'error'
      );
    }
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <button
            className="btn btn-ghost"
            onClick={() => navigate('/teacher')}
          >
            ←
          </button>
          <h1>{isNew ? 'إنشاء كيزيس جديد' : 'تحرير الكيزيس'}</h1>
        </div>
        {!isNew && <StatusBadge status={status} />}
      </div>

      {loading && <div className="spinner" />}

      {error && <p className="text-danger">{error}</p>}

      {!loading && !error && (
        <>
          {/* --- Quiz metadata --- */}
          <div className="card">
            <h2>إعدادات الكيزيس</h2>
            <div className="form-group">
              <label>العنوان</label>
              <input
                className="form-control"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="عنوان الكيزيس"
                disabled={isLive}
              />
            </div>
            <div className="form-group">
              <label>الوصف (اختياري)</label>
              <textarea
                className="form-control"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="وصف موجز للكيزيس..."
                rows={2}
                disabled={isLive}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>وقت البدء</label>
                <input
                  className="form-control"
                  type="datetime-local"
                  value={startAt}
                  onChange={(e) => setStartAt(e.target.value)}
                  disabled={isLive}
                />
              </div>
              <div className="form-group">
                <label>وقت النهاية</label>
                <input
                  className="form-control"
                  type="datetime-local"
                  value={endAt}
                  onChange={(e) => setEndAt(e.target.value)}
                  disabled={isLive}
                />
              </div>
              <div className="form-group">
                <label>المدة (دقيقة)</label>
                <input
                  className="form-control"
                  type="number"
                  min={1}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  disabled={isLive}
                />
              </div>
            </div>
            <div className="form-check">
              <input
                type="checkbox"
                checked={negativeMarking}
                onChange={(e) => setNegativeMarking(e.target.checked)}
                disabled={isLive}
              />
              <label>تفعيل التصحيح السلبي</label>
            </div>

            <div className="form-group">
              <label>الفصول المستهدفة</label>
              {classes.length === 0 && (
                <p className="text-muted">جارٍ تحميل الفصول...</p>
              )}
              <div
                style={{
                  display: 'flex',
                  gap: '0.6rem',
                  flexWrap: 'wrap',
                }}
              >
                {classes.map((c) => (
                  <label key={c.id} className="form-check">
                    <input
                      type="checkbox"
                      checked={targetClassIds.includes(c.id)}
                      onChange={() => handleClassToggle(c.id)}
                      disabled={isLive}
                    />
                    {c.name}
                  </label>
                ))}
              </div>
            </div>

            <button
              className="btn btn-primary"
              onClick={handleSaveQuiz}
              disabled={saving || isLive}
            >
              {saving ? 'جارٍ الحفظ...' : isNew ? 'إنشاء الكيزيس' : 'حفظ التغييرات'}
            </button>

            {!isNew && isLive && (
              <button
                className="btn btn-outline"
                onClick={() => setExtendOpen(true)}
                style={{ marginLeft: '0.5rem' }}
              >
                تمديد الموعد النهائي
              </button>
            )}

            {!isNew && isPublished && !isLive && (
              <span
                className="text-warning"
                style={{ marginLeft: '0.5rem' }}
              >
                تم نشر هذا الكيزيس؟ لا يمكن تعديل المحتوى الآن.
              </span>
            )}

            {canPublish && (
              <button
                className="btn btn-outline"
                onClick={handlePublish}
                style={{ marginLeft: '0.5rem' }}
              >
                نشر الكيزيس
              </button>
            )}
          </div>

          {/* --- Extend deadline dialog --- */}
          {extendOpen && quiz && (
            <div className="overlay">
              <div className="dialog">
                <h3>تمديد الموعد النهائي</h3>
                <p className="text-muted">
                  الموعد الحالي: {formatDateTime(quiz.endAt)}
                </p>
                <p className="text-muted" style={{ fontSize: '0.8rem' }}>
                  يجب أن يكون الموعد الجديد أبعد من الموعد الحالي.
                </p>
                <div className="form-group">
                  <label>الموعد الجديد</label>
                  <input
                    className="form-control"
                    type="datetime-local"
                    value={newEndAt}
                    onChange={(e) => setNewEndAt(e.target.value)}
                  />
                </div>
                <div className="dialog-footer">
                  <button
                    className="btn btn-outline"
                    onClick={() => setExtendOpen(false)}
                  >
                    إلغاء
                  </button>
                  <button className="btn btn-primary" onClick={handleExtendDeadline}>
                    تمديد
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* --- Questions --- */}
          {quiz && (
            <div className="card mt-3">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <h2>الأسئلة ({questions.length})</h2>
                {!isLive && (
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() =>
                      setEditQuestionId(
                        editQuestionId === ADD_QUESTION_FLAG ? null : ADD_QUESTION_FLAG
                      )
                    }
                  >
                    {editQuestionId === ADD_QUESTION_FLAG
                      ? 'إلغاء'
                      : '+ إضافة سؤال'}
                  </button>
                )}
              </div>

              {questions.length === 0 && (
                <p className="text-muted">
                  {isLive
                    ? 'لا توجد أسئلة.'
                    : 'أضف أسئلة للكيزيس. الكيزيس يجب أن يحتوي على سؤال واحد على الأقل للنشر.'}
                </p>
              )}

              {editQuestionId === ADD_QUESTION_FLAG && !isLive && (
                <QuestionEditor
                  isLocked={false}
                  onSave={handleAddOrEditQuestion}
                  onCancel={() => setEditQuestionId(null)}
                />
              )}

              <div style={{ marginTop: '1rem' }}>
                {questions
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map((q) => (
                    <div key={q.id} className="question-editor">
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          gap: '0.5rem',
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div
                            className="quiz-card-title"
                            style={{ fontSize: '0.95rem' }}
                          >
                            {q.order}. {q.text}
                          </div>
                          <div className="quiz-card-meta">
                            <span>{q.points} نقطة</span>
                            <span>{q.choices.length} خيارات</span>
                            <span>
                              الصحيح:{' '}
                              {q.choices.find((c) => c.isCorrect)?.text}
                            </span>
                          </div>
                        </div>
                        {!isLive && editQuestionId !== q.id && (
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setEditQuestionId(q.id)}
                          >
                            تعديل
                          </button>
                        )}
                      </div>

                      {editQuestionId === q.id && !isLive && (
                        <QuestionEditor
                          question={q}
                          isLocked={false}
                          onSave={(value) =>
                            handleUpdateQuestion(q, value)
                          }
                          onCancel={() => setEditQuestionId(null)}
                        />
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
