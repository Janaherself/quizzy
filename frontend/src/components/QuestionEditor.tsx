import { useState } from 'react';
import type { QuestionForTeacherDto, QuestionEditorValue } from '../api/types';
import { useTranslation } from '../i18n/useTranslation';

interface ChoiceEditor {
  text: string;
  isCorrect: boolean;
}

interface QuestionEditorProps {
  question?: QuestionForTeacherDto;
  isLocked?: boolean;
  onSave: (value: QuestionEditorValue) => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function QuestionEditor({
  question,
  isLocked = false,
  onSave,
  onCancel,
  isLoading = false,
}: QuestionEditorProps) {
  const { t } = useTranslation();
  const [text, setText] = useState(question?.text ?? '');
  const [points, setPoints] = useState(question?.points?.toString() ?? '5');
  const [choices, setChoices] = useState<ChoiceEditor[]>(() => {
    if (question?.choices?.length) {
      return question.choices
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((c) => ({ text: c.text, isCorrect: c.isCorrect }));
    }
    return [
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
    ];
  });

  const handleChoiceText = (idx: number, value: string) => {
    setChoices((prev) => prev.map((c, i) => (i === idx ? { ...c, text: value } : c)));
  };

  const handleCorrect = (idx: number) => {
    setChoices((prev) => prev.map((c, i) => ({ ...c, isCorrect: i === idx })));
  };

  const addChoice = () => {
    if (choices.length >= 6) return;
    setChoices((prev) => [...prev, { text: '', isCorrect: false }]);
  };

  const removeChoice = (idx: number) => {
    if (choices.length <= 2) return;
    setChoices((prev) => prev.filter((_, i) => i !== idx));
  };

  const hasTextError = !text.trim();
  const hasPointsError = parseInt(points, 10) <= 0 || isNaN(parseInt(points, 10));
  const hasMinChoicesError = choices.length < 2;
  const hasChoiceTextError = choices.some((c) => !c.text.trim());
  const correctCount = choices.filter((c) => c.isCorrect).length;
  const hasCorrectError = correctCount !== 1;

  const canSave =
    !hasTextError &&
    !hasPointsError &&
    !hasMinChoicesError &&
    !hasChoiceTextError &&
    !hasCorrectError;

  const handleSave = async () => {
    const value: QuestionEditorValue = {
      text: text.trim(),
      points: parseInt(points, 10),
      choices: choices.map((c) => ({
        text: c.text.trim(),
        isCorrect: c.isCorrect,
      })),
    };
    await onSave(value);
  };

  return (
    <div className="question-editor">
      <div className="form-group">
        <label>{t('qe_questionText')}</label>
        <textarea
          className={`form-control ${hasTextError ? 'input-error' : ''}`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          placeholder={t('qe_questionPlaceholder')}
          disabled={isLocked}
        />
        {hasTextError && (
          <span className="error-msg">{t('qe_validation_textRequired')}</span>
        )}
      </div>
      <div className="form-row" style={{ marginBottom: '0.75rem' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>{t('qe_points')}</label>
          <input
            className={`form-control ${hasPointsError ? 'input-error' : ''}`}
            type="number"
            min={1}
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            disabled={isLocked}
          />
          {hasPointsError && (
            <span className="error-msg">{t('qe_validation_pointsRequired')}</span>
          )}
        </div>
      </div>

      <div className="choices-list">
        <label
          style={{
            fontSize: '0.85rem',
            fontWeight: 600,
            color: 'var(--color-text-muted)',
          }}
        >
          {t('qe_choices', { count: choices.length })}
        </label>
        {choices.map((choice, idx) => (
          <div key={idx} className="choice-editor">
            <button
              type="button"
              className={
                choice.isCorrect
                  ? 'correct-btn correct-selected'
                  : 'correct-btn'
              }
              onClick={() => handleCorrect(idx)}
              disabled={isLocked}
              title={
                choice.isCorrect
                  ? t('qe_correctAnswer')
                  : t('qe_markCorrect')
              }
            >
              {choice.isCorrect && (
                <span className="correct-icon" aria-label={t('qe_correctAnswer')}>
                  ✓
                </span>
              )}
              {choice.isCorrect
                ? t('qe_correctAnswer')
                : t('qe_markCorrect')}
            </button>
            <input
              className={`form-control ${!choice.text.trim() ? 'input-error' : ''}`}
              type="text"
              placeholder={t('qe_choicePlaceholder', { index: idx + 1 })}
              value={choice.text}
              onChange={(e) => handleChoiceText(idx, e.target.value)}
              disabled={isLocked}
              style={{ flex: 1 }}
            />
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => removeChoice(idx)}
              disabled={isLocked || choices.length <= 2}
              title={t('qe_removeChoice')}
            >
              ×
            </button>
          </div>
        ))}
        {hasMinChoicesError && (
          <span className="error-msg">{t('qe_validation_minChoices')}</span>
        )}
        {hasChoiceTextError && (
          <span className="error-msg">{t('qe_validation_choiceTextRequired')}</span>
        )}
        {hasCorrectError && (
          <span className="error-msg">
            {correctCount === 0
              ? t('qe_validation_noCorrectAnswer')
              : t('qe_validation_multipleCorrect')}
          </span>
        )}
      </div>

      {!isLocked && (
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={addChoice}
          disabled={choices.length >= 6}
        >
          {t('qe_addChoice')}
        </button>
      )}

      <div className="dialog-footer" style={{ justifyContent: 'flex-end' }}>
        {onCancel && (
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={onCancel}
          >
            {t('qe_cancel')}
          </button>
        )}
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={!canSave || isLocked || isLoading}
          onClick={handleSave}
        >
          {isLoading ? t('qe_saving') : question ? t('qe_update') : t('qe_add')}
        </button>
      </div>
    </div>
  );
}
