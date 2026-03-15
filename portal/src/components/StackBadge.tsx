import { TechStack, STACK_LABELS } from '../data/apps'

interface StackBadgeProps {
  stack: TechStack
  active?: boolean
  onClick?: () => void
}

const STACK_COLORS: Record<TechStack, { idle: string; active: string }> = {
  nextjs: {
    idle: 'text-gray-400 border-gray-200',
    active: 'text-white bg-gray-800 border-gray-800',
  },
  html: {
    idle: 'text-gray-400 border-gray-200',
    active: 'text-white bg-amber-600 border-amber-600',
  },
  'react-vite': {
    idle: 'text-gray-400 border-gray-200',
    active: 'text-white bg-sky-600 border-sky-600',
  },
  'chrome-ext': {
    idle: 'text-gray-400 border-gray-200',
    active: 'text-white bg-emerald-600 border-emerald-600',
  },
  script: {
    idle: 'text-gray-400 border-gray-200',
    active: 'text-white bg-violet-600 border-violet-600',
  },
}

export function StackBadge({ stack, active = false, onClick }: StackBadgeProps) {
  const colors = STACK_COLORS[stack]
  return (
    <span
      className={[
        'inline-block px-2.5 py-0.5 text-[11px] font-medium border rounded-sm transition-colors',
        active ? colors.active : colors.idle,
        onClick ? 'cursor-pointer' : '',
      ].join(' ')}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
    >
      {STACK_LABELS[stack]}
    </span>
  )
}
