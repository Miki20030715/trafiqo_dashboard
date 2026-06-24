/**
 * TrafiqoLogo — faithful SVG recreation of the official Trafiqo brand.
 *
 * The mark uses the same 3-sector donut motif as the Q/O letters in the
 * official wordmark: green top-left · blue top-right · yellow bottom.
 * The wordmark recreates the full TRAFIQO lettering with all embellishments.
 *
 * Drop the official PNG/SVG into /public/trafiqo-logo.svg and swap the
 * <TrafiqoWordmarkSvg> body for <img src={base+"trafiqo-logo.svg"}> —
 * the public API (variant/tone/showTagline/className) stays the same.
 */

type LogoTone = 'dark' | 'light'
type LogoVariant = 'full' | 'mark' | 'wordmark'

interface TrafiqoLogoProps {
  variant?: LogoVariant
  tone?: LogoTone
  showTagline?: boolean
  className?: string
  markClassName?: string
  wordmarkClassName?: string
}

/**
 * Three-sector donut mark — the Q motif from the official wordmark.
 * Blue top-right · green top-left · yellow bottom, transparent centre.
 * Fixed pixel sizes via Tailwind h-* classes, never shrinks on zoom.
 */
function TrafiqoMark({ className = 'h-9 w-9', blue = '#1B72E8' }: { className?: string; blue?: string }) {
  // cx=45 cy=45 r_outer=44 r_inner=18
  // outer vertices: top(45,1) lo-right(83,67) lo-left(7,67)
  // inner vertices: top(45,27) lo-right(61,54) lo-left(29,54)
  return (
    <svg
      viewBox="0 0 90 90"
      className={className}
      role="img"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* blue sector — top-right */}
      <path d="M45,27 L45,1 A44,44 0 0,1 83,67 L61,54 A18,18 0 0,0 45,27 Z" fill={blue} />
      {/* green sector — top-left */}
      <path d="M29,54 L7,67 A44,44 0 0,1 45,1 L45,27 A18,18 0 0,0 29,54 Z" fill="#2DA84A" />
      {/* yellow sector — bottom */}
      <path d="M61,54 L83,67 A44,44 0 0,1 7,67 L29,54 A18,18 0 0,0 61,54 Z" fill="#F8B500" />
      {/* Q-tail: yellow rotated bar at lower-right */}
      <rect x="75" y="62" width="20" height="11" rx="4" fill="#F8B500" transform="rotate(45 85 67)" />
    </svg>
  )
}

/**
 * Full TRAFIQO wordmark as SVG paths.
 * Each letter carries its official embellishment:
 *   T – red dot at stem/crossbar junction
 *   R – green road-arch bowl with white dashed centre-line
 *   A – solid blue
 *   F – solid blue
 *   I – red dot on top
 *   Q – three-sector donut + yellow pointer tail
 *   O – three-sector donut
 */
