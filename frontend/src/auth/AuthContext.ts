import { createContext } from 'react';
import type { UserDto } from '../api/types';

export interface AuthContextValue {
  user: UserDto | null;
  loading: boolean;
  initialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
