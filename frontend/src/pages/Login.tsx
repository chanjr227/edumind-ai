import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import BookAnimation from "../components/BookAnimation";

import { useAuth } from "../hooks/useAuth";
import "../styles/Login.css";

function Login() {
  // Mengambil fungsi login dari AuthContext
  const { login } = useAuth();

  // Mengelola input form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Mengelola tampilan password
  const [showPassword, setShowPassword] = useState(false);

  // Mengelola status loading dan error
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Navigasi halaman
  const navigate = useNavigate();

  // Menangani proses login
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    // Validasi input
    if (!email.trim() || !password.trim()) {
      setError("Email dan password wajib diisi.");
      return;
    }

    try {
      setIsLoading(true);

      // Mengirim data login ke backend
      await login(email, password);

      // Mengarahkan pengguna setelah login berhasil
      navigate("/dashboard");
    } catch {
      // Menampilkan pesan jika login gagal
      setError("Email atau password salah. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Bagian kiri: branding */}
      <section className="login-brand">
        <div className="brand-content">
          <div className="brand-logo">
            <span className="logo-icon">E</span>
            <span>EduMind AI</span>
          </div>

          {/* Animasi buku 3D EduMind AI */}
          <BookAnimation />

          <div className="brand-message">
            <span className="brand-label">SMART LEARNING PLATFORM</span>

            <h1>
              Learn Smarter.
              <br />
              Grow Further.
            </h1>

            <p>
              Empower your learning journey with intelligent education,
              personalized experiences, and AI-powered insights.
            </p>
          </div>

          <div className="brand-footer">
            © 2026 EduMind AI. All rights reserved.
          </div>
        </div>
      </section>

      {/* Bagian kanan: form login */}
      <section className="login-form-section">
        <div className="login-container">
          <div className="login-heading">
            <span className="welcome-label">WELCOME BACK</span>
            <h2>Sign in to your account</h2>
            <p>Enter your credentials to access your learning space.</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {/* Input email */}
            <div className="form-group">
              <label htmlFor="email">Email address</label>

              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </div>

            {/* Input password */}
            <div className="form-group">
              <div className="password-label">
                <label htmlFor="password">Password</label>
              </div>

              <div className="password-input-wrapper">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Pesan error */}
            {error && <div className="login-error">{error}</div>}

            {/* Tombol login */}
            <button type="submit" className="login-button" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="login-register">
            Don't have an account? <Link to="/register">Create account</Link>
          </div>

          <div className="login-security">
            <span>🔒</span>
            Your learning journey is protected and secure.
          </div>
        </div>
      </section>
    </div>
  );
}

export default Login;
