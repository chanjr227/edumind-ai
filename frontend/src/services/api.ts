import axios from "axios";

// Menentukan alamat backend EduMind AI
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Membuat instance Axios untuk seluruh request API
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Menambahkan JWT Token secara otomatis ke setiap request
api.interceptors.request.use(
  (config) => {
    // Mengambil token dari localStorage
    const token = localStorage.getItem("token");

    // Memasukkan token ke Authorization Header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    // Meneruskan error jika request gagal disiapkan
    return Promise.reject(error);
  },
);

// Menangani respons dari backend
api.interceptors.response.use(
  (response) => {
    // Mengembalikan respons jika request berhasil
    return response;
  },
  (error) => {
    // Memeriksa apakah token sudah tidak valid
    if (error.response?.status === 401) {
      // Menghapus token yang sudah tidak valid
      localStorage.removeItem("token");

      // Menghapus data pengguna yang tersimpan
      localStorage.removeItem("user");
    }

    return Promise.reject(error);
  },
);

// Mengekspor Axios agar dapat digunakan seluruh halaman
export default api;
