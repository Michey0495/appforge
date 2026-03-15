export function Logo({ size = 'default' }: { size?: 'default' | 'large' }) {
  const iconSize = size === 'large' ? 28 : 20
  const textClass = size === 'large'
    ? 'text-[24px] font-bold tracking-tight'
    : 'text-[15px] font-semibold tracking-tight'

  return (
    <span className="inline-flex items-center gap-2">
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="32" height="32" rx="3" fill="#1e3461" />
        <path d="M10 21h12l-2-4H12l-2 4z" fill="#fff" opacity="0.45" />
        <path d="M12 17h8l-2-4h-4l-2 4z" fill="#fff" opacity="0.7" />
        <path d="M14 13h4l-2-4-2 4z" fill="#fff" />
        <rect x="14.5" y="22" width="3" height="2" rx="0.5" fill="#fff" opacity="0.35" />
      </svg>
      <span className={`${textClass} text-navy-800`}>
        App<span className="text-navy-400">Forge</span>
      </span>
    </span>
  )
}