function TrafiqoWordmarkSvg({ blue = '#1B72E8', className = '' }: { blue?: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 504 90"
      overflow="visible"
      className={className}
      role="img"
      aria-label="TRAFIQO"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* ── T (0–57) ───────────────────────────────────────── */}
      <rect x="0"  y="0"  width="57" height="22" fill={blue} />
      <rect x="20" y="0"  width="17" height="90" fill={blue} />
      <circle cx="28" cy="22" r="11" fill="#EA4335" />

      {/* ── R (65–141) ─────────────────────────────────────── */}
      <rect x="65" y="0"  width="17" height="90" fill={blue} />
      <rect x="65" y="0"  width="62" height="22" fill={blue} />
      {/* green road-arch bowl */}
      <path d="M82,22 H119 Q141,22 141,44 Q141,66 119,66 H82 Z" fill="#2DA84A" />
      {/* white road centre-line dashes */}
      <line x1="130" y1="27" x2="130" y2="61"
            stroke="white" strokeWidth="3.5" strokeDasharray="7 5" strokeLinecap="round" />
      {/* diagonal leg */}
      <path d="M82,66 L100,66 L142,90 L124,90 Z" fill={blue} />

      {/* ── A (149–215) ────────────────────────────────────── */}
      <polygon points="182,0 194,0 215,90 201,90" fill={blue} />
      <polygon points="182,0 170,0 149,90 163,90" fill={blue} />
      <rect x="158" y="57" width="46" height="18" fill={blue} />

      {/* ── F (223–278) ────────────────────────────────────── */}
      <rect x="223" y="0"  width="17" height="90" fill={blue} />
      <rect x="223" y="0"  width="55" height="22" fill={blue} />
      <rect x="223" y="44" width="43" height="18" fill={blue} />

      {/* ── I (286–308) ────────────────────────────────────── */}
      <rect x="291" y="0" width="17" height="90" fill={blue} />
      {/* red dot above stem */}
      <circle cx="299" cy="0" r="14" fill="#EA4335" />

      {/* ── Q (316–408)  cx=362 cy=45 r_out=44 r_in=18 ────── */}
      {/* outer vertices: top(362,1) lo-right(400,67) lo-left(324,67) */}
      {/* inner vertices: top(362,27) lo-right(380,54) lo-left(346,54) */}
      <path d="M362,27 L362,1  A44,44 0 0,1 400,67 L380,54 A18,18 0 0,0 362,27 Z" fill={blue}     />
      <path d="M346,54 L324,67 A44,44 0 0,1 362,1  L362,27 A18,18 0 0,0 346,54 Z" fill="#2DA84A"  />
      <path d="M380,54 L400,67 A44,44 0 0,1 324,67 L346,54 A18,18 0 0,0 380,54 Z" fill="#F8B500"  />
      {/* Q pointer tail */}
      <rect x="388" y="67" width="26" height="13" rx="5" fill="#F8B500" transform="rotate(45 401 73)" />

      {/* ── O (416–504)  cx=460 cy=45 r_out=44 r_in=18 ────── */}
      {/* outer vertices: top(460,1) lo-right(498,67) lo-left(422,67) */}
      {/* inner vertices: top(460,27) lo-right(476,54) lo-left(444,54) */}
      <path d="M460,27 L460,1  A44,44 0 0,1 498,67 L476,54 A18,18 0 0,0 460,27 Z" fill={blue}     />
      <path d="M444,54 L422,67 A44,44 0 0,1 460,1  L460,27 A18,18 0 0,0 444,54 Z" fill="#2DA84A"  />
      <path d="M476,54 L498,67 A44,44 0 0,1 422,67 L444,54 A18,18 0 0,0 476,54 Z" fill="#F8B500"  />
    </svg>
  )
}

export function TrafiqoLogo({
  variant = 'full',
  tone = 'dark',
  showTagline = false,
  className = '',
  markClassName = 'h-9 w-9',
  wordmarkClassName = 'h-7',
}: TrafiqoLogoProps) {
  const blue = tone === 'light' ? '#FFFFFF' : '#1B72E8'
  const taglineColor = tone === 'light' ? 'text-white/70' : 'text-ink-muted'

  if (variant === 'mark') {
    return <TrafiqoMark className={`${markClassName} ${className}`} blue={blue} />
  }

  const Wordmark = (
    <TrafiqoWordmarkSvg
      blue={blue}
      className={wordmarkClassName}
    />
  )

  if (variant === 'wordmark') {
    return (
      <div className={`inline-flex flex-col ${className}`}>
        {Wordmark}
        {showTagline && (
          <span className={`mt-1 text-[0.65rem] font-medium uppercase tracking-[0.14em] ${taglineColor}`}>
            Smarter choices. Smoother cities.
          </span>
        )}
      </div>
    )
  }

  // variant === 'full'
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <TrafiqoMark className={markClassName} blue={blue} />
      <div className="flex flex-col">
        {Wordmark}
        {showTagline && (
          <span className={`mt-0.5 text-[0.62rem] font-medium uppercase tracking-[0.14em] ${taglineColor}`}>
            Smarter choices. Smoother cities.
          </span>
        )}
      </div>
    </div>
  )
}

export default TrafiqoLogo
