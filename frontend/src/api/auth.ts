import api from './client';
import type {
  LoginRequest,
  LoginResponse,
  UserDto,
  ClassDto,
} from './types';

export const authApi = {
  login: (request: LoginRequest) =>
    api.post<LoginResponse>('/auth/login', request).then((r) => r.data),
  getCurrentUser: () => api.get<UserDto>('/auth/me').then((r) => r.data),
  getClasses: () => api.get<ClassDto[]>('/classes').then((r) => r.data),
};
