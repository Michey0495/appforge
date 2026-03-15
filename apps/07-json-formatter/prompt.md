# JSON / APIレスポンス整形ツール 作成プロンプト

以下の要件でJSON整形ツールを作成してください。

- 2モード: Format/Validate と Diff
- Format モード: テキストエリア入力、整形/圧縮/検証ボタン、ツリービュー切替
- Diff モード: 2つのテキストエリアを並列配置、差分ボタン、色分け差分出力
- JSONPath検索
- 行番号付き出力
- シンタックスハイライト（キー:青、文字列:緑、数値:橙、真偽値:紫）

## Design rules:
- White background (#ffffff), navy accent (#1e3461)
- No emojis
- Japanese UI labels
- Font: 'Inter', 'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', sans-serif
- Border radius: 2px
- No external libraries, pure vanilla JS

## Version 1: html/index.html
- Single HTML file, self-contained
- Vanilla JS, no build tools
