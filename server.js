const path = require('path');
const crypto = require('crypto');
const express = require('express');
const { rateLimit } = require('express-rate-limit');
const { initializeDatabase, pool } = require('./db');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const authSecret = process.env.AUTH_SECRET?.trim() || 'daystride-development-secret';

if (!process.env.AUTH_SECRET?.trim()) {
  console.warn('AUTH_SECRET is missing. Using a temporary development secret for this session.');
}

const AUTH_SECRET = authSecret;
const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const databaseUnavailableMessage =
  'Database is not connected. Check your MySQL credentials in .env, then restart the server.';

let databaseReady = false;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use((error, _req, res, next) => {
  if (error instanceof SyntaxError && 'body' in error) {
    return res.status(400).json({ message: 'Request body must be valid JSON.' });
  }

  return next(error);
});

const appLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false
});

app.use(appLimiter);

const formatDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value);
const formatTime = (value) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
const formatEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const normalizeEmail = (email) => email.trim().toLowerCase();

const encodeBase64Url = (value) => Buffer.from(value).toString('base64url');

const signToken = (payload) => {
  const body = encodeBase64Url(JSON.stringify(payload));
  const signature = crypto.createHmac('sha256', AUTH_SECRET).update(body).digest('base64url');
  return `${body}.${signature}`;
};

const verifyToken = (token) => {
  const [body, signature] = String(token || '').split('.');
  if (!body || !signature) return null;

  const expectedSignature = crypto.createHmac('sha256', AUTH_SECRET).update(body).digest('base64url');
  if (signature.length !== expectedSignature.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch (error) {
    return null;
  }
};

const hashPassword = (password, salt = crypto.randomBytes(16).toString('hex')) => {
  const hash = crypto.pbkdf2Sync(password, salt, 120000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
};

const verifyPassword = (password, storedHash) => {
  const [salt, originalHash] = String(storedHash || '').split(':');
  if (!salt || !originalHash) return false;

  const currentHash = hashPassword(password, salt).split(':')[1];
  if (currentHash.length !== originalHash.length) return false;
  return crypto.timingSafeEqual(Buffer.from(currentHash), Buffer.from(originalHash));
};

const validateAuthPayload = ({ name, email, password }, isSignup = false) => {
  if (isSignup && (!name || name.trim().length < 2)) return 'Name must be at least 2 characters.';
  if (!email || !formatEmail(email)) return 'Please enter a valid email address.';
  if (!password || password.length < 8) return 'Password must be at least 8 characters.';
  return null;
};

const validateProfilePayload = ({ name, email }) => {
  if (!name || name.trim().length < 2) return 'Name must be at least 2 characters.';
  if (!email || !formatEmail(email)) return 'Please enter a valid email address.';
  return null;
};

const createAuthResponse = (user) => ({
  user: {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.created_at
  },
  token: signToken({
    sub: user.id,
    name: user.name,
    email: user.email,
    exp: Date.now() + TOKEN_TTL_MS
  })
});

const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  const payload = verifyToken(token);

  if (!payload) {
    return res.status(401).json({ message: 'Please sign in to continue.' });
  }

  try {
    const [rows] = await pool.query('SELECT id, name, email, created_at FROM users WHERE id = ?', [
      payload.sub
    ]);
    if (!rows.length) return res.status(401).json({ message: 'Account not found.' });

    req.user = rows[0];
    return next();
  } catch (error) {
    return res.status(500).json({ message: 'Unable to verify account.' });
  }
};

const requireDatabase = (_req, res, next) => {
  if (!databaseReady) {
    return res.status(503).json({ message: databaseUnavailableMessage });
  }

  return next();
};

const validatePayload = ({ title, taskDate, startTime, endTime, priority, notes, status }) => {
  if (!title || title.trim().length < 3) return 'Title must be at least 3 characters.';
  if (!formatDate(taskDate)) return 'taskDate must be YYYY-MM-DD.';
  if (!formatTime(startTime) || !formatTime(endTime)) return 'Times must be HH:MM.';
  if (startTime >= endTime) return 'endTime must be later than startTime.';
  if (!['low', 'medium', 'high'].includes(priority)) return 'Invalid priority.';
  if (status && !['pending', 'in_progress', 'completed'].includes(status)) return 'Invalid status.';
  if (notes && notes.length > 500) return 'Notes must be 500 characters or less.';
  return null;
};

app.get('/api/health', async (_req, res) => {
  if (!databaseReady) {
    return res.status(503).json({ status: 'error', database: 'unavailable' });
  }

  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(503).json({ status: 'error', database: 'unavailable' });
  }
});

app.post('/api/auth/signup', requireDatabase, async (req, res) => {
  const payload = {
    name: req.body.name,
    email: req.body.email,
    password: req.body.password
  };

  const errorMessage = validateAuthPayload(payload, true);
  if (errorMessage) return res.status(400).json({ message: errorMessage });

  try {
    const email = normalizeEmail(payload.email);
    const passwordHash = hashPassword(payload.password);
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [payload.name.trim(), email, passwordHash]
    );
    const [rows] = await pool.query('SELECT id, name, email, created_at FROM users WHERE id = ?', [
      result.insertId
    ]);

    return res.status(201).json(createAuthResponse(rows[0]));
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    return res.status(500).json({ message: 'Unable to create account.' });
  }
});

