# フルページスクリーンショット Chrome拡張 生成プロンプト

開いているページ全体を1枚のPNGとして保存するChrome拡張を作ってください。

## 機能要件
- ツールバーアイコンクリックで起動
- ページ全体（スクロール領域含む）を1枚化
- lazy-load画像のプリロード待機
- 固定ヘッダー・footerの重複描画を除去
- PNG / JPG / PDF 出力切替
- 自動命名: {日付}_{ホスト名}_{タイトル}.png
- キーボードショートカット Alt+Shift+S

## 技術スタック
- Manifest V3
- chrome.tabs.captureVisibleTab + スクロール+合成
- jsPDF（PDF出力時）
- background page不使用（service workerのみ）

## デザインルール
- ポップアップは200x300px程度
- 白背景、ネイビーアクセント
- 絵文字は使用しない
