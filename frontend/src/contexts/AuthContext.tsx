import { useEffect, useState, type ReactNode } from "react";

import api from "../services/api";
import { AuthContext } from "./auth-context";
import type { User } from "./auth-context";

// Struktur properti provider
interface AuthProviderProps {
  children: ReactNode;
}

// Menyediakan autentikasi untuk seluruh aplikasi
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token"),
  );
  const [isLoading, setIsLoading] = useState(true);

  // Memeriksa sesi pengguna ketika aplikasi pertama kali dibuka
  useEffect(() => {
    const checkAuth = async () => {
      const savedToken = localStorage.getItem("token");

      // Jika token tidak tersedia, pengguna belum login
      if (!savedToken) {
        setIsLoading(false);
        return;
      }

      try {
        // Mengambil profil pengguna berdasarkan token
        const response = await api.get("/auth/me");

        // Mengambil informasi pengguna dari respons backend
        const userData = response.data.data.user;

        // Memperbarui state autentikasi
        setUser(userData);
        setToken(savedToken);

        // Menyimpan informasi pengguna
        localStorage.setItem("user", JSON.stringify(userData));
      } catch {
        // Menghapus sesi jika token tidak valid
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Fungsi untuk login pengguna
  const login = async (email: string, password: string) => {
    // Mengirim permintaan login ke backend
    const response = await api.post("/auth/login", {
      email,
      password,
    });

    // Mengambil token dan informasi pengguna
    const { token: accessToken, user: userData } = response.data.data;

    // Menyimpan sesi login
    localStorage.setItem("token", accessToken);
    localStorage.setItem("user", JSON.stringify(userData));

    // Memperbarui state autentikasi
    setToken(accessToken);
    setUser(userData);
  };

  // Fungsi untuk logout pengguna
  const logout = () => {
    // Menghapus data sesi dari localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // Mengosongkan state autentikasi
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
