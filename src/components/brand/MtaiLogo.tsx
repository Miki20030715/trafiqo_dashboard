/**
 * MTAI — Miracle Traffic AI — partner mark (stand-in recreation).
 * Used small, only in the "technology & deployment partner" area.
 * Swap the mark/text when the official asset is added to /context.
 */

interface MtaiLogoProps {
  tone?: 'dark' | 'light'
  showLabel?: boolean
  className?: string
}

export function MtaiLogo({ tone = 'dark', showLabel = true, className = '' }: MtaiLogoProps) {
  const textColor = tone === 'light' ? 'text-white' : 'text-ink-soft'

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <svg
        viewBox="0 0 32 32"
        className="h-7 w-7 shrink-0"
        role="img"
        aria-label="Miracle Traffic AI"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="32" height="32" rx="9" fill="#0E2A47" />
        {/* three "lanes" in the brand-adjacent traffic palette */}
        <rect x="7" y="8" width="3.4" height="16" rx="1.7" fill="#2E7DD7" />
        <rect x="14.3" y="8" width="3.4" height="16" rx="1.7" fill="#1FA86B" />
        <rect x="21.6" y="8" width="3.4" height="16" rx="1.7" fill="#F5821F" />
        <circle cx="23.3" cy="11" r="2.4" fill="#E5384B" />
      </svg>
      {showLabel && (
        <span className={`text-sm font-semibold leading-tight ${textColor}`}>
          Miracle Traffic AI
        </span>
      )}
    </div>
  )
}

export default MtaiLogo
