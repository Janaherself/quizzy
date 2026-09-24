import { ReactNode } from 'react';
import type { QuizSummaryDto } from '../api/types';
import { StatusBadge, formatDateRange } from './StatusBadge';

interface QuizCardProps {
  quiz: QuizSummaryDto;
  children?: ReactNode;
}

export function QuizCard({ quiz, children }: QuizCardProps) {
  const targetCount = quiz.targetClassIds.length;

  return (
    <div className="quiz-card rtl-fix">
      <div className="quiz-card-header">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="quiz-card-title text-ellipsis">{quiz.title}</div>
          <div className="quiz-card-meta">
            <span>{formatDateRange(quiz.startAt, quiz.endAt)}</span>
            <span>{quiz.questionCount} سؤال</span>
            <span>{quiz.durationMinutes} دقيقة</span>
            {targetCount > 0 && <span>{targetCount} فصل</span>}
            {quiz.negativeMarkingEnabled && <span>تصحيح سلبي</span>}
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
