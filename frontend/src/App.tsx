import { Navigate, Route, Routes } from "react-router-dom";

// Mengimpor halaman
import VerifyCertificate from "./pages/VerifyCertificate";
import Login from "./pages/Login";

// Mengimpor hook autentikasi
import { useAuth } from "./hooks/useAuth";

// Komponen utama aplikasi EduMind AI
function App() {
  const { isLoading, user } = useAuth();

  // Menunggu pemeriksaan sesi pengguna
  if (isLoading) {
    return <div>Loading EduMind AI...</div>;
  }

  return (
    <Routes>
      {/* Halaman verifikasi sertifikat publik */}
      <Route
        path="/verify-certificate/:certificateNumber"
        element={<VerifyCertificate />}
      />

      {/* Halaman login */}
      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" replace /> : <Login />}
      />

      {/* Dashboard sementara */}
      <Route
        path="/dashboard"
        element={
          user ? (
            <div>
              <h1>Welcome to EduMind AI</h1>
              <p>Halo, {user.name}!</p>
            </div>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Halaman utama */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Halaman tidak ditemukan */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
