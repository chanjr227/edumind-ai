const prisma = require("../config/prisma");

// STUDENT ENROLL TO COURSE
const enrollCourse = async (req, res) => {
  try {
    const studentId = Number(req.user.id);
    const courseId = Number(req.params.courseId);

    if (!Number.isInteger(courseId) || courseId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }

    // Pastikan user adalah STUDENT
    if (req.user.role !== "STUDENT") {
      return res.status(403).json({
        success: false,
        message: "Only students can enroll in courses",
      });
    }

    // Periksa apakah course tersedia
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Hanya course PUBLISHED yang bisa diikuti
    if (course.status !== "PUBLISHED") {
      return res.status(400).json({
        success: false,
        message: "This course is not available for enrollment",
      });
    }

    // Periksa pendaftaran sebelumnya
    const existingEnrollment = await prisma.courseEnrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId,
        },
      },
    });

    if (existingEnrollment) {
      return res.status(409).json({
        success: false,
        message: "You are already enrolled in this course",
      });
    }

    // Buat enrollment
    const enrollment = await prisma.courseEnrollment.create({
      data: {
        studentId,
        courseId,
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            level: true,
            thumbnail: true,
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: "Course enrollment successful",
      data: {
        enrollment,
      },
    });
  } catch (error) {
    console.error("Enroll course error:", error);

    // Menangani pendaftaran ganda jika terjadi request bersamaan
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "You are already enrolled in this course",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to enroll in course",
    });
  }
};

// GET MY ENROLLMENTS
const getMyEnrollments = async (req, res) => {
  try {
    const studentId = Number(req.user.id);

    const { page = 1, limit = 10 } = req.query;

    const currentPage = Number(page);
    const pageSize = Number(limit);

    // Validasi pagination
    if (
      !Number.isInteger(currentPage) ||
      currentPage < 1 ||
      !Number.isInteger(pageSize) ||
      pageSize < 1 ||
      pageSize > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid pagination parameters",
      });
    }

    // Hitung total enrollment
    const total = await prisma.courseEnrollment.count({
      where: {
        studentId,
      },
    });

    // Ambil daftar enrollment
    const enrollments = await prisma.courseEnrollment.findMany({
      where: {
        studentId,
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            thumbnail: true,
            level: true,
            status: true,
            publishedAt: true,
          },
        },
      },
      orderBy: {
        enrolledAt: "desc",
      },
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
    });

    return res.status(200).json({
      success: true,
      message: "My enrollments retrieved successfully",
      data: {
        total,
        page: currentPage,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
        enrollments,
      },
    });
  } catch (error) {
    console.error("Get my enrollments error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve my enrollments",
    });
  }
};

module.exports = {
  enrollCourse,
  getMyEnrollments,
};
