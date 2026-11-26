const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
const morgan = require("morgan");
const prisma = require("./config/prisma");
const authRoutes = require("./routes/authRoutes");

dotenv.config();

const app = express();

// Security
app.use(helmet());

// CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
);

// Request parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Authentication Routes
app.use("/api/auth", authRoutes);

// Logger
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "EduMind AI Backend is running!",
    timestamp: new Date().toISOString(),
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to EduMind AI API",
    version: "1.0.0",
  });
});

// Database health check
app.get("/api/health/db", async (req, res) => {
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      success: true,
      message: "Database connected successfully!",
    });
  } catch (error) {
    console.error("Database connection error:", error);

    res.status(500).json({
      success: false,
      message: "Database connection failed!",
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);

  res.status(err.status || 500).json({
    success: false,
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal server error",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`EduMind AI API running on http://localhost:${PORT}`);
});
