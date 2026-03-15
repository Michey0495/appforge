import { useState, useRef, useCallback, type DragEvent, type ChangeEvent } from 'react'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'

// 読み込んだ画像の型定義
interface SourceFile {
  name: string
  type: string
  size: number
  dataUrl: string
}

// 変換済み画像の型定義
interface ConvertedFile {
  name: string
  blob: Blob
  url: string
  width: number
  height: number
}

// 出力フォーマットの選択肢
type OutputFormat = 'image/png' | 'image/jpeg' | 'image/webp'

// フォーマットに対応する拡張子を返す
const getExtension = (format: OutputFormat): string => {
  const map: Record<OutputFormat, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
  }
  return map[format]
}

// ファイルサイズを読みやすい形式に変換
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

// 1枚の画像を変換する処理
const convertImage = (
  source: SourceFile,
  targetWidth: number,
  targetHeight: number,
  format: OutputFormat,
  quality: number,
  keepAspect: boolean
): Promise<ConvertedFile> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      let w = targetWidth || img.naturalWidth
      let h = targetHeight || img.naturalHeight

      // アスペクト比を維持する計算
      if (keepAspect && (targetWidth || targetHeight)) {
        const ratio = img.naturalWidth / img.naturalHeight
        if (targetWidth && targetHeight) {
          if (w / h > ratio) {
            w = Math.round(h * ratio)
          } else {
            h = Math.round(w / ratio)
          }
        } else if (targetWidth) {
          h = Math.round(w / ratio)
        } else {
          w = Math.round(h * ratio)
        }
      }

      // オフスクリーンCanvasに描画
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas contextを取得できません'))
        return
      }
      ctx.drawImage(img, 0, 0, w, h)

      // Blobとして出力
      const baseName = source.name.replace(/\.[^.]+$/, '')
      const outputName = `${baseName}.${getExtension(format)}`

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('変換に失敗しました'))
            return
          }
          resolve({
            name: outputName,
            blob,
            url: URL.createObjectURL(blob),
            width: w,
            height: h,
          })
        },
        format,
        quality
      )
    }
    img.onerror = () => reject(new Error('画像の読み込みに失敗しました'))
    img.src = source.dataUrl
  })
}

