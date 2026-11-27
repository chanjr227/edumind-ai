const express = require("express");
const router = express.Router();

const {
  enrollCourse,
  getMyEnrollments,
} = require("../controllers/enrollmentController");

const { protect, authorizeRoles } = require("../middlewares/authMiddleware");

// GET MY ENROLLMENTS
router.get(
  "/my-enrollments",
  protect,
  authorizeRoles("STUDENT"),
  getMyEnrollments,
);

// STUDENT ENROLL TO COURSE
router.post("/:courseId", protect, authorizeRoles("STUDENT"), enrollCourse);

module.exports = router;
