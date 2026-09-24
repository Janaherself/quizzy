import api from './client';
import type {
  QuizSummaryDto,
  QuizForTakingDto,
  StartQuizResponse,
  SubmitAnswerRequest,
  SubmitQuizRequest,
  QuizResultDto,
} from './types';

export const studentQuizzesApi = {
  getAvailableQuizzes: () =>
    api.get<QuizSummaryDto[]>('/student/quizzes').then((r) => r.data),
  getQuizForTaking: (id: number) =>
    api.get<QuizForTakingDto>(`/student/quizzes/${id}`).then((r) => r.data),
  startQuiz: (id: number) =>
    api.post<StartQuizResponse>(`/student/quizzes/${id}/start`).then((r) => r.data),
  getSubmission: (submissionId: number) =>
    api.get(`/student/quizzes/submissions/${submissionId}`).then((r) => r.data),
  saveAnswer: (submissionId: number, data: SubmitAnswerRequest) =>
    api
      .post(`/student/quizzes/submissions/${submissionId}/answers`, data)
      .then((r) => r.data),
  submitQuiz: (submissionId: number, data: SubmitQuizRequest) =>
    api
      .post<QuizResultDto>(
        `/student/quizzes/submissions/${submissionId}/submit`,
        data
      )
      .then((r) => r.data),
  getQuizResult: (quizId: number) =>
    api.get<QuizResultDto>(`/student/quizzes/${quizId}/result`).then((r) => r.data),

  getTeacherQuizResults: (quizId: number) =>
    api.get(`/teacher/quizzes/${quizId}/results`).then((r) => r.data),
};
