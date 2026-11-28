const express = require("express");
const router = express.Router();

// Mengambil controller untuk mengunduh sertifikat PDF
const {
  downloadCertificate,
} = require("../controllers/certificatePdfController");

// Mengambil fungsi controller sertifikat
const {
  getMyCertificates,
  verifyCertificate,
} = require("../controllers/certificateController");

// Mengambil middleware autentikasi dan pembatasan role
const { protect, authorizeRoles } = require("../middlewares/authMiddleware");

// ============================================
// VERIFIKASI SERTIFIKAT (PUBLIC)
// Tidak membutuhkan login
// ============================================
router.get("/verify/:certificateNumber", verifyCertificate);

// ============================================
// MELIHAT SERTIFIKAT MILIK SISWA
// Hanya dapat diakses siswa yang sudah login
// ============================================
router.get(
  "/my-certificates",
  protect,
  authorizeRoles("STUDENT"),
  getMyCertificates,
);

// ============================================
// DOWNLOAD SERTIFIKAT DALAM FORMAT PDF
// Hanya dapat diakses pemilik sertifikat
// ============================================
router.get(
  "/:certificateNumber/download",
  protect,
  authorizeRoles("STUDENT"),
  downloadCertificate,
);

// Mengekspor router agar dapat digunakan server.js
module.exports = router;
