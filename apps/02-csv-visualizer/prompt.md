# CSV可視化ダッシュボード 生成プロンプト

CSVファイルをドラッグ&ドロップでアップロードすると、自動でデータを解析し、グラフと基本統計量を表示するダッシュボードアプリを作成してください。

## 機能要件
- CSVファイルのドラッグ&ドロップアップロード対応
- PapaParseによるCSV自動パース
- Chart.jsによるグラフ自動生成（棒グラフ、折れ線グラフ、円グラフ）
- グラフの軸に使うカラムを選択できるUI
- 基本統計量の表示（平均、中央値、最大値、最小値、標準偏差）
- レスポンシブデザイン

## デザインルール
- 白背景、ネイビーアクセント（#2c52a4）
- 絵文字は一切使用しない
- UIラベルは日本語
- クリーンでミニマルなデザイン
- フォント: 'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', sans-serif
- コメントは日本語

## 技術スタック
3つのバージョンを作成する:
1. HTML版: 単一HTMLファイル、CDNでライブラリ読み込み、Vanilla JS
2. React+Vite版: React + Vite + TypeScript + Tailwind CSS
3. Next.js版: Next.js App Router + TypeScript + Tailwind CSS
