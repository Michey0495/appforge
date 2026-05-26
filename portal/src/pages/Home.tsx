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

      <div className="mb-16 border border-gray-100 rounded-sm p-8">
        <h2 className="text-[13px] font-medium text-gray-500 tracking-wider uppercase mb-2">
          Deliverable Types
        </h2>
        <p className="text-[13px] text-gray-500 leading-relaxed mb-6">
          バイブコーディングで作る業務効率化ツールは、配布形態で4つに分けられる。
          AIに渡す命令文の出し方も形態ごとに違うので、最初にどれで作るかを決めてから依頼する。
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <DeliverableCard
            title="Webアプリ"
            tag="ブラウザで開くだけで動く"
            desc="1個のHTMLファイル or Next.js / React の SPA。社内のURLを共有すれば全員が即使える。配布も更新も最速。"
            prompt="ブラウザだけで動くWebアプリを作ってください。CDNでライブラリを読み込み、1個のHTMLファイルで完結させてください。"
            examples={['CSV可視化ダッシュボード', 'PDF比較', 'Markdownエディタ']}
          />
          <DeliverableCard
            title="デスクトップアプリ (Win/Mac)"
            tag="ローカルファイル直接アクセス"
            desc="Tauri / Electron で .exe / .dmg / .app にパッケージング。OS統合・ファイルシステム直接操作・常駐動作・オフライン処理が要るときに選ぶ。"
            prompt="Win/Mac向けのデスクトップアプリを作ってください。Tauri + React 構成で、配布は cargo tauri build で行います。"
            examples={['ZIP暗号化', 'ファイル一括リネーマー']}
          />
          <DeliverableCard
            title="Chrome拡張機能"
            tag="閲覧中ページを操作"
            desc="Manifest V3 の .zip / Chrome Web Store 公開。開いているページの DOM を読み書きしたい、ブラウザのツールバーから呼びたい、ショートカット起動したい場合に選ぶ。"
            prompt="Chrome拡張機能（Manifest V3）として作ってください。ツールバーアイコンクリックで起動、現在開いているタブに対して動作します。"
            examples={['フルページスクショ', 'Google Meet タイムスタンプ']}
          />
          <DeliverableCard
            title="CLIスクリプト"
            tag="ターミナルから自動化"
            desc="Node.js / Python の単一ファイル。cron や CI から定期実行したい、サーバー上で動かしたい、他のスクリプトから呼びたいときに選ぶ。"
            prompt="Node.js の単一ファイルスクリプトとして作ってください。引数で入力ファイルを受け取り、結果を標準出力に返します。"
            examples={['Slack絵文字集計', 'GitHubイシュー棚卸し']}
          />
        </div>
        <p className="text-[12px] text-gray-400 leading-relaxed mt-6">
          迷ったらまず Webアプリで作る。ファイル直接操作が要るならデスクトップ、ページ閲覧と紐付くなら拡張、定期実行ならCLI。
          複数形態を同居させるアプリは1パターンずつ別ディレクトリで実装する。
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
        <p className="text-center text-gray-400 py-20 text-sm">
          該当するアプリがありません
        </p>
      )}
    </div>
  )
}

interface DeliverableCardProps {
  title: string
  tag: string
  desc: string
  prompt: string
  examples: string[]
}

function DeliverableCard({ title, tag, desc, prompt, examples }: DeliverableCardProps) {
  return (
    <div className="border border-gray-100 rounded-sm p-5 bg-white">
      <div className="flex items-baseline justify-between gap-3 mb-1">
        <p className="text-[14px] font-semibold text-gray-800">{title}</p>
        <span className="text-[10px] text-gray-400 tracking-wide">{tag}</span>
      </div>
      <p className="text-[12px] text-gray-500 leading-relaxed mb-3">{desc}</p>
      <p className="text-[10px] font-medium text-gray-400 tracking-wider uppercase mb-1">命令の出し方</p>
      <pre className="bg-gray-50 border border-gray-100 rounded-sm p-3 text-[11px] text-gray-600 whitespace-pre-wrap leading-relaxed font-mono mb-3">
        {prompt}
      </pre>
      <p className="text-[10px] font-medium text-gray-400 tracking-wider uppercase mb-1">この集の例</p>
      <p className="text-[11px] text-gray-500">{examples.join(' / ')}</p>
    </div>
  )
}
