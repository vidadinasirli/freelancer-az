import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { toProfile } from '../helpers.js';

const router = Router();

router.get('/links', requireAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM social_links WHERE userId = ?').get(req.userId);
  res.json(row || { github: '', instagram: '', linkedin: '', facebook: '', displayLink1: '', displayLink2: '' });
});

router.put('/links', requireAuth, (req, res) => {
  const body = req.body || {};
  db.prepare(`
    INSERT INTO social_links (userId, github, instagram, linkedin, facebook, displayLink1, displayLink2)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(userId) DO UPDATE SET github=excluded.github, instagram=excluded.instagram,
      linkedin=excluded.linkedin, facebook=excluded.facebook, displayLink1=excluded.displayLink1, displayLink2=excluded.displayLink2
  `).run(req.userId, body.github || '', body.instagram || '', body.linkedin || '', body.facebook || '', body.displayLink1 || '', body.displayLink2 || '');
  res.json(db.prepare('SELECT * FROM social_links WHERE userId = ?').get(req.userId));
});

router.post('/follow/:id', requireAuth, (req, res) => {
  const targetId = Number(req.params.id);
  if (targetId === req.userId) return res.status(400).json({ error: 'Öz profilinizi izləyə bilməzsiniz.' });
  const target = db.prepare('SELECT id, fullName FROM users WHERE id = ?').get(targetId);
  if (!target) return res.status(404).json({ error: 'İstifadəçi tapılmadı.' });
  const existing = db.prepare('SELECT id FROM follows WHERE followerId = ? AND followingId = ?').get(req.userId, targetId);
  if (existing) db.prepare('DELETE FROM follows WHERE id = ?').run(existing.id);
  else {
    db.prepare('INSERT INTO follows (followerId, followingId) VALUES (?, ?)').run(req.userId, targetId);
    db.prepare(`INSERT INTO notifications (userId, type, referenceId, title, description) VALUES (?, 'follow', ?, ?, ?)`)
      .run(targetId, req.userId, 'Yeni izləyici', 'Profilinizi yeni biri izləməyə başladı.');
  }
  res.json({ following: !existing });
});

router.get('/status/:id', (req, res) => {
  const row = db.prepare('SELECT isOnline, lastSeenAt FROM user_online_status WHERE userId = ?').get(req.params.id);
  res.json(row || { isOnline: false, lastSeenAt: null });
});

router.put('/status', requireAuth, (req, res) => {
  db.prepare(`
    INSERT INTO user_online_status (userId, isOnline, lastSeenAt) VALUES (?, ?, datetime('now'))
    ON CONFLICT(userId) DO UPDATE SET isOnline=excluded.isOnline, lastSeenAt=datetime('now')
  `).run(req.userId, req.body?.isOnline ? 1 : 0);
  res.json({ success: true });
});

export default router;
