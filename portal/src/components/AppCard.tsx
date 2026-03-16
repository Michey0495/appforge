import { Link } from 'react-router-dom'
import { AppInfo } from '../data/apps'
import { StackBadge } from './StackBadge'

interface AppCardProps {
  app: AppInfo
}

export function AppCard({ app }: AppCardProps) {
  return (
    <Link
      to={`/app/${app.id}`}
      className="group block border border-gray-200 rounded-sm card-hover bg-white"
    >
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[11px] font-mono text-gray-400 tabular-nums">
            {String(app.number).padStart(2, '0')}
          </span>
          <div className="flex items-center gap-1.5">
            {app.usesAI && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-sm">
                AI
              </span>
            )}
            <span className="text-[10px] font-medium text-gray-400 tracking-wider uppercase">
              {app.categoryLabel}
            </span>
          </div>
        </div>

        <h3 className="text-[15px] font-semibold text-gray-800 mb-1.5 group-hover:text-navy-700 transition-colors">
          {app.name}
        </h3>
        <p className="text-[12px] text-gray-500 leading-relaxed mb-4 line-clamp-2">
          {app.description}
        </p>

        <div className="flex gap-1">
          {app.stacks.map((stack) => (
            <StackBadge key={stack} stack={stack} />
          ))}
        </div>
      </div>
    </Link>
  )
}
