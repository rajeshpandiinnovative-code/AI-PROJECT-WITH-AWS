/**
 * Abstract “human ↔ AI handshake” motif — teacher judgment meets machine precision.
 */
export function HandshakeHeroArt() {
  return (
    <div className="relative mx-auto w-full max-w-md select-none" aria-hidden>
      <svg viewBox="0 0 400 280" className="h-auto w-full drop-shadow-[0_20px_50px_rgba(16,185,129,0.15)]">
        <defs>
          <linearGradient id="hx1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#0F172A" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="hx2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#64748B" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#1E293B" stopOpacity="0.95" />
          </linearGradient>
        </defs>
        <ellipse cx="200" cy="248" rx="160" ry="18" fill="#0F172A" opacity="0.45" />
        {/* Human side — organic curve */}
        <path
          d="M40 180 Q 80 60 195 125 Q 210 132 205 150 Q 198 175 175 195 Q 130 220 85 200 Q 55 188 40 180 Z"
          fill="url(#hx1)"
          stroke="#10B981"
          strokeWidth="1.5"
          opacity="0.95"
        />
        {/* AI side — geometric */}
        <path
          d="M360 180 Q 320 55 205 125 L 205 150 Q 218 168 235 175 Q 285 195 325 188 Q 350 182 360 180 Z"
          fill="url(#hx2)"
          stroke="#94A3B8"
          strokeWidth="1.25"
          opacity="0.92"
        />
        {/* Join / “handshake” seam */}
        <path
          d="M 195 125 Q 200 138 205 125"
          stroke="#10B981"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="200" cy="132" r="10" fill="#10B981" opacity="0.35" />
        <circle cx="200" cy="132" r="4" fill="#10B981" />
        {/* Spark accents */}
        <path d="M120 95 l6-6 M126 89 l-6-6" stroke="#10B981" strokeWidth="1.5" opacity="0.7" />
        <path d="M285 88 h8 M289 84 v8" stroke="#94A3B8" strokeWidth="1.5" opacity="0.7" />
      </svg>
      <p className="sr-only">Illustration: partnership between educator insight and AI precision</p>
    </div>
  );
}
