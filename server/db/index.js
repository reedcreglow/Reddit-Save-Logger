const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(__dirname, '../../data/reddit-save-logger.db');

const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);

// Migration: drop legacy per-user credential columns if they exist
const userCols = db.pragma('table_info(users)').map(c => c.name);
if (userCols.includes('client_id'))     db.exec('ALTER TABLE users DROP COLUMN client_id');
if (userCols.includes('client_secret')) db.exec('ALTER TABLE users DROP COLUMN client_secret');

console.log(`Database ready at ${DB_PATH}`);

module.exports = db;
