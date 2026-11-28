import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "../styles/VerifyCertificate.css";

// Struktur data sertifikat dari API
interface Certificate {
  id: number;
  certificateNumber: string;
  studentName: string;
  courseTitle: string;
  completedAt: string;
  issuedAt: string;
}

// Struktur respons API
interface VerificationResponse {
  success: boolean;
  message: string;
  data?: {
    isValid: boolean;
    certificate?: Certificate;
  };
}

export default function VerifyCertificate() {
  // Mengambil nomor sertifikat dari URL
  const { certificateNumber } = useParams<{
    certificateNumber: string;
  }>();

  // Menyimpan data sertifikat
  const [certificate, setCertificate] = useState<Certificate | null>(null);

  // Menyimpan status proses verifikasi
  const [loading, setLoading] = useState(true);

  // Menyimpan status keaslian sertifikat
  const [isValid, setIsValid] = useState(false);

  // Menyimpan pesan kesalahan
  const [error, setError] = useState("");

  useEffect(() => {
    // Mengambil data sertifikat dari backend
    const verify = async () => {
      try {
        setLoading(true);
        setError("");

        // Memanggil endpoint verifikasi publik
        const response = await fetch(
          `http://localhost:5000/api/certificates/verify/${encodeURIComponent(
            certificateNumber || "",
          )}`,
        );

        // Mengubah respons menjadi JSON
        const result: VerificationResponse = await response.json();

        // Memeriksa hasil verifikasi
        if (!response.ok || !result.data?.isValid) {
          setIsValid(false);
          setError(result.message || "Certificate is invalid");
          return;
        }

        // Menyimpan data sertifikat yang valid
        setCertificate(result.data.certificate || null);
        setIsValid(true);
      } catch {
        // Menangani kegagalan koneksi ke backend
        setError("Unable to connect to certificate verification server.");
      } finally {
        // Mengakhiri proses loading
        setLoading(false);
      }
    };

    // Menjalankan proses verifikasi
    verify();
  }, [certificateNumber]);

  // Mengubah tanggal menjadi format yang mudah dibaca
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  // Tampilan saat proses verifikasi
  if (loading) {
    return (
      <div className="verification-page">
        <div className="verification-card">
          <h2>Verifying Certificate...</h2>
          <p>Please wait while we verify your certificate.</p>
        </div>
      </div>
    );
  }

  // Tampilan jika sertifikat tidak valid
  if (!isValid || !certificate) {
    return (
      <div className="verification-page">
        <div className="verification-card invalid">
          <h1>Certificate Invalid</h1>
          <p>{error || "Certificate could not be verified."}</p>
          <span>EDUMIND AI</span>
        </div>
      </div>
    );
  }

  // Tampilan jika sertifikat valid
  return (
    <div className="verification-page">
      <div className="verification-card valid">
        <div className="verification-icon">✓</div>

        <p className="verification-brand">EDUMIND AI</p>

        <h1>Certificate Verified</h1>

        <p className="verification-description">
          This certificate is authentic and has been officially issued by
          EduMind AI.
        </p>

        <div className="verification-details">
          <div>
            <span>Student Name</span>
            <strong>{certificate.studentName}</strong>
          </div>

          <div>
            <span>Course</span>
            <strong>{certificate.courseTitle}</strong>
          </div>

          <div>
            <span>Certificate Number</span>
            <strong>{certificate.certificateNumber}</strong>
          </div>

          <div>
            <span>Completed Date</span>
            <strong>{formatDate(certificate.completedAt)}</strong>
          </div>

          <div>
            <span>Issued Date</span>
            <strong>{formatDate(certificate.issuedAt)}</strong>
          </div>
        </div>

        <div className="verification-footer">
          Official Certificate Verification
        </div>
      </div>
    </div>
  );
}
