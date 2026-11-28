const express = require("express");
const router = express.Router();

const {
  createSection,
  getCourseSections,
  updateSection,
  deleteSection,
} = require("../controllers/sectionController");

const { protect, authorizeRoles } = require("../middlewares/authMiddleware");

const courseManagers = ["SUPER_ADMIN", "ADMIN", "TEACHER"];

// CREATE SECTION
router.post(
  "/course/:courseId",
  protect,
  authorizeRoles(...courseManagers),
  createSection,
);

// GET SECTIONS BY COURSE
router.get(
  "/course/:courseId",
  protect,
  authorizeRoles(...courseManagers),
  getCourseSections,
);

// UPDATE SECTION
router.put("/:id", protect, authorizeRoles(...courseManagers), updateSection);

// DELETE SECTION
router.delete(
  "/:id",
  protect,
  authorizeRoles(...courseManagers),
  deleteSection,
);

module.exports = router;
