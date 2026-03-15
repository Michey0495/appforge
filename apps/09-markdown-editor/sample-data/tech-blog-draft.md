# Claude APIを使った社内FAQボットの開発記録

## 背景

社内のヘルプデスクには月間約1,200件の問い合わせが届く。その7割は過去に回答済みの内容と重複していた。FAQページは存在するが、検索性が低く、結局Slackで質問するケースが大半を占めていた。

この状況を改善するため、Claude APIを活用した社内FAQボットを開発した。自然言語で質問を投げると、社内ナレッジベースから適切な回答を返す仕組みだ。

## アーキテクチャ

```
+----------------+     +----------------+     +------------------+
|                |     |                |     |                  |
|  Slack Bot     +---->+  API Server    +---->+  Claude API      |
|  (Bolt SDK)   |     |  (Express)     |     |  (claude-3.5)    |
|                |     |                |     |                  |
+----------------+     +-------+--------+     +------------------+
                               |
                       +-------v--------+
                       |                |
                       |  Vector DB     |
                       |  (Pinecone)    |
                       |                |
                       +-------^--------+
                               |
                       +-------+--------+
                       |                |
                       |  Knowledge     |
                       |  Base (S3)     |
                       |                |
                       +----------------+
```

処理フロー:

1. ユーザーがSlackでボットにメンションして質問
2. API Serverが質問文をEmbeddingに変換
3. Pineconeで類似ドキュメントを検索（上位5件）
4. 検索結果をコンテキストとしてClaude APIに送信
5. 生成された回答をSlackに返信

## 実装のポイント

### Embeddingの前処理

社内ドキュメントをそのままEmbeddingに変換すると精度が出なかった。ドキュメントを意味のある単位でチャンク分割する処理を入れたところ、回答精度が大幅に向上した。

```typescript
function splitIntoChunks(document: string, maxTokens: number = 512): string[] {
  const paragraphs = document.split(/\n\n+/)
  const chunks: string[] = []
  let currentChunk = ''

  for (const paragraph of paragraphs) {
    const combined = currentChunk + '\n\n' + paragraph
    if (estimateTokens(combined) > maxTokens) {
      if (currentChunk) chunks.push(currentChunk.trim())
      currentChunk = paragraph
    } else {
      currentChunk = combined
    }
  }

  if (currentChunk) chunks.push(currentChunk.trim())
  return chunks
}
```

### プロンプト設計

Claude APIに渡すシステムプロンプトで、回答の品質を制御している。特に「わからない場合は正直にわからないと答える」指示が重要だった。ハルシネーション防止に直結する。

```typescript
const systemPrompt = `あなたは社内ヘルプデスクのアシスタントです。
以下のルールに従って回答してください。

- 提供されたコンテキスト内の情報のみを使って回答する
- コンテキストに該当する情報がない場合は「該当する情報が見つかりませんでした」と回答する
- 回答には参照元ドキュメントのタイトルを明記する
- 推測や一般的な知識での補完はしない`
```

### レスポンス速度の改善

初期バージョンでは回答まで平均8秒かかっていた。Streaming APIとキャッシュの導入で3秒以下に短縮できた。

```typescript
const stream = await anthropic.messages.stream({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 1024,
  system: systemPrompt,
  messages: [{ role: 'user', content: userQuery }]
})

for await (const chunk of stream) {
  // Slackメッセージをリアルタイム更新
  await updateSlackMessage(channel, ts, accumulatedText)
}
```

## パフォーマンス比較

導入前後の比較（1ヶ月間の計測結果）:

| 指標 | 導入前 | 導入後 | 変化 |
|------|--------|--------|------|
| 月間問い合わせ数 | 1,200件 | 480件 | -60% |
| 平均回答時間 | 4.2時間 | 2.8秒 | -99.9% |
| ヘルプデスク工数 | 160時間/月 | 62時間/月 | -61% |
| 回答満足度 | 72% | 88% | +16pt |
| 自動回答率 | - | 73% | - |

ヘルプデスク担当者が定型的な質問から解放され、複雑な問い合わせや改善活動に時間を使えるようになった。

## 苦労した点

Embeddingの品質がそのまま回答品質に直結するため、チャンク分割の粒度調整に時間がかかった。最初は固定長で分割していたが、文の途中で切れるケースが多く、段落単位の分割に変更した。

もう一つは、社内用語の扱い。略語や部署名の表記揺れが検索精度を下げていた。同義語辞書を作成してクエリ拡張する仕組みを追加したところ、検索ヒット率が15%向上した。

## 今後の展望

現時点ではSlack経由の質問応答のみだが、次のステップとしてドキュメントの自動更新検知と再Embedding化のパイプラインを構築する予定。ナレッジベースが常に最新の状態を保てるようにすることで、回答精度の持続的な維持を目指す。

---

技術開発部 山田太郎
2026年3月 執筆
