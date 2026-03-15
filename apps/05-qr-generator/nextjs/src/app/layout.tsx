import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'QRコード一括生成ツール',
  description: 'URLやテキストからQRコードをまとめて生成',
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
