const db = require('../db');

const TOKEN_URL = 'https://www.reddit.com/api/v1/access_token';
const API_BASE = 'https://oauth.reddit.com';

async function refreshAccessToken(account) {
  const credentials = Buffer.from(
    `${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`
  ).toString('base64');
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'reddit-save-logger/1.0',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: account.refresh_token,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token refresh failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  const expiresAt = Date.now() + data.expires_in * 1000;

  db.prepare(
    'UPDATE accounts SET access_token = ?, token_expires_at = ? WHERE id = ?'
  ).run(data.access_token, expiresAt, account.id);

  return { ...account, access_token: data.access_token, token_expires_at: expiresAt };
}

async function redditFetch(account, path, options = {}) {
  let acc = account;

  // Refresh if expired or missing (with 60s buffer)
  if (!acc.access_token || !acc.token_expires_at || Date.now() > acc.token_expires_at - 60_000) {
    acc = await refreshAccessToken(acc);
  }

  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${acc.access_token}`,
      'User-Agent': 'reddit-save-logger/1.0',
      ...options.headers,
    },
  });

  // Retry once after refresh on 401
  if (res.status === 401) {
    acc = await refreshAccessToken(acc);
    const retry = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${acc.access_token}`,
        'User-Agent': 'reddit-save-logger/1.0',
        ...options.headers,
      },
    });
    if (!retry.ok) throw new Error(`Reddit API error: ${retry.status}`);
    return retry.json();
  }

  if (!res.ok) throw new Error(`Reddit API error: ${res.status}`);
  return res.json();
}

module.exports = { redditFetch, refreshAccessToken };
