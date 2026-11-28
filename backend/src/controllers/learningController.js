// Menghasilkan nomor sertifikat yang unik
const { randomUUID } = require("crypto");

const prisma = require("../config/prisma");

// =====================================================
// GET COURSE CURRICULUM
// Melihat detail kursus, section, dan daftar lesson
// =====================================================
const getCourseCurriculum = async (req, res) => {
  try {
    // Mengambil ID kursus dari parameter URL
    const courseId = Number(req.params.courseId);

    // Mengambil ID siswa dari token JWT
    const studentId = Number(req.user.id);

    // Validasi ID kursus
    if (!Number.isInteger(courseId) || courseId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
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
        slug: true,
        description: true,
        thumbnail: true,
        level: true,
        status: true,

        // Mengambil seluruh section beserta lesson di dalamnya
        sections: {
          orderBy: {
            order: "asc",
          },
          include: {
            lessons: {
              orderBy: {
                order: "asc",
              },

              // Mengambil progres siswa yang sedang login
              include: {
                progress: {
                  where: {
                    studentId,
                  },
                  select: {
                    id: true,
                    isCompleted: true,
                    completedAt: true,
                    lastAccessedAt: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Memeriksa apakah kursus ditemukan
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Hanya kursus yang sudah dipublikasikan yang bisa dipelajari
    if (course.status !== "PUBLISHED") {
      return res.status(404).json({
        success: false,
        message: "Published course not found",
      });
    }

    // Memeriksa apakah siswa sudah terdaftar pada kursus
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId,
        },
      },
    });

    // Menentukan apakah siswa sudah enrollment
    const isEnrolled = Boolean(enrollment);

    // Menghitung jumlah lesson dan progres belajar siswa
    let totalLessons = 0;
    let completedLessons = 0;

    // Menyusun ulang data section dan lesson untuk respons API
    const sections = course.sections.map((section) => {
      const lessons = section.lessons.map((lesson) => {
        totalLessons++;

        // Mengambil progres siswa pada lesson ini
        const progress = lesson.progress[0] || null;

        // Menghitung lesson yang sudah selesai
        if (progress?.isCompleted) {
          completedLessons++;
        }

        // Lesson terkunci jika siswa belum enrollment
        // dan lesson tersebut bukan preview
        const isLocked = !isEnrolled && !lesson.isPreview;

        return {
          id: lesson.id,
          sectionId: lesson.sectionId,
          title: lesson.title,
          durationMinutes: lesson.durationMinutes,
          order: lesson.order,
          isPreview: lesson.isPreview,

          // Materi hanya diberikan jika siswa memiliki akses
          content: isLocked ? null : lesson.content,
          videoUrl: isLocked ? null : lesson.videoUrl,

          // Status apakah lesson terkunci
          isLocked,

          // Progres belajar siswa
          progress,
        };
      });

      return {
        id: section.id,
        courseId: section.courseId,
        title: section.title,
        description: section.description,
        order: section.order,
        lessons,
      };
    });

    // Menghitung persentase penyelesaian kursus
    const progressPercentage =
      totalLessons > 0
        ? Math.round((completedLessons / totalLessons) * 100)
        : 0;

    // Mengirimkan data curriculum kepada siswa
    return res.status(200).json({
      success: true,
      message: "Course curriculum retrieved successfully",
      data: {
        course: {
          id: course.id,
          title: course.title,
          slug: course.slug,
          description: course.description,
          thumbnail: course.thumbnail,
          level: course.level,
          status: course.status,
        },

        isEnrolled,

        progress: {
          totalLessons,
          completedLessons,
          progressPercentage,
        },

        sections,
      },
    });
  } catch (error) {
    console.error("Get Course Curriculum Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve course curriculum",
    });
  }
};

// =====================================================
// GET LESSON CONTENT
// Membuka materi lesson dengan pemeriksaan enrollment
// =====================================================
const getLessonContent = async (req, res) => {
  try {
    // Mengambil ID lesson dari parameter URL
    const lessonId = Number(req.params.lessonId);

    // Mengambil ID siswa dari token JWT
    const studentId = Number(req.user.id);

    // Validasi ID lesson
    if (!Number.isInteger(lessonId) || lessonId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid lesson ID",
      });
    }

    // Mencari lesson beserta informasi section dan kursusnya
    const lesson = await prisma.courseLesson.findUnique({
      where: {
        id: lessonId,
      },
      include: {
        section: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                status: true,
              },
            },
          },
        },
      },
    });

    // Memeriksa apakah lesson ditemukan
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found",
      });
    }

    // Mengambil informasi kursus dari relasi section
    const course = lesson.section.course;

    // Memastikan kursus sudah dipublikasikan
    if (course.status !== "PUBLISHED") {
      return res.status(404).json({
        success: false,
        message: "Published course not found",
      });
    }

    // Memeriksa enrollment siswa pada kursus
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId: course.id,
        },
      },
    });

    // Menentukan apakah siswa sudah enrollment
    const isEnrolled = Boolean(enrollment);

    // Siswa yang belum enrollment hanya boleh membuka preview
    if (!isEnrolled && !lesson.isPreview) {
      return res.status(403).json({
        success: false,
        message: "You must enroll in this course to access this lesson",
      });
    }

    // Variabel untuk menyimpan progres siswa
    let progress = null;

    // Progres hanya dicatat untuk siswa yang sudah enrollment
    if (isEnrolled) {
      progress = await prisma.lessonProgress.upsert({
        // Mencari progres berdasarkan kombinasi siswa dan lesson
        where: {
          studentId_lessonId: {
            studentId,
            lessonId,
          },
        },

        // Jika progres sudah ada, perbarui waktu akses terakhir
        update: {
          lastAccessedAt: new Date(),
        },

        // Jika belum ada, buat progres baru
        create: {
          studentId,
          lessonId,
          lastAccessedAt: new Date(),
        },
      });
    }

    // Mengirimkan materi lesson kepada siswa
    return res.status(200).json({
      success: true,
      message: "Lesson content retrieved successfully",
      data: {
        course: {
          id: course.id,
          title: course.title,
        },

        lesson: {
          id: lesson.id,
          sectionId: lesson.sectionId,
          title: lesson.title,
          content: lesson.content,
          videoUrl: lesson.videoUrl,
          durationMinutes: lesson.durationMinutes,
          order: lesson.order,
          isPreview: lesson.isPreview,
        },

        isEnrolled,
        progress,
      },
    });
  } catch (error) {
    console.error("Get Lesson Content Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve lesson content",
    });
  }
};

