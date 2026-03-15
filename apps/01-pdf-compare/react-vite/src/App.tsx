import { useState, useRef, useCallback, useEffect } from 'react'
import * as pdfjsLib from 'pdfjs-dist'

// pdf.js ワーカーの設定
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

// ---- 型定義 ----

interface PdfState {
  file: File | null
  doc: pdfjsLib.PDFDocumentProxy | null
  name: string
}

interface DiffResult {
  diffPixelCount: number
  diffPercentage: number
  diffImageData: ImageData | null
}

// ---- 定数 ----

const RENDER_SCALE = 1.5
const DIFF_COLOR = { r: 255, g: 68, b: 68 } // 差分ハイライト色

// ---- メインコンポーネント ----

export default function App() {
  // PDF状態
  const [pdfA, setPdfA] = useState<PdfState>({ file: null, doc: null, name: '' })
  const [pdfB, setPdfB] = useState<PdfState>({ file: null, doc: null, name: '' })

  // ページ管理
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)

  // 差分表示のON/OFF
  const [showDiff, setShowDiff] = useState(true)

  // 差分結果
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null)

  // AI要約
  const [apiKey, setApiKey] = useState('')
  const [aiSummary, setAiSummary] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  // レンダリング状態
  const [rendering, setRendering] = useState(false)

  // Canvas参照
  const canvasARef = useRef<HTMLCanvasElement>(null)
  const canvasBRef = useRef<HTMLCanvasElement>(null)
  const canvasDiffRef = useRef<HTMLCanvasElement>(null)

  // ドラッグ状態
  const [dragOverA, setDragOverA] = useState(false)
  const [dragOverB, setDragOverB] = useState(false)

  // PDFファイル読み込み処理
  const loadPdf = useCallback(async (file: File, side: 'A' | 'B') => {
    const arrayBuffer = await file.arrayBuffer()
    const doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    const state: PdfState = { file, doc, name: file.name }

    if (side === 'A') {
      setPdfA(state)
    } else {
      setPdfB(state)
    }

    return doc
  }, [])

  // 両方のPDFが読み込まれたらページ数を設定
  useEffect(() => {
    if (pdfA.doc && pdfB.doc) {
      const pages = Math.min(pdfA.doc.numPages, pdfB.doc.numPages)
      setTotalPages(pages)
      setCurrentPage(1)
    }
  }, [pdfA.doc, pdfB.doc])

  // ページが変わったらレンダリング
  useEffect(() => {
    if (pdfA.doc && pdfB.doc && currentPage > 0) {
      renderPages(currentPage)
    }
  }, [currentPage, pdfA.doc, pdfB.doc, showDiff])

  // 1ページをCanvasに描画する
  const renderPageToCanvas = async (
    doc: pdfjsLib.PDFDocumentProxy,
    pageNum: number,
    canvas: HTMLCanvasElement,
  ): Promise<ImageData> => {
    const page = await doc.getPage(pageNum)
    const viewport = page.getViewport({ scale: RENDER_SCALE })
    const ctx = canvas.getContext('2d')!

    canvas.width = viewport.width
    canvas.height = viewport.height

    await page.render({ canvasContext: ctx, viewport }).promise
    return ctx.getImageData(0, 0, canvas.width, canvas.height)
  }

  // 2枚のImageDataからピクセル差分を計算
  const computeDiff = (imgA: ImageData, imgB: ImageData): DiffResult => {
    // サイズが異なる場合は大きい方に合わせる
    const width = Math.max(imgA.width, imgB.width)
    const height = Math.max(imgA.height, imgB.height)

    const diffCanvas = canvasDiffRef.current!
    diffCanvas.width = width
    diffCanvas.height = height

    const diffCtx = diffCanvas.getContext('2d')!
    const diffImageData = diffCtx.createImageData(width, height)

    let diffPixelCount = 0
    const totalPixels = width * height

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4

        // 範囲外のピクセルは白として扱う
        const getPixel = (img: ImageData, px: number, py: number) => {
          if (px >= img.width || py >= img.height) return [255, 255, 255, 255]
          const i = (py * img.width + px) * 4
          return [img.data[i], img.data[i + 1], img.data[i + 2], img.data[i + 3]]
        }

        const [rA, gA, bA] = getPixel(imgA, x, y)
        const [rB, gB, bB] = getPixel(imgB, x, y)

        // ピクセル差分の判定（閾値: 各チャネル30以上の差）
        const threshold = 30
        const isDiff =
          Math.abs(rA - rB) > threshold ||
          Math.abs(gA - gB) > threshold ||
          Math.abs(bA - bB) > threshold

        if (isDiff) {
          diffPixelCount++
          // 差分ピクセルを赤でハイライト
          diffImageData.data[idx] = DIFF_COLOR.r
          diffImageData.data[idx + 1] = DIFF_COLOR.g
          diffImageData.data[idx + 2] = DIFF_COLOR.b
          diffImageData.data[idx + 3] = 180
        } else {
          // 差分なし: 元画像のグレースケール化した薄い表示
          const gray = Math.round((rA + gA + bA) / 3)
          diffImageData.data[idx] = gray
          diffImageData.data[idx + 1] = gray
          diffImageData.data[idx + 2] = gray
          diffImageData.data[idx + 3] = 60
        }
      }
    }

    return {
      diffPixelCount,
      diffPercentage: (diffPixelCount / totalPixels) * 100,
      diffImageData,
    }
  }

  // 両ページのレンダリングと差分計算
  const renderPages = async (pageNum: number) => {
    if (!pdfA.doc || !pdfB.doc) return
    if (!canvasARef.current || !canvasBRef.current || !canvasDiffRef.current) return

    setRendering(true)

    try {
      const [imgA, imgB] = await Promise.all([
        renderPageToCanvas(pdfA.doc, pageNum, canvasARef.current),
        renderPageToCanvas(pdfB.doc, pageNum, canvasBRef.current),
      ])

      // 差分計算
      const result = computeDiff(imgA, imgB)
      setDiffResult(result)

      // 差分画像をCanvasに描画
      if (result.diffImageData && showDiff) {
        const diffCtx = canvasDiffRef.current.getContext('2d')!
        diffCtx.putImageData(result.diffImageData, 0, 0)
      }
    } catch (err) {
      console.error('レンダリングエラー:', err)
    } finally {
      setRendering(false)
    }
  }

  // ファイルドロップのハンドリング
  const handleDrop = (side: 'A' | 'B') => (e: React.DragEvent) => {
    e.preventDefault()
    if (side === 'A') setDragOverA(false)
    else setDragOverB(false)

    const file = e.dataTransfer.files[0]
    if (file?.type === 'application/pdf') {
      loadPdf(file, side)
    }
  }

  const handleDragOver = (side: 'A' | 'B') => (e: React.DragEvent) => {
    e.preventDefault()
    if (side === 'A') setDragOverA(true)
    else setDragOverB(true)
  }

  const handleDragLeave = (side: 'A' | 'B') => () => {
    if (side === 'A') setDragOverA(false)
    else setDragOverB(false)
  }

  // ファイル選択のハンドリング
  const handleFileSelect = (side: 'A' | 'B') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) loadPdf(file, side)
  }

  // ページ遷移
  const goToPrevPage = () => setCurrentPage((p) => Math.max(1, p - 1))
  const goToNextPage = () => setCurrentPage((p) => Math.min(totalPages, p + 1))

  // AI要約の呼び出し
  const requestAiSummary = async () => {
    if (!apiKey.trim()) {
      setAiSummary('APIキーを入力してください。')
      return
    }
    if (!diffResult) {
      setAiSummary('先にPDFを読み込んで差分を確認してください。')
      return
    }

    setAiLoading(true)
    setAiSummary('')

    // Canvasからテキスト的な差分情報を構成
    const prompt = `2つのPDFドキュメントをピクセル比較しました。
現在表示中のページ: ${currentPage} / ${totalPages}ページ
差分ピクセル数: ${diffResult.diffPixelCount.toLocaleString()}
差分割合: ${diffResult.diffPercentage.toFixed(2)}%

PDF A: ${pdfA.name}
PDF B: ${pdfB.name}

この比較結果から、2つのPDFの違いについて日本語で簡潔に要約してください。差分割合に基づいて、変更の規模感や想定される変更内容について推測してください。`

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(
          errorData?.error?.message || `API Error: ${response.status}`,
        )
      }

      const data = await response.json()
      const text = data.content?.[0]?.text || '応答を取得できませんでした。'
      setAiSummary(text)
    } catch (err) {
      const message = err instanceof Error ? err.message : '不明なエラー'
      setAiSummary(`エラー: ${message}`)
    } finally {
      setAiLoading(false)
    }
  }

  // 両方のPDFが読み込み済みかどうか
  const bothLoaded = pdfA.doc !== null && pdfB.doc !== null

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fafafa' }}>
      {/* ヘッダー */}
      <header
        className="border-b"
        style={{ backgroundColor: '#2c52a4', borderColor: '#1e3a73' }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-white tracking-wide">
            PDF Compare
          </h1>
          <span className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
            差分比較ツール
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* ファイルアップロード領域 */}
        <div className="grid grid-cols-2 gap-6">
          {/* PDF A */}
          <UploadZone
            label="PDF A（変更前）"
            fileName={pdfA.name}
            isDragOver={dragOverA}
            onDrop={handleDrop('A')}
            onDragOver={handleDragOver('A')}
            onDragLeave={handleDragLeave('A')}
            onFileSelect={handleFileSelect('A')}
          />
          {/* PDF B */}
          <UploadZone
            label="PDF B（変更後）"
            fileName={pdfB.name}
            isDragOver={dragOverB}
            onDrop={handleDrop('B')}
            onDragOver={handleDragOver('B')}
            onDragLeave={handleDragLeave('B')}
            onFileSelect={handleFileSelect('B')}
          />
        </div>

        {/* 両方読み込み完了時の操作パネル */}
        {bothLoaded && (
          <div
            className="border p-4 flex items-center justify-between"
            style={{
              backgroundColor: '#ffffff',
              borderColor: '#e0e0e0',
            }}
          >
            {/* ページナビゲーション */}
            <div className="flex items-center gap-3">
              <button
                onClick={goToPrevPage}
                disabled={currentPage <= 1 || rendering}
                className="px-3 py-1.5 text-sm border disabled:opacity-40"
                style={{
                  borderColor: '#2c52a4',
                  color: '#2c52a4',
                  backgroundColor: 'transparent',
                }}
              >
                前のページ
              </button>
              <span className="text-sm" style={{ color: '#262626' }}>
                {currentPage} / {totalPages} ページ
              </span>
              <button
                onClick={goToNextPage}
                disabled={currentPage >= totalPages || rendering}
                className="px-3 py-1.5 text-sm border disabled:opacity-40"
                style={{
                  borderColor: '#2c52a4',
                  color: '#2c52a4',
                  backgroundColor: 'transparent',
                }}
              >
                次のページ
              </button>
            </div>

            {/* 差分表示トグル */}
            <div className="flex items-center gap-3">
              {diffResult && (
                <span className="text-xs" style={{ color: '#666666' }}>
                  差分: {diffResult.diffPercentage.toFixed(2)}%
                  ({diffResult.diffPixelCount.toLocaleString()} px)
                </span>
              )}
              <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showDiff}
                  onChange={(e) => setShowDiff(e.target.checked)}
                  className="accent-[#2c52a4]"
                />
                差分オーバーレイ
              </label>
            </div>
          </div>
        )}

        {/* Canvas比較表示 */}
        {bothLoaded && (
          <div className="grid grid-cols-3 gap-4">
            {/* PDF A のCanvas */}
            <div
              className="border"
              style={{ borderColor: '#e0e0e0', backgroundColor: '#ffffff' }}
            >
              <div
                className="px-3 py-2 text-xs font-medium border-b"
                style={{
                  backgroundColor: '#f5f5f5',
                  borderColor: '#e0e0e0',
                  color: '#262626',
                }}
              >
                {pdfA.name}
              </div>
              <div className="overflow-auto" style={{ maxHeight: '70vh' }}>
                <canvas ref={canvasARef} className="block w-full h-auto" />
              </div>
            </div>

            {/* PDF B のCanvas */}
            <div
              className="border"
              style={{ borderColor: '#e0e0e0', backgroundColor: '#ffffff' }}
            >
              <div
                className="px-3 py-2 text-xs font-medium border-b"
                style={{
                  backgroundColor: '#f5f5f5',
                  borderColor: '#e0e0e0',
                  color: '#262626',
                }}
              >
                {pdfB.name}
              </div>
              <div className="overflow-auto" style={{ maxHeight: '70vh' }}>
                <canvas ref={canvasBRef} className="block w-full h-auto" />
              </div>
            </div>

            {/* 差分Canvas */}
            <div
              className="border"
              style={{
                borderColor: showDiff ? '#2c52a4' : '#e0e0e0',
                backgroundColor: '#ffffff',
              }}
            >
              <div
                className="px-3 py-2 text-xs font-medium border-b"
                style={{
                  backgroundColor: showDiff ? '#2c52a4' : '#f5f5f5',
                  borderColor: showDiff ? '#1e3a73' : '#e0e0e0',
                  color: showDiff ? '#ffffff' : '#262626',
                }}
              >
                差分表示
              </div>
              <div className="overflow-auto" style={{ maxHeight: '70vh' }}>
                <canvas
                  ref={canvasDiffRef}
                  className="block w-full h-auto"
                  style={{ opacity: showDiff ? 1 : 0.2 }}
                />
              </div>
            </div>
          </div>
        )}

        {/* AI要約セクション */}
        {bothLoaded && (
          <div
            className="border p-5"
            style={{
              backgroundColor: '#ffffff',
              borderColor: '#e0e0e0',
            }}
          >
            <h2
              className="text-sm font-semibold mb-4"
              style={{ color: '#2c52a4' }}
            >
              AI 差分要約
            </h2>

            <div className="flex items-end gap-3 mb-4">
              <div className="flex-1">
                <label
                  className="block text-xs mb-1.5"
                  style={{ color: '#666666' }}
                >
                  Anthropic API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-ant-..."
                  className="w-full border px-3 py-2 text-sm outline-none focus:border-[#2c52a4]"
                  style={{ borderColor: '#e0e0e0' }}
                />
              </div>
              <button
                onClick={requestAiSummary}
                disabled={aiLoading}
                className="px-5 py-2 text-sm text-white disabled:opacity-60"
                style={{ backgroundColor: '#2c52a4' }}
              >
                {aiLoading ? '分析中...' : '要約を生成'}
              </button>
            </div>

            {aiSummary && (
              <div
                className="border p-4 text-sm leading-relaxed whitespace-pre-wrap"
                style={{
                  borderColor: '#e0e0e0',
                  backgroundColor: '#f9f9f9',
                  color: '#262626',
                }}
              >
                {aiSummary}
              </div>
            )}
          </div>
        )}

        {/* 読み込み待ちメッセージ */}
        {!bothLoaded && (
          <div
            className="text-center py-16 text-sm"
            style={{ color: '#666666' }}
          >
            2つのPDFファイルをアップロードすると比較を開始します
          </div>
        )}
      </main>
    </div>
  )
}

// ---- アップロードゾーン コンポーネント ----

interface UploadZoneProps {
  label: string
  fileName: string
  isDragOver: boolean
  onDrop: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: () => void
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
}

function UploadZone({
  label,
  fileName,
  isDragOver,
  onDrop,
  onDragOver,
  onDragLeave,
  onFileSelect,
}: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onClick={() => inputRef.current?.click()}
      className="border-2 border-dashed p-8 text-center cursor-pointer transition-colors"
      style={{
        borderColor: isDragOver ? '#2c52a4' : '#d0d0d0',
        backgroundColor: isDragOver ? '#f0f4ff' : '#ffffff',
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        onChange={onFileSelect}
        className="hidden"
      />
      <div className="text-sm font-medium mb-2" style={{ color: '#2c52a4' }}>
        {label}
      </div>
      {fileName ? (
        <div className="text-sm" style={{ color: '#262626' }}>
          {fileName}
        </div>
      ) : (
        <div className="text-xs" style={{ color: '#999999' }}>
          ここにPDFをドロップ、またはクリックして選択
        </div>
      )}
    </div>
  )
}
