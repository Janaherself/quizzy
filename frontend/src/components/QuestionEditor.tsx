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

  const canSave =
    text.trim().length > 0 &&
    parseInt(points, 10) > 0 &&
    choices.length >= 2 &&
    choices.length <= 6 &&
    choices.every((c) => c.text.trim().length > 0) &&
    choices.filter((c) => c.isCorrect).length === 1;

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
          className="form-control"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          placeholder={t('qe_questionPlaceholder')}
          disabled={isLocked}
        />
      </div>
      <div className="form-row" style={{ marginBottom: '0.75rem' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>{t('qe_points')}</label>
          <input
            className="form-control"
            type="number"
            min={1}
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            disabled={isLocked}
          />
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
            <input
              type="radio"
              name={`correct-${question?.id ?? 'new'}`}
              checked={choice.isCorrect}
              onChange={() => handleCorrect(idx)}
              disabled={isLocked}
            />
            <input
              className="form-control"
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
