import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '画像一括変換ツール',
  description: '複数画像のリサイズ・フォーマット変換・圧縮をブラウザ内で処理',
}

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
