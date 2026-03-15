# カラーパレット生成 作成プロンプト

以下の要件でカラーパレット生成ツールを作成してください。

- カラーピッカーでベースカラー指定
- 配色パターン生成: 補色、類似色、トライアド、スプリットコンプリメンタリー
- 各色にスウォッチ・HEX・RGB・HSL値を表示
- WCAGコントラストチェッカー: テキスト色+背景色の入力でコントラスト比とAA/AAAパス判定
- クリックで色コピー
- CSS Custom Properties形式でエクスポート
- 色計算はすべてpure JS（HSL変換含む）

## Design rules:
- White background (#ffffff), navy accent (#1e3461)
- No emojis
- Japanese UI labels
- Font: 'Inter', 'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', sans-serif
- Border radius: 2px

## Version 1: html/index.html
- Single HTML file, self-contained
- No external libraries
