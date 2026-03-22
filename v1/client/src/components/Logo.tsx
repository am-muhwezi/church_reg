interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  /** 'dark' = on dark/black bg (logo on black header), 'light' = on light surface */
  theme?: 'dark' | 'light'
}

export default function Logo({ size = 'md', theme = 'dark' }: LogoProps) {
  const heights: Record<string, string> = {
    sm: 'h-10',
    md: 'h-14',
    lg: 'h-20',
  }

  if (theme === 'dark') {
    // Logo PNG has amber text — works directly on dark backgrounds
    return (
      <img
        src="/logo.png"
        alt="Manifest Fellowship Kenya"
        className={`${heights[size]} w-auto object-contain`}
        draggable={false}
      />
    )
  }

  // On light backgrounds, the logo's amber text still reads well.
  // Add a subtle tint via CSS filter if needed, or just render as-is.
  return (
    <div className="flex items-center gap-2">
      <img
        src="/logo.png"
        alt="Manifest Fellowship Kenya"
        className={`${heights[size]} w-auto object-contain`}
        draggable={false}
      />
    </div>
  )
}
