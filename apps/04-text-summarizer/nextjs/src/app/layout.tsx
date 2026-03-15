import type { Metadata } from 'next'
import './globals.css'

// メタデータ設定
export const metadata: Metadata = {
  title: 'テキスト要約・翻訳ツール',
  description: 'Anthropic API を使用したテキスト要約・翻訳ツール',
}

// ルートレイアウト
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
