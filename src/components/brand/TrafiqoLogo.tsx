/**
 * Trafiqo logo — faithful recreation in the brand palette (magenta / orange / green).
 *
 * This is a swap-in stand-in for the official asset. When the official PNG/SVG lands in
 * /context (or /public), replace the <TrafiqoMark /> body and/or the wordmark below — the
 * public API (variant / tone / showTagline / className) stays the same so nothing else changes.
 */

type LogoTone = 'dark' | 'light'
type LogoVariant = 'full' | 'mark' | 'wordmark'

interface TrafiqoLogoProps {
  variant?: LogoVariant
  tone?: LogoTone
  showTagline?: boolean
  className?: string
  /** Tailwind height class for the mark, e.g. "h-9". */
  markClassName?: string
  /** Tailwind text-size class for the wordmark, e.g. "text-2xl". */
  wordmarkClassName?: string
}

function TrafiqoMark({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      role="img"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="tq-tile" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#E34585" />
          <stop offset="1" stopColor="#D6206B" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="13" fill="url(#tq-tile)" />
      {/* Route / mobility path */}
      <path
        d="M13.5 35.5 C13.5 23 35 27 35 13"
        stroke="#FFFFFF"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Start node (green accent) */}
      <circle cx="13.5" cy="35.5" r="4.4" fill="#FFFFFF" />
      <circle cx="13.5" cy="35.5" r="2.4" fill="#1FA86B" />
      {/* Mid waypoint */}
      <circle cx="24.4" cy="24" r="2" fill="#FFFFFF" opacity="0.85" />
      {/* Destination pin (orange accent) */}
      <circle cx="35" cy="13" r="4.8" fill="#F5821F" />
      <circle cx="35" cy="13" r="2.1" fill="#FFFFFF" />
    </svg>
  )
}

export function TrafiqoLogo({
  variant = 'full',
  tone = 'dark',
  showTagline = false,
  className = '',
  markClassName = 'h-9 w-9',
  wordmarkClassName = 'text-2xl',
}: TrafiqoLogoProps) {
  const inkColor = tone === 'light' ? 'text-white' : 'text-ink'
  const accentColor = tone === 'light' ? 'text-brand-300' : 'text-brand-500'
  const taglineColor = tone === 'light' ? 'text-white/70' : 'text-ink-muted'

  if (variant === 'mark') {
    return <TrafiqoMark className={`${markClassName} ${className}`} />
  }

  const Wordmark = (
    <span className={`font-extrabold leading-none tracking-tight ${wordmarkClassName}`}>
      <span className={inkColor}>TRAFIQ</span>
      <span className={accentColor}>O</span>
    </span>
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

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <TrafiqoMark className={markClassName} />
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
