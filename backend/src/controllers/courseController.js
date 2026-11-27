const prisma = require("../config/prisma");

// CREATE COURSE
const createCourse = async (req, res) => {
  try {
    const { title, description, thumbnail, level } = req.body;

    // Validate required fields
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Title and description are required",
      });
    }

    // Validate data types
    if (typeof title !== "string" || typeof description !== "string") {
      return res.status(400).json({
        success: false,
        message: "Title and description must be strings",
      });
    }

    const normalizedTitle = title.trim();
    const normalizedDescription = description.trim();

    // Validate title
    if (normalizedTitle.length < 3 || normalizedTitle.length > 200) {
      return res.status(400).json({
        success: false,
        message: "Title must contain 3-200 characters",
      });
    }

    // Validate description
    if (!normalizedDescription) {
      return res.status(400).json({
        success: false,
        message: "Description cannot be empty",
      });
    }

    // Validate optional thumbnail
    if (
      thumbnail !== undefined &&
      thumbnail !== null &&
      (typeof thumbnail !== "string" || thumbnail.length > 500)
    ) {
      return res.status(400).json({
        success: false,
        message: "Thumbnail must be a string with maximum 500 characters",
      });
    }

    // Validate course level
    const allowedLevels = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];

    const courseLevel = level || "BEGINNER";

    if (!allowedLevels.includes(courseLevel)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course level",
      });
    }

    // Generate unique slug
    const slug = normalizedTitle
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const existingCourse = await prisma.course.findUnique({
      where: { slug },
    });

    if (existingCourse) {
      return res.status(409).json({
        success: false,
        message: "Course with this title already exists",
      });
    }

    // Create course
    const course = await prisma.course.create({
      data: {
        title: normalizedTitle,
        slug,
        description: normalizedDescription,
        thumbnail: thumbnail?.trim() || null,
        level: courseLevel,
        status: "DRAFT",
        createdById: req.user.id,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: "Course created successfully",
      data: {
        course,
      },
    });
  } catch (error) {
    console.error("Create course error:", error);

    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "Course slug already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create course",
    });
  }
};

// GET ALL COURSES

// GET ALL COURSES
const getAllCourses = async (req, res) => {
  try {
    const {
      search,
      status,
      level,
      createdById,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    // Validate pagination
    const currentPage = Number(page);
    const pageSize = Number(limit);

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

    // Validate filters
    const allowedStatuses = ["DRAFT", "PUBLISHED", "ARCHIVED"];
    const allowedLevels = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];

    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course status",
      });
    }

    if (level && !allowedLevels.includes(level)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course level",
      });
    }

    // Validate sorting
    const allowedSortFields = ["title", "createdAt", "updatedAt"];

    if (!allowedSortFields.includes(sortBy)) {
      return res.status(400).json({
        success: false,
        message: "Invalid sorting field",
      });
    }

    if (!["asc", "desc"].includes(order)) {
      return res.status(400).json({
        success: false,
        message: "Invalid sorting order",
      });
    }

    // Build filter
    const where = {};

    if (search) {
      where.OR = [
        {
          title: {
            contains: search.trim(),
          },
        },
        {
          description: {
            contains: search.trim(),
          },
        },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (level) {
      where.level = level;
    }

    if (createdById !== undefined) {
      const creatorId = Number(createdById);

      if (!Number.isInteger(creatorId) || creatorId <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid creator ID",
        });
      }

      where.createdById = creatorId;
    }

    // Get total matching courses
    const total = await prisma.course.count({
      where,
    });

    // Get courses
    const courses = await prisma.course.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        [sortBy]: order,
      },
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
    });

    return res.status(200).json({
      success: true,
      message: "Courses retrieved successfully",
      data: {
        total,
        page: currentPage,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
        courses,
      },
    });
  } catch (error) {
    console.error("Get all courses error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve courses",
    });
  }
};

// GET COURSE BY ID
const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validasi ID
    const courseId = Number(id);

    if (!Number.isInteger(courseId) || courseId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }

    // Cari course berdasarkan ID
    const course = await prisma.course.findUnique({
      where: {
        id: courseId,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Course retrieved successfully",
      data: {
        course,
      },
    });
  } catch (error) {
    console.error("Get course by ID error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve course",
    });
  }
};

