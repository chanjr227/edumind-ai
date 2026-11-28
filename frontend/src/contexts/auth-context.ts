import { createContext } from "react";

// Daftar role pengguna EduMind AI
export type UserRole = "SUPER_ADMIN" | "ADMIN" | "TEACHER" | "STUDENT";

// Struktur data pengguna
export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
}

// Struktur data context autentikasi
export interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

// Membuat context autentikasi
export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);
