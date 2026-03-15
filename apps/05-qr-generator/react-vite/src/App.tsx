import { useState, useCallback, useRef } from 'react'
import QRCode from 'qrcode'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'

// QRコード1件分のデータ型
interface QrItem {
  text: string
  dataUrl: string
  index: number
}

// ファイル名を生成（URLならドメイン名、それ以外は連番）
function generateFilename(text: string, index: number): string {
  try {
    const url = new URL(text)
    const domain = url.hostname.replace(/\./g, '_')
    return `qr_${domain}.png`
  } catch {
    return `qr_${String(index + 1).padStart(3, '0')}.png`
  }
}

// DataURLをBlobに変換するユーティリティ
function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',')
  const mime = parts[0].match(/:(.*?);/)?.[1] ?? 'image/png'
  const binary = atob(parts[1])
  const array = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i)
  }
  return new Blob([array], { type: mime })
}

export default function App() {
  const [inputText, setInputText] = useState('')
  const [fgColor, setFgColor] = useState('#262626')
  const [bgColor, setBgColor] = useState('#ffffff')
  const [qrSize, setQrSize] = useState(256)
  const [qrItems, setQrItems] = useState<QrItem[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [csvFileName, setCsvFileName] = useState('')
  const csvInputRef = useRef<HTMLInputElement>(null)

  // CSV読み込み処理
  const handleCsvUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setCsvFileName(file.name)
    const reader = new FileReader()

    reader.onload = (ev) => {
      const csvText = ev.target?.result as string
      const lines = csvText.split('\n').filter(line => line.trim())

      // ヘッダー行からURL列を特定
      const header = lines[0].split(',')
      const urlIndex = header.findIndex(h => h.trim().toLowerCase() === 'url')

      const startIndex = urlIndex >= 0 ? 1 : 0
      const colIndex = urlIndex >= 0 ? urlIndex : 0

      const urls = lines.slice(startIndex)
        .map(line => {
          const cols = line.split(',')
          return cols[colIndex]?.trim() ?? ''
        })
        .filter(url => url.length > 0)

      // 既存テキストに追加
      setInputText(prev => {
        const existing = prev.trim()
        return existing ? existing + '\n' + urls.join('\n') : urls.join('\n')
      })
    }

    reader.readAsText(file)
  }, [])

  // QRコード一括生成
  const handleGenerate = useCallback(async () => {
    const entries = inputText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)

    if (entries.length === 0) return

    setIsGenerating(true)

    try {
      // 全エントリを並列でQRコード化
      const items = await Promise.all(
        entries.map(async (text, index) => {
          const dataUrl = await QRCode.toDataURL(text, {
            width: qrSize,
            color: {
              dark: fgColor,
              light: bgColor,
            },
            errorCorrectionLevel: 'M',
          })
          return { text, dataUrl, index }
        })
      )

      setQrItems(items)
    } catch (error) {
      console.error('QRコード生成に失敗:', error)
    } finally {
      setIsGenerating(false)
    }
  }, [inputText, qrSize, fgColor, bgColor])

  // 個別ダウンロード
  const handleDownloadSingle = useCallback((item: QrItem) => {
    const link = document.createElement('a')
    link.download = generateFilename(item.text, item.index)
    link.href = item.dataUrl
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [])

  // ZIP一括ダウンロード
  const handleDownloadAll = useCallback(async () => {
    if (qrItems.length === 0) return

    try {
      const zip = new JSZip()

      qrItems.forEach(item => {
        const blob = dataUrlToBlob(item.dataUrl)
        const filename = generateFilename(item.text, item.index)
        zip.file(filename, blob)
      })

      const zipBlob = await zip.generateAsync({ type: 'blob' })
      saveAs(zipBlob, 'qr_codes.zip')
    } catch (error) {
      console.error('ZIP生成に失敗:', error)
    }
  }, [qrItems])

  // すべてクリア
  const handleClear = useCallback(() => {
    setInputText('')
    setQrItems([])
    setCsvFileName('')
    if (csvInputRef.current) {
      csvInputRef.current.value = ''
    }
  }, [])

  return (
    <div className="min-h-screen bg-white">
      {/* ヘッダー */}
      <header className="bg-navy text-white py-5 text-center">
        <h1 className="text-2xl font-semibold tracking-wide">QRコード一括生成ツール</h1>
        <p className="text-sm opacity-85 mt-1">URLやテキストからQRコードをまとめて生成</p>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* 入力エリア */}
        <section className="mb-8">
          <label
            htmlFor="textInput"
            className="block text-sm font-semibold text-navy mb-2"
          >
            テキスト入力（1行に1つのURL / テキスト）
          </label>
          <textarea
            id="textInput"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={'https://example.com\nhttps://google.com\nhttps://github.com'}
            className="w-full h-40 px-4 py-3 border border-gray-300 rounded-md text-sm leading-relaxed resize-y focus:outline-none focus:border-navy focus:ring-2 focus:ring-navy/10"
          />
          <div className="flex items-center gap-3 mt-3">
            <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 border border-gray-300 rounded-md text-xs cursor-pointer hover:bg-gray-200 transition-colors">
              CSVから読み込み
              <input
                ref={csvInputRef}
                type="file"
                accept=".csv"
                onChange={handleCsvUpload}
                className="hidden"
              />
            </label>
            {csvFileName && (
              <span className="text-xs text-gray-500">{csvFileName}</span>
            )}
          </div>
        </section>

        {/* 設定パネル */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8 p-5 bg-gray-50 rounded-lg border border-gray-200">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">前景色</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={fgColor}
                onChange={(e) => setFgColor(e.target.value)}
              />
              <span className="text-xs text-gray-500 font-mono">{fgColor}</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">背景色</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
              />
              <span className="text-xs text-gray-500 font-mono">{bgColor}</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">サイズ</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={128}
                max={512}
                step={16}
                value={qrSize}
                onChange={(e) => setQrSize(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-xs text-gray-500 font-mono min-w-[48px] text-right">
                {qrSize}px
              </span>
            </div>
          </div>
        </section>

        {/* ボタン群 */}
        <div className="flex gap-3 mb-8 flex-wrap">
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !inputText.trim()}
            className="px-6 py-2.5 bg-navy text-white rounded-md text-sm font-semibold hover:bg-navy-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating ? '生成中...' : '生成する'}
          </button>
          <button
            onClick={handleDownloadAll}
            disabled={qrItems.length === 0}
            className="px-6 py-2.5 bg-gray-100 text-gray-700 border border-gray-300 rounded-md text-sm font-semibold hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ZIP一括ダウンロード
          </button>
          <button
            onClick={handleClear}
            className="px-6 py-2.5 bg-white text-red-700 border border-red-300 rounded-md text-sm font-semibold hover:bg-red-50 transition-colors"
          >
            すべてクリア
          </button>
        </div>

        {/* 結果表示 */}
        {qrItems.length > 0 ? (
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-semibold text-navy">生成結果</h2>
              <span className="text-xs text-gray-500">{qrItems.length}件</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {qrItems.map((item) => (
                <div
                  key={item.index}
                  className="border border-gray-200 rounded-lg p-4 text-center bg-white hover:shadow-md transition-shadow"
                >
                  <p className="text-xs text-gray-500 mb-3 break-all line-clamp-2">
                    {item.text}
                  </p>
                  <div className="flex justify-center mb-3">
                    <img
                      src={item.dataUrl}
                      alt={`QR: ${item.text}`}
                      width={Math.min(qrSize, 200)}
                      height={Math.min(qrSize, 200)}
                    />
                  </div>
                  <button
                    onClick={() => handleDownloadSingle(item)}
                    className="inline-block px-3.5 py-1.5 text-xs text-navy bg-navy-light border border-indigo-200 rounded hover:bg-blue-100 transition-colors"
                  >
                    PNGダウンロード
                  </button>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <p className="text-sm">テキストを入力してQRコードを生成してください</p>
          </div>
        )}
      </main>

      {/* フッター */}
      <footer className="text-center py-6 text-xs text-gray-400 border-t border-gray-100 mt-12">
        QRコード一括生成ツール - AI駆動開発デモ
      </footer>

      {/* ローディングオーバーレイ */}
      {isGenerating && (
        <div className="fixed inset-0 bg-white/80 z-50 flex items-center justify-center">
          <div className="w-10 h-10 border-3 border-gray-200 border-t-navy rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}
