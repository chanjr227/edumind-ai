const express = require("express");
const router = express.Router();

// Mengambil seluruh fungsi controller review
const {
  createReview,
  getCourseReviews,
  updateReview,
  deleteReview,
} = require("../controllers/reviewController");

// Mengambil middleware autentikasi dan role
const { protect, authorizeRoles } = require("../middlewares/authMiddleware");

// Melihat review kursus dapat diakses pengguna tanpa login
router.get("/course/:courseId", getCourseReviews);

// Semua endpoint berikutnya membutuhkan autentikasi siswa
router.use(protect, authorizeRoles("STUDENT"));

// Membuat review untuk kursus
router.post("/course/:courseId", createReview);

// Memperbarui review milik siswa
router.put("/:reviewId", updateReview);

// Menghapus review milik siswa
router.delete("/:reviewId", deleteReview);

module.exports = router;