// =====================================================
// COMPLETE LESSON
// Menandai lesson selesai dan menerbitkan sertifikat otomatis
// =====================================================
const completeLesson = async (req, res) => {
  try {
    // Mengambil ID lesson dari parameter URL
    const lessonId = Number(req.params.lessonId);

    // Mengambil ID siswa dari token JWT
    const studentId = Number(req.user.id);

    // Validasi ID lesson
    if (!Number.isInteger(lessonId) || lessonId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid lesson ID",
      });
    }

    // Memastikan lesson tersedia dan mengambil data kursusnya
    const lesson = await prisma.courseLesson.findUnique({
      where: {
        id: lessonId,
      },
      include: {
        section: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                status: true,
              },
            },
          },
        },
      },
    });

    // Jika lesson tidak ditemukan
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found",
      });
    }

    // Mengambil informasi kursus
    const course = lesson.section.course;

    // Memastikan kursus sudah dipublikasikan
    if (course.status !== "PUBLISHED") {
      return res.status(404).json({
        success: false,
        message: "Published course not found",
      });
    }

    // Memastikan siswa sudah enrollment pada kursus
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId: course.id,
        },
      },
    });

    // Siswa yang belum enrollment tidak boleh menyelesaikan lesson
    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: "You must enroll in this course to complete this lesson",
      });
    }

    // Memastikan siswa sudah pernah membuka lesson
    const existingProgress = await prisma.lessonProgress.findUnique({
      where: {
        studentId_lessonId: {
          studentId,
          lessonId,
        },
      },
    });

    // Siswa harus membuka lesson sebelum menandainya selesai
    if (!existingProgress) {
      return res.status(400).json({
        success: false,
        message: "Please access the lesson before completing it",
      });
    }

    // Mengambil waktu penyelesaian saat ini
    const completedAt = existingProgress.completedAt || new Date();

    // Memperbarui progres menjadi selesai
    // Waktu penyelesaian lama dipertahankan jika lesson sudah selesai
    const progress = await prisma.lessonProgress.update({
      where: {
        studentId_lessonId: {
          studentId,
          lessonId,
        },
      },
      data: {
        isCompleted: true,
        completedAt,
        lastAccessedAt: new Date(),
      },
    });

    // Menghitung seluruh lesson dalam kursus
    const totalLessons = await prisma.courseLesson.count({
      where: {
        section: {
          courseId: course.id,
        },
      },
    });

    // Menghitung lesson yang sudah diselesaikan oleh siswa
    const completedLessons = await prisma.lessonProgress.count({
      where: {
        studentId,
        isCompleted: true,
        lesson: {
          section: {
            courseId: course.id,
          },
        },
      },
    });

    // Menghitung persentase penyelesaian kursus
    const progressPercentage =
      totalLessons > 0
        ? Math.round((completedLessons / totalLessons) * 100)
        : 0;

    // Menentukan apakah seluruh lesson sudah selesai
    const isCourseCompleted =
      totalLessons > 0 && completedLessons === totalLessons;

    // Menyiapkan variabel sertifikat
    let certificate = null;
    let certificateIssued = false;

    // Sertifikat hanya diterbitkan jika seluruh lesson selesai
    if (isCourseCompleted) {
      // Memeriksa apakah sertifikat sudah pernah diterbitkan
      certificate = await prisma.courseCertificate.findUnique({
        where: {
          studentId_courseId: {
            studentId,
            courseId: course.id,
          },
        },
      });

      // Membuat sertifikat jika belum tersedia
      if (!certificate) {
        // Mengambil nama siswa untuk disimpan sebagai snapshot
        const student = await prisma.user.findUnique({
          where: {
            id: studentId,
          },
          select: {
            name: true,
          },
        });

        // Memastikan data siswa tersedia
        if (!student) {
          return res.status(404).json({
            success: false,
            message: "Student not found",
          });
        }

        // Membuat nomor sertifikat yang unik
        const certificateNumber = `EDU-${new Date().getFullYear()}-${randomUUID()
          .slice(0, 8)
          .toUpperCase()}`;

        try {
          // Menyimpan sertifikat kelulusan
          certificate = await prisma.courseCertificate.create({
            data: {
              studentId,
              courseId: course.id,
              certificateNumber,
              studentName: student.name,
              courseTitle: course.title,
              completedAt: new Date(),
            },
          });

          certificateIssued = true;
        } catch (error) {
          // Mengantisipasi permintaan bersamaan yang membuat sertifikat ganda
          if (error.code === "P2002") {
            certificate = await prisma.courseCertificate.findUnique({
              where: {
                studentId_courseId: {
                  studentId,
                  courseId: course.id,
                },
              },
            });

            // Melempar error jika sertifikat belum ditemukan
            if (!certificate) {
              throw error;
            }
          } else {
            throw error;
          }
        }
      }
    }

    // Mengirimkan hasil pembaruan progres dan sertifikat
    return res.status(200).json({
      success: true,
      message: certificateIssued
        ? "Lesson completed and course certificate issued successfully"
        : "Lesson completed successfully",
      data: {
        progress,
        courseCompletion: {
          totalLessons,
          completedLessons,
          progressPercentage,
          isCompleted: isCourseCompleted,
        },
        certificateIssued,
        certificate,
      },
    });
  } catch (error) {
    // Mencatat error untuk kebutuhan debugging
    console.error("Complete Lesson Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to complete lesson",
    });
  }
};