export default function App() {
  // 状態管理
  const [sourceFiles, setSourceFiles] = useState<SourceFile[]>([])
  const [convertedFiles, setConvertedFiles] = useState<ConvertedFile[]>([])
  const [resizeWidth, setResizeWidth] = useState('')
  const [resizeHeight, setResizeHeight] = useState('')
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('image/png')
  const [quality, setQuality] = useState(0.8)
  const [keepAspect, setKeepAspect] = useState(true)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isConverting, setIsConverting] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [progress, setProgress] = useState(0)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // ファイルを読み込んでsourceFilesに追加
  const handleFiles = useCallback((files: FileList) => {
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (imageFiles.length === 0) return

    const promises = imageFiles.map(
      (file) =>
        new Promise<SourceFile>((resolve) => {
          const reader = new FileReader()
          reader.onload = (e) => {
            resolve({
              name: file.name,
              type: file.type,
              size: file.size,
              dataUrl: e.target?.result as string,
            })
          }
          reader.readAsDataURL(file)
        })
    )

    Promise.all(promises).then((newFiles) => {
      setSourceFiles((prev) => [...prev, ...newFiles])
    })
  }, [])

  // ドラッグ&ドロップのハンドラ
  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles]
  )

  const handleFileInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        handleFiles(e.target.files)
      }
    },
    [handleFiles]
  )

  // 変換実行
  const handleConvert = async () => {
    if (sourceFiles.length === 0) return

    setIsConverting(true)
    setConvertedFiles([])
    setProgress(0)
    setStatusMessage('変換中...')

    const targetW = resizeWidth ? parseInt(resizeWidth) : 0
    const targetH = resizeHeight ? parseInt(resizeHeight) : 0
    const results: ConvertedFile[] = []

    for (let i = 0; i < sourceFiles.length; i++) {
      try {
        const result = await convertImage(
          sourceFiles[i],
          targetW,
          targetH,
          outputFormat,
          quality,
          keepAspect
        )
        results.push(result)
      } catch (err) {
        console.error(`変換エラー: ${sourceFiles[i].name}`, err)
      }

      const pct = Math.round(((i + 1) / sourceFiles.length) * 100)
      setProgress(pct)
      setStatusMessage(`変換中... ${i + 1} / ${sourceFiles.length}`)
    }

    setConvertedFiles(results)
    setStatusMessage(`${results.length} 件の変換が完了`)
    setIsConverting(false)
  }

  // ZIP一括ダウンロード
  const handleDownloadAll = async () => {
    if (convertedFiles.length === 0) return

    setStatusMessage('ZIPファイルを生成中...')
    const zip = new JSZip()

    convertedFiles.forEach((file) => {
      zip.file(file.name, file.blob)
    })

    try {
      const content = await zip.generateAsync({ type: 'blob' })
      saveAs(content, 'converted-images.zip')
      setStatusMessage('ZIPダウンロード完了')
    } catch (err) {
      console.error('ZIP生成エラー:', err)
      setStatusMessage('ZIP生成に失敗しました')
    }
  }

  // 個別ダウンロード
  const handleDownloadOne = (file: ConvertedFile) => {
    const a = document.createElement('a')
    a.href = file.url
    a.download = file.name
    a.click()
  }

  // すべてクリア
  const handleClear = () => {
    // 既存のObjectURLを解放
    convertedFiles.forEach((f) => URL.revokeObjectURL(f.url))
    setSourceFiles([])
    setConvertedFiles([])
    setStatusMessage('')
    setProgress(0)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="min-h-screen bg-white">
      {/* ヘッダー */}
      <header className="bg-navy text-white px-8 py-5">
        <h1 className="text-xl font-semibold tracking-wide">画像一括変換ツール</h1>
        <p className="text-sm mt-1 opacity-85">
          複数画像のリサイズ・フォーマット変換・圧縮をブラウザ内で処理
        </p>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* ドロップゾーン */}
        <div
          className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
            isDragOver
              ? 'border-navy bg-navy-light'
              : 'border-gray-300 bg-gray-50 hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <p className="text-sm text-gray-600">画像ファイルをここにドラッグ&ドロップ</p>
          <p className="text-xs text-gray-400 mt-1">
            またはクリックしてファイルを選択（PNG / JPEG / WebP / GIF）
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          accept="image/*"
          onChange={handleFileInputChange}
        />

        {/* 設定パネル */}
        <div className="mt-7 p-6 bg-gray-50 rounded-lg grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">幅 (px)</label>
            <input
              type="number"
              placeholder="例: 800"
              min={1}
              value={resizeWidth}
              onChange={(e) => setResizeWidth(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-navy focus:ring-2 focus:ring-navy/15"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">高さ (px)</label>
            <input
              type="number"
              placeholder="例: 600"
              min={1}
              value={resizeHeight}
              onChange={(e) => setResizeHeight(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-navy focus:ring-2 focus:ring-navy/15"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">出力フォーマット</label>
            <select
              value={outputFormat}
              onChange={(e) => setOutputFormat(e.target.value as OutputFormat)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:border-navy focus:ring-2 focus:ring-navy/15"
            >
              <option value="image/png">PNG</option>
              <option value="image/jpeg">JPEG</option>
              <option value="image/webp">WebP</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              品質 <span className="text-navy font-semibold">{quality}</span>
            </label>
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.05}
              value={quality}
              onChange={(e) => setQuality(parseFloat(e.target.value))}
              className="w-full mt-1"
            />
          </div>
        </div>

        {/* アスペクト比維持チェック */}
        <div className="mt-5 flex items-center gap-2">
          <input
            type="checkbox"
            id="keepAspect"
            checked={keepAspect}
            onChange={(e) => setKeepAspect(e.target.checked)}
            className="w-4 h-4"
          />
          <label htmlFor="keepAspect" className="text-xs text-gray-700">
            アスペクト比を維持する
          </label>
        </div>

        {/* アクションボタン */}
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={handleConvert}
            disabled={sourceFiles.length === 0 || isConverting}
            className="px-6 py-2.5 bg-navy text-white text-sm font-semibold rounded-md hover:bg-navy-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            変換実行
          </button>
          <button
            onClick={handleDownloadAll}
            disabled={convertedFiles.length === 0}
            className="px-6 py-2.5 bg-navy-light text-navy text-sm font-semibold rounded-md hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ZIP一括ダウンロード
          </button>
          <button
            onClick={handleClear}
            disabled={sourceFiles.length === 0}
            className="px-6 py-2.5 bg-white text-red-700 text-sm font-semibold rounded-md border border-red-200 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            すべてクリア
          </button>
        </div>

        {/* ファイル数表示 */}
        {sourceFiles.length > 0 && (
          <p className="mt-5 text-xs text-gray-500">
            {sourceFiles.length} 件の画像を読み込み済み
          </p>
        )}

        {/* ステータスバー */}
        {statusMessage && (
          <div className="mt-4 p-3 bg-navy-light rounded-md text-sm text-navy">
            <span>{statusMessage}</span>
            {isConverting && (
              <div className="w-full h-1 bg-blue-200 rounded mt-2 overflow-hidden">
                <div
                  className="h-full bg-navy transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>
        )}

        {/* プレビューグリッド */}
        {convertedFiles.length > 0 && (
          <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {convertedFiles.map((file, index) => (
              <div key={index} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                <img
                  src={file.url}
                  alt={file.name}
                  className="w-full h-36 object-contain bg-gray-100"
                />
                <div className="px-3 py-2">
                  <p className="text-xs text-gray-800 truncate">{file.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {file.width} x {file.height} / {formatFileSize(file.blob.size)}
                  </p>
                </div>
                <div className="px-3 pb-2">
                  <button
                    onClick={() => handleDownloadOne(file)}
                    className="text-xs px-3 py-1 bg-navy text-white rounded hover:bg-navy-dark transition-colors"
                  >
                    ダウンロード
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
