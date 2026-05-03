const db = require('../db');

function attachAccount(req, res, next) {
  if (!req.session?.accountId) {
    return res.status(401).json({ error: 'No active account' });
  }
  const account = db.prepare(
    'SELECT * FROM accounts WHERE id = ? AND user_id = ?'
  ).get(req.session.accountId, req.user.id);
  if (!account) {
    return res.status(401).json({ error: 'Account not found' });
  }
  req.account = account;
  next();
}

module.exports = { attachAccount };