// =====================================================
// GET STUDENT DASHBOARD
// Menampilkan statistik dan ringkasan pembelajaran siswa
// =====================================================
const getStudentDashboard = async (req, res) => {
  try {
    // Mengambil ID siswa dari token JWT
    const studentId = Number(req.user.id);

    // Mengambil seluruh kursus yang diikuti siswa
    const enrollments = await prisma.courseEnrollment.findMany({
      where: {
        studentId,
      },
      orderBy: {
        enrolledAt: "desc",
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            thumbnail: true,
            level: true,
            status: true,

            // Mengambil seluruh section dan lesson dalam kursus
            sections: {
              orderBy: {
                order: "asc",
              },
              select: {
                lessons: {
                  orderBy: {
                    order: "asc",
                  },
                  select: {
                    id: true,

                    // Mengambil progres milik siswa yang sedang login
                    progress: {
                      where: {
                        studentId,
                      },
                      select: {
                        isCompleted: true,
                        lastAccessedAt: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    // Menyiapkan variabel statistik dashboard
    let completedCourses = 0;
    let totalProgressPercentage = 0;

    // Menyusun daftar kursus beserta progres belajar
    const courses = enrollments.map((enrollment) => {
      const course = enrollment.course;

      // Menggabungkan seluruh lesson dari semua section
      const lessons = course.sections.flatMap((section) => section.lessons);

      // Menghitung total lesson dalam kursus
      const totalLessons = lessons.length;

      // Menghitung jumlah lesson yang sudah diselesaikan
      const completedLessons = lessons.filter(
        (lesson) => lesson.progress[0]?.isCompleted === true,
      ).length;

      // Menghitung persentase progres kursus
      const progressPercentage =
        totalLessons > 0
          ? Math.round((completedLessons / totalLessons) * 100)
          : 0;

      // Menghitung kursus yang sudah selesai seluruhnya
      const isCompleted = totalLessons > 0 && completedLessons === totalLessons;

      if (isCompleted) {
        completedCourses++;
      }

      // Menambahkan progres kursus ke total progres
      totalProgressPercentage += progressPercentage;

      // Mengumpulkan waktu akses terakhir seluruh lesson
      const accessDates = lessons
        .flatMap((lesson) => lesson.progress)
        .map((progress) => progress.lastAccessedAt)
        .filter(Boolean);

      // Mengurutkan waktu akses dari yang terbaru
      const lastAccessedAt =
        accessDates.length > 0
          ? new Date(Math.max(...accessDates.map((date) => date.getTime())))
          : null;

      // Mengembalikan data kursus untuk dashboard
      return {
        id: course.id,
        title: course.title,
        slug: course.slug,
        thumbnail: course.thumbnail,
        level: course.level,
        status: course.status,
        enrolledAt: enrollment.enrolledAt,
        totalLessons,
        completedLessons,
        progressPercentage,
        isCompleted,
        lastAccessedAt,
      };
    });

    // Menghitung jumlah kursus yang diikuti
    const totalEnrolledCourses = courses.length;

    // Menghitung jumlah kursus yang masih berjalan
    const inProgressCourses = courses.filter(
      (course) => !course.isCompleted,
    ).length;

    // Menghitung rata-rata progres seluruh kursus
    const overallProgress =
      totalEnrolledCourses > 0
        ? Math.round(totalProgressPercentage / totalEnrolledCourses)
        : 0;

    // Mengirimkan ringkasan dashboard kepada siswa
    return res.status(200).json({
      success: true,
      message: "Student dashboard retrieved successfully",
      data: {
        statistics: {
          totalEnrolledCourses,
          completedCourses,
          inProgressCourses,
          overallProgress,
        },
        courses,
      },
    });
  } catch (error) {
    // Mencatat error untuk kebutuhan debugging
    console.error("Get Student Dashboard Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve student dashboard",
    });
  }
};

// Mengekspor controller agar bisa digunakan oleh routes
module.exports = {
  getCourseCurriculum,
  getLessonContent,
  completeLesson,
  getStudentDashboard,
};
