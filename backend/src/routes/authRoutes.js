const express = require("express");
const router = express.Router();

const { register, login, getMe } = require("../controllers/authController");

const { protect, authorizeRoles } = require("../middlewares/authMiddleware");

// Register
router.post("/register", register);

// Login
router.post("/login", login);

// Get current user
router.get("/me", protect, getMe);

// Admin only
router.get(
  "/admin-only",
  protect,
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "Welcome Admin! You have access to this resource.",
      data: {
        user: req.user,
      },
    });
  },
);

module.exports = router;
