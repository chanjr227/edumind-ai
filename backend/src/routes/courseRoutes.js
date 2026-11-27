const express = require("express");
const router = express.Router();

const {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  publishCourse,
  archiveCourse,
  restoreCourse,
} = require("../controllers/courseController");

const { protect, authorizeRoles } = require("../middlewares/authMiddleware");

// GET All Courses
router.get(
  "/",
  protect,
  authorizeRoles("SUPER_ADMIN", "ADMIN", "TEACHER"),
  getAllCourses,
);

// GET Course by ID
router.get(
  "/:id",
  protect,
  authorizeRoles("SUPER_ADMIN", "ADMIN", "TEACHER"),
  getCourseById,
);

// CREATE Course
router.post(
  "/",
  protect,
  authorizeRoles("SUPER_ADMIN", "ADMIN", "TEACHER"),
  createCourse,
);

// UPDATE Course
router.put(
  "/:id",
  protect,
  authorizeRoles("SUPER_ADMIN", "ADMIN", "TEACHER"),
  updateCourse,
);

// DELETE Course
router.delete(
  "/:id",
  protect,
  authorizeRoles("SUPER_ADMIN", "ADMIN", "TEACHER"),
  deleteCourse,
);

// PUBLISH Course
router.patch(
  "/:id/publish",
  protect,
  authorizeRoles("SUPER_ADMIN", "ADMIN", "TEACHER"),
  publishCourse,
);

// ARCHIVE Course
router.patch(
  "/:id/archive",
  protect,
  authorizeRoles("SUPER_ADMIN", "ADMIN", "TEACHER"),
  archiveCourse,
);

// RESTORE Course
router.patch(
  "/:id/restore",
  protect,
  authorizeRoles("SUPER_ADMIN", "ADMIN", "TEACHER"),
  restoreCourse,
);

module.exports = router;
