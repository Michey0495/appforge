// ページ速度チェッカー - popup.js

document.addEventListener('DOMContentLoaded', () => {
  runAnalysis();
  document.getElementById('refreshBtn').addEventListener('click', runAnalysis);
});

async function runAnalysis() {
  const content = document.getElementById('content');
  content.innerHTML = '<div class="loading">計測中...</div>';

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) {
      throw new Error('アクティブなタブが見つかりません');
    }

    // chrome:// や edge:// 等のシステムページでは実行不可
    if (tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:'))) {
      throw new Error('システムページでは計測できません');
    }

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: collectMetrics
    });

    if (!results || results.length === 0 || !results[0].result) {
      throw new Error('メトリクスの取得に失敗しました');
    }

    const metrics = results[0].result;
    renderResults(metrics);
  } catch (err) {
    content.innerHTML = `<div class="error">${escapeHtml(err.message)}</div>`;
  }
}

// アクティブタブ内で実行されるメトリクス収集関数
function collectMetrics() {
  const navEntries = performance.getEntriesByType('navigation');
  const resourceEntries = performance.getEntriesByType('resource');
  const nav = navEntries.length > 0 ? navEntries[0] : null;

  // ページ読み込み時間
  const domContentLoaded = nav ? Math.round(nav.domContentLoadedEventEnd - nav.startTime) : null;
  const loadTime = nav ? Math.round(nav.loadEventEnd - nav.startTime) : null;

  // TTFB
  const ttfb = nav ? Math.round(nav.responseStart - nav.startTime) : null;

  // DOM要素数
  const domSize = document.querySelectorAll('*').length;

  // リソース集計
  let totalResourceSize = 0;
  let imageCount = 0;
  let imageSize = 0;

  resourceEntries.forEach(entry => {
    const size = entry.transferSize || 0;
    totalResourceSize += size;

    if (entry.initiatorType === 'img' || (entry.name && /\.(jpg|jpeg|png|gif|svg|webp|avif|ico)(\?|$)/i.test(entry.name))) {
      imageCount++;
      imageSize += size;
    }
  });

  return {
    domContentLoaded,
    loadTime,
    ttfb,
    domSize,
    resourceCount: resourceEntries.length,
    totalResourceSize,
    imageCount,
    imageSize
  };
}

function renderResults(m) {
  const score = calculateScore(m);
  const suggestions = generateSuggestions(m);

  let html = '';

  // スコア表示
  html += `<div class="score-section">
    <div class="score-label">総合スコア</div>
    <div class="score-value">${score.value}</div>
    <span class="score-badge score-${score.level}">${score.label}</span>
  </div>`;

  // メトリクスグリッド
  html += '<div class="metrics-grid">';
  html += metricCard('DOMContentLoaded', m.domContentLoaded, 'ms');
  html += metricCard('Load', m.loadTime, 'ms');
  html += metricCard('TTFB', m.ttfb, 'ms');
  html += metricCard('DOM要素数', m.domSize, '個');
  html += metricCard('リソース数', m.resourceCount, '件');
  html += metricCard('リソース合計', formatBytes(m.totalResourceSize), '');
  html += metricCard('画像数', m.imageCount, '件');
  html += metricCard('画像合計', formatBytes(m.imageSize), '');
  html += '</div>';

  // 改善提案
  if (suggestions.length > 0) {
    html += '<div class="suggestions">';
    html += '<div class="suggestions-title">改善ポイント</div>';
    suggestions.forEach(s => {
      html += `<div class="suggestion-item">${escapeHtml(s)}</div>`;
    });
    html += '</div>';
  }

  document.getElementById('content').innerHTML = html;
}

function metricCard(label, value, unit) {
  const displayValue = value !== null && value !== undefined ? value : '-';
  return `<div class="metric-card">
    <div class="metric-label">${label}</div>
    <div class="metric-value">${displayValue}<span class="metric-unit"> ${unit}</span></div>
  </div>`;
}

function calculateScore(m) {
  let points = 100;

  // ロード時間による減点
  if (m.loadTime !== null) {
    if (m.loadTime > 5000) points -= 30;
    else if (m.loadTime > 3000) points -= 20;
    else if (m.loadTime > 1500) points -= 10;
  }

  // TTFB
  if (m.ttfb !== null) {
    if (m.ttfb > 1000) points -= 20;
    else if (m.ttfb > 500) points -= 10;
    else if (m.ttfb > 200) points -= 5;
  }

  // DOM要素数
  if (m.domSize > 3000) points -= 15;
  else if (m.domSize > 1500) points -= 10;
  else if (m.domSize > 800) points -= 5;

  // リソース数
  if (m.resourceCount > 100) points -= 15;
  else if (m.resourceCount > 50) points -= 10;
  else if (m.resourceCount > 30) points -= 5;

  // リソースサイズ
  if (m.totalResourceSize > 5 * 1024 * 1024) points -= 15;
  else if (m.totalResourceSize > 2 * 1024 * 1024) points -= 10;
  else if (m.totalResourceSize > 1024 * 1024) points -= 5;

  points = Math.max(0, Math.min(100, points));

  let level, label;
  if (points >= 70) { level = 'good'; label = 'Good'; }
  else if (points >= 40) { level = 'medium'; label = 'Medium'; }
  else { level = 'bad'; label = 'Bad'; }

  return { value: points, level, label };
}

function generateSuggestions(m) {
  const suggestions = [];

  if (m.ttfb !== null && m.ttfb > 500) {
    suggestions.push(`TTFB が ${m.ttfb}ms です。サーバーレスポンスの高速化やCDN導入を検討してください。`);
  }

  if (m.loadTime !== null && m.loadTime > 3000) {
    suggestions.push(`ページ読み込みに ${(m.loadTime / 1000).toFixed(1)}秒 かかっています。リソースの最適化が必要です。`);
  }

  if (m.domSize > 1500) {
    suggestions.push(`DOM要素が ${m.domSize}個 あります。不要な要素の削減を検討してください。`);
  }

  if (m.resourceCount > 50) {
    suggestions.push(`${m.resourceCount}件のリソースを読み込んでいます。バンドルやスプライトの活用で削減できる可能性があります。`);
  }

  if (m.imageSize > 1024 * 1024) {
    suggestions.push(`画像の合計サイズが ${formatBytes(m.imageSize)} です。WebPへの変換や圧縮を検討してください。`);
  }

  if (m.imageCount > 20) {
    suggestions.push(`${m.imageCount}枚の画像があります。遅延読み込み（lazy loading）の導入を検討してください。`);
  }

  if (m.totalResourceSize > 2 * 1024 * 1024) {
    suggestions.push(`リソース合計が ${formatBytes(m.totalResourceSize)} です。gzip/brotli圧縮が有効か確認してください。`);
  }

  if (suggestions.length === 0) {
    suggestions.push('目立った問題は検出されませんでした。');
  }

  return suggestions;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + units[i];
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
