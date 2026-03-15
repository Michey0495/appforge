'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import type { PDFDocumentProxy } from 'pdfjs-dist'

// pdf.js の型定義
type PDFPageProxy = Awaited<ReturnType<PDFDocumentProxy['getPage']>>

// 差分計算結果の型
interface DiffResult {
  diffCount: number
  totalPixels: number
}

// レンダリングスケール
const RENDER_SCALE = 1.5
// 差分検出の閾値（RGB合計がこの値を超えたら差分とみなす）
const DIFF_THRESHOLD = 30

export default function PdfComparePage() {
  // pdf.js ライブラリの参照
  const pdfjsLibRef = useRef<typeof import('pdfjs-dist') | null>(null)

  // PDFドキュメントの状態
  const [pdf1, setPdf1] = useState<PDFDocumentProxy | null>(null)
  const [pdf2, setPdf2] = useState<PDFDocumentProxy | null>(null)
  const [fileName1, setFileName1] = useState('')
  const [fileName2, setFileName2] = useState('')

  // 表示制御
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [showDiff, setShowDiff] = useState(true)
  const [isCompared, setIsCompared] = useState(false)

  // AI要約
  const [apiKey, setApiKey] = useState('')
  const [summaryText, setSummaryText] = useState(
    'APIキーを入力し、比較実行後に要約ボタンを押してください。'
  )
  const [isSummarizing, setIsSummarizing] = useState(false)

  // Canvas参照
  const canvas1Ref = useRef<HTMLCanvasElement>(null)
  const canvas2Ref = useRef<HTMLCanvasElement>(null)
  const canvasDiffRef = useRef<HTMLCanvasElement>(null)

  // 最新の差分結果を保持
  const lastDiffRef = useRef<DiffResult | null>(null)

  // ドラッグ中のハイライト管理
  const [dragging1, setDragging1] = useState(false)
  const [dragging2, setDragging2] = useState(false)

  // pdf.js の動的ロード（クライアントサイドのみ）
  useEffect(() => {
    async function loadPdfJs() {
      const pdfjs = await import('pdfjs-dist')
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`
      pdfjsLibRef.current = pdfjs
    }
    loadPdfJs()
  }, [])

  // PDFファイルを読み込む共通処理
  const loadPdf = useCallback(
    async (
      file: File,
      setPdf: (doc: PDFDocumentProxy) => void,
      setName: (name: string) => void
    ) => {
      const pdfjs = pdfjsLibRef.current
      if (!pdfjs) return

      setName(file.name)
      const arrayBuffer = await file.arrayBuffer()
      const doc = await pdfjs.getDocument({ data: arrayBuffer }).promise
      setPdf(doc)
    },
    []
  )

  // ファイル選択ハンドラ
  const handleFileSelect = useCallback(
    (
      files: FileList | null,
      setPdf: (doc: PDFDocumentProxy) => void,
      setName: (name: string) => void
    ) => {
      const file = files?.[0]
      if (!file || file.type !== 'application/pdf') return
      loadPdf(file, setPdf, setName)
    },
    [loadPdf]
  )

  // ドラッグ&ドロップのイベントハンドラ生成
  const createDropHandlers = useCallback(
    (
      setPdf: (doc: PDFDocumentProxy) => void,
      setName: (name: string) => void,
      setDragging: (v: boolean) => void
    ) => ({
      onDragOver: (e: React.DragEvent) => {
        e.preventDefault()
        setDragging(true)
      },
      onDragLeave: () => setDragging(false),
      onDrop: (e: React.DragEvent) => {
        e.preventDefault()
        setDragging(false)
        const file = e.dataTransfer.files[0]
        if (file?.type === 'application/pdf') {
          loadPdf(file, setPdf, setName)
        }
      },
    }),
    [loadPdf]
  )

  // PDFの1ページをCanvasに描画してImageDataを返す
  const renderPage = useCallback(
    async (
      pdfDoc: PDFDocumentProxy,
      pageNum: number,
      canvas: HTMLCanvasElement
    ): Promise<ImageData> => {
      const page: PDFPageProxy = await pdfDoc.getPage(pageNum)
      const viewport = page.getViewport({ scale: RENDER_SCALE })
      canvas.width = viewport.width
      canvas.height = viewport.height
      const ctx = canvas.getContext('2d')!
      await page.render({ canvasContext: ctx, viewport }).promise
      return ctx.getImageData(0, 0, canvas.width, canvas.height)
    },
    []
  )

  // ピクセル単位の差分計算
  const computeDiff = useCallback(
    (
      imgData1: ImageData,
      imgData2: ImageData,
      diffCanvas: HTMLCanvasElement
    ): DiffResult => {
      const w = Math.min(imgData1.width, imgData2.width)
      const h = Math.min(imgData1.height, imgData2.height)
      diffCanvas.width = w
      diffCanvas.height = h

      const ctx = diffCanvas.getContext('2d')!
      const diffData = ctx.createImageData(w, h)
      let diffCount = 0

      for (let i = 0; i < w * h * 4; i += 4) {
        const dr = Math.abs(imgData1.data[i] - imgData2.data[i])
        const dg = Math.abs(imgData1.data[i + 1] - imgData2.data[i + 1])
        const db = Math.abs(imgData1.data[i + 2] - imgData2.data[i + 2])

        if (dr + dg + db > DIFF_THRESHOLD) {
          // 差分あり: 赤でハイライト
          diffData.data[i] = 220
          diffData.data[i + 1] = 50
          diffData.data[i + 2] = 50
          diffData.data[i + 3] = 200
          diffCount++
        } else {
          // 差分なし: 元画像を薄く表示
          diffData.data[i] = imgData1.data[i]
          diffData.data[i + 1] = imgData1.data[i + 1]
          diffData.data[i + 2] = imgData1.data[i + 2]
          diffData.data[i + 3] = 60
        }
      }

      ctx.putImageData(diffData, 0, 0)
      return { diffCount, totalPixels: w * h }
    },
    []
  )

  // 指定ページの描画と差分計算
  const renderCurrentPage = useCallback(
    async (pageNum: number) => {
      const c1 = canvas1Ref.current
      const c2 = canvas2Ref.current
      const cd = canvasDiffRef.current
      if (!c1 || !c2 || !cd || !pdf1 || !pdf2) return

      let img1: ImageData | null = null
      let img2: ImageData | null = null

      if (pageNum <= pdf1.numPages) {
        img1 = await renderPage(pdf1, pageNum, c1)
      }
      if (pageNum <= pdf2.numPages) {
        img2 = await renderPage(pdf2, pageNum, c2)
      }

      if (img1 && img2) {
        lastDiffRef.current = computeDiff(img1, img2, cd)
      }
    },
    [pdf1, pdf2, renderPage, computeDiff]
  )

  // 比較実行
  const handleCompare = useCallback(async () => {
    if (!pdf1 || !pdf2) return
    const pages = Math.max(pdf1.numPages, pdf2.numPages)
    setTotalPages(pages)
    setCurrentPage(1)
    setIsCompared(true)
    setShowDiff(true)
    await renderCurrentPage(1)
  }, [pdf1, pdf2, renderCurrentPage])

  // ページ切り替え
  const goToPage = useCallback(
    async (page: number) => {
      setCurrentPage(page)
      await renderCurrentPage(page)
    },
    [renderCurrentPage]
  )

  // AI要約を取得
  const handleSummarize = useCallback(async () => {
    const key = apiKey.trim()
    if (!key) {
      alert('APIキーを入力してください')
      return
    }
    if (!lastDiffRef.current) {
      alert('先に比較を実行してください')
      return
    }

    setIsSummarizing(true)
    setSummaryText('要約を生成中...')

    const { diffCount, totalPixels } = lastDiffRef.current
    const diffPercent = ((diffCount / totalPixels) * 100).toFixed(2)

    const prompt = `PDF比較の結果を分析してください。
ページ ${currentPage} の比較結果:
- 差分ピクセル数: ${diffCount}
- 全体ピクセル数: ${totalPixels}
- 差分率: ${diffPercent}%

この差分率から推測される変更内容を、日本語で簡潔に説明してください。差分率が0%に近ければ「ほぼ変更なし」、数%であれば「軽微な修正」、大きければ「大幅な変更」として、具体的に何が変わった可能性があるかを推測してください。`

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 500,
          messages: [{ role: 'user', content: prompt }],
        }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      setSummaryText(data.content[0].text)
    } catch (err) {
      const message = err instanceof Error ? err.message : '不明なエラー'
      setSummaryText(`エラー: ${message}`)
    } finally {
      setIsSummarizing(false)
    }
  }, [apiKey, currentPage])

  // 両方のPDFがロードされているか
  const isReady = pdf1 !== null && pdf2 !== null

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-6">
      {/* タイトル */}
      <h1 className="text-xl font-semibold mb-1">PDF比較ツール</h1>
      <p className="text-[13px] text-gray-400 mb-6">
        2つのPDFをアップロードして差分を確認
      </p>

      {/* アップロードエリア */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* PDF 1 */}
        <label
          className={`
            flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-md
            cursor-pointer transition-colors
            ${fileName1 ? 'border-navy bg-[#f0f4fa] border-solid' : 'border-gray-300'}
            ${dragging1 ? 'border-navy' : ''}
          `}
          {...createDropHandlers(setPdf1, setFileName1, setDragging1)}
        >
          <input
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) =>
              handleFileSelect(e.target.files, setPdf1, setFileName1)
            }
          />
          <span className="text-sm text-gray-500">
            PDF 1 をドロップまたはクリック
          </span>
          {fileName1 && (
            <span className="text-xs text-navy mt-2">{fileName1}</span>
          )}
        </label>

        {/* PDF 2 */}
        <label
          className={`
            flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-md
            cursor-pointer transition-colors
            ${fileName2 ? 'border-navy bg-[#f0f4fa] border-solid' : 'border-gray-300'}
            ${dragging2 ? 'border-navy' : ''}
          `}
          {...createDropHandlers(setPdf2, setFileName2, setDragging2)}
        >
          <input
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) =>
              handleFileSelect(e.target.files, setPdf2, setFileName2)
            }
          />
          <span className="text-sm text-gray-500">
            PDF 2 をドロップまたはクリック
          </span>
          {fileName2 && (
            <span className="text-xs text-navy mt-2">{fileName2}</span>
          )}
        </label>
      </div>

      {/* 操作ボタン */}
      <div className="flex items-center gap-3 flex-wrap mb-4">
        <button
          onClick={handleCompare}
          disabled={!isReady}
          className="px-4 py-2 text-[13px] rounded bg-navy text-white border border-navy
                     hover:bg-navy-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          比較する
        </button>
        <button
          onClick={() => setShowDiff((prev) => !prev)}
          disabled={!isCompared}
          className="px-4 py-2 text-[13px] rounded border border-gray-300 bg-white
                     hover:border-navy hover:text-navy
                     disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {showDiff ? '差分表示 ON/OFF' : '差分非表示中'}
        </button>
        <span className="flex items-center gap-2 text-[13px] text-gray-500">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={!isCompared || currentPage <= 1}
            className="px-3 py-2 rounded border border-gray-300 bg-white
                       hover:border-navy hover:text-navy
                       disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            前
          </button>
          <span>
            {isCompared ? `${currentPage} / ${totalPages}` : '- / -'}
          </span>
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={!isCompared || currentPage >= totalPages}
            className="px-3 py-2 rounded border border-gray-300 bg-white
                       hover:border-navy hover:text-navy
                       disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            次
          </button>
        </span>
      </div>

      {/* 比較ビュー（3カラム） */}
      {isCompared && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div>
            <div className="text-xs text-gray-400 mb-2">PDF 1</div>
            <div className="border border-gray-200 rounded overflow-hidden bg-[#fafafa]">
              <canvas ref={canvas1Ref} className="block w-full h-auto" />
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-2">PDF 2</div>
            <div className="border border-gray-200 rounded overflow-hidden bg-[#fafafa]">
              <canvas ref={canvas2Ref} className="block w-full h-auto" />
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-2">差分</div>
            <div className="border border-gray-200 rounded overflow-hidden bg-[#fafafa]">
              <canvas
                ref={canvasDiffRef}
                className={`block w-full h-auto ${showDiff ? '' : 'hidden'}`}
              />
            </div>
          </div>
        </div>
      )}

      {/* AI要約セクション */}
      <div className="mt-6">
        <div className="text-xs text-gray-400 mb-2">
          AI要約（Anthropic API）
        </div>
        <div className="flex gap-2 mb-3">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Anthropic API Key を入力"
            className="flex-1 px-3 py-2 text-[13px] border border-gray-300 rounded
                       focus:outline-none focus:border-navy"
          />
          <button
            onClick={handleSummarize}
            disabled={!isCompared || isSummarizing}
            className="px-4 py-2 text-[13px] rounded border border-gray-300 bg-white
                       hover:border-navy hover:text-navy
                       disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            変更点を要約
          </button>
        </div>
        <div
          className={`
            bg-[#f8f8f8] border border-gray-200 rounded-md p-4
            text-[13px] leading-7 whitespace-pre-wrap min-h-[60px]
            ${isSummarizing ? 'text-gray-400 italic' : ''}
          `}
        >
          {summaryText}
        </div>
      </div>
    </div>
  )
}
