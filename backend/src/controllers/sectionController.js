const prisma = require("../config/prisma");

// Helper: check course management permission
const canManageCourse = (user, course) => {
  if (["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
    return true;
  }

  return user.role === "TEACHER" && Number(user.id) === course.createdById;
};

// CREATE SECTION
const createSection = async (req, res) => {
  try {
    const courseId = Number(req.params.courseId);
    const { title, description, order } = req.body;

    if (!Number.isInteger(courseId) || courseId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }

    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Section title is required",
      });
    }

    if (title.trim().length > 200) {
      return res.status(400).json({
        success: false,
        message: "Section title cannot exceed 200 characters",
      });
    }

    if (
      description !== undefined &&
      description !== null &&
      typeof description !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid section description",
      });
    }

    if (order !== undefined && (!Number.isInteger(order) || order < 0)) {
      return res.status(400).json({
        success: false,
        message: "Invalid section order",
      });
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    if (!canManageCourse(req.user, course)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to manage this course",
      });
    }

    let sectionOrder = order;

    if (sectionOrder === undefined) {
      const lastSection = await prisma.courseSection.findFirst({
        where: { courseId },
        orderBy: { order: "desc" },
        select: { order: true },
      });

      sectionOrder = lastSection ? lastSection.order + 1 : 0;
    }

    const section = await prisma.courseSection.create({
      data: {
        courseId,
        title: title.trim(),
        description: description?.trim() || null,
        order: sectionOrder,
      },
      include: {
        lessons: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Course section created successfully",
      data: { section },
    });
  } catch (error) {
    console.error("Create section error:", error);

    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "Section order already exists in this course",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create course section",
    });
  }
};

// GET SECTIONS BY COURSE
const getCourseSections = async (req, res) => {
  try {
    const courseId = Number(req.params.courseId);

    if (!Number.isInteger(courseId) || courseId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    if (!canManageCourse(req.user, course)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view this curriculum",
      });
    }

    const sections = await prisma.courseSection.findMany({
      where: { courseId },
      include: {
        lessons: {
          orderBy: { order: "asc" },
        },
      },
      orderBy: { order: "asc" },
    });

    return res.status(200).json({
      success: true,
      message: "Course sections retrieved successfully",
      data: {
        total: sections.length,
        sections,
      },
    });
  } catch (error) {
    console.error("Get course sections error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve course sections",
    });
  }
};

// UPDATE SECTION
const updateSection = async (req, res) => {
  try {
    const sectionId = Number(req.params.id);
    const { title, description, order } = req.body;

    if (!Number.isInteger(sectionId) || sectionId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid section ID",
      });
    }

    const section = await prisma.courseSection.findUnique({
      where: { id: sectionId },
      include: { course: true },
    });

    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Course section not found",
      });
    }

    if (!canManageCourse(req.user, section.course)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to update this section",
      });
    }

    const data = {};

    if (title !== undefined) {
      if (
        typeof title !== "string" ||
        !title.trim() ||
        title.trim().length > 200
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid section title",
        });
      }

      data.title = title.trim();
    }

    if (description !== undefined) {
      if (description !== null && typeof description !== "string") {
        return res.status(400).json({
          success: false,
          message: "Invalid section description",
        });
      }

      data.description = description?.trim() || null;
    }

    if (order !== undefined) {
      if (!Number.isInteger(order) || order < 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid section order",
        });
      }

      data.order = order;
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }

    const updatedSection = await prisma.courseSection.update({
      where: { id: sectionId },
      data,
      include: { lessons: true },
    });

    return res.status(200).json({
      success: true,
      message: "Course section updated successfully",
      data: { section: updatedSection },
    });
  } catch (error) {
    console.error("Update section error:", error);

    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "Section order already exists in this course",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update course section",
    });
  }
};

// DELETE SECTION
const deleteSection = async (req, res) => {
  try {
    const sectionId = Number(req.params.id);

    if (!Number.isInteger(sectionId) || sectionId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid section ID",
      });
    }

    const section = await prisma.courseSection.findUnique({
      where: { id: sectionId },
      include: { course: true },
    });

    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Course section not found",
      });
    }

    if (!canManageCourse(req.user, section.course)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to delete this section",
      });
    }

    await prisma.courseSection.delete({
      where: { id: sectionId },
    });

    return res.status(200).json({
      success: true,
      message: "Course section deleted successfully",
    });
  } catch (error) {
    console.error("Delete section error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete course section",
    });
  }
};

module.exports = {
  createSection,
  getCourseSections,
  updateSection,
  deleteSection,
};
