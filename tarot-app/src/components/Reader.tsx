/** Stilisierte Kartenlegerin als SVG-Illustration mit CSS-Idle (Atmen, Blinzeln, Kopfneigen). Keine reale Person. */
export function Reader({ speaking }: { speaking: boolean }) {
  return (
    <div className={`reader${speaking ? ' reader--speaking' : ''}`} aria-hidden="true">
      <svg viewBox="0 0 240 230" className="reader__svg" role="img">
        <defs>
          <radialGradient id="glow" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#f3c77a" stopOpacity="0.5" /><stop offset="100%" stopColor="#f3c77a" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="shawl" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5a2a52" />
            <stop offset="100%" stopColor="#2a1230" />
          </linearGradient>
          <linearGradient id="skin" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e9c6a6" />
            <stop offset="100%" stopColor="#d3a37e" />
          </linearGradient>
          <linearGradient id="hair" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2b1a1c" />
            <stop offset="100%" stopColor="#4a2c2e" />
          </linearGradient>
        </defs>
        <g className="reader__body">
          {/* Schultern und Tuch */}
          <path d="M20 230 C 30 150, 70 135, 120 135 C 170 135, 210 150, 220 230 Z" fill="url(#shawl)" />
          <path d="M60 230 C 70 175, 95 160, 120 160 C 145 160, 170 175, 180 230 Z" fill="#3b1a3a" opacity="0.8" />
          {/* Halskette */}
          <path d="M96 150 Q 120 178 144 150" fill="none" stroke="#d4a54a" strokeWidth="2" />
          <circle cx="120" cy="177" r="4" fill="#d4a54a" />
          <g className="reader__head">
            {/* Haar hinten */}
            <path d="M62 120 C 55 60, 80 28, 120 28 C 160 28, 185 60, 178 120 C 176 150, 160 160, 120 165 C 80 160, 64 150, 62 120 Z" fill="url(#hair)" />
            {/* Hals */}
            <rect x="106" y="120" width="28" height="30" rx="12" fill="url(#skin)" />
            {/* Gesicht */}
            <ellipse cx="120" cy="92" rx="36" ry="44" fill="url(#skin)" />
            {/* Haar vorne / Kopftuch */}
            <path d="M84 78 C 88 44, 108 36, 120 36 C 132 36, 152 44, 156 78 C 148 62, 134 56, 120 58 C 106 56, 92 62, 84 78 Z" fill="url(#hair)" />
            <path d="M80 70 C 90 40, 150 40, 160 70 C 158 52, 140 34, 120 34 C 100 34, 82 52, 80 70 Z" fill="#6a2f66" />
            <circle cx="120" cy="40" r="4" fill="#d4a54a" />
            {/* Ohrringe */}
            <circle cx="85" cy="104" r="3" fill="#d4a54a" />
            <circle cx="155" cy="104" r="3" fill="#d4a54a" />
            {/* Augenbrauen */}
            <path d="M98 78 Q 108 72 116 77" fill="none" stroke="#3a2224" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M124 77 Q 132 72 142 78" fill="none" stroke="#3a2224" strokeWidth="2.2" strokeLinecap="round" />
            {/* Augen */}
            <g className="reader__eyes">
              <ellipse cx="107" cy="90" rx="6.5" ry="4.5" fill="#fff7ee" />
              <ellipse cx="133" cy="90" rx="6.5" ry="4.5" fill="#fff7ee" />
              <circle cx="108" cy="90.5" r="3" fill="#3b2a2b" />
              <circle cx="134" cy="90.5" r="3" fill="#3b2a2b" />
              <circle cx="109" cy="89.5" r="1" fill="#fff" />
              <circle cx="135" cy="89.5" r="1" fill="#fff" />
              {/* Lider für das Blinzeln */}
              <g className="reader__lids">
                <rect x="99" y="84" width="17" height="12" rx="6" fill="url(#skin)" />
                <rect x="125" y="84" width="17" height="12" rx="6" fill="url(#skin)" />
              </g>
            </g>
            {/* Nase */}
            <path d="M119 96 Q 116 106 121 107" fill="none" stroke="#c48f6a" strokeWidth="1.6" strokeLinecap="round" />
            {/* Mund */}
            <path className="reader__mouth" d="M110 118 Q 120 126 130 118" fill="none" stroke="#a8515d" strokeWidth="2.4" strokeLinecap="round" />
            {/* Wangen */}
            <ellipse cx="98" cy="108" rx="6" ry="3.5" fill="#e6a08c" opacity="0.35" />
            <ellipse cx="142" cy="108" rx="6" ry="3.5" fill="#e6a08c" opacity="0.35" />
          </g>
        </g>
      </svg>
    </div>
  )
}
