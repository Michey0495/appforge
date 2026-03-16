import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { AppInfo, TechStack, STACK_LABELS } from '../data/apps'
import { StackBadge } from './StackBadge'

interface AppDetailProps {
  app: AppInfo
}

interface SampleFile {
  name: string
  description: string
}

interface PromptOption {
  id: string
  label: string
  text: string
}

interface PromptConfig {
  base: string
  options: PromptOption[]
}

export function AppDetail({ app }: AppDetailProps) {
  const [activeStack, setActiveStack] = useState<TechStack>(app.stacks[0])
  const [copied, setCopied] = useState(false)

  const config = getPromptConfig(app)
  const [enabledOptions, setEnabledOptions] = useState<Set<string>>(new Set())

  const assembledPrompt = useMemo(() => {
    const lines = [config.base]
    const active = config.options.filter((o) => enabledOptions.has(o.id))
    if (active.length > 0) {
      lines.push('')
      lines.push('追加の要件:')
      active.forEach((o) => lines.push(`- ${o.text}`))
    }
    return lines.join('\n')
  }, [config, enabledOptions])

  const toggleOption = (id: string) => {
    setEnabledOptions((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(assembledPrompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        to="/"
        className="inline-block text-[12px] text-gray-400 hover:text-gray-600 transition-colors mb-10"
      >
        Back
      </Link>

      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-[13px] font-mono text-gray-400 tabular-nums">
            {String(app.number).padStart(2, '0')}
          </span>
          <span className="text-[10px] font-medium text-gray-400 tracking-wider uppercase">
            {app.categoryLabel}
          </span>
          {app.usesAI && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-sm">
              AI
            </span>
          )}
        </div>
        <h1 className="text-[28px] font-bold text-gray-900 tracking-tight mb-2">
          {app.name}
        </h1>
        <p className="text-[14px] text-gray-400 leading-relaxed mb-6">{app.description}</p>
        <a
          href={`/apps/${app.folderName}/html/index.html`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-5 py-2.5 text-[13px] font-medium bg-gray-800 text-white rounded-sm hover:bg-navy-600 transition-colors"
        >
          アプリを開く
        </a>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <InfoBlock label="対象ユーザー">
          <span className="text-[13px] text-gray-600">{app.targetAudience}</span>
        </InfoBlock>
        <InfoBlock label="効率化見込み">
          <span className="text-[13px] text-gray-600">{app.timeSaved}</span>
        </InfoBlock>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-10">
        <InfoBlock label="Libraries">
          <div className="flex flex-wrap gap-1">
            {app.techLibraries.map((lib) => (
              <span key={lib} className="text-[11px] text-gray-500">{lib}</span>
            ))}
          </div>
        </InfoBlock>
        <InfoBlock label="AI API">
          <span className="text-[13px] text-gray-600">{app.usesAI ? 'Required' : 'Not required'}</span>
        </InfoBlock>
        <InfoBlock label="Patterns">
          <span className="text-[13px] text-gray-600">{app.stacks.length}</span>
        </InfoBlock>
      </div>

      <div className="mb-10">
        <SectionLabel>Features</SectionLabel>
        <ul className="space-y-1.5">
          {app.features.map((feat) => (
            <li key={feat} className="text-[13px] text-gray-500 flex items-start gap-2">
              <span className="text-gray-400 mt-px">-</span>
              {feat}
            </li>
          ))}
        </ul>
      </div>

      <div className="mb-10">
        <SectionLabel>Implementation</SectionLabel>
        <div className="flex gap-1.5 mb-4">
          {app.stacks.map((stack) => (
            <StackBadge
              key={stack}
              stack={stack}
              active={activeStack === stack}
              onClick={() => setActiveStack(stack)}
            />
          ))}
        </div>
        <div className="border border-gray-100 rounded-sm p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-medium text-gray-700">
              {STACK_LABELS[activeStack]}
            </span>
            <code className="text-[11px] text-gray-400 font-mono">
              apps/{app.folderName}/{activeStack}/
            </code>
          </div>
          <p className="text-[12px] text-gray-400 leading-relaxed">
            {getStackDescription(activeStack)}
          </p>
        </div>
      </div>

      {/* サンプルデータ */}
      {getSampleFiles(app).length > 0 && (
        <div className="mb-10">
          <SectionLabel>Sample Data</SectionLabel>
          <p className="text-[12px] text-gray-400 mb-4">
            動作確認用のダミーデータ。実務を想定した具体的なデータを用意している。
          </p>
          <div className="border border-gray-100 rounded-sm divide-y divide-gray-50">
            {getSampleFiles(app).map((file) => (
              <div key={file.name} className="flex items-center justify-between px-5 py-3">
                <div className="flex-1 min-w-0 mr-4">
                  <span className="text-[12px] font-mono text-gray-600 block truncate">{file.name}</span>
                  <span className="text-[11px] text-gray-400">{file.description}</span>
                </div>
                <a
                  href={`/apps/${app.folderName}/sample-data/${file.name}`}
                  download={file.name}
                  className="flex-shrink-0 px-3 py-1.5 text-[11px] font-medium text-gray-600 border border-gray-200 rounded-sm hover:bg-gray-50 transition-colors"
                >
                  DL
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 開発フローガイド */}
      <div className="mb-10">
        <SectionLabel>How to Build</SectionLabel>
        <div className="border border-gray-100 rounded-sm p-5 space-y-4">
          <div className="flex gap-4">
            <StepNumber n={1} />
            <div>
              <p className="text-[13px] font-medium text-gray-700 mb-1">Planモードで壁打ち</p>
              <p className="text-[12px] text-gray-400 leading-relaxed">
                下のプロンプトをAIに送る。最初はシンプルに伝えて、AIに設計案を出させる。
                「こういう機能も欲しい」「ここはこうしたい」とラリーしながら仕様を固める。
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <StepNumber n={2} />
            <div>
              <p className="text-[13px] font-medium text-gray-700 mb-1">仕様を確定して実装開始</p>
              <p className="text-[12px] text-gray-400 leading-relaxed">
                AIの設計案に納得したら承認する。AIがコードを書き始める。
                途中で「ここを変えたい」と言えばその場で修正できる。
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <StepNumber n={3} />
            <div>
              <p className="text-[13px] font-medium text-gray-700 mb-1">動作確認して調整</p>
              <p className="text-[12px] text-gray-400 leading-relaxed">
                ブラウザで動かしてみて、気になる点をAIにフィードバック。
                「色を変えて」「ボタンの位置を右に」など自然な日本語で伝えるだけで直る。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* インタラクティブプロンプト */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <SectionLabel>Prompt</SectionLabel>
          <button
            onClick={handleCopy}
            className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors"
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        <p className="text-[12px] text-gray-400 mb-4">
          まずはシンプルなプロンプトから始める。必要に応じてオプションをクリックして追加。
        </p>

        {config.options.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {config.options.map((opt) => {
              const active = enabledOptions.has(opt.id)
              return (
                <button
                  key={opt.id}
                  onClick={() => toggleOption(opt.id)}
                  className={[
                    'px-3 py-1.5 text-[11px] font-medium rounded-sm border transition-all',
                    active
                      ? 'bg-gray-800 text-white border-gray-800'
                      : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300 hover:text-gray-500',
                  ].join(' ')}
                >
                  {active ? '- ' : '+ '}{opt.label}
                </button>
              )
            })}
          </div>
        )}

        <pre className="bg-gray-50 border border-gray-100 rounded-sm p-5 text-[12px] text-gray-600 whitespace-pre-wrap leading-relaxed font-mono overflow-x-auto">
          {assembledPrompt}
        </pre>
      </div>
    </div>
  )
}

function StepNumber({ n }: { n: number }) {
  return (
    <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-[11px] font-medium text-gray-600 bg-gray-100 rounded-sm">
      {n}
    </span>
  )
}

function InfoBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border border-gray-100 rounded-sm p-4">
      <span className="block text-[10px] font-medium text-gray-400 tracking-wider uppercase mb-2">
        {label}
      </span>
      {children}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[11px] font-medium text-gray-400 tracking-wider uppercase mb-3">
      {children}
    </h2>
  )
}

function getStackDescription(stack: TechStack): string {
  switch (stack) {
    case 'nextjs':
      return 'App Router + TypeScript + Tailwind CSS。サーバーコンポーネントとクライアントコンポーネントの使い分けを学べる構成。'
    case 'html':
      return '1ファイルで完結。CDN経由でライブラリを読み込み、vanilla JS で実装。最もシンプルで再現しやすい。'
    case 'react-vite':
      return 'Vite + React + TypeScript + Tailwind CSS。コンポーネント分割されたモダンなフロントエンド構成。'
    case 'chrome-ext':
      return 'manifest.json + popup/content script で構成するChrome拡張機能。chrome://extensions で読み込んで使う。'
    case 'script':
      return 'Node.js のシングルファイルスクリプト。ターミナルから実行する自動化ツール。'
  }
}

function getPromptConfig(app: AppInfo): PromptConfig {
  const configs: Record<string, PromptConfig> = {
    '01-pdf-compare': {
      base: '2つのPDFを比較して差分を表示するWebアプリを作ってください。',
      options: [
        { id: 'dnd', label: 'ドラッグ&ドロップ', text: 'ファイルのドラッグ&ドロップに対応する' },
        { id: 'highlight', label: '差分ハイライト', text: '差分があるピクセルを赤色でハイライト表示する' },
        { id: 'ai', label: 'AI要約', text: 'AIで変更点を自然言語で要約する（APIキーはブラウザ側で入力）' },
        { id: 'nav', label: 'ページ送り', text: '複数ページのPDFにページナビゲーションで対応する' },
        { id: 'export', label: 'エクスポート', text: '比較結果を画像として保存できるようにする' },
        { id: 'html', label: '単一HTML', text: '1つのHTMLファイルだけで完結させる（CDN使用可）' },
      ],
    },
    '02-csv-visualizer': {
      base: 'CSVファイルをアップロードしたら自動でグラフを作ってくれるダッシュボードを作ってください。',
      options: [
        { id: 'dnd', label: 'ドラッグ&ドロップ', text: 'CSVのドラッグ&ドロップアップロードに対応する' },
        { id: 'charts', label: '複数グラフ', text: '棒グラフ・折れ線・円グラフを切り替えられるようにする' },
        { id: 'axis', label: '軸の選択', text: 'どのカラムをX軸・Y軸にするか選べるようにする' },
        { id: 'stats', label: '統計量', text: '平均・中央値・最大・最小・標準偏差を表示する' },
        { id: 'preview', label: 'データプレビュー', text: 'CSVの先頭数行をテーブルでプレビュー表示する' },
        { id: 'html', label: '単一HTML', text: '1つのHTMLファイルだけで完結させる' },
      ],
    },
    '03-image-batch': {
      base: '画像を複数まとめてリサイズ・変換できるツールを作ってください。',
      options: [
        { id: 'dnd', label: 'ドラッグ&ドロップ', text: '複数画像のドラッグ&ドロップに対応する' },
        { id: 'format', label: 'フォーマット変換', text: 'PNG / JPEG / WebP を相互変換できるようにする' },
        { id: 'quality', label: '圧縮率調整', text: 'スライダーで圧縮品質を調整できるようにする' },
        { id: 'preview', label: 'プレビュー', text: '変換前後のプレビューを表示する' },
        { id: 'zip', label: 'ZIP一括DL', text: '変換済み画像をZIPでまとめてダウンロードできるようにする' },
        { id: 'aspect', label: 'アスペクト比維持', text: 'リサイズ時にアスペクト比を維持するオプションをつける' },
      ],
    },
    '04-text-summarizer': {
      base: '長い文章をAIで要約してくれるツールを作ってください。',
      options: [
        { id: 'modes', label: '要約モード切替', text: '箇条書き要約と段落要約を切り替えられるようにする' },
        { id: 'translate', label: '翻訳機能', text: '日本語→英語、英語→日本語の翻訳もできるようにする' },
        { id: 'count', label: '文字数カウント', text: '入力テキストの文字数をリアルタイムで表示する' },
        { id: 'copy', label: 'コピーボタン', text: '結果をワンクリックでコピーできるようにする' },
        { id: 'loading', label: 'ローディング表示', text: 'API呼び出し中にローディング状態を表示する' },
        { id: 'html', label: '単一HTML', text: '1つのHTMLファイルだけで完結させる' },
      ],
    },
    '05-qr-generator': {
      base: 'URLを入力したらQRコードを作ってくれるツールを作ってください。',
      options: [
        { id: 'batch', label: '一括生成', text: '複数のURLを1行ずつ入力してまとめて生成できるようにする' },
        { id: 'csv', label: 'CSV読み込み', text: 'CSVファイルからURLを一括読み込みできるようにする' },
        { id: 'color', label: '色カスタマイズ', text: 'QRコードの前景色・背景色を選べるようにする' },
        { id: 'size', label: 'サイズ調整', text: 'QRコードのサイズをスライダーで変更できるようにする' },
        { id: 'zip', label: 'ZIP一括DL', text: '全QRコードをZIPでまとめてダウンロードできるようにする' },
        { id: 'html', label: '単一HTML', text: '1つのHTMLファイルだけで完結させる' },
      ],
    },
    '06-meeting-minutes': {
      base: '会議のチャットログを貼り付けたら議事録にしてくれるツールを作ってください。',
      options: [
        { id: 'todo', label: 'TODO抽出', text: '議事録から決定事項とTODOリストを自動で抜き出す' },
        { id: 'speaker', label: '発言者別要約', text: '発言者ごとに発言内容を整理・要約する' },
        { id: 'format', label: 'Markdown出力', text: '議事録をMarkdown形式で出力する' },
        { id: 'multi', label: '複数フォーマット対応', text: 'Zoom、Teams、Slackなど複数のチャット形式を自動判別する' },
        { id: 'copy', label: 'コピーボタン', text: '結果をワンクリックでコピーできるようにする' },
        { id: 'html', label: '単一HTML', text: '1つのHTMLファイルだけで完結させる' },
      ],
    },
    '07-json-formatter': {
      base: 'JSONを貼り付けたら見やすく整形してくれるツールを作ってください。',
      options: [
        { id: 'validate', label: 'バリデーション', text: '構文エラーの検出と該当箇所の表示をする' },
        { id: 'tree', label: 'ツリービュー', text: '折りたたみ可能なツリー表示に切り替えられるようにする' },
        { id: 'minify', label: '圧縮', text: 'JSONを1行に圧縮するMinify機能をつける' },
        { id: 'search', label: 'パス検索', text: 'JSONPathで特定の値を検索できるようにする' },
        { id: 'diff', label: '差分比較', text: '2つのJSONを貼り付けて差分を比較できるようにする' },
        { id: 'syntax', label: 'シンタックスハイライト', text: 'キー・文字列・数値・真偽値を色分け表示する' },
      ],
    },
    '08-password-generator': {
      base: 'パスワードの強度をチェックして安全なパスワードも生成できるツールを作ってください。',
      options: [
        { id: 'meter', label: '強度メーター', text: '入力中にリアルタイムで強度バーを表示する' },
        { id: 'crack', label: '解読時間表示', text: '推定の解読時間を表示する' },
        { id: 'entropy', label: 'エントロピー表示', text: 'パスワードのエントロピー（ビット数）を表示する' },
        { id: 'custom', label: '生成カスタマイズ', text: '長さ・大文字・小文字・数字・記号の有無を選べるようにする' },
        { id: 'warning', label: '改善アドバイス', text: '弱いパターンを検出して改善の提案を表示する' },
        { id: 'html', label: '単一HTML', text: '1つのHTMLファイルだけで完結させる' },
      ],
    },
    '09-markdown-editor': {
      base: 'Markdownを書いたら横にリアルタイムでプレビューが出るエディタを作ってください。',
      options: [
        { id: 'toolbar', label: 'ツールバー', text: '太字・イタリック・リンクなどのボタンをつける' },
        { id: 'highlight', label: 'コードハイライト', text: 'コードブロックに構文ハイライトを適用する' },
        { id: 'dark', label: 'ダークモード', text: 'ダークモード切替ボタンをつける' },
        { id: 'export', label: 'HTML出力', text: 'プレビューをHTMLファイルとして保存できるようにする' },
        { id: 'save', label: '自動保存', text: 'LocalStorageに自動保存して、再読み込みしても消えないようにする' },
        { id: 'count', label: '文字数カウント', text: '文字数と単語数を画面下部に表示する' },
      ],
    },
    '10-color-palette': {
      base: '色を1つ選んだら、それに合う配色パターンを自動で作ってくれるツールを作ってください。',
      options: [
        { id: 'patterns', label: '複数パターン', text: '補色・類似色・トライアドなど複数の配色パターンを生成する' },
        { id: 'contrast', label: 'コントラスト比', text: 'WCAGのコントラスト比をチェックしてAA/AAA判定を表示する' },
        { id: 'convert', label: '色形式変換', text: 'HEX / RGB / HSL を相互変換して表示する' },
        { id: 'copy', label: 'ワンクリックコピー', text: '色の値をクリックするだけでコピーできるようにする' },
        { id: 'export', label: 'CSS出力', text: 'パレットをCSS Custom Properties形式で出力する' },
        { id: 'shade', label: '明度バリエーション', text: '各色の明るい/暗いバリエーションも一緒に表示する' },
      ],
    },
    '11-regex-tester': {
      base: '正規表現を入力したらテスト文字列に対してリアルタイムで結果を見せてくれるツールを作ってください。',
      options: [
        { id: 'highlight', label: 'マッチハイライト', text: 'テスト文字列中のマッチ箇所を色付きでハイライトする' },
        { id: 'groups', label: 'キャプチャグループ', text: 'キャプチャグループの内容を一覧表示する' },
        { id: 'flags', label: 'フラグ切替', text: 'g / i / m / s のフラグをチェックボックスで切り替えられるようにする' },
        { id: 'presets', label: 'プリセット', text: 'メール・電話番号・URLなどよく使うパターンをプリセットで用意する' },
        { id: 'replace', label: '置換プレビュー', text: '置換パターンを入力して置換後の結果もプレビューする' },
      ],
    },
    '12-api-mock': {
      base: 'ブラウザの中でAPIのモックレスポンスを定義して、すぐにテストできるツールを作ってください。',
      options: [
        { id: 'method', label: 'メソッド指定', text: 'GET / POST / PUT / DELETE を選べるようにする' },
        { id: 'status', label: 'ステータスコード', text: 'レスポンスのHTTPステータスコードを設定できるようにする' },
        { id: 'delay', label: '遅延設定', text: 'レスポンスの遅延時間をスライダーで設定できるようにする' },
        { id: 'headers', label: 'カスタムヘッダー', text: 'レスポンスにカスタムヘッダーを追加できるようにする' },
        { id: 'test', label: 'テストパネル', text: '定義したモックAPIをその場でfetchしてテストするパネルをつける' },
        { id: 'list', label: 'モック一覧', text: '登録済みモックの一覧と削除ボタンを表示する' },
      ],
    },
    '13-diff-checker': {
      base: '2つのテキストを貼り付けて差分を見やすく表示してくれるツールを作ってください。',
      options: [
        { id: 'color', label: 'カラー表示', text: '追加行を緑、削除行を赤、変更行を黄色で色分けする' },
        { id: 'view', label: '表示切替', text: '統合ビューと分割ビューを切り替えられるようにする' },
        { id: 'line', label: '行番号', text: '各行に行番号を表示する' },
        { id: 'stats', label: '差分統計', text: '追加・削除・変更なしの行数を集計して表示する' },
        { id: 'copy', label: 'コピー機能', text: '差分結果をコピーできるようにする' },
      ],
    },
    '14-prompt-builder': {
      base: 'AIに渡すプロンプトをブロック単位で組み立てられるツールを作ってください。',
      options: [
        { id: 'blocks', label: 'ブロックタイプ', text: 'ロール・指示・制約・出力形式・例・コンテキストのブロックを用意する' },
        { id: 'reorder', label: '並べ替え', text: 'ブロックの順番を上下ボタンで入れ替えられるようにする' },
        { id: 'templates', label: 'テンプレート', text: '要約・翻訳・コードレビューなどのテンプレートをプリセットで用意する' },
        { id: 'tokens', label: 'トークン推定', text: '組み立てたプロンプトのトークン数を概算で表示する' },
        { id: 'preview', label: 'プレビュー', text: 'XMLタグ形式で組み立てたプロンプトをリアルタイムでプレビューする' },
        { id: 'copy', label: 'コピー機能', text: '完成したプロンプトをワンクリックでコピーする' },
      ],
    },
    '15-gantt-chart': {
      base: 'タスクを登録したらガントチャートを描いてくれるツールを作ってください。',
      options: [
        { id: 'scale', label: 'スケール切替', text: '日・週・月の表示スケールを切り替えられるようにする' },
        { id: 'today', label: '今日マーカー', text: '今日の日付に赤い線を引いて現在位置を示す' },
        { id: 'color', label: '色の指定', text: 'タスクごとにバーの色を選べるようにする' },
        { id: 'edit', label: '編集・削除', text: 'タスクの編集と削除ができるようにする' },
        { id: 'export', label: 'PNG出力', text: 'ガントチャートをPNG画像としてダウンロードできるようにする' },
        { id: 'tooltip', label: 'ホバー詳細', text: 'バーにマウスを載せるとタスク詳細をツールチップで表示する' },
      ],
    },
    '16-invoice-generator': {
      base: '品目と金額を入力して見積書を作れるツールを作ってください。',
      options: [
        { id: 'tax', label: '消費税計算', text: '税率10%と8%の軽減税率を切り替えられるようにする' },
        { id: 'company', label: '会社情報', text: '発行元の会社名・住所・連絡先を登録できるようにする' },
        { id: 'seal', label: '印影挿入', text: '画像ファイルで印影を挿入できるようにする' },
        { id: 'pdf', label: 'PDF出力', text: 'ブラウザの印刷機能でPDF保存できるレイアウトにする' },
        { id: 'save', label: 'LocalStorage保存', text: '入力データをLocalStorageに保存して次回復元できるようにする' },
        { id: 'number', label: '見積番号自動採番', text: '見積書番号を日付ベースで自動生成する' },
      ],
    },
    '17-data-cleansing': {
      base: 'CSVの汚いデータをきれいにするツールを作ってください。',
      options: [
        { id: 'dup', label: '重複削除', text: '完全一致・部分一致の重複行を検出して削除する' },
        { id: 'blank', label: '空欄補完', text: '空欄セルを指定値やカラム平均で補完する' },
        { id: 'normalize', label: '表記ゆれ統一', text: '全角半角・大文字小文字・カタカナひらがなを統一する' },
        { id: 'trim', label: '空白トリム', text: 'セル前後の不要な空白を除去する' },
        { id: 'preview', label: 'ビフォーアフター', text: 'クレンジング前後のプレビューを並べて表示する' },
        { id: 'download', label: 'CSV出力', text: 'クレンジング済みCSVをダウンロードできるようにする' },
      ],
    },
    '18-cron-builder': {
      base: 'Cron式をGUIで組み立てられるツールを作ってください。',
      options: [
        { id: 'preview', label: '実行日時プレビュー', text: '直近10回の実行日時を一覧表示する' },
        { id: 'japanese', label: '日本語説明', text: 'Cron式を日本語の自然文で説明する' },
        { id: 'presets', label: 'プリセット', text: '毎日・毎週月曜・毎月1日などよく使うパターンをボタンで用意する' },
        { id: 'copy', label: 'コピー機能', text: '生成したCron式をワンクリックでコピーする' },
        { id: 'validate', label: 'バリデーション', text: 'Cron式を手入力して構文チェックできるモードもつける' },
      ],
    },
    '19-format-converter': {
      base: 'データ形式を変換するツールを作ってください。JSONを貼り付けたらCSVやYAMLに変換できるような。',
      options: [
        { id: 'json-csv', label: 'JSON→CSV', text: 'JSONの配列をCSVに変換する' },
        { id: 'csv-json', label: 'CSV→JSON', text: 'CSVをJSON配列に変換する' },
        { id: 'json-yaml', label: 'JSON↔YAML', text: 'JSONとYAMLを相互変換する' },
        { id: 'json-xml', label: 'JSON↔XML', text: 'JSONとXMLを相互変換する' },
        { id: 'download', label: 'ファイル出力', text: '変換結果をファイルとしてダウンロードできるようにする' },
        { id: 'upload', label: 'ファイル読み込み', text: 'テキスト入力だけでなくファイルアップロードにも対応する' },
      ],
    },
    '20-daily-report': {
      base: '箇条書きのメモから日報を作ってくれるツールを作ってください。',
      options: [
        { id: 'format', label: 'フォーマット選択', text: '日報・週報・月報のフォーマットを選べるようにする' },
        { id: 'tone', label: 'トーン調整', text: '上司向け・チーム向け・経営層向けなど報告先に合わせた文体にする' },
        { id: 'reflection', label: '所感自動生成', text: '業務内容から振り返り・課題・改善点を自動で付与する' },
        { id: 'template', label: 'テンプレート', text: '会社のフォーマットに合わせたテンプレートを選択できるようにする' },
        { id: 'copy', label: 'コピー機能', text: '生成した日報をワンクリックでコピーする' },
        { id: 'html', label: '単一HTML', text: '1つのHTMLファイルだけで完結させる' },
      ],
    },
    '21-namecard-ocr': {
      base: '名刺の写真を読み取ってCSVにしてくれるツールを作ってください。',
      options: [
        { id: 'multi', label: '複数枚一括', text: '複数の名刺画像をまとめてアップロードして一括処理する' },
        { id: 'fields', label: '読み取り項目', text: '氏名・会社名・部署・役職・メール・電話・住所を構造化して抽出する' },
        { id: 'vcard', label: 'vCard出力', text: 'CSV以外にvCard(.vcf)形式でもエクスポートできるようにする' },
        { id: 'preview', label: 'プレビュー', text: '読み取り結果を画像の横にテーブルで並べて確認・修正できるようにする' },
        { id: 'chrome', label: 'Chrome拡張', text: 'Chrome拡張機能としても使えるようにする（ポップアップUI）' },
      ],
    },
    '22-slack-emoji-stats': {
      base: 'Slackのリアクション絵文字の使用状況を集計するスクリプトを作ってください。',
      options: [
        { id: 'ranking', label: 'ランキング', text: '絵文字別・ユーザー別の使用回数ランキングを出す' },
        { id: 'period', label: '期間指定', text: '集計対象の期間を開始日・終了日で指定できるようにする' },
        { id: 'channel', label: 'チャンネル指定', text: '特定チャンネルだけを対象にできるようにする' },
        { id: 'csv', label: 'CSV出力', text: '集計結果をCSVファイルに出力する' },
        { id: 'web', label: 'Web UI', text: 'ブラウザで結果を見られるHTML画面もつける' },
      ],
    },
    '23-meet-timestamp': {
      base: 'Google Meet使用中に議事録メモとタイムスタンプを記録できるChrome拡張を作ってください。',
      options: [
        { id: 'overlay', label: 'オーバーレイ表示', text: 'Google Meetの画面上にフローティングメモ帳を表示する' },
        { id: 'timestamp', label: 'タイムスタンプ', text: 'ボタン1つで経過時間をメモに自動挿入する' },
        { id: 'shortcuts', label: 'キーボードショートカット', text: 'Alt+Tでタイムスタンプ挿入のショートカットを設定する' },
        { id: 'export', label: 'Markdownコピー', text: 'メモをMarkdown形式でクリップボードにコピーする' },
        { id: 'save', label: '自動保存', text: 'メモをLocalStorageに自動保存して消えないようにする' },
      ],
    },
    '24-receipt-reader': {
      base: 'レシートの写真を読み取って経費精算用のデータにしてくれるツールを作ってください。',
      options: [
        { id: 'multi', label: '複数枚一括', text: '複数のレシート画像をまとめて処理する' },
        { id: 'category', label: 'カテゴリ推定', text: '交通費・交際費・消耗品費などの勘定科目を自動推定する' },
        { id: 'csv', label: 'CSV出力', text: '経理提出用のCSVフォーマットで出力する' },
        { id: 'total', label: '合計表示', text: '読み取った全レシートの合計金額を表示する' },
        { id: 'edit', label: '読み取り修正', text: '読み取り結果を手動で修正できるようにする' },
      ],
    },
    '25-interview-questions': {
      base: '求人票を貼り付けたら面接で使える質問リストを作ってくれるツールを作ってください。',
      options: [
        { id: 'categories', label: '3カテゴリ', text: '技術質問・行動質問・カルチャーフィットの3軸で質問を分類する' },
        { id: 'hints', label: '回答ヒント', text: '各質問に対する想定回答のポイントを併記する' },
        { id: 'level', label: '難易度設定', text: 'ジュニア/ミドル/シニアで質問の難易度を調整する' },
        { id: 'sheet', label: '評価シート', text: '面接時に使える評価シートを印刷用レイアウトで出力する' },
        { id: 'copy', label: 'コピー機能', text: '質問リストをMarkdownでコピーする' },
      ],
    },
    '26-glossary-builder': {
      base: '社内で使う専門用語を登録して検索できる辞書ツールを作ってください。',
      options: [
        { id: 'category', label: 'カテゴリ分類', text: '用語を部署やテーマ別にカテゴリ分類できるようにする' },
        { id: 'search', label: '全文検索', text: '用語名と説明文の両方を対象に検索できるようにする' },
        { id: 'import', label: 'CSV読込', text: 'CSVファイルで用語を一括インポートできるようにする' },
        { id: 'export', label: 'エクスポート', text: 'JSON / CSV でエクスポートできるようにする' },
        { id: 'save', label: '永続化', text: 'LocalStorageに保存して、ブラウザを閉じても残るようにする' },
      ],
    },
    '27-github-issue-audit': {
      base: 'GitHubリポジトリの放置イシューを一覧化して棚卸しするスクリプトを作ってください。',
      options: [
        { id: 'score', label: 'スコアリング', text: '最終更新からの日数でスコアをつけて優先度を判定する' },
        { id: 'label', label: 'ラベル集計', text: 'ラベル別にイシューを集計してカテゴリごとの件数を出す' },
        { id: 'assignee', label: 'アサイン状況', text: 'アサインなしのイシューを特にハイライトする' },
        { id: 'markdown', label: 'Markdownレポート', text: '棚卸し結果をMarkdownレポートで出力する' },
        { id: 'web', label: 'Web UI', text: 'ブラウザで結果を見られるHTML画面もつける' },
      ],
    },
    '28-ringi-draft': {
      base: '稟議書のドラフトをAIで作ってくれるツールを作ってください。',
      options: [
        { id: 'amount', label: '金額・ROI', text: '金額と投資対効果（ROI）の記載を含める' },
        { id: 'risk', label: 'リスク分析', text: '想定リスクと対策案の項目を追加する' },
        { id: 'compare', label: '比較表', text: '他社比較や代替案との比較表を生成する' },
        { id: 'format', label: '稟議書体裁', text: '件名・起案者・決裁区分・実施時期を含む正式フォーマットにする' },
        { id: 'print', label: '印刷対応', text: '印刷用のA4レイアウトでPDF出力できるようにする' },
      ],
    },
    '29-perf-checker': {
      base: 'ページの表示速度を計測してスコアを出してくれるChrome拡張を作ってください。',
      options: [
        { id: 'cwv', label: 'Core Web Vitals', text: 'LCP・FID・CLSの3指標をリアルタイムで計測する' },
        { id: 'resources', label: 'リソース一覧', text: '読み込んだリソースのサイズと時間を一覧表示する' },
        { id: 'advice', label: '改善提案', text: 'スコアが低い場合に改善のヒントを表示する' },
        { id: 'history', label: '計測履歴', text: '過去の計測結果を保存して比較できるようにする' },
        { id: 'badge', label: 'バッジ表示', text: '拡張アイコンにスコアをバッジ表示する' },
      ],
    },
    '30-kintai-formatter': {
      base: '勤怠CSVの形式を変換するツールを作ってください。A社形式をB社形式に直すような。',
      options: [
        { id: 'mapping', label: '列マッピング', text: 'GUIで入力列と出力列の対応関係を定義する' },
        { id: 'date', label: '日付変換', text: '日付フォーマット（YYYY/MM/DD ↔ YYYYMMDD等）を自動変換する' },
        { id: 'time', label: '時刻変換', text: '時刻フォーマット（HH:MM ↔ 小数点時間等）を変換する' },
        { id: 'save', label: 'ルール保存', text: '変換ルールを保存して次回以降もワンクリックで使えるようにする' },
        { id: 'preview', label: 'プレビュー', text: '変換前後のプレビューを並べて表示する' },
      ],
    },
  }
  return configs[app.folderName] ?? { base: '', options: [] }
}

function getSampleFiles(app: AppInfo): SampleFile[] {
  const files: Record<string, SampleFile[]> = {
    '01-pdf-compare': [
      { name: 'v1-terms.txt', description: '利用規約 第1版（PDF化して比較用に使う）' },
      { name: 'v2-terms.txt', description: '利用規約 第2版（10箇所の差分あり）' },
    ],
    '02-csv-visualizer': [
      { name: 'sales-by-region.csv', description: '5地域x12ヶ月の売上データ（60行）' },
      { name: 'employee-kpi.csv', description: '5部署30名分のKPIデータ' },
      { name: 'monthly-expenses.csv', description: '中堅企業の月次経費（12ヶ月）' },
    ],
    '03-image-batch': [
      { name: 'sample-chart.svg', description: '四半期別売上の棒グラフ' },
      { name: 'sample-logo.svg', description: '幾何学ロゴデザイン' },
      { name: 'sample-diagram.svg', description: '承認フローチャート' },
      { name: 'sample-icon.svg', description: 'アプリケーションアイコン' },
      { name: 'sample-card.svg', description: '日本語名刺レイアウト' },
    ],
    '04-text-summarizer': [
      { name: 'press-release.txt', description: 'SaaS製品リリースのプレスリリース' },
      { name: 'meeting-memo.txt', description: 'Q3予算レビューの議事録' },
      { name: 'research-report.txt', description: 'エッジコンピューティング動向レポート' },
    ],
    '05-qr-generator': [
      { name: 'event-urls.csv', description: '企業イベント用15URL（受付・アンケート等）' },
      { name: 'product-catalog.csv', description: '商品カタログ10件のURL' },
    ],
    '06-meeting-minutes': [
      { name: 'zoom-chat-log.txt', description: 'Zoomキックオフ会議のチャットログ' },
      { name: 'teams-chat-log.txt', description: 'Teams四半期レビューの会話ログ' },
      { name: 'slack-thread.txt', description: 'Slack障害対応スレッド' },
    ],
    '07-json-formatter': [
      { name: 'api-response-users.json', description: 'ページネーション付きユーザー一覧API' },
      { name: 'api-response-orders.json', description: '注文管理APIレスポンス（5件）' },
      { name: 'config-complex.json', description: '多階層アプリケーション設定' },
      { name: 'broken.json', description: '構文エラー入りJSON（バリデーションテスト用）' },
    ],
    '08-password-generator': [
      { name: 'test-passwords.txt', description: '強度別テスト用パスワード20件' },
      { name: 'password-policy.json', description: 'エンタープライズ向けポリシー3パターン' },
    ],
    '09-markdown-editor': [
      { name: 'project-readme.md', description: '社内ツールのREADME（フルスペック）' },
      { name: 'tech-blog-draft.md', description: 'Claude API開発ブログの下書き' },
      { name: 'meeting-notes-template.md', description: '議事録テンプレート' },
    ],
    '10-color-palette': [
      { name: 'brand-colors.json', description: 'ブランドカラー5色の定義' },
      { name: 'wcag-test-pairs.json', description: 'コントラスト比テスト用10ペア' },
    ],
    '11-regex-tester': [
      { name: 'test-cases.json', description: '正規表現テストケース12件（メール・電話・URL等）' },
    ],
    '12-api-mock': [
      { name: 'mock-endpoints.json', description: '従業員管理API 8エンドポイント定義' },
      { name: 'error-responses.json', description: 'エラーレスポンス5パターン' },
    ],
    '13-diff-checker': [
      { name: 'spec-v1.txt', description: '機能仕様書 v1.0（ユーザー登録機能）' },
      { name: 'spec-v2.txt', description: '機能仕様書 v2.0（6箇所の変更あり）' },
      { name: 'code-before.js', description: 'リファクタリング前のJS（コールバック地獄）' },
      { name: 'code-after.js', description: 'リファクタリング後（async/await化）' },
    ],
    '14-prompt-builder': [
      { name: 'templates.json', description: 'プロンプトテンプレート6種' },
      { name: 'example-prompts.txt', description: 'XMLタグ形式の完成プロンプト5例' },
    ],
    '15-gantt-chart': [
      { name: 'project-plan.csv', description: 'Web開発プロジェクト計画（20タスク・3ヶ月）' },
      { name: 'sprint-backlog.csv', description: '2週間スプリントバックログ（15タスク）' },
    ],
    '16-invoice-generator': [
      { name: 'sample-items.csv', description: 'SIer案件の見積品目リスト（15項目）' },
      { name: 'company-info.json', description: '発行元・宛先の会社情報サンプル' },
    ],
    '17-data-cleansing': [
      { name: 'dirty-customer-list.csv', description: '表記ゆれ・重複・空欄だらけの顧客リスト（50行）' },
      { name: 'dirty-sales-log.csv', description: '日付形式混在・全角数字入りの売上ログ（30行）' },
    ],
    '18-cron-builder': [
      { name: 'cron-examples.json', description: '実務でよく使うCron式20パターン' },
    ],
    '19-format-converter': [
      { name: 'sample-users.json', description: 'ユーザー一覧JSON（CSV変換テスト用）' },
      { name: 'sample-config.yaml', description: 'アプリ設定YAML（JSON変換テスト用）' },
      { name: 'sample-data.csv', description: '商品マスタCSV（JSON変換テスト用）' },
    ],
    '20-daily-report': [
      { name: 'daily-notes.txt', description: '1日の業務メモ（箇条書き）' },
      { name: 'weekly-notes.txt', description: '1週間の業務メモ（日別箇条書き）' },
    ],
    '21-namecard-ocr': [
      { name: 'sample-cards.txt', description: 'テスト用名刺データ（テキスト形式5枚分）' },
    ],
    '22-slack-emoji-stats': [
      { name: 'sample-reactions.json', description: 'Slack APIレスポンスのサンプル（リアクション付き）' },
    ],
    '24-receipt-reader': [
      { name: 'sample-receipts.txt', description: 'テスト用レシートデータ（テキスト形式5枚分）' },
    ],
    '25-interview-questions': [
      { name: 'sample-jd-backend.txt', description: 'バックエンドエンジニアの求人票サンプル' },
      { name: 'sample-jd-pm.txt', description: 'プロジェクトマネージャーの求人票サンプル' },
    ],
    '26-glossary-builder': [
      { name: 'it-glossary.csv', description: 'IT業界用語50件（インポート用）' },
      { name: 'business-glossary.csv', description: 'ビジネス用語30件（インポート用）' },
    ],
    '27-github-issue-audit': [
      { name: 'sample-issues.json', description: 'GitHub APIレスポンスのサンプル（イシュー20件）' },
    ],
    '28-ringi-draft': [
      { name: 'sample-ringi-input.txt', description: '稟議書のインプット例（箇条書き3件）' },
    ],
    '30-kintai-formatter': [
      { name: 'kintai-format-a.csv', description: '勤怠データA社形式（1ヶ月分）' },
      { name: 'kintai-format-b.csv', description: '勤怠データB社形式（変換先）のサンプル' },
    ],
  }
  return files[app.folderName] ?? []
}
