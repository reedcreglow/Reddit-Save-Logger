CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reddit_user_id TEXT NOT NULL UNIQUE,
  reddit_username TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  last_login TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  reddit_user_id TEXT NOT NULL UNIQUE,
  reddit_username TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT NOT NULL,
  token_expires_at INTEGER,
  avatar_url TEXT,
  scope TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  is_active INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reddit_id TEXT NOT NULL,
  account_id INTEGER NOT NULL REFERENCES accounts(id),
  subreddit TEXT NOT NULL,
  author TEXT,
  title TEXT NOT NULL,
  selftext TEXT,
  url TEXT,
  permalink TEXT NOT NULL,
  thumbnail TEXT,
  preview_url TEXT,
  post_type TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  num_comments INTEGER DEFAULT 0,
  created_utc INTEGER NOT NULL,
  is_saved INTEGER DEFAULT 0,
  is_upvoted INTEGER DEFAULT 0,
  saved_at TEXT,
  upvoted_at TEXT,
  first_seen_at TEXT DEFAULT (datetime('now')),
  UNIQUE(reddit_id, account_id)
);

CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reddit_id TEXT NOT NULL,
  account_id INTEGER NOT NULL REFERENCES accounts(id),
  content TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(reddit_id, account_id)
);

CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id INTEGER NOT NULL REFERENCES accounts(id),
  name TEXT NOT NULL,
  color TEXT,
  UNIQUE(account_id, name)
);

CREATE TABLE IF NOT EXISTS post_tags (
  reddit_id TEXT NOT NULL,
  tag_id INTEGER NOT NULL REFERENCES tags(id),
  account_id INTEGER NOT NULL REFERENCES accounts(id),
  PRIMARY KEY (reddit_id, tag_id)
);

CREATE TABLE IF NOT EXISTS collections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id INTEGER NOT NULL REFERENCES accounts(id),
  name TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS collection_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  collection_id INTEGER NOT NULL REFERENCES collections(id),
  reddit_id TEXT NOT NULL,
  account_id INTEGER NOT NULL REFERENCES accounts(id),
  position INTEGER NOT NULL DEFAULT 0,
  added_at TEXT DEFAULT (datetime('now')),
  UNIQUE(collection_id, reddit_id)
);

CREATE TABLE IF NOT EXISTS saved_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id INTEGER NOT NULL REFERENCES accounts(id),
  name TEXT NOT NULL,
  filters TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sync_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id INTEGER NOT NULL REFERENCES accounts(id),
  pool TEXT NOT NULL,
  started_at TEXT DEFAULT (datetime('now')),
  completed_at TEXT,
  new_posts INTEGER DEFAULT 0,
  status TEXT DEFAULT 'running',
  error TEXT
);

CREATE VIRTUAL TABLE IF NOT EXISTS posts_fts USING fts5(
  reddit_id,
  title,
  selftext,
  subreddit,
  content='posts',
  content_rowid='id'
);

CREATE TRIGGER IF NOT EXISTS posts_ai AFTER INSERT ON posts BEGIN
  INSERT INTO posts_fts(rowid, reddit_id, title, selftext, subreddit)
  VALUES (new.id, new.reddit_id, new.title, new.selftext, new.subreddit);
END;

CREATE TRIGGER IF NOT EXISTS posts_ad AFTER DELETE ON posts BEGIN
  INSERT INTO posts_fts(posts_fts, rowid, reddit_id, title, selftext, subreddit)
  VALUES ('delete', old.id, old.reddit_id, old.title, old.selftext, old.subreddit);
END;

CREATE TRIGGER IF NOT EXISTS posts_au AFTER UPDATE ON posts BEGIN
  INSERT INTO posts_fts(posts_fts, rowid, reddit_id, title, selftext, subreddit)
  VALUES ('delete', old.id, old.reddit_id, old.title, old.selftext, old.subreddit);
  INSERT INTO posts_fts(rowid, reddit_id, title, selftext, subreddit)
  VALUES (new.id, new.reddit_id, new.title, new.selftext, new.subreddit);
END;

CREATE INDEX IF NOT EXISTS idx_accounts_user ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_account_saved ON posts(account_id, is_saved);
CREATE INDEX IF NOT EXISTS idx_posts_account_upvoted ON posts(account_id, is_upvoted);
CREATE INDEX IF NOT EXISTS idx_posts_subreddit ON posts(account_id, subreddit);
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(account_id, created_utc);
CREATE INDEX IF NOT EXISTS idx_posts_first_seen ON posts(account_id, first_seen_at);
CREATE INDEX IF NOT EXISTS idx_collection_posts_col ON collection_posts(collection_id, position);
CREATE INDEX IF NOT EXISTS idx_post_tags_reddit ON post_tags(reddit_id, account_id);
