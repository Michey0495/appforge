'use client'

import { useState, useCallback } from 'react'

// 処理モードの型定義
type ProcessMode = 'summary-bullet' | 'summary-paragraph' | 'ja-to-en' | 'en-to-ja'

// モード選択肢の定義
const MODE_OPTIONS: { value: ProcessMode; label: string }[] = [
  { value: 'summary-bullet', label: '要約（箇条書き）' },
  { value: 'summary-paragraph', label: '要約（段落）' },
  { value: 'ja-to-en', label: '日 → 英 翻訳' },
  { value: 'en-to-ja', label: '英 → 日 翻訳' },
]

// モードに応じたプロンプトを生成
function buildPrompt(text: string, mode: ProcessMode): string {
  const prompts: Record<ProcessMode, string> = {
    'summary-bullet': `以下のテキストを箇条書きで要約してください。重要なポイントを漏れなく抽出し、簡潔にまとめてください。\n\n${text}`,
    'summary-paragraph': `以下のテキストを段落形式で要約してください。原文の要点を保ちつつ、読みやすい文章にまとめてください。\n\n${text}`,
    'ja-to-en': `以下の日本語テキストを英語に翻訳してください。自然で読みやすい英語にしてください。\n\n${text}`,
    'en-to-ja': `以下の英語テキストを日本語に翻訳してください。自然で読みやすい日本語にしてください。\n\n${text}`,
  }
  return prompts[mode]
}

// メインページコンポーネント
export default function Home() {
  const [apiKey, setApiKey] = useState('')
  const [inputText, setInputText] = useState('')
  const [mode, setMode] = useState<ProcessMode>('summary-bullet')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  // API呼び出し処理
  const handleSubmit = useCallback(async () => {
    setError('')
    setResult('')

    // バリデーション
    if (!apiKey.trim()) {
      setError('APIキーを入力してください。')
      return
    }
    if (!inputText.trim()) {
      setError('テキストを入力してください。')
      return
    }

    setLoading(true)

    try {
      const prompt = buildPrompt(inputText.trim(), mode)

      // Anthropic API 呼び出し（ブラウザから直接）
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey.trim(),
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          messages: [{ role: 'user', content: prompt }],
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage =
          (errorData as { error?: { message?: string } })?.error?.message ||
          `APIエラー (${response.status})`
        throw new Error(errorMessage)
      }

      const data = await response.json()
      const resultText =
        (data as { content?: { text?: string }[] })?.content?.[0]?.text ||
        '結果を取得できませんでした。'
      setResult(resultText)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'リクエスト中にエラーが発生しました。')
    } finally {
      setLoading(false)
    }
  }, [apiKey, inputText, mode])

  // コピー処理
  const handleCopy = useCallback(async () => {
    if (!result) return

    try {
      await navigator.clipboard.writeText(result)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // フォールバック処理
      const textarea = document.createElement('textarea')
      textarea.value = result
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [result])

  return (
    <div className="min-h-screen bg-white">
      {/* ヘッダー */}
      <header className="bg-navy text-white py-5 text-center">
        <h1 className="text-xl font-semibold tracking-wide">テキスト要約・翻訳ツール</h1>
        <p className="text-sm mt-1 opacity-85">Anthropic API を使用した要約・翻訳</p>
      </header>

      <main className="max-w-[860px] mx-auto px-5 py-8 pb-16">
        {/* APIキー入力 */}
        <div className="mb-7">
          <label htmlFor="apiKey" className="block text-sm font-semibold text-navy mb-2">
            APIキー
          </label>
          <input
            type="password"
            id="apiKey"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-ant-... を入力"
            autoComplete="off"
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-navy focus:ring-2 focus:ring-navy/10"
          />
        </div>

        {/* テキスト入力 */}
        <div className="mb-7">
          <label htmlFor="inputText" className="block text-sm font-semibold text-navy mb-2">
            入力テキスト
          </label>
          <textarea
            id="inputText"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="要約または翻訳したいテキストを入力してください"
            className="w-full min-h-[200px] px-3.5 py-3 border border-gray-300 rounded-md text-sm leading-7 focus:outline-none focus:border-navy focus:ring-2 focus:ring-navy/10"
          />
          <div className="text-right text-xs text-gray-400 mt-1">
            {inputText.length.toLocaleString()} 文字
          </div>
        </div>

        {/* モード選択 */}
        <div className="mb-7">
          <span className="block text-sm font-semibold text-navy mb-2">処理モード</span>
          <div className="flex flex-wrap gap-2">
            {MODE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setMode(option.value)}
                className={`px-4 py-2 border rounded-md text-sm transition-colors ${
                  mode === option.value
                    ? 'bg-navy border-navy text-white'
                    : 'bg-white border-gray-300 text-gray-500 hover:border-navy hover:text-navy'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* 実行ボタン */}
        <div className="mb-7">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="inline-flex items-center justify-center px-9 py-3 bg-navy text-white border-none rounded-md text-[15px] font-semibold min-w-[160px] hover:bg-navy-dark disabled:opacity-55 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <span className="spinner mr-2" />
                処理中...
              </>
            ) : (
              '実行'
            )}
          </button>
          {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
        </div>

        {/* 結果表示 */}
        {result && (
          <div className="mb-7">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-navy">結果</span>
              <button
                onClick={handleCopy}
                className={`px-4 py-1.5 border rounded-md text-xs transition-colors ${
                  copied
                    ? 'bg-navy border-navy text-white'
                    : 'bg-white border-gray-300 text-gray-500 hover:border-navy hover:text-navy'
                }`}
              >
                {copied ? 'コピー済み' : 'コピー'}
              </button>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4 text-sm leading-7 whitespace-pre-wrap break-words min-h-[100px]">
              {result}
            </div>
          </div>
        )}
      </main>

      {/* フッター */}
      <footer className="text-center py-5 text-xs text-gray-400 border-t border-gray-100 mt-10">
        テキスト要約・翻訳ツール - AI駆動開発デモ
      </footer>
    </div>
  )
}
