# SalesBoard - 営業ダッシュボードツール

社内営業チーム向けのリアルタイムダッシュボードアプリケーション。Salesforce APIと連携し、案件進捗・売上実績・KPIを一画面で可視化する。

## 動作環境

- Node.js 20.x 以上
- PostgreSQL 15.x 以上
- Redis 7.x 以上

## セットアップ

### 1. リポジトリのクローン

```bash
git clone https://github.com/example-corp/salesboard.git
cd salesboard
```

### 2. 依存パッケージのインストール

```bash
npm install
```

### 3. 環境変数の設定

`.env.example` をコピーして `.env` を作成し、各値を設定する。

```bash
cp .env.example .env
```

主な環境変数:

| 変数名 | 説明 | 例 |
|--------|------|-----|
| DATABASE_URL | PostgreSQL接続文字列 | postgresql://user:pass@localhost:5432/salesboard |
| REDIS_URL | Redis接続文字列 | redis://localhost:6379 |
| SF_CLIENT_ID | Salesforce OAuth Client ID | 3MVG9... |
| SF_CLIENT_SECRET | Salesforce OAuth Client Secret | ******** |
| JWT_SECRET | JWT署名キー | ランダム文字列 |

### 4. データベースのマイグレーション

```bash
npm run db:migrate
npm run db:seed
```

### 5. 開発サーバーの起動

```bash
npm run dev
```

`http://localhost:3000` でアクセス可能。

## API仕様

### 認証

全てのAPIリクエストに `Authorization: Bearer {token}` ヘッダーが必要。

### エンドポイント一覧

```
POST   /api/auth/login          ログイン
POST   /api/auth/refresh        トークン更新
GET    /api/dashboard/summary   ダッシュボードサマリー
GET    /api/deals               案件一覧
GET    /api/deals/:id           案件詳細
POST   /api/deals               案件作成
PUT    /api/deals/:id           案件更新
GET    /api/reports/monthly     月次レポート
GET    /api/reports/pipeline    パイプラインレポート
GET    /api/users/me            ログインユーザー情報
```

### レスポンス形式

```json
{
  "status": "success",
  "data": { ... },
  "pagination": {
    "total": 100,
    "page": 1,
    "per_page": 20
  }
}
```

エラー時:

```json
{
  "status": "error",
  "code": "UNAUTHORIZED",
  "message": "認証トークンが無効です"
}
```

## ディレクトリ構成

```
salesboard/
  src/
    api/            APIルーティングとコントローラー
    services/       ビジネスロジック
    models/         データモデル定義
    middleware/     認証・ログ・エラーハンドリング
    utils/          ユーティリティ関数
    config/         設定ファイル
  client/
    components/     Reactコンポーネント
    hooks/          カスタムフック
    pages/          ページコンポーネント
    styles/         CSSモジュール
  prisma/
    schema.prisma   Prismaスキーマ
    migrations/     マイグレーションファイル
  tests/
    unit/           ユニットテスト
    integration/    統合テスト
    e2e/            E2Eテスト
```

## 開発ガイドライン

### ブランチ運用

- `main` - 本番環境にデプロイされるブランチ
- `develop` - 開発統合ブランチ
- `feature/*` - 機能開発用ブランチ
- `hotfix/*` - 緊急修正用ブランチ

### コミットメッセージ

Conventional Commits に準拠する。

```
feat: 案件フィルター機能を追加
fix: ダッシュボードの集計値が0になる不具合を修正
docs: APIドキュメントを更新
refactor: レポート生成ロジックをサービス層に移動
```

### テスト

```bash
npm run test            # ユニットテスト
npm run test:e2e        # E2Eテスト
npm run test:coverage   # カバレッジレポート生成
```

カバレッジ目標: ユニットテスト 80%以上

## ライセンス

社内利用限定。無断転載・再配布を禁止する。

## 問い合わせ

技術開発部 プロダクトチーム: product-team@example-corp.co.jp
