const prisma = require("../config/prisma");

// Check course management permission
const canManageCourse = (user, course) => {
  if (["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
    return true;
  }

  return user.role === "TEACHER" && Number(user.id) === course.createdById;
};

// CREATE LESSON
const createLesson = async (req, res) => {
  try {
    const sectionId = Number(req.params.sectionId);

    const { title, content, videoUrl, durationMinutes, order, isPreview } =
      req.body;

    if (!Number.isInteger(sectionId) || sectionId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid section ID",
      });
    }

    if (
      typeof title !== "string" ||
      !title.trim() ||
      title.trim().length > 200
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid lesson title is required",
      });
    }

    if (
      content !== undefined &&
      content !== null &&
      typeof content !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid lesson content",
      });
    }

    if (
      videoUrl !== undefined &&
      videoUrl !== null &&
      (typeof videoUrl !== "string" || videoUrl.length > 500)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid video URL",
      });
    }

    if (
      durationMinutes !== undefined &&
      durationMinutes !== null &&
      (!Number.isInteger(durationMinutes) || durationMinutes < 1)
    ) {
      return res.status(400).json({
        success: false,
        message: "Duration must be a positive integer",
      });
    }

    if (order !== undefined && (!Number.isInteger(order) || order < 0)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lesson order",
      });
    }

    if (isPreview !== undefined && typeof isPreview !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isPreview must be a boolean",
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
        message: "You do not have permission to manage this course",
      });
    }

    let lessonOrder = order;

    if (lessonOrder === undefined) {
      const lastLesson = await prisma.courseLesson.findFirst({
        where: { sectionId },
        orderBy: { order: "desc" },
        select: { order: true },
      });

      lessonOrder = lastLesson ? lastLesson.order + 1 : 0;
    }

    const lesson = await prisma.courseLesson.create({
      data: {
        sectionId,
        title: title.trim(),
        content: content ?? null,
        videoUrl: videoUrl?.trim() || null,
        durationMinutes: durationMinutes ?? null,
        order: lessonOrder,
        isPreview: isPreview ?? false,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Course lesson created successfully",
      data: { lesson },
    });
  } catch (error) {
    console.error("Create lesson error:", error);

    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "Lesson order already exists in this section",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create course lesson",
    });
  }
};

// GET LESSONS BY SECTION
const getSectionLessons = async (req, res) => {
  try {
    const sectionId = Number(req.params.sectionId);

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
        message: "You do not have permission to view these lessons",
      });
    }

    const lessons = await prisma.courseLesson.findMany({
      where: { sectionId },
      orderBy: { order: "asc" },
    });

    return res.status(200).json({
      success: true,
      message: "Course lessons retrieved successfully",
      data: {
        total: lessons.length,
        lessons,
      },
    });
  } catch (error) {
    console.error("Get section lessons error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve course lessons",
    });
  }
};

// UPDATE LESSON
const updateLesson = async (req, res) => {
  try {
    const lessonId = Number(req.params.id);

    if (!Number.isInteger(lessonId) || lessonId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid lesson ID",
      });
    }

    const lesson = await prisma.courseLesson.findUnique({
      where: { id: lessonId },
      include: {
        section: {
          include: { course: true },
        },
      },
    });

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: "Course lesson not found",
      });
    }

    if (!canManageCourse(req.user, lesson.section.course)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to update this lesson",
      });
    }

    const { title, content, videoUrl, durationMinutes, order, isPreview } =
      req.body;

    const data = {};

    if (title !== undefined) {
      if (
        typeof title !== "string" ||
        !title.trim() ||
        title.trim().length > 200
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid lesson title",
        });
      }

      data.title = title.trim();
    }

    if (content !== undefined) {
      if (content !== null && typeof content !== "string") {
        return res.status(400).json({
          success: false,
          message: "Invalid lesson content",
        });
      }

      data.content = content;
    }

    if (videoUrl !== undefined) {
      if (
        videoUrl !== null &&
        (typeof videoUrl !== "string" || videoUrl.length > 500)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid video URL",
        });
      }

      data.videoUrl = videoUrl?.trim() || null;
    }

    if (durationMinutes !== undefined) {
      if (
        durationMinutes !== null &&
        (!Number.isInteger(durationMinutes) || durationMinutes < 1)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid lesson duration",
        });
      }

      data.durationMinutes = durationMinutes;
    }

    if (order !== undefined) {
      if (!Number.isInteger(order) || order < 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid lesson order",
        });
      }

      data.order = order;
    }

    if (isPreview !== undefined) {
      if (typeof isPreview !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "isPreview must be a boolean",
        });
      }

      data.isPreview = isPreview;
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }

    const updatedLesson = await prisma.courseLesson.update({
      where: { id: lessonId },
      data,
    });

    return res.status(200).json({
      success: true,
      message: "Course lesson updated successfully",
      data: { lesson: updatedLesson },
    });
  } catch (error) {
    console.error("Update lesson error:", error);

    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "Lesson order already exists in this section",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update course lesson",
    });
  }
};

// DELETE LESSON
const deleteLesson = async (req, res) => {
  try {
    const lessonId = Number(req.params.id);

    if (!Number.isInteger(lessonId) || lessonId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid lesson ID",
      });
    }

    const lesson = await prisma.courseLesson.findUnique({
      where: { id: lessonId },
      include: {
        section: {
          include: { course: true },
        },
      },
    });

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: "Course lesson not found",
      });
    }

    if (!canManageCourse(req.user, lesson.section.course)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to delete this lesson",
      });
    }

    await prisma.courseLesson.delete({
      where: { id: lessonId },
    });

    return res.status(200).json({
      success: true,
      message: "Course lesson deleted successfully",
    });
  } catch (error) {
    console.error("Delete lesson error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete course lesson",
    });
  }
};

module.exports = {
  createLesson,
  getSectionLessons,
  updateLesson,
  deleteLesson,
};