app.post('/api/auth/signin', requireDatabase, async (req, res) => {
  const payload = {
    email: req.body.email,
    password: req.body.password
  };

  const errorMessage = validateAuthPayload(payload);
  if (errorMessage) return res.status(400).json({ message: errorMessage });

  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, password_hash, created_at FROM users WHERE email = ?',
      [normalizeEmail(payload.email)]
    );

    if (!rows.length || !verifyPassword(payload.password, rows[0].password_hash)) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    return res.json(createAuthResponse(rows[0]));
  } catch (error) {
    return res.status(500).json({ message: 'Unable to sign in.' });
  }
});

app.get('/api/auth/me', requireDatabase, requireAuth, (req, res) => {
  res.json({ user: req.user });
});

app.put('/api/auth/profile', requireDatabase, requireAuth, async (req, res) => {
  const payload = {
    name: req.body.name,
    email: req.body.email
  };

  const errorMessage = validateProfilePayload(payload);
  if (errorMessage) return res.status(400).json({ message: errorMessage });

  try {
    const email = normalizeEmail(payload.email);
    const [result] = await pool.query('UPDATE users SET name = ?, email = ? WHERE id = ?', [
      payload.name.trim(),
      email,
      req.user.id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Account not found.' });
    }

    const [rows] = await pool.query('SELECT id, name, email, created_at FROM users WHERE id = ?', [
      req.user.id
    ]);

    return res.json(createAuthResponse(rows[0]));
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    return res.status(500).json({ message: 'Unable to update profile.' });
  }
});

app.get('/api/schedules', requireDatabase, requireAuth, async (req, res) => {
  const { date } = req.query;

  if (date && !formatDate(date)) {
    return res.status(400).json({ message: 'date query must be YYYY-MM-DD.' });
  }

  try {
    const [rows] = date
      ? await pool.query(
          'SELECT * FROM schedules WHERE user_id = ? AND task_date = ? ORDER BY start_time ASC',
          [req.user.id, date]
        )
      : await pool.query(
          'SELECT * FROM schedules WHERE user_id = ? ORDER BY task_date ASC, start_time ASC',
          [req.user.id]
        );

    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to load schedules.' });
  }
});

app.post('/api/schedules', requireDatabase, requireAuth, async (req, res) => {
  const payload = {
    title: req.body.title,
    taskDate: req.body.taskDate,
    startTime: req.body.startTime,
    endTime: req.body.endTime,
    priority: req.body.priority,
    notes: req.body.notes || '',
    status: req.body.status || 'pending'
  };

  const errorMessage = validatePayload(payload);
  if (errorMessage) return res.status(400).json({ message: errorMessage });

  try {
    const [result] = await pool.query(
      `INSERT INTO schedules (user_id, title, task_date, start_time, end_time, priority, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        payload.title.trim(),
        payload.taskDate,
        payload.startTime,
        payload.endTime,
        payload.priority,
        payload.status,
        payload.notes.trim()
      ]
    );

    const [rows] = await pool.query('SELECT * FROM schedules WHERE id = ? AND user_id = ?', [
      result.insertId,
      req.user.id
    ]);
    return res.status(201).json(rows[0]);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to create schedule.' });
  }
});

app.put('/api/schedules/:id', requireDatabase, requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'Invalid schedule id.' });
  }

  const payload = {
    title: req.body.title,
    taskDate: req.body.taskDate,
    startTime: req.body.startTime,
    endTime: req.body.endTime,
    priority: req.body.priority,
    notes: req.body.notes || '',
    status: req.body.status || 'pending'
  };

  const errorMessage = validatePayload(payload);
  if (errorMessage) return res.status(400).json({ message: errorMessage });

  try {
    const [result] = await pool.query(
      `UPDATE schedules
       SET title = ?, task_date = ?, start_time = ?, end_time = ?, priority = ?, status = ?, notes = ?
       WHERE id = ? AND user_id = ?`,
      [
        payload.title.trim(),
        payload.taskDate,
        payload.startTime,
        payload.endTime,
        payload.priority,
        payload.status,
        payload.notes.trim(),
        id,
        req.user.id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Schedule not found.' });
    }

    const [rows] = await pool.query('SELECT * FROM schedules WHERE id = ? AND user_id = ?', [
      id,
      req.user.id
    ]);
    return res.json(rows[0]);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to update schedule.' });
  }
});

app.delete('/api/schedules/:id', requireDatabase, requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'Invalid schedule id.' });
  }

  try {
    const [result] = await pool.query('DELETE FROM schedules WHERE id = ? AND user_id = ?', [
      id,
      req.user.id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Schedule not found.' });
    }

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: 'Unable to delete schedule.' });
  }
});

app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const startServer = async () => {
  try {
    await initializeDatabase();
    databaseReady = true;
  } catch (error) {
    console.warn('Database setup skipped. Check your MySQL connection and .env settings.');
    console.warn(error.message);
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

startServer();
