const prisma = require("../config/prisma");

// =====================================================
// CREATE COURSE REVIEW
// Siswa memberikan rating dan review pada kursus
// =====================================================
const createReview = async (req, res) => {
  try {
    // Mengambil ID kursus dari parameter URL
    const courseId = Number(req.params.courseId);

    // Mengambil ID siswa dari token JWT
    const studentId = Number(req.user.id);

    // Mengambil rating dan komentar dari request body
    const { rating, comment } = req.body;

    // Memvalidasi ID kursus
    if (!Number.isInteger(courseId) || courseId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }

    // Memvalidasi rating harus berupa angka 1 sampai 5
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be an integer between 1 and 5",
      });
    }

    // Memvalidasi komentar jika dikirimkan
    if (
      comment !== undefined &&
      comment !== null &&
      typeof comment !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Comment must be a string",
      });
    }

    // Mencari kursus berdasarkan ID
    const course = await prisma.course.findUnique({
      where: {
        id: courseId,
      },
      select: {
        id: true,
        title: true,
        status: true,
      },
    });

    // Memastikan kursus ditemukan
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Review hanya bisa diberikan pada kursus published
    if (course.status !== "PUBLISHED") {
      return res.status(400).json({
        success: false,
        message: "Only published courses can be reviewed",
      });
    }

    // Memastikan siswa sudah mengikuti kursus
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId,
        },
      },
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: "You must enroll in this course before reviewing",
      });
    }

    // Memeriksa apakah siswa sudah pernah memberikan review
    const existingReview = await prisma.courseReview.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId,
        },
      },
    });

    if (existingReview) {
      return res.status(409).json({
        success: false,
        message: "You have already reviewed this course",
      });
    }

    // Membuat review baru
    const review = await prisma.courseReview.create({
      data: {
        studentId,
        courseId,
        rating,
        comment: comment?.trim() || null,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Mengirimkan review yang berhasil dibuat
    return res.status(201).json({
      success: true,
      message: "Course review created successfully",
      data: {
        review,
      },
    });
  } catch (error) {
    // Mencatat error untuk kebutuhan debugging
    console.error("Create Course Review Error:", error);

    // Menangani kemungkinan duplikasi akibat request bersamaan
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "You have already reviewed this course",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create course review",
    });
  }
};

// =====================================================
// GET COURSE REVIEWS
// Melihat seluruh review pada kursus
// =====================================================
const getCourseReviews = async (req, res) => {
  try {
    // Mengambil ID kursus dari parameter URL
    const courseId = Number(req.params.courseId);

    // Validasi ID kursus
    if (!Number.isInteger(courseId) || courseId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }

    // Memastikan kursus tersedia
    const course = await prisma.course.findUnique({
      where: {
        id: courseId,
      },
      select: {
        id: true,
        title: true,
        status: true,
      },
    });

    if (!course || course.status !== "PUBLISHED") {
      return res.status(404).json({
        success: false,
        message: "Published course not found",
      });
    }

    // Mengambil seluruh review kursus
    const reviews = await prisma.courseReview.findMany({
      where: {
        courseId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Menghitung rata-rata rating
    const averageRating = await prisma.courseReview.aggregate({
      where: {
        courseId,
      },
      _avg: {
        rating: true,
      },
      _count: {
        rating: true,
      },
    });

    // Mengirimkan daftar review dan ringkasan rating
    return res.status(200).json({
      success: true,
      message: "Course reviews retrieved successfully",
      data: {
        course,
        statistics: {
          totalReviews: averageRating._count.rating,
          averageRating: Number((averageRating._avg.rating || 0).toFixed(1)),
        },
        reviews,
      },
    });
  } catch (error) {
    console.error("Get Course Reviews Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve course reviews",
    });
  }
};

// =====================================================
// UPDATE COURSE REVIEW
// Siswa mengubah review miliknya sendiri
// =====================================================
const updateReview = async (req, res) => {
  try {
    // Mengambil ID review dari parameter URL
    const reviewId = Number(req.params.reviewId);

    // Mengambil ID siswa dari token JWT
    const studentId = Number(req.user.id);

    // Mengambil rating dan komentar dari request body
    const { rating, comment } = req.body;

    // Validasi ID review
    if (!Number.isInteger(reviewId) || reviewId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid review ID",
      });
    }

    // Memastikan setidaknya satu field dikirim
    if (rating === undefined && comment === undefined) {
      return res.status(400).json({
        success: false,
        message: "Please provide rating or comment to update",
      });
    }

    // Validasi rating jika dikirim
    if (
      rating !== undefined &&
      (!Number.isInteger(rating) || rating < 1 || rating > 5)
    ) {
      return res.status(400).json({
        success: false,
        message: "Rating must be an integer between 1 and 5",
      });
    }

    // Validasi komentar jika dikirim
    if (
      comment !== undefined &&
      comment !== null &&
      typeof comment !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Comment must be a string",
      });
    }

    // Mencari review milik siswa
    const existingReview = await prisma.courseReview.findUnique({
      where: {
        id: reviewId,
      },
    });

    if (!existingReview) {
      return res.status(404).json({
        success: false,
        message: "Course review not found",
      });
    }

    // Memastikan siswa hanya mengubah review miliknya
    if (existingReview.studentId !== studentId) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to update this review",
      });
    }

    // Menyiapkan data yang akan diperbarui
    const updateData = {};

    if (rating !== undefined) {
      updateData.rating = rating;
    }

    if (comment !== undefined) {
      updateData.comment = comment?.trim() || null;
    }

    // Memperbarui review
    const review = await prisma.courseReview.update({
      where: {
        id: reviewId,
      },
      data: updateData,
    });

    return res.status(200).json({
      success: true,
      message: "Course review updated successfully",
      data: {
        review,
      },
    });
  } catch (error) {
    console.error("Update Course Review Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update course review",
    });
  }
};

// =====================================================
// DELETE COURSE REVIEW
// Siswa menghapus review miliknya sendiri
// =====================================================
const deleteReview = async (req, res) => {
  try {
    // Mengambil ID review dari parameter URL
    const reviewId = Number(req.params.reviewId);

    // Mengambil ID siswa dari token JWT
    const studentId = Number(req.user.id);

    // Validasi ID review
    if (!Number.isInteger(reviewId) || reviewId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid review ID",
      });
    }

    // Mencari review berdasarkan ID
    const review = await prisma.courseReview.findUnique({
      where: {
        id: reviewId,
      },
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Course review not found",
      });
    }

    // Memastikan siswa hanya menghapus review miliknya
    if (review.studentId !== studentId) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to delete this review",
      });
    }

    // Menghapus review dari database
    await prisma.courseReview.delete({
      where: {
        id: reviewId,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Course review deleted successfully",
    });
  } catch (error) {
    console.error("Delete Course Review Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete course review",
    });
  }
};

// Mengekspor seluruh controller review
module.exports = {
  createReview,
  getCourseReviews,
  updateReview,
  deleteReview,
};
