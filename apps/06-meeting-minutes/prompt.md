# 議事録AI整形ツール 作成プロンプト

以下の要件で議事録AI整形ツールを作成してください。

- チャットログ（Zoom/Teams/Slack形式）をペーストする大きなテキストエリア
- Anthropic APIで整形処理
- 3つのモード: 議事録整形、決定事項抽出、TODO抽出
- APIキーはクライアント側で入力する形式
- 処理中のローディング表示
- 結果のコピーボタン

## App features:
- Large textarea for chat log input
- API key input field (password type)
- Mode buttons: 議事録整形, 決定事項抽出, TODO抽出
- Result display area with copy button
- Loading state during API call
- Calls Anthropic API directly from browser with 'anthropic-dangerous-direct-browser-access' header
- Model: 'claude-sonnet-4-20250514'

## Design rules:
- White background (#ffffff), navy accent (#1e3461)
- No emojis
- Japanese UI labels
- Font: 'Inter', 'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', sans-serif
- Border radius: 2px
- Comments in Japanese

## Version 1: html/index.html
- Single HTML file, self-contained
- Vanilla JS, no build tools
