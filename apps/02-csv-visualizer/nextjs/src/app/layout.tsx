import type { Metadata } from 'next'
import './globals.css'

// メタデータ定義
export const metadata: Metadata = {
  title: 'CSV可視化ダッシュボード',
  description: 'CSVファイルをアップロードしてデータを可視化するダッシュボード',
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
