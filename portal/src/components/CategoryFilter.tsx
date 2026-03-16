import { Category, CATEGORY_LABELS } from '../data/apps'

interface CategoryFilterProps {
  selected: Category
  onSelect: (category: Category) => void
}

const CATEGORIES: Category[] = [
  'all', 'document', 'data', 'image', 'ai-text', 'utility', 'security', 'workflow', 'dev-tool',
]

export function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {CATEGORIES.map((cat) => (
        <button
          key={cat}
          onClick={() => onSelect(cat)}
          className={[
            'px-3.5 py-1.5 text-[12px] font-medium tracking-wide rounded-sm transition-colors',
            selected === cat
              ? 'bg-navy-700 text-white'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50',
          ].join(' ')}
        >
          {CATEGORY_LABELS[cat]}
        </button>
      ))}
    </div>
  )
}
