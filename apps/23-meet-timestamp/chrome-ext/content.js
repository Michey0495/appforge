// Meet議事録タイムスタンプ - Content Script
// Google Meet上にフローティングメモ帳を表示する

(function() {
  'use strict';

  // 二重起動防止
  if (document.getElementById('meet-notes-panel')) return;

  const STORAGE_KEY = 'meet_notes_' + window.location.pathname;
  const startTime = Date.now();

  // パネル作成
  const panel = document.createElement('div');
  panel.id = 'meet-notes-panel';
  panel.innerHTML = `
    <div id="meet-notes-header">
      <span id="meet-notes-title">議事録</span>
      <span id="meet-notes-elapsed"></span>
      <button id="meet-notes-collapse" title="折りたたみ">-</button>
    </div>
    <div id="meet-notes-body">
      <textarea id="meet-notes-textarea" placeholder="議事録を入力..."></textarea>
      <div id="meet-notes-toolbar">
        <button class="mn-btn mn-btn-primary" id="meet-notes-stamp">タイムスタンプ</button>
        <button class="mn-btn" id="meet-notes-copy">コピー</button>
        <button class="mn-btn" id="meet-notes-md">Markdownでコピー</button>
        <button class="mn-btn mn-btn-danger" id="meet-notes-clear">クリア</button>
      </div>
    </div>
  `;

  // スタイル注入
  const style = document.createElement('style');
  style.textContent = `
    #meet-notes-panel {
      position: fixed;
      top: 80px;
      right: 16px;
      width: 360px;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 2px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
      z-index: 999999;
      font-family: 'Inter', 'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', sans-serif;
      font-size: 13px;
      color: #1a1a2e;
    }
    #meet-notes-header {
      display: flex;
      align-items: center;
      padding: 8px 12px;
      border-bottom: 1px solid #f3f4f6;
      cursor: move;
      user-select: none;
      background: #f8f9fb;
    }
    #meet-notes-title {
      font-weight: 600;
      font-size: 12px;
      flex: 1;
    }
    #meet-notes-elapsed {
      font-size: 10px;
      color: #9ca3af;
      margin-right: 8px;
      font-variant-numeric: tabular-nums;
    }
    #meet-notes-collapse {
      background: none;
      border: 1px solid #e5e7eb;
      border-radius: 2px;
      width: 24px;
      height: 24px;
      cursor: pointer;
      font-size: 14px;
      line-height: 1;
      color: #6b7280;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    #meet-notes-collapse:hover { background: #f3f4f6; }
    #meet-notes-body {
      padding: 8px;
    }
    #meet-notes-body.collapsed {
      display: none;
    }
    #meet-notes-textarea {
      width: 100%;
      height: 240px;
      border: 1px solid #e5e7eb;
      border-radius: 2px;
      padding: 8px;
      font-family: inherit;
      font-size: 12px;
      line-height: 1.7;
      color: #1a1a2e;
      resize: vertical;
      outline: none;
      box-sizing: border-box;
    }
    #meet-notes-textarea:focus {
      border-color: #1e3461;
    }
    #meet-notes-toolbar {
      display: flex;
      gap: 4px;
      margin-top: 6px;
      flex-wrap: wrap;
    }
    .mn-btn {
      background: transparent;
      color: #1e3461;
      border: 1px solid #e5e7eb;
      border-radius: 2px;
      padding: 4px 8px;
      font-size: 11px;
      font-family: inherit;
      cursor: pointer;
      white-space: nowrap;
    }
    .mn-btn:hover { background: #f3f4f6; }
    .mn-btn-primary {
      background: #1e3461;
      color: #ffffff;
      border-color: #1e3461;
    }
    .mn-btn-primary:hover { background: #2e4f87; }
    .mn-btn-danger { color: #dc2626; }
    .mn-btn-danger:hover { background: #fef2f2; }
  `;

  document.head.appendChild(style);
  document.body.appendChild(panel);

  const textarea = document.getElementById('meet-notes-textarea');
  const body = document.getElementById('meet-notes-body');
  const collapseBtn = document.getElementById('meet-notes-collapse');
  const elapsedEl = document.getElementById('meet-notes-elapsed');

  // localStorageから復元
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) textarea.value = saved;

  // 自動保存（入力ごと）
  textarea.addEventListener('input', () => {
    localStorage.setItem(STORAGE_KEY, textarea.value);
  });

  // 経過時間表示
  function updateElapsed() {
    const diff = Date.now() - startTime;
    const h = String(Math.floor(diff / 3600000)).padStart(2, '0');
    const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
    const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
    elapsedEl.textContent = `${h}:${m}:${s}`;
  }
  setInterval(updateElapsed, 1000);
  updateElapsed();

  // タイムスタンプ挿入
  document.getElementById('meet-notes-stamp').addEventListener('click', () => {
    const diff = Date.now() - startTime;
    const h = String(Math.floor(diff / 3600000)).padStart(2, '0');
    const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
    const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
    const stamp = `[${h}:${m}:${s}] `;

    const pos = textarea.selectionStart;
    const before = textarea.value.substring(0, pos);
    const after = textarea.value.substring(pos);
    textarea.value = before + stamp + after;
    textarea.selectionStart = textarea.selectionEnd = pos + stamp.length;
    textarea.focus();
    localStorage.setItem(STORAGE_KEY, textarea.value);
  });

  // コピー
  document.getElementById('meet-notes-copy').addEventListener('click', () => {
    navigator.clipboard.writeText(textarea.value).then(() => {
      flashButton('meet-notes-copy', 'コピー済み');
    });
  });

  // Markdownコピー
  document.getElementById('meet-notes-md').addEventListener('click', () => {
    const lines = textarea.value.split('\n');
    const md = lines.map((line) => {
      const tsMatch = line.match(/^\[(\d{2}:\d{2}:\d{2})\]\s*(.*)/);
      if (tsMatch) return `- **${tsMatch[1]}** ${tsMatch[2]}`;
      if (line.trim() === '') return '';
      return `- ${line}`;
    }).join('\n');

    navigator.clipboard.writeText(md).then(() => {
      flashButton('meet-notes-md', 'コピー済み');
    });
  });

  // クリア
  document.getElementById('meet-notes-clear').addEventListener('click', () => {
    if (confirm('メモをクリアしますか？')) {
      textarea.value = '';
      localStorage.removeItem(STORAGE_KEY);
    }
  });

  // 折りたたみ
  let collapsed = false;
  collapseBtn.addEventListener('click', () => {
    collapsed = !collapsed;
    body.classList.toggle('collapsed', collapsed);
    collapseBtn.textContent = collapsed ? '+' : '-';
    panel.style.width = collapsed ? '120px' : '360px';
  });

  // ドラッグ移動
  let isDragging = false;
  let dragOffsetX = 0;
  let dragOffsetY = 0;
  const header = document.getElementById('meet-notes-header');

  header.addEventListener('mousedown', (e) => {
    if (e.target === collapseBtn) return;
    isDragging = true;
    dragOffsetX = e.clientX - panel.offsetLeft;
    dragOffsetY = e.clientY - panel.offsetTop;
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    panel.style.left = (e.clientX - dragOffsetX) + 'px';
    panel.style.top = (e.clientY - dragOffsetY) + 'px';
    panel.style.right = 'auto';
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
  });

  function flashButton(id, text) {
    const btn = document.getElementById(id);
    const original = btn.textContent;
    btn.textContent = text;
    setTimeout(() => { btn.textContent = original; }, 1500);
  }
})();
