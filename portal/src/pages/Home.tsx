import { useState } from 'react'
import { apps, Category } from '../data/apps'
import { AppCard } from '../components/AppCard'
import { CategoryFilter } from '../components/CategoryFilter'
import { Logo } from '../components/Logo'

export function Home() {
  const [category, setCategory] = useState<Category>('all')

  const filtered = category === 'all' ? apps : apps.filter((a) => a.category === category)

  return (
    <div>
      <div className="mb-16">
        <div className="mb-5">
          <Logo size="large" />
        </div>
        <p className="text-[14px] text-gray-400 max-w-xl leading-relaxed">
          AI駆動開発で構築した{apps.length}本の実用アプリ。
          Planモードで設計を壁打ちし、AIとラリーしながら実装する開発フローのデモ集。
        </p>
      </div>

      <div className="mb-8">
        <CategoryFilter selected={category} onSelect={setCategory} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((app) => (
          <AppCard key={app.id} app={app} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-gray-300 py-20 text-sm">
          該当するアプリがありません
        </p>
      )}
    </div>
  )
}
