#!/usr/bin/env node

// GitHubイシュー棚卸しスクリプト
// 使い方: GITHUB_TOKEN=ghp_xxx REPO=owner/name node index.js

const fs = require('fs');

const TOKEN = process.env.GITHUB_TOKEN;
const REPO = process.env.REPO;

if (!TOKEN || !REPO) {
  console.error('環境変数 GITHUB_TOKEN と REPO を設定してください');
  console.error('例: GITHUB_TOKEN=ghp_xxx REPO=facebook/react node index.js');
  process.exit(1);
}

async function fetchAllIssues() {
  let allIssues = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const url = `https://api.github.com/repos/${REPO}/issues?state=open&per_page=${perPage}&page=${page}`;
    const res = await fetch(url, {
      headers: {
        'Authorization': `token ${TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'issue-audit-script'
      }
    });

    if (!res.ok) {
      throw new Error(`GitHub API エラー: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    if (data.length === 0) break;

    // PRを除外
    const issuesOnly = data.filter(item => !item.pull_request);
    allIssues = [...allIssues, ...issuesOnly];

    if (data.length < perPage) break;
    page++;
  }

  return allIssues;
}

function calcScore(daysSinceUpdate) {
  if (daysSinceUpdate > 90) return { level: 'high', label: '高' };
  if (daysSinceUpdate > 30) return { level: 'medium', label: '中' };
  return { level: 'low', label: '低' };
}

function formatDate(date) {
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
}

async function main() {
  console.error(`リポジトリ ${REPO} のイシューを取得中...`);
  const issues = await fetchAllIssues();
  const now = new Date();

  const processed = issues.map(issue => {
    const updatedAt = new Date(issue.updated_at);
    const days = Math.floor((now - updatedAt) / (1000 * 60 * 60 * 24));
    const score = calcScore(days);
    const assignees = (issue.assignees || []).map(a => a.login);
    const labels = (issue.labels || []).map(l => l.name);

    return { number: issue.number, title: issue.title, labels, assignees, updatedAt, days, score };
  }).sort((a, b) => b.days - a.days);

  // Markdownレポート出力
  const dateStr = formatDate(now);
  const high = processed.filter(i => i.score.level === 'high');
  const medium = processed.filter(i => i.score.level === 'medium');
  const low = processed.filter(i => i.score.level === 'low');
  const unassigned = processed.filter(i => i.assignees.length === 0);

  let md = `# GitHubイシュー棚卸しレポート\n\n`;
  md += `生成日: ${dateStr}\n`;
  md += `リポジトリ: ${REPO}\n`;
  md += `対象イシュー数: ${processed.length}件\n\n`;
  md += `## サマリー\n\n`;
  md += `- 対応必須（90日以上放置）: ${high.length}件\n`;
  md += `- 要確認（30-90日放置）: ${medium.length}件\n`;
  md += `- 直近更新あり（30日未満）: ${low.length}件\n`;
  md += `- 未アサイン: ${unassigned.length}件\n\n`;

  const renderSection = (title, items) => {
    if (items.length === 0) return '';
    let s = `## ${title}\n\n`;
    items.forEach(i => {
      s += `- #${i.number} ${i.title} （${i.days}日放置, アサイン: ${i.assignees.length > 0 ? i.assignees.join('/') : 'なし'}）\n`;
    });
    return s + '\n';
  };

  md += renderSection('対応必須（スコア: 高）', high);
  md += renderSection('要確認（スコア: 中）', medium);
  md += renderSection('直近更新あり（スコア: 低）', low);

  // stdoutにMarkdownを出力
  console.log(md);

  // CSVファイルを保存
  const csvDate = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const csvPath = `./issue-audit-${csvDate}.csv`;
  const bom = '\uFEFF';
  let csv = bom + '番号,タイトル,ラベル,アサイン,最終更新,放置日数,スコア\n';

  processed.forEach(i => {
    const quoteCsv = (v) => {
      const s = String(v);
      return (s.includes(',') || s.includes('"') || s.includes('\n'))
        ? '"' + s.replace(/"/g, '""') + '"'
        : s;
    };
    csv += [
      i.number,
      quoteCsv(i.title),
      quoteCsv(i.labels.join('; ')),
      quoteCsv(i.assignees.join('; ') || 'なし'),
      formatDate(i.updatedAt),
      i.days,
      i.score.label
    ].join(',') + '\n';
  });

  fs.writeFileSync(csvPath, csv, 'utf-8');
  console.error(`CSVファイルを保存しました: ${csvPath}`);
}

main().catch(err => {
  console.error('エラー:', err.message);
  process.exit(1);
});
