import { useState, useCallback, useRef, useMemo } from 'react'
import Papa from 'papaparse'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Bar, Line, Pie } from 'react-chartjs-2'

// Chart.jsのコンポーネント登録
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

// 型定義
type ChartType = 'bar' | 'line' | 'pie'

interface Stats {
  column: string
  mean: number
  median: number
  max: number
  min: number
  stdDev: number
}

// 統計量の計算
function calculateStats(values: number[]): Omit<Stats, 'column'> {
  const sorted = [...values].sort((a, b) => a - b)
  const n = sorted.length
  const sum = sorted.reduce((acc, v) => acc + v, 0)
  const mean = sum / n

  const median =
    n % 2 === 0
      ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
      : sorted[Math.floor(n / 2)]

  const variance = sorted.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / n
  const stdDev = Math.sqrt(variance)

  return { mean, median, max: sorted[n - 1], min: sorted[0], stdDev }
}

// 数値フォーマット
function formatNumber(num: number): string {
  if (Number.isInteger(num)) return num.toLocaleString('ja-JP')
  return num.toLocaleString('ja-JP', { maximumFractionDigits: 2 })
}

// 円グラフ用カラー生成
function generateColors(count: number): string[] {
  const baseHue = 220
  return Array.from({ length: count }, (_, i) => {
    const hue = (baseHue + (i * 360) / count) % 360
    const saturation = 55 + (i % 3) * 10
    const lightness = 45 + (i % 4) * 8
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`
  })
}

export default function App() {
  // 状態管理
  const [data, setData] = useState<Record<string, string>[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [fileName, setFileName] = useState('')
  const [chartType, setChartType] = useState<ChartType>('bar')
  const [labelColumn, setLabelColumn] = useState('')
  const [dataColumn, setDataColumn] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 数値カラムの判定
  const numericColumns = useMemo(() => {
    return headers.filter((h) =>
      data.some((row) => !isNaN(parseFloat(row[h])) && row[h] !== '')
    )
  }, [headers, data])

  // テキストカラム（ラベル候補）
  const textColumns = useMemo(() => {
    const textCols = headers.filter((h) => !numericColumns.includes(h))
    return textCols.length > 0 ? textCols : headers
  }, [headers, numericColumns])

  // CSV解析処理
  const handleFile = useCallback((file: File) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedHeaders = results.meta.fields || []
        const parsedData = results.data

        setHeaders(parsedHeaders)
        setData(parsedData)
        setFileName(file.name)

        // 数値/テキストカラムの初期値設定
        const numCols = parsedHeaders.filter((h) =>
          parsedData.some((row) => !isNaN(parseFloat(row[h])) && row[h] !== '')
        )
        const txtCols = parsedHeaders.filter((h) => !numCols.includes(h))
        const labelCandidates = txtCols.length > 0 ? txtCols : parsedHeaders

        setLabelColumn(labelCandidates[0] || '')
        setDataColumn(numCols[0] || '')
      },
    })
  }, [])

  // ドラッグ&ドロップハンドラ
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file && file.name.endsWith('.csv')) {
        handleFile(file)
      }
    },
    [handleFile]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false)
  }, [])

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  // 統計量の計算
  const statsData = useMemo((): Stats[] => {
    return numericColumns
      .map((col) => {
        const values = data
          .map((row) => parseFloat(row[col]))
          .filter((v) => !isNaN(v))
        if (values.length === 0) return null
        return { column: col, ...calculateStats(values) }
      })
      .filter((s): s is Stats => s !== null)
  }, [data, numericColumns])

  // グラフデータの構築
  const chartData = useMemo(() => {
    if (!labelColumn || !dataColumn || data.length === 0) return null

    const labels = data.map((row) => row[labelColumn])
    const values = data.map((row) => parseFloat(row[dataColumn]) || 0)
    const colors = generateColors(values.length)

    return {
      labels,
      datasets: [
        {
          label: dataColumn,
          data: values,
          backgroundColor:
            chartType === 'pie' ? colors : 'rgba(44, 82, 164, 0.7)',
          borderColor:
            chartType === 'pie'
              ? colors.map(() => '#ffffff')
              : '#2c52a4',
          borderWidth: 2,
          tension: 0.3,
          fill: false,
          pointBackgroundColor: '#2c52a4',
          pointRadius: chartType === 'line' ? 4 : undefined,
        },
      ],
    }
  }, [data, labelColumn, dataColumn, chartType])

  // グラフオプション
  const chartOptions = useMemo(() => {
    const fontFamily =
      "'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', sans-serif"
    return {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: chartType === 'pie',
          position: 'right' as const,
          labels: { font: { family: fontFamily, size: 12 } },
        },
        title: {
          display: true,
          text: dataColumn + 'の分布',
          font: { family: fontFamily, size: 16, weight: '600' as const },
          color: '#333',
        },
      },
      scales:
        chartType === 'pie'
          ? {}
          : {
              x: {
                grid: { color: '#f0f0f0' },
                ticks: { font: { family: fontFamily, size: 12 } },
              },
              y: {
                grid: { color: '#f0f0f0' },
                beginAtZero: true,
                ticks: { font: { family: fontFamily, size: 12 } },
              },
            },
    }
  }, [chartType, dataColumn])

  // グラフコンポーネントの選択
  const renderChart = () => {
    if (!chartData) return null
    switch (chartType) {
      case 'bar':
        return <Bar data={chartData} options={chartOptions} />
      case 'line':
        return <Line data={chartData} options={chartOptions} />
      case 'pie':
        return <Pie data={chartData} options={chartOptions} />
    }
  }

  const hasData = data.length > 0

  return (
    <div className="min-h-screen bg-white">
      {/* ヘッダー */}
      <header className="bg-navy text-white px-8 py-5">
        <h1 className="text-[22px] font-semibold tracking-wide">
          CSV可視化ダッシュボード
        </h1>
        <p className="text-[13px] opacity-85 mt-1">
          CSVファイルをアップロードしてデータを可視化
        </p>
      </header>

      <div className="max-w-[1200px] mx-auto px-6 py-8">
        {/* ドロップゾーン */}
        <div
          className={`border-2 border-dashed rounded-lg px-6 py-12 text-center cursor-pointer transition-colors mb-8
            ${isDragOver ? 'border-navy bg-blue-50' : 'border-gray-300 bg-gray-50 hover:border-navy hover:bg-blue-50'}`}
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <p className="text-base font-medium text-gray-600 mb-2">
            CSVファイルをここにドラッグ&ドロップ
          </p>
          <p className="text-sm text-gray-400">
            またはクリックしてファイルを選択
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileInput}
          />
        </div>

        {/* ファイル情報 */}
        {hasData && (
          <div className="bg-blue-50 border-l-4 border-navy px-4 py-3 mb-6 text-sm text-gray-700">
            読み込み完了:{' '}
            <span className="font-semibold text-navy">{fileName}</span> (
            {data.length}行 x {headers.length}列)
          </div>
        )}

        {/* コントロールパネル */}
        {hasData && (
          <div className="flex flex-wrap gap-4 mb-8 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                グラフ種類
              </label>
              <select
                value={chartType}
                onChange={(e) => setChartType(e.target.value as ChartType)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-700 min-w-[160px] focus:border-navy focus:outline-none"
              >
                <option value="bar">棒グラフ</option>
                <option value="line">折れ線グラフ</option>
                <option value="pie">円グラフ</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                ラベル列（X軸）
              </label>
              <select
                value={labelColumn}
                onChange={(e) => setLabelColumn(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-700 min-w-[160px] focus:border-navy focus:outline-none"
              >
                {textColumns.map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                データ列（Y軸）
              </label>
              <select
                value={dataColumn}
                onChange={(e) => setDataColumn(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-700 min-w-[160px] focus:border-navy focus:outline-none"
              >
                {numericColumns.map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* グラフ */}
        {hasData && chartData && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
            <div className="max-h-[450px]">{renderChart()}</div>
          </div>
        )}

        {/* 統計量テーブル */}
        {hasData && statsData.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-navy mb-4 pb-2 border-b-2 border-gray-200">
              基本統計量
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr>
                    <th className="bg-gray-50 text-navy font-semibold px-4 py-2.5 text-left border-b-2 border-gray-200">
                      カラム
                    </th>
                    <th className="bg-gray-50 text-navy font-semibold px-4 py-2.5 text-left border-b-2 border-gray-200">
                      平均
                    </th>
                    <th className="bg-gray-50 text-navy font-semibold px-4 py-2.5 text-left border-b-2 border-gray-200">
                      中央値
                    </th>
                    <th className="bg-gray-50 text-navy font-semibold px-4 py-2.5 text-left border-b-2 border-gray-200">
                      最大値
                    </th>
                    <th className="bg-gray-50 text-navy font-semibold px-4 py-2.5 text-left border-b-2 border-gray-200">
                      最小値
                    </th>
                    <th className="bg-gray-50 text-navy font-semibold px-4 py-2.5 text-left border-b-2 border-gray-200">
                      標準偏差
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {statsData.map((stat) => (
                    <tr key={stat.column} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 border-b border-gray-100 font-semibold text-navy">
                        {stat.column}
                      </td>
                      <td className="px-4 py-2.5 border-b border-gray-100 text-gray-600">
                        {formatNumber(stat.mean)}
                      </td>
                      <td className="px-4 py-2.5 border-b border-gray-100 text-gray-600">
                        {formatNumber(stat.median)}
                      </td>
                      <td className="px-4 py-2.5 border-b border-gray-100 text-gray-600">
                        {formatNumber(stat.max)}
                      </td>
                      <td className="px-4 py-2.5 border-b border-gray-100 text-gray-600">
                        {formatNumber(stat.min)}
                      </td>
                      <td className="px-4 py-2.5 border-b border-gray-100 text-gray-600">
                        {formatNumber(stat.stdDev)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* データプレビュー */}
        {hasData && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-navy mb-4 pb-2 border-b-2 border-gray-200">
              データプレビュー（先頭10行）
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px] border-collapse">
                <thead>
                  <tr>
                    {headers.map((h) => (
                      <th
                        key={h}
                        className="bg-navy text-white font-medium px-3 py-2 text-left whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.slice(0, 10).map((row, i) => (
                    <tr
                      key={i}
                      className={i % 2 === 1 ? 'bg-gray-50' : ''}
                    >
                      {headers.map((h) => (
                        <td
                          key={h}
                          className="px-3 py-2 border-b border-gray-100 whitespace-nowrap"
                        >
                          {row[h] || ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
