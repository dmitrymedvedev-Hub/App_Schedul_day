const path = require('path');
const express = require('express');
const { rateLimit } = require('express-rate-limit');
const pool = require('./db');

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const appLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false
});

app.use(appLimiter);

const formatDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value);
const formatTime = (value) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

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

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/schedules', async (req, res) => {
  const { date } = req.query;

  if (date && !formatDate(date)) {
    return res.status(400).json({ message: 'date query must be YYYY-MM-DD.' });
  }

  try {
    const [rows] = date
      ? await pool.query(
          'SELECT * FROM schedules WHERE task_date = ? ORDER BY start_time ASC',
          [date]
        )
      : await pool.query('SELECT * FROM schedules ORDER BY task_date ASC, start_time ASC');

    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to load schedules.' });
  }
});

app.post('/api/schedules', async (req, res) => {
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
      `INSERT INTO schedules (title, task_date, start_time, end_time, priority, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        payload.title.trim(),
        payload.taskDate,
        payload.startTime,
        payload.endTime,
        payload.priority,
        payload.status,
        payload.notes.trim()
      ]
    );

    const [rows] = await pool.query('SELECT * FROM schedules WHERE id = ?', [result.insertId]);
    return res.status(201).json(rows[0]);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to create schedule.' });
  }
});

app.put('/api/schedules/:id', async (req, res) => {
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
       WHERE id = ?`,
      [
        payload.title.trim(),
        payload.taskDate,
        payload.startTime,
        payload.endTime,
        payload.priority,
        payload.status,
        payload.notes.trim(),
        id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Schedule not found.' });
    }

    const [rows] = await pool.query('SELECT * FROM schedules WHERE id = ?', [id]);
    return res.json(rows[0]);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to update schedule.' });
  }
});

app.delete('/api/schedules/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'Invalid schedule id.' });
  }

  try {
    const [result] = await pool.query('DELETE FROM schedules WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Schedule not found.' });
    }

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: 'Unable to delete schedule.' });
  }
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
