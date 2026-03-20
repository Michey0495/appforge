export function Logo({ size = 'default' }: { size?: 'default' | 'large' }) {
  const iconSize = size === 'large' ? 28 : 20
  const textClass = size === 'large'
    ? 'text-[24px] font-bold tracking-tight'
    : 'text-[15px] font-semibold tracking-tight'

  return (
    <span className="inline-flex items-center gap-2">
      <img
        src="/appforge-icon.png"
        alt="AppForge"
        width={iconSize}
        height={iconSize}
        className="rounded-[3px]"
      />
      <span className={`${textClass} text-navy-800`}>
        App<span className="text-navy-400">Forge</span>
      </span>
    </span>
  )
}
