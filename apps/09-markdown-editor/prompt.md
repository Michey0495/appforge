# Markdownライブプレビュー 作成プロンプト

以下の要件でMarkdownエディタを作成してください。

- marked CDN読み込みでMarkdownパース
- highlight.js CDN読み込みでコードハイライト
- 分割ビュー: 左にエディタ、右にプレビュー
- 入力時リアルタイムプレビュー
- ツールバー: Bold, Italic, Code, Link, Heading, List
- ダークモード切替
- HTML出力エクスポート
- localStorageへの自動保存
- 文字数・単語数カウント

## Design rules:
- White background (#ffffff), navy accent (#1e3461)
- No emojis
- Japanese UI labels
- Font: 'Inter', 'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', sans-serif
- Border radius: 2px

## Version 1: html/index.html
- Single HTML file, self-contained
- marked and highlight.js from CDN
