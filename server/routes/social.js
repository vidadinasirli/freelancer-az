import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { toProfile } from '../helpers.js';

const router = Router();

router.get('/links', requireAuth, async (req, res, next) => {
 try {
  const row = await db.get('SELECT * FROM social_links WHERE userId = ?', [req.userId]);
  res.json(row || { github: '', instagram: '', linkedin: '', facebook: '', displayLink1: '', displayLink2: '' });
 } catch (error) { next(error); }
});

router.put('/links', requireAuth, async (req, res, next) => {
 try {
  const body = req.body || {};
  await db.run(`
    INSERT INTO social_links (userId, github, instagram, linkedin, facebook, displayLink1, displayLink2)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(userId) DO UPDATE SET github=excluded.github, instagram=excluded.instagram,
      linkedin=excluded.linkedin, facebook=excluded.facebook, displayLink1=excluded.displayLink1, displayLink2=excluded.displayLink2
  `, [req.userId, body.github || '', body.instagram || '', body.linkedin || '', body.facebook || '', body.displayLink1 || '', body.displayLink2 || '']);
  res.json(await db.get('SELECT * FROM social_links WHERE userId = ?', [req.userId]));
 } catch (error) { next(error); }
});

router.post('/follow/:id', requireAuth, async (req, res, next) => {
 try {
  const targetId = Number(req.params.id);
  if (targetId === req.userId) return res.status(400).json({ error: 'Öz profilinizi izləyə bilməzsiniz.' });
  const target = await db.get('SELECT id, fullName FROM users WHERE id = ?', [targetId]);
  if (!target) return res.status(404).json({ error: 'İstifadəçi tapılmadı.' });
  const existing = await db.get('SELECT id FROM follows WHERE followerId = ? AND followingId = ?', [req.userId, targetId]);
  if (existing) await db.run('DELETE FROM follows WHERE id = ?', [existing.id]);
  else {
    await db.run('INSERT INTO follows (followerId, followingId) VALUES (?, ?) RETURNING id', [req.userId, targetId]);
    await db.run(`INSERT INTO notifications (userId, type, referenceId, title, description) VALUES (?, 'follow', ?, ?, ?) RETURNING id`,
      [targetId, req.userId, 'Yeni izləyici', 'Profilinizi yeni biri izləməyə başladı.']);
  }
  res.json({ following: !existing });
 } catch (error) { next(error); }
});

router.get('/status/:id', async (req, res, next) => {
 try {
  const row = await db.get('SELECT isOnline, lastSeenAt FROM user_online_status WHERE userId = ?', [req.params.id]);
  res.json(row || { isOnline: false, lastSeenAt: null });
 } catch (error) { next(error); }
});

router.put('/status', requireAuth, async (req, res, next) => {
 try {
  await db.run(`
    INSERT INTO user_online_status (userId, isOnline, lastSeenAt) VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(userId) DO UPDATE SET isOnline=excluded.isOnline, lastSeenAt=CURRENT_TIMESTAMP
  `, [req.userId, Boolean(req.body?.isOnline)]);
  res.json({ success: true });
 } catch (error) { next(error); }
});

export default router;
