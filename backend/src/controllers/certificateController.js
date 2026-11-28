const prisma = require("../config/prisma");

// ============================================
// GET SERTIFIKAT MILIK SISWA YANG LOGIN
// ============================================
const getMyCertificates = async (req, res) => {
  try {
    // Mengambil ID siswa dari token autentikasi
    const studentId = req.user.id;

    // Mengambil semua sertifikat milik siswa
    const certificates = await prisma.courseCertificate.findMany({
      where: {
        studentId,
      },
      orderBy: {
        issuedAt: "desc",
      },
    });

    // Mengirim daftar sertifikat
    return res.status(200).json({
      success: true,
      message: "Student certificates retrieved successfully",
      data: {
        total: certificates.length,
        certificates,
      },
    });
  } catch (error) {
    console.error("Get My Certificates Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve student certificates",
    });
  }
};

// ============================================
// VERIFIKASI SERTIFIKAT SECARA PUBLIK
// ============================================
const verifyCertificate = async (req, res) => {
  try {
    // Mengambil nomor sertifikat dari parameter URL
    const { certificateNumber } = req.params;

    // Mencari sertifikat berdasarkan nomor unik
    const certificate = await prisma.courseCertificate.findUnique({
      where: {
        certificateNumber,
      },
      select: {
        id: true,
        certificateNumber: true,
        studentName: true,
        courseTitle: true,
        completedAt: true,
        issuedAt: true,
      },
    });

    // Jika sertifikat tidak ditemukan
    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found or invalid",
        data: {
          isValid: false,
        },
      });
    }

    // Jika sertifikat ditemukan, berarti nomor tersebut valid
    return res.status(200).json({
      success: true,
      message: "Certificate verified successfully",
      data: {
        isValid: true,
        certificate,
      },
    });
  } catch (error) {
    console.error("Verify Certificate Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to verify certificate",
    });
  }
};

// Mengekspor controller agar dapat digunakan oleh routes
module.exports = {
  getMyCertificates,
  verifyCertificate,
};
