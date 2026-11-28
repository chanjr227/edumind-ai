import { useContext } from "react";
import { AuthContext } from "../contexts/auth-context";

// Hook untuk mengakses autentikasi
export function useAuth() {
  const context = useContext(AuthContext);

  // Memastikan hook digunakan di dalam AuthProvider
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
