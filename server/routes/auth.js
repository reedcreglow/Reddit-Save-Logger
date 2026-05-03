const express = require('express');
const crypto = require('crypto');
const db = require('../db');

const router = express.Router();

const REDDIT_AUTH_URL = 'https://www.reddit.com/api/v1/authorize';
const TOKEN_URL = 'https://www.reddit.com/api/v1/access_token';

// CSRF state token store — keyed by state, TTL 10 min
const pendingFlows = new Map();

function cleanExpiredFlows() {
  const now = Date.now();
  for (const [key, val] of pendingFlows) {
    if (val.expiresAt < now) pendingFlows.delete(key);
  }
}

// POST /api/auth/init
// Returns Reddit OAuth URL using server-side credentials from .env
router.post('/init', (req, res) => {
  const clientId = process.env.REDDIT_CLIENT_ID;
  if (!clientId) {
    return res.status(500).json({ error: 'REDDIT_CLIENT_ID is not configured on the server' });
  }

  cleanExpiredFlows();

  const state = crypto.randomBytes(16).toString('hex');
  pendingFlows.set(state, { expiresAt: Date.now() + 10 * 60 * 1000 });

  const redirectUri = process.env.REDDIT_REDIRECT_URI;
  const scope = 'identity read vote save history mysubreddits privatemessages';

  const url = new URL(REDDIT_AUTH_URL);
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('state', state);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('duration', 'permanent');
  url.searchParams.set('scope', scope);

  res.json({ url: url.toString() });
});

// GET /api/auth/callback
// Reddit redirects here after OAuth
router.get('/callback', async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    return res.redirect(`${process.env.FRONTEND_URL}/?auth=error&message=${encodeURIComponent(error)}`);
  }

  if (!code || !state) {
    return res.redirect(`${process.env.FRONTEND_URL}/?auth=error&message=missing_params`);
  }

  const pending = pendingFlows.get(state);
  if (!pending || pending.expiresAt < Date.now()) {
    pendingFlows.delete(state);
    return res.redirect(`${process.env.FRONTEND_URL}/?auth=error&message=expired_or_invalid_state`);
  }
  pendingFlows.delete(state);

  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;
  const redirectUri = process.env.REDDIT_REDIRECT_URI;

  try {
    // Exchange code for tokens
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const tokenRes = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'reddit-save-logger/1.0',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      const text = await tokenRes.text();
      console.error('Token exchange failed:', text);
      return res.redirect(`${process.env.FRONTEND_URL}/?auth=error&message=token_exchange_failed`);
    }

    const tokens = await tokenRes.json();
    const expiresAt = Date.now() + tokens.expires_in * 1000;

    // Fetch Reddit user info
    const meRes = await fetch('https://oauth.reddit.com/api/v1/me', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        'User-Agent': 'reddit-save-logger/1.0',
      },
    });

    if (!meRes.ok) {
      return res.redirect(`${process.env.FRONTEND_URL}/?auth=error&message=me_fetch_failed`);
    }

    const me = await meRes.json();
    const redditUserId = `t2_${me.id}`;
    const avatarUrl = me.icon_img
      ? me.icon_img.split('?')[0]
      : null;

    // Upsert user
    let user = db.prepare('SELECT * FROM users WHERE reddit_user_id = ?').get(redditUserId);
    if (!user) {
      const result = db.prepare(
        'INSERT INTO users (reddit_user_id, reddit_username) VALUES (?, ?)'
      ).run(redditUserId, me.name);
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    } else {
      db.prepare(
        "UPDATE users SET reddit_username = ?, last_login = datetime('now') WHERE id = ?"
      ).run(me.name, user.id);
    }

    // Upsert account
    let account = db.prepare('SELECT * FROM accounts WHERE reddit_user_id = ?').get(redditUserId);
    if (!account) {
      const result = db.prepare(
        `INSERT INTO accounts
           (user_id, reddit_user_id, reddit_username, access_token, refresh_token, token_expires_at, avatar_url, scope, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`
      ).run(user.id, redditUserId, me.name, tokens.access_token, tokens.refresh_token, expiresAt, avatarUrl, tokens.scope);
      account = db.prepare('SELECT * FROM accounts WHERE id = ?').get(result.lastInsertRowid);
    } else {
      db.prepare(
        `UPDATE accounts
         SET access_token = ?, refresh_token = ?, token_expires_at = ?, avatar_url = ?, scope = ?, is_active = 1
         WHERE id = ?`
      ).run(tokens.access_token, tokens.refresh_token, expiresAt, avatarUrl, tokens.scope, account.id);
    }

    req.session.userId = user.id;
    req.session.accountId = account.id;

    res.redirect(`${process.env.FRONTEND_URL}/`);
  } catch (err) {
    console.error('OAuth callback error:', err);
    res.redirect(`${process.env.FRONTEND_URL}/?auth=error&message=server_error`);
  }
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  if (!req.session?.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const user = db.prepare('SELECT id, reddit_user_id, reddit_username, created_at FROM users WHERE id = ?')
    .get(req.session.userId);
  if (!user) return res.status(401).json({ error: 'User not found' });

  const account = db.prepare(
    'SELECT id, reddit_username, avatar_url, scope, is_active FROM accounts WHERE id = ?'
  ).get(req.session.accountId);

  res.json({ user, account });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

module.exports = router;
