import "../styles/BookAnimation.css";

// Komponen animasi buku 3D EduMind AI
function BookAnimation() {
  return (
    <div className="book-animation">
      {/* Cahaya di belakang buku */}
      <div className="book-glow" />

      {/* Partikel dekorasi */}
      <span className="book-particle particle-one">✦</span>
      <span className="book-particle particle-two">✧</span>
      <span className="book-particle particle-three">+</span>
      <span className="book-particle particle-four">✦</span>

      {/* Simbol pengetahuan yang melayang */}
      <div className="knowledge-symbol symbol-one">AI</div>
      <div className="knowledge-symbol symbol-two">∑</div>
      <div className="knowledge-symbol symbol-three">✧</div>

      {/* Buku dengan perspektif 3D */}
      <div className="book-scene">
        <div className="book">
          {/* Bagian tengah dan halaman buku */}
          <div className="book-spine" />

          {/* Halaman kiri */}
          <div className="book-page page-left">
            <div className="page-lines">
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
          </div>

          {/* Halaman kanan */}
          <div className="book-page page-right">
            <div className="page-lines">
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
          </div>

          {/* Halaman yang membalik */}
          <div className="flipping-page page-flip-one">
            <div className="page-lines">
              <span />
              <span />
              <span />
              <span />
            </div>
          </div>

          <div className="flipping-page page-flip-two">
            <div className="page-lines">
              <span />
              <span />
              <span />
              <span />
            </div>
          </div>

          {/* Sampul buku */}
          <div className="book-cover">
            <div className="cover-content">
              <span className="cover-logo">E</span>
              <span className="cover-title">EDUMIND</span>
              <span className="cover-subtitle">KNOWLEDGE IS POWER</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bayangan buku */}
      <div className="book-shadow" />

      {/* Keterangan animasi */}
      <div className="book-caption">
        <span className="caption-line" />
        <span>EXPLORE THE WORLD OF KNOWLEDGE</span>
        <span className="caption-line" />
      </div>
    </div>
  );
}

export default BookAnimation;
