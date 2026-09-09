import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.get('/', requireAuth, (req, res) => {
  res.json(db.prepare('SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC LIMIT 100').all(req.userId));
});
router.post('/read', requireAuth, (req, res) => {
  db.prepare('UPDATE notifications SET isRead = 1 WHERE userId = ?').run(req.userId);
  res.json({ success: true });
});
export default router;
