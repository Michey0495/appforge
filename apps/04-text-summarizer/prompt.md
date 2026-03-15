# テキスト要約・翻訳ツール 作成プロンプト

以下の要件でテキスト要約・翻訳ツールを作成してください。

- テキストエリアに長文を入力
- Anthropic API で要約（箇条書き / 段落形式を選択可能）
- 日本語→英語、英語→日本語の翻訳機能
- APIキーはクライアント側で入力する形式
- 処理中のローディング表示
- 結果のコピーボタン

## App features:
- Large textarea for input text
- API key input field (password type)
- Mode selection: 要約（箇条書き）, 要約（段落）, 日→英翻訳, 英→日翻訳
- Submit button
- Result display area with copy button
- Loading state during API call
- Character count display
- Calls Anthropic API directly from browser with 'anthropic-dangerous-direct-browser-access' header
- Model: 'claude-sonnet-4-20250514'

## Design rules (apply to ALL versions):
- White background, navy accent (#2c52a4)
- No emojis
- Japanese UI labels
- Clean, minimal design
- Font: 'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', sans-serif
- Comments in Japanese

## Version 1: html/index.html
- Single HTML file, self-contained
- Vanilla JS, no build tools
- Clean CSS (no frameworks, inline styles in <style> tag)

## Version 2: react-vite/
- React + Vite + TypeScript + Tailwind CSS

## Version 3: nextjs/
- Next.js App Router + TypeScript + Tailwind CSS
- 'use client' on page.tsx
