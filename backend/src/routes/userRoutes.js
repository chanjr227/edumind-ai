const express = require("express");
const router = express.Router();

const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserRole,
  updateUserStatus,
  deleteUser,
} = require("../controllers/userController");

const { protect, authorizeRoles } = require("../middlewares/authMiddleware");

// Semua route hanya bisa diakses SUPER_ADMIN
router.use(protect, authorizeRoles("SUPER_ADMIN"));

// Create user
router.post("/", createUser);

// Get all users
router.get("/", getAllUsers);

// Get user by ID
router.get("/:id", getUserById);

// Update user
router.put("/:id", updateUser);

// Update user role
router.patch("/:id/role", updateUserRole);

// Update user account status
router.patch("/:id/status", updateUserStatus);

// Delete user
router.delete("/:id", deleteUser);

module.exports = router;
