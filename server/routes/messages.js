import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/messages/conversations — list of people I've messaged with + last message
router.get('/conversations', requireAuth, (req, res) => {
  const uid = req.userId;
  const rows = db.prepare(`
    SELECT
      CASE WHEN m.fromUserId = ? THEN m.toUserId ELSE m.fromUserId END as otherId,
      m.text as lastMessage, m.createdAt as time, m.fromUserId, m.isRead
    FROM messages m
    WHERE m.fromUserId = ? OR m.toUserId = ?
    ORDER BY m.createdAt DESC
  `).all(uid, uid, uid);

  const seen = new Map();
  for (const r of rows) {
    if (!seen.has(r.otherId)) seen.set(r.otherId, r);
  }

  const conversations = [...seen.values()].map(r => {
    const user = db.prepare('SELECT id, fullName, email, role FROM users WHERE id = ?').get(r.otherId);
    const unreadCount = db.prepare(`
      SELECT COUNT(*) c FROM messages WHERE fromUserId = ? AND toUserId = ? AND isRead = 0
    `).get(r.otherId, uid).c;
    return {
      userId: r.otherId,
      user,
      lastMessage: r.lastMessage,
      time: r.time,
      isSentByMe: r.fromUserId === uid,
      unreadCount,
    };
  });

  res.json(conversations);
});

// GET /api/messages/:userId — full thread with a specific user
router.get('/:userId', requireAuth, (req, res) => {
  const uid = req.userId;
  const otherId = Number(req.params.userId);
  const other = db.prepare('SELECT id, fullName, email, role FROM users WHERE id = ?').get(otherId);
  if (!other) return res.status(404).json({ error: 'İstifadəçi tapılmadı.' });

  const messages = db.prepare(`
    SELECT * FROM messages
    WHERE (fromUserId = ? AND toUserId = ?) OR (fromUserId = ? AND toUserId = ?)
    ORDER BY createdAt ASC
  `).all(uid, otherId, otherId, uid);

  db.prepare(`UPDATE messages SET isRead = 1 WHERE fromUserId = ? AND toUserId = ? AND isRead = 0`).run(otherId, uid);

  res.json({ user: other, messages });
});

// POST /api/messages — send a message { toUserId, text }
router.post('/', requireAuth, (req, res) => {
  const { toUserId, text } = req.body || {};
  if (!toUserId || !text || !text.trim()) {
    return res.status(400).json({ error: 'Alıcı və mesaj mətni tələb olunur.' });
  }
  const target = db.prepare('SELECT id FROM users WHERE id = ?').get(toUserId);
  if (!target) return res.status(404).json({ error: 'Alıcı tapılmadı.' });

  const info = db.prepare(`INSERT INTO messages (fromUserId, toUserId, text) VALUES (?, ?, ?)`)
    .run(req.userId, toUserId, text.trim());
  const row = db.prepare('SELECT * FROM messages WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(row);
});

export default router;
