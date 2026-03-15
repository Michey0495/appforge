import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PDF比較ツール',
  description: '2つのPDFをアップロードして差分を確認',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className="bg-white text-[#262626] font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
