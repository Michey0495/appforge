#!/usr/bin/env node

// Slackリアクション集計スクリプト
// 使い方: SLACK_TOKEN=xoxb-... CHANNEL_ID=C01... node index.js

const https = require('https');
const fs = require('fs');

const SLACK_TOKEN = process.env.SLACK_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const LIMIT = parseInt(process.env.LIMIT || '200', 10);

if (!SLACK_TOKEN || !CHANNEL_ID) {
  console.error('環境変数 SLACK_TOKEN と CHANNEL_ID を設定してください');
  console.error('例: SLACK_TOKEN=xoxb-... CHANNEL_ID=C01... node index.js');
  process.exit(1);
}

function slackGet(path) {
  return new Promise((resolve, reject) => {
    const url = `https://slack.com/api/${path}`;
    const req = https.get(url, {
      headers: { 'Authorization': `Bearer ${SLACK_TOKEN}` }
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch (e) { reject(new Error(`JSON parse error: ${e.message}`)); }
      });
    });
    req.on('error', reject);
  });
}

async function fetchAllMessages() {
  let allMessages = [];
  let cursor = undefined;

  while (true) {
    let path = `conversations.history?channel=${CHANNEL_ID}&limit=${LIMIT}`;
    if (cursor) path += `&cursor=${cursor}`;

    const data = await slackGet(path);
    if (!data.ok) {
      console.error('Slack APIエラー:', data.error);
      process.exit(1);
    }

    allMessages = [...allMessages, ...data.messages];
    console.error(`取得済み: ${allMessages.length} メッセージ`);

    if (data.response_metadata?.next_cursor) {
      cursor = data.response_metadata.next_cursor;
    } else {
      break;
    }
  }
  return allMessages;
}

async function main() {
  console.error(`チャンネル ${CHANNEL_ID} のメッセージを取得中...`);
  const messages = await fetchAllMessages();

  const emojiCounts = {};
  const userCounts = {};
  let totalReactions = 0;

  messages.forEach((msg) => {
    if (!msg.reactions) return;
    msg.reactions.forEach((r) => {
      emojiCounts[r.name] = (emojiCounts[r.name] || 0) + r.count;
      totalReactions += r.count;
      if (r.users) {
        r.users.forEach((u) => {
          userCounts[u] = (userCounts[u] || 0) + 1;
        });
      }
    });
  });

  // コンソール出力
  console.error(`\n--- 集計結果 ---`);
  console.error(`メッセージ数: ${messages.length}`);
  console.error(`リアクション総数: ${totalReactions}`);
  console.error(`\n絵文字ランキング (上位15):`);

  Object.entries(emojiCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .forEach(([name, count], i) => {
      console.error(`  ${i + 1}. :${name}: ${count}`);
    });

  console.error(`\nユーザーランキング (上位15):`);
  Object.entries(userCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .forEach(([userId, count], i) => {
      console.error(`  ${i + 1}. ${userId}: ${count}`);
    });

  // CSV保存
  const csvRows = ['種別,名前,カウント'];
  Object.entries(emojiCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([name, count]) => csvRows.push(`絵文字,":${name}:",${count}`));
  Object.entries(userCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([userId, count]) => csvRows.push(`ユーザー,"${userId}",${count}`));

  const csvFile = `slack_reactions_${CHANNEL_ID}.csv`;
  fs.writeFileSync(csvFile, '\uFEFF' + csvRows.join('\n'), 'utf-8');
  console.error(`\nCSV保存: ${csvFile}`);

  // JSON（stdout）をWebUI向けに出力
  console.log(JSON.stringify({ ok: true, messages }, null, 2));
}

main().catch((err) => {
  console.error('エラー:', err.message);
  process.exit(1);
});
