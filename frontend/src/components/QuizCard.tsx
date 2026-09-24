import { ReactNode } from 'react';
import type { QuizSummaryDto } from '../api/types';
import { StatusBadge, formatDateRange } from './StatusBadge';
import { useTranslation } from '../i18n/useTranslation';
import { localeForLanguage } from '../utils/datetime';

interface QuizCardProps {
  quiz: QuizSummaryDto;
  children?: ReactNode;
}

export function QuizCard({ quiz, children }: QuizCardProps) {
  const { t, language } = useTranslation();
  const locale = localeForLanguage(language);
  const targetCount = quiz.targetClassIds.length;

  return (
    <div className="quiz-card">
      <div className="quiz-card-header">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="quiz-card-title text-ellipsis">{quiz.title}</div>
          <div className="quiz-card-meta">
            <span>{formatDateRange(quiz.startAt, quiz.endAt, locale)}</span>
            <span>
              {t('quizCard_questions', { count: quiz.questionCount })}
            </span>
            <span>{t('quizCard_minutes', { duration: quiz.durationMinutes })}</span>
            {targetCount > 0 && (
              <span>{t('quizCard_class', { count: targetCount })}</span>
            )}
            {quiz.negativeMarkingEnabled && <span>{t('quizCard_negativeMarking')}</span>}
          </div>
        </div>
        <StatusBadge status={quiz.status} />
      </div>

      {quiz.description && (
        <div className="text-muted" style={{ fontSize: '0.82rem' }}>
          {quiz.description}
        </div>
      )}

      {children && <div className="quiz-card-actions">{children}</div>}
    </div>
  );
}
