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
import { useTranslation } from '../i18n/useTranslation';
import {
  fromAmmanDateTimeLocal,
  toAmmanDateTimeLocal,
  formatDateTime,
  localeForLanguage,
} from '../utils/datetime';

const DEFAULT_DURATION = 20;
const ADD_QUESTION_FLAG = -1;

export function QuizEditor() {
  const { t, language } = useTranslation();
  const locale = localeForLanguage(language);
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
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const status = quiz ? quiz.status : 'Draft';
  const isPublished = quiz?.isPublished ?? false;
  const isLive = status === 'Live';
  const canPublish = !!quiz && !isPublished && !isLive && questions.length > 0;

  useEffect(() => {
    loadClasses();

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
      const msg = err?.response?.data?.message ?? t('quizEditor_loadError');
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
      toast.show(t('quizEditor_loadQuestionsError'), 'error');
    }
  }

  async function loadClasses() {
    try {
      const data = await quizzesApi.getClasses();
      setClasses(data);
    } catch {
      toast.show(t('quizEditor_loadClassesError'), 'error');
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
      toast.show(t('quizEditor_validation_titleRequired'), 'error');
      return;
    }
    if (new Date(endAt) <= new Date(startAt)) {
      toast.show(t('quizEditor_validation_datesOrder'), 'error');
      return;
    }
    if (targetClassIds.length === 0) {
      toast.show(t('quizEditor_validation_targetClassRequired'), 'error');
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
      toast.show(t('quizEditor_saveSuccess'), 'info');
      await loadQuestions(saved.id);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? t('quizEditor_saveError');
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
      toast.show(t('quizEditor_publishSuccess'), 'info');
    } catch (err: any) {
      toast.show(
        err?.response?.data?.message ?? t('quizEditor_publishError'),
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
      toast.show(t('quizEditor_extendSuccess'), 'info');
    } catch (err: any) {
      toast.show(err?.response?.data?.message ?? t('quizEditor_extendError'), 'error');
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
      toast.show(t('quizEditor_questionSaved'), 'info');
    } catch (err: any) {
      toast.show(
        err?.response?.data?.message ?? t('quizEditor_questionSaveError'),
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
      toast.show(t('quizEditor_questionUpdated'), 'info');
    } catch (err: any) {
      toast.show(
        err?.response?.data?.message ?? t('quizEditor_questionUpdateError'),
        'error'
      );
    }
  };

  const handleDeleteQuestion = (questionId: number) => {
    setDeleteConfirmId(questionId);
  };

  const handleConfirmDelete = async () => {
    if (!quiz || deleteConfirmId === null) return;
    try {
      await quizzesApi.deleteQuestion(quiz.id, deleteConfirmId);
      await loadQuestions(quiz.id);
      toast.show(t('quizEditor_questionDeleted'), 'info');
    } catch (err: any) {
      toast.show(
        err?.response?.data?.message ?? t('quizEditor_questionDeleteError'),
        'error'
      );
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmId(null);
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
          <h1>{isNew ? t('quizEditor_createNew') : t('quizEditor_edit')}</h1>
        </div>
        {!isNew && <StatusBadge status={status} />}
      </div>

      {loading && <div className="spinner" />}

      {error && <p className="text-danger">{error}</p>}

      {!loading && !error && (
        <>
          {/* --- Quiz metadata --- */}
          <div className="card">
            <h2>{t('quizEditor_quizSettings')}</h2>
            <div className="form-group">
              <label>{t('quizEditor_title')}</label>
              <input
                className="form-control"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('quizEditor_titlePlaceholder')}
                disabled={isLive}
              />
            </div>
            <div className="form-group">
              <label>{t('quizEditor_description')}</label>
              <textarea
                className="form-control"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('quizEditor_descriptionPlaceholder')}
                rows={2}
                disabled={isLive}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>{t('quizEditor_startTime')}</label>
                <input
                  className="form-control"
                  type="datetime-local"
                  value={startAt}
                  onChange={(e) => setStartAt(e.target.value)}
                  disabled={isLive}
                />
              </div>
              <div className="form-group">
                <label>{t('quizEditor_endTime')}</label>
                <input
                  className="form-control"
                  type="datetime-local"
                  value={endAt}
                  onChange={(e) => setEndAt(e.target.value)}
                  disabled={isLive}
                />
              </div>
              <div className="form-group">
                <label>{t('quizEditor_duration')}</label>
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
              <label>{t('quizEditor_negativeMarking')}</label>
            </div>

            <div className="form-group">
              <label>{t('quizEditor_targetClasses')}</label>
              {classes.length === 0 && (
                <p className="text-muted">{t('quizEditor_loadingClasses')}</p>
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

            {(!isLive || isNew) && (
              <button
                className="btn btn-primary"
                onClick={handleSaveQuiz}
                disabled={saving}
              >
                {saving
                  ? t('quizEditor_saving')
                  : isNew
                  ? t('quizEditor_createButton')
                  : t('quizEditor_saveButton')}
              </button>
            )}

            {!isNew && isLive && (
              <button
                className="btn btn-outline"
                onClick={() => {
              if (quiz) setNewEndAt(toAmmanDateTimeLocal(quiz.endAt));
              setExtendOpen(true);
            }}
                style={{ marginInlineStart: '0.5rem' }}
              >
                {t('quizEditor_extendDeadline')}
              </button>
            )}

            {!isNew && (isLive || status === 'Closed') && (
              <span
                className="text-warning"
                style={{ marginInlineStart: '0.5rem' }}
              >
                {t('quizEditor_publishedLocked')}
              </span>
            )}

            {canPublish && (
              <button
                className="btn btn-outline"
                onClick={handlePublish}
                style={{ marginInlineStart: '0.5rem' }}
              >
                {t('quizEditor_publish')}
              </button>
            )}
          </div>

          {/* --- Extend deadline dialog --- */}
          {extendOpen && quiz && (
            <div className="overlay">
              <div className="dialog">
                <h3>{t('quizEditor_extendDeadline')}</h3>
                <p className="text-muted">
                  {t('quizEditor_currentDeadline')} {formatDateTime(quiz.endAt, locale)}
                </p>
                <p className="text-muted" style={{ fontSize: '0.8rem' }}>
                  {t('quizEditor_extendHint')}
                </p>
                <div className="form-group">
                  <label>{t('quizEditor_newDeadline')}</label>
                  <input
                    className="form-control"
                    type="datetime-local"
                    value={newEndAt}
                    step="60"
                    onChange={(e) => setNewEndAt(e.target.value)}
                  />
                  <p className="text-muted" style={{ fontSize: '0.78rem' }}>
                    {t('quizEditor_timeHint')}
                  </p>
                </div>
                <div className="dialog-footer">
                  <button
                    className="btn btn-outline"
                    onClick={() => setExtendOpen(false)}
                  >
                    {t('quizEditor_cancel')}
                  </button>
                  <button className="btn btn-primary" onClick={handleExtendDeadline}>
                    {t('quizEditor_extendAction')}
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
                <h2>{t('quizEditor_questionsCount', { count: questions.length })}</h2>
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
                      ? t('quizEditor_cancel')
                      : t('quizEditor_addQuestion')}
                  </button>
                )}
              </div>

              {questions.length === 0 && (
                <p className="text-muted">
                  {isLive
                    ? t('quizEditor_noQuestions')
                    : t('quizEditor_addQuestionsHint')}
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
                           <div className="quiz-card-meta meta-separated">
                             <span>{t('quizEditor_pointsShort', { count: q.points })}</span>
                             <span>{t('quizEditor_choicesShort', { count: q.choices.length })}</span>
                             <span>
                               {t('quizEditor_correctLabel')} {q.choices.find((c) => c.isCorrect)?.text}
                             </span>
                           </div>
                        </div>
                        {!isLive && editQuestionId !== q.id && (
                          <>
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => setEditQuestionId(q.id)}
                              title={t('quizEditor_editQuestion')}
                            >
                              {t('quizEditor_editQuestion')}
                            </button>
                            <button
                              className="btn btn-ghost btn-sm btn-delete"
                              onClick={() => handleDeleteQuestion(q.id)}
                              title={t('quizEditor_deleteQuestion')}
                            >
                              <span aria-label={t('quizEditor_deleteQuestion')}>×</span>
                            </button>
                          </>
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

      {deleteConfirmId !== null && (
        <div className="overlay">
          <div className="dialog" style={{ maxWidth: '420px' }}>
            <h3>{t('quizEditor_deleteQuestion')}</h3>
            <p style={{ marginBottom: '1rem' }}>
              {t('quizEditor_confirmDeleteQuestion')}
            </p>
            <div className="dialog-footer">
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={handleCancelDelete}
              >
                {t('quizEditor_cancel')}
              </button>
              <button
                type="button"
                className="btn btn-sm btn-delete-confirm"
                onClick={handleConfirmDelete}
              >
                {t('quizEditor_deleteConfirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
