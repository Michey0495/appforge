# QRコード一括生成ツール 作成プロンプト

以下の要件で QRコード一括生成ツールを作成してください。

- テキストエリアに1行1URLで入力
- CSVファイルからの一括読み込みにも対応
- qrcode.js でQRコードを生成
- 色（前景色・背景色）のカスタマイズ
- サイズ（ピクセル）の調整
- 個別ダウンロード & ZIP一括ダウンロード

## App features:
- Textarea input (one URL/text per line)
- CSV file upload for batch import
- QR code generation using qrcode library (npm: qrcode for React/Next, CDN for HTML)
- Foreground color picker (default: #262626)
- Background color picker (default: #ffffff)
- Size slider (128-512px, default 256)
- Generate button
- Grid display of generated QR codes
- Individual PNG download per QR
- Bulk ZIP download using JSZip
- Clear all button

## Design rules (apply to ALL versions):
- White background, navy accent (#2c52a4)
- No emojis
- Japanese UI labels
- Clean, minimal design
- Font: 'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', sans-serif
- Comments in Japanese

## Version 1: html/index.html
- Single HTML file
- Use CDN: qrcodejs (https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js) and JSZip
- Vanilla JS
- For the QR library in HTML version, use the QRCode constructor from qrcodejs: new QRCode(element, options)

## Version 2: react-vite/
Files: package.json, vite.config.ts, tsconfig.json, postcss.config.js, tailwind.config.js, index.html, src/main.tsx, src/App.tsx, src/index.css
- React + Vite + TypeScript + Tailwind
- Dependencies: react, react-dom, qrcode, @types/qrcode, jszip, file-saver, @types/file-saver
- Use qrcode library's toDataURL() method for React version

## Version 3: nextjs/
Files: package.json, next.config.ts, tsconfig.json, postcss.config.mjs, tailwind.config.ts, src/app/layout.tsx, src/app/page.tsx, src/app/globals.css
- Next.js App Router + TypeScript + Tailwind
- 'use client' on page.tsx
- Dependencies: next, react, react-dom, qrcode, @types/qrcode, jszip, file-saver, @types/file-saver
