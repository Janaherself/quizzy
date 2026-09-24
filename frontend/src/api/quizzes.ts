import api from './client';
import type {
  QuizSummaryDto,
  QuizDto,
  CreateQuizRequest,
  UpdateQuizRequest,
  ExtendQuizDeadlineRequest,
  QuestionForTeacherDto,
  CreateQuestionRequest,
  UpdateQuestionRequest,
  ClassDto,
} from './types';

export interface UpdateQuizParams {
  id: number;
  data: UpdateQuizRequest;
}

export const quizzesApi = {
  getTeacherQuizzes: () =>
    api.get<QuizSummaryDto[]>('/teacher/quizzes').then((r) => r.data),
  getQuiz: (id: number) =>
    api.get<QuizDto>(`/teacher/quizzes/${id}`).then((r) => r.data),
  createQuiz: (data: CreateQuizRequest) =>
    api.post<QuizDto>('/teacher/quizzes', data).then((r) => r.data),
  updateQuiz: (id: number, data: UpdateQuizRequest) =>
    api.put<QuizDto>(`/teacher/quizzes/${id}`, data).then((r) => r.data),
  extendDeadline: (id: number, data: ExtendQuizDeadlineRequest) =>
    api
      .patch<QuizDto>(`/teacher/quizzes/${id}/extend-deadline`, data)
      .then((r) => r.data),
  publishQuiz: (id: number) =>
    api.post<QuizDto>(`/teacher/quizzes/${id}/publish`).then((r) => r.data),
  deleteQuiz: (id: number) =>
    api.delete(`/teacher/quizzes/${id}`).then((r) => r.status === 204),
  getClasses: () => api.get<ClassDto[]>('/classes').then((r) => r.data),

  getQuestions: (quizId: number) =>
    api
      .get<QuestionForTeacherDto[]>(`/teacher/quizzes/${quizId}/questions`)
      .then((r) => r.data),
  getQuestion: (quizId: number, questionId: number) =>
    api
      .get<QuestionForTeacherDto>(
        `/teacher/quizzes/${quizId}/questions/${questionId}`
      )
      .then((r) => r.data),
  createQuestion: (quizId: number, data: CreateQuestionRequest) =>
    api
      .post<QuestionForTeacherDto>(
        `/teacher/quizzes/${quizId}/questions`,
        data
      )
      .then((r) => r.data),
  updateQuestion: (
    quizId: number,
    questionId: number,
    data: UpdateQuestionRequest
  ) =>
    api
      .put<QuestionForTeacherDto>(
        `/teacher/quizzes/${quizId}/questions/${questionId}`,
        data
      )
      .then((r) => r.data),
  deleteQuestion: (quizId: number, questionId: number) =>
    api
      .delete(`/teacher/quizzes/${quizId}/questions/${questionId}`)
      .then((r) => r.status === 204),
};
