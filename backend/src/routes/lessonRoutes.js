const express = require("express");
const router = express.Router();

const {
  createLesson,
  getSectionLessons,
  updateLesson,
  deleteLesson,
} = require("../controllers/lessonController");

const { protect, authorizeRoles } = require("../middlewares/authMiddleware");

const courseManagers = ["SUPER_ADMIN", "ADMIN", "TEACHER"];

// CREATE LESSON
router.post(
  "/section/:sectionId",
  protect,
  authorizeRoles(...courseManagers),
  createLesson,
);

// GET LESSONS BY SECTION
router.get(
  "/section/:sectionId",
  protect,
  authorizeRoles(...courseManagers),
  getSectionLessons,
);

// UPDATE LESSON
router.put("/:id", protect, authorizeRoles(...courseManagers), updateLesson);

// DELETE LESSON
router.delete("/:id", protect, authorizeRoles(...courseManagers), deleteLesson);

module.exports = router;
