# パスワード生成・強度チェック 作成プロンプト

以下の要件でパスワード生成・強度チェックツールを作成してください。

- zxcvbn CDN読み込みでリアルタイム強度判定
- 強度バー（5段階: 0-4、ネイビー系グラデーション）
- クラック推定時間表示
- zxcvbnの警告メッセージ表示
- 生成セクション: 長さスライダー(8-64)、チェックボックス（大文字/小文字/数字/記号）
- 生成ボタン、コピーボタン
- エントロピー（ビット数）表示

## Design rules:
- White background (#ffffff), navy accent (#1e3461)
- No emojis
- Japanese UI labels
- Font: 'Inter', 'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', sans-serif
- Border radius: 2px

## Version 1: html/index.html
- Single HTML file, self-contained
- zxcvbn from CDN
