const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const prisma = require("../config/prisma");

// ============================================
// DOWNLOAD SERTIFIKAT PROFESIONAL DALAM PDF
// ============================================
const downloadCertificate = async (req, res) => {
  try {
    // Mengambil ID siswa dari token autentikasi
    const studentId = req.user.id;

    // Mengambil nomor sertifikat dari URL
    const { certificateNumber } = req.params;

    // Mencari sertifikat yang dimiliki siswa
    const certificate = await prisma.courseCertificate.findFirst({
      where: {
        certificateNumber,
        studentId,
      },
    });

    // Memastikan sertifikat ditemukan
    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found",
      });
    }

    // Membuat URL verifikasi publik
    const verificationUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/verify-certificate/${certificate.certificateNumber}`;

    // Menghasilkan QR Code dalam format data URL
    const qrCodeData = await QRCode.toDataURL(verificationUrl, {
      width: 300,
      margin: 1,
      color: {
        dark: "#172554",
        light: "#FFFFFF",
      },
    });

    // Membuat dokumen PDF A4 landscape
    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margins: {
        top: 40,
        bottom: 40,
        left: 50,
        right: 50,
      },
    });

    // Mengatur nama file PDF
    const fileName = `${certificate.certificateNumber}.pdf`;

    // Mengatur header respons PDF
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    // Menghubungkan dokumen PDF ke response
    doc.pipe(res);

    // Menggambar background putih
    doc.rect(0, 0, 842, 595).fill("#FFFFFF");

    // Border utama warna navy
    doc.lineWidth(8).strokeColor("#172554").rect(20, 20, 802, 555).stroke();

    // Border kedua warna gold
    doc.lineWidth(2).strokeColor("#C9A227").rect(32, 32, 778, 531).stroke();

    // Dekorasi sudut kiri atas
    doc
      .lineWidth(2)
      .strokeColor("#C9A227")
      .moveTo(50, 85)
      .lineTo(50, 50)
      .lineTo(85, 50)
      .stroke();

    // Dekorasi sudut kanan atas
    doc.moveTo(757, 50).lineTo(792, 50).lineTo(792, 85).stroke();

    // Identitas platform
    doc
      .fillColor("#172554")
      .font("Helvetica-Bold")
      .fontSize(17)
      .text("EDUMIND AI", 50, 65, {
        align: "center",
      });

    // Tagline platform
    doc
      .fillColor("#64748B")
      .font("Helvetica")
      .fontSize(9)
      .text("SMART LEARNING PLATFORM", 50, 88, {
        align: "center",
      });

    // Judul utama sertifikat
    doc
      .fillColor("#172554")
      .font("Helvetica-Bold")
      .fontSize(32)
      .text("CERTIFICATE OF COMPLETION", 50, 125, {
        align: "center",
      });

    // Garis dekorasi gold
    doc
      .lineWidth(2)
      .strokeColor("#C9A227")
      .moveTo(280, 168)
      .lineTo(562, 168)
      .stroke();

    // Teks pengantar
    doc
      .fillColor("#64748B")
      .font("Helvetica")
      .fontSize(12)
      .text("THIS CERTIFICATE IS PROUDLY PRESENTED TO", 50, 190, {
        align: "center",
      });

    // Nama siswa
    doc
      .fillColor("#172554")
      .font("Helvetica-Bold")
      .fontSize(34)
      .text(certificate.studentName, 70, 220, {
        align: "center",
        width: 702,
      });

    // Garis di bawah nama siswa
    doc
      .lineWidth(1)
      .strokeColor("#C9A227")
      .moveTo(250, 265)
      .lineTo(592, 265)
      .stroke();

    // Keterangan penyelesaian kursus
    doc
      .fillColor("#475569")
      .font("Helvetica")
      .fontSize(14)
      .text("For successfully completing the course", 50, 285, {
        align: "center",
      });

    // Nama kursus
    doc
      .fillColor("#172554")
      .font("Helvetica-Bold")
      .fontSize(23)
      .text(certificate.courseTitle, 100, 315, {
        align: "center",
        width: 642,
      });

    // Mengubah tanggal penyelesaian menjadi format yang mudah dibaca
    const completedDate = new Date(certificate.completedAt).toLocaleDateString(
      "en-GB",
      {
        day: "2-digit",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      },
    );

    // Menampilkan tanggal penyelesaian
    doc
      .fillColor("#64748B")
      .font("Helvetica")
      .fontSize(11)
      .text(`Completed on ${completedDate}`, 50, 360, {
        align: "center",
      });

    // Area tanda tangan digital
    doc
      .fillColor("#172554")
      .font("Helvetica-Oblique")
      .fontSize(19)
      .text("EduMind AI", 150, 425, {
        align: "center",
        width: 200,
      });

    // Garis tanda tangan
    doc
      .lineWidth(1)
      .strokeColor("#172554")
      .moveTo(150, 455)
      .lineTo(350, 455)
      .stroke();

    // Label tanda tangan
    doc
      .fillColor("#64748B")
      .font("Helvetica")
      .fontSize(10)
      .text("AUTHORIZED SIGNATURE", 150, 463, {
        align: "center",
        width: 200,
      });

    // Menampilkan QR Code untuk verifikasi
    doc.image(qrCodeData, 650, 410, {
      width: 90,
      height: 90,
    });

    // Keterangan QR Code
    doc
      .fillColor("#64748B")
      .font("Helvetica")
      .fontSize(8)
      .text("SCAN TO VERIFY", 630, 505, {
        align: "center",
        width: 130,
      });

    // Nomor sertifikat
    doc
      .fillColor("#172554")
      .font("Helvetica-Bold")
      .fontSize(9)
      .text(`CERTIFICATE NO: ${certificate.certificateNumber}`, 50, 525, {
        align: "center",
      });

    // Mengubah tanggal penerbitan
    const issuedDate = new Date(certificate.issuedAt).toLocaleDateString(
      "en-GB",
      {
        day: "2-digit",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      },
    );

    // Menampilkan tanggal penerbitan
    doc
      .fillColor("#64748B")
      .font("Helvetica")
      .fontSize(9)
      .text(`Issued on ${issuedDate}`, 50, 540, {
        align: "center",
      });

    // Menyelesaikan pembuatan PDF
    doc.end();
  } catch (error) {
    console.error("Download Certificate Error:", error);

    // Mengirim error jika respons PDF belum dimulai
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to generate certificate PDF",
      });
    }
  }
};

// Mengekspor controller
module.exports = {
  downloadCertificate,
};
