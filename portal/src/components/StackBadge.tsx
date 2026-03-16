import { TechStack, STACK_LABELS } from '../data/apps'

interface StackBadgeProps {
  stack: TechStack
  active?: boolean
  onClick?: () => void
}

export function StackBadge({ stack, active = false, onClick }: StackBadgeProps) {
  return (
    <span
      className={[
        'inline-block px-2.5 py-0.5 text-[11px] font-medium border rounded-sm transition-colors',
        active
          ? 'text-white bg-navy-700 border-navy-700'
          : 'text-gray-500 border-gray-200',
        onClick ? 'cursor-pointer' : '',
      ].join(' ')}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
    >
      {STACK_LABELS[stack]}
    </span>
  )
}
