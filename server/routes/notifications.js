import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.get('/', requireAuth, async (req, res, next) => {
 try {
  res.json(await db.all('SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC LIMIT 100', [req.userId]));
 } catch (error) { next(error); }
});
router.post('/read', requireAuth, async (req, res, next) => {
 try {
  await db.run('UPDATE notifications SET isRead = TRUE WHERE userId = ?', [req.userId]);
  res.json({ success: true });
 } catch (error) { next(error); }
});
export default router;
