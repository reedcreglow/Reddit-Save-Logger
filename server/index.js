require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const express = require('express');
const session = require('express-session');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const { attachUser } = require('./middleware/session');
const { attachAccount } = require('./middleware/activeAccount');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false, // set true behind HTTPS in prod
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  },
}));

app.use('/api/auth', authRoutes);

// All routes below require authentication
app.use('/api', attachUser, attachAccount);

app.get('/api/ping', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
