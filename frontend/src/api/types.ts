export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: UserDto;
}

export interface UserDto {
  id: number;
  name: string;
  email: string;
  role: string;
  classId: number | null;
  className: string | null;
}

export interface ClassDto {
  id: number;
  name: string;
}

export interface CreateQuizRequest {
  title: string;
  description: string | null;
  startAt: string;
  endAt: string;
  durationMinutes: number;
  negativeMarkingEnabled: boolean;
  targetClassIds: number[];
}

export interface UpdateQuizRequest {
  title: string;
  description: string | null;
  startAt: string;
  endAt: string;
  durationMinutes: number;
  negativeMarkingEnabled: boolean;
  targetClassIds: number[];
}

export interface ExtendQuizDeadlineRequest {
  newEndAt: string;
}

export interface QuizDto {
  id: number;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string;
  durationMinutes: number;
  negativeMarkingEnabled: boolean;
  isPublished: boolean;
  createdByTeacherId: number;
  teacherName: string;
  createdAt: string;
  targetClassIds: number[];
  questions: QuestionDto[];
  status: string;
}

export interface QuizSummaryDto {
  id: number;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string;
  durationMinutes: number;
  negativeMarkingEnabled: boolean;
  isPublished: boolean;
  targetClassIds: number[];
  questionCount: number;
  status: string;
}

export interface QuestionDto {
  id: number;
  text: string;
  points: number;
  order: number;
  choices: ChoiceDto[];
}

export interface ChoiceDto {
  id: number;
  text: string;
  order: number;
}

export interface ChoiceWithCorrectDto {
  id: number;
  text: string;
  order: number;
  isCorrect: boolean;
}

export interface QuestionForTeacherDto {
  id: number;
  text: string;
  points: number;
  order: number;
  choices: ChoiceWithCorrectDto[];
}

export interface CreateQuestionRequest {
  text: string;
  points: number;
  order: number;
  choices: CreateChoiceRequest[];
}

export interface CreateChoiceRequest {
  text: string;
  isCorrect: boolean;
  order: number;
}

export interface UpdateQuestionRequest {
  text: string;
  points: number;
  order: number;
  choices: UpdateChoiceRequest[];
}

export interface UpdateChoiceRequest {
  id: number | null;
  text: string;
  isCorrect: boolean;
  order: number;
}

export interface StartQuizResponse {
  submissionId: number;
  startedAt: string;
  effectiveDeadline: string;
  quiz: QuizForTakingDto;
}

export interface QuizForTakingDto {
  id: number;
  title: string;
  description: string | null;
  durationMinutes: number;
  negativeMarkingEnabled: boolean;
  questions: QuestionForTakingDto[];
}

export interface QuestionForTakingDto {
  id: number;
  text: string;
  points: number;
  order: number;
  choices: ChoiceForTakingDto[];
}

export interface ChoiceForTakingDto {
  id: number;
  text: string;
  order: number;
}

export interface SubmitAnswerRequest {
  questionId: number;
  selectedChoiceId: number | null;
}

export interface SubmitQuizRequest {
  answers: SubmitAnswerRequest[];
}

export interface QuizResultDto {
  submissionId: number;
  quizId: number;
  quizTitle: string;
  score: number;
  maxPossibleScore: number;
  startedAt: string;
  submittedAt: string;
  status: string;
  answers: AnswerResultDto[];
}

export interface AnswerResultDto {
  questionId: number;
  questionText: string;
  questionPoints: number;
  selectedChoiceId: number | null;
  selectedChoiceText: string | null;
  correctChoiceId: number;
  correctChoiceText: string;
  awardedPoints: number;
  isCorrect: boolean;
}

export interface TeacherQuizResultDto {
  submissionId: number;
  studentId: number;
  studentName: string;
  studentEmail: string;
  className: string | null;
  score: number;
  maxPossibleScore: number;
  startedAt: string;
  submittedAt: string | null;
  status: string;
}

export interface ErrorResponse {
  message: string;
  details?: string | null;
}

export interface QuestionEditorValue {
  text: string;
  points: number;
  choices: { text: string; isCorrect: boolean }[];
}
