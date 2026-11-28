const express = require("express");
const router = express.Router();

// Mengimpor controller untuk fitur pembelajaran
const {
  getCourseCurriculum,
  getLessonContent,
  completeLesson,
  getStudentDashboard,
} = require("../controllers/learningController");

// Mengimpor middleware autentikasi dan pembatasan role
const { protect, authorizeRoles } = require("../middlewares/authMiddleware");

// Semua endpoint di bawah hanya bisa diakses siswa
router.use(protect, authorizeRoles("STUDENT"));

// Melihat curriculum kursus beserta section dan lesson
router.get("/courses/:courseId", getCourseCurriculum);

// Menandai lesson sebagai selesai
router.patch("/lessons/:lessonId/complete", completeLesson);

// GET dashboard khusus siswa
router.get("/dashboard", getStudentDashboard);

// Membuka materi lesson
router.get("/lessons/:lessonId", getLessonContent);

module.exports = router;