// UPDATE COURSE
const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, thumbnail, level } = req.body;

    const courseId = Number(id);

    if (!Number.isInteger(courseId) || courseId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }

    const existingCourse = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!existingCourse) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Teacher hanya boleh mengubah course miliknya
    if (
      req.user.role === "TEACHER" &&
      existingCourse.createdById !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to update this course",
      });
    }

    const data = {};

    if (title !== undefined) {
      if (
        typeof title !== "string" ||
        title.trim().length < 3 ||
        title.trim().length > 200
      ) {
        return res.status(400).json({
          success: false,
          message: "Title must contain 3-200 characters",
        });
      }

      const normalizedTitle = title.trim();

      const slug = normalizedTitle
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      if (!slug) {
        return res.status(400).json({
          success: false,
          message: "Invalid course title",
        });
      }

      data.title = normalizedTitle;
      data.slug = slug;
    }

    if (description !== undefined) {
      if (typeof description !== "string" || !description.trim()) {
        return res.status(400).json({
          success: false,
          message: "Description cannot be empty",
        });
      }

      data.description = description.trim();
    }

    if (thumbnail !== undefined) {
      if (
        thumbnail !== null &&
        (typeof thumbnail !== "string" || thumbnail.length > 500)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid thumbnail",
        });
      }

      data.thumbnail = thumbnail?.trim() || null;
    }

    if (level !== undefined) {
      const allowedLevels = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];

      if (!allowedLevels.includes(level)) {
        return res.status(400).json({
          success: false,
          message: "Invalid course level",
        });
      }

      data.level = level;
    }

    const course = await prisma.course.update({
      where: { id: courseId },
      data,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: "Course updated successfully",
      data: { course },
    });
  } catch (error) {
    console.error("Update course error:", error);

    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "Course title already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update course",
    });
  }
};

// DELETE COURSE
const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const courseId = Number(id);

    // Validate ID
    if (!Number.isInteger(courseId) || courseId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }

    // Find course
    const existingCourse = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!existingCourse) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Teacher hanya boleh menghapus course miliknya
    if (
      req.user.role === "TEACHER" &&
      existingCourse.createdById !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to delete this course",
      });
    }

    // Delete course
    await prisma.course.delete({
      where: { id: courseId },
    });

    return res.status(200).json({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (error) {
    console.error("Delete course error:", error);

    if (error.code === "P2003") {
      return res.status(409).json({
        success: false,
        message: "Cannot delete course because it has related data",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to delete course",
    });
  }
};

// PUBLISH COURSE
const publishCourse = async (req, res) => {
  try {
    const courseId = Number(req.params.id);

    if (!Number.isInteger(courseId) || courseId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }

    const existingCourse = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!existingCourse) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    if (
      req.user.role === "TEACHER" &&
      existingCourse.createdById !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to publish this course",
      });
    }

    if (existingCourse.status === "PUBLISHED") {
      return res.status(400).json({
        success: false,
        message: "Course is already published",
      });
    }

    const course = await prisma.course.update({
      where: { id: courseId },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Course published successfully",
      data: { course },
    });
  } catch (error) {
    console.error("Publish course error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to publish course",
    });
  }
};

// ARCHIVE COURSE
const archiveCourse = async (req, res) => {
  try {
    const courseId = Number(req.params.id);

    // Validate course ID
    if (!Number.isInteger(courseId) || courseId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }

    // Find course
    const existingCourse = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!existingCourse) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Check teacher ownership
    if (
      req.user.role === "TEACHER" &&
      existingCourse.createdById !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to archive this course",
      });
    }

    // Only published courses can be archived
    if (existingCourse.status !== "PUBLISHED") {
      return res.status(400).json({
        success: false,
        message: "Only published courses can be archived",
      });
    }

    // Update course status
    const course = await prisma.course.update({
      where: { id: courseId },
      data: {
        status: "ARCHIVED",
      },
    });

    return res.status(200).json({
      success: true,
      message: "Course archived successfully",
      data: {
        course,
      },
    });
  } catch (error) {
    console.error("Archive course error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to archive course",
    });
  }
};

// RESTORE COURSE
const restoreCourse = async (req, res) => {
  try {
    const courseId = Number(req.params.id);

    // Validate course ID
    if (!Number.isInteger(courseId) || courseId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }

    // Find course
    const existingCourse = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!existingCourse) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Check teacher ownership
    if (
      req.user.role === "TEACHER" &&
      existingCourse.createdById !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to restore this course",
      });
    }

    // Only archived courses can be restored
    if (existingCourse.status !== "ARCHIVED") {
      return res.status(400).json({
        success: false,
        message: "Only archived courses can be restored",
      });
    }

    // Restore course
    const course = await prisma.course.update({
      where: { id: courseId },
      data: {
        status: "PUBLISHED",
      },
    });

    return res.status(200).json({
      success: true,
      message: "Course restored successfully",
      data: {
        course,
      },
    });
  } catch (error) {
    console.error("Restore course error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to restore course",
    });
  }
};

module.exports = {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  publishCourse,
  archiveCourse,
  restoreCourse,
};
