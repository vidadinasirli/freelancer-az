import { Router } from 'express';
import { db } from '../db.js';

const router = Router();
const adminKey = process.env.ADMIN_KEY || 'freelancer-az-admin';

function requireAdmin(req, res, next) {
  if (req.headers['x-admin-key'] !== adminKey) {
    return res.status(401).json({ error: 'Admin girişi tələb olunur.' });
  }
  next();
}

router.post('/', async (req, res, next) => {
 try {
  const { name, email, subject, message } = req.body || {};
  if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
    return res.status(400).json({ error: 'Ad, e-poçt, mövzu və mesaj tələb olunur.' });
  }
  const result = await db.run(`
    INSERT INTO support_tickets (name, email, subject, message)
    VALUES (?, ?, ?, ?) RETURNING id
  `, [name.trim(), email.trim().toLowerCase(), subject.trim(), message.trim()]);
  const sender = await db.get('SELECT id FROM users WHERE email = ?', [email.trim().toLowerCase()]);
  const admin = await db.get("SELECT id FROM users WHERE email = 'admin@freelancer.az'");
  if (sender && admin) {
    await db.run('INSERT INTO messages (fromUserId, toUserId, text) VALUES (?, ?, ?) RETURNING id',
      [sender.id, admin.id, `[Dəstək] ${subject.trim()}\n${message.trim()}`]);
    await db.run(`INSERT INTO notifications (userId, type, referenceId, title, description) VALUES (?, 'support', ?, ?, ?) RETURNING id`,
      [admin.id, result.lastInsertRowid, 'Yeni dəstək müraciəti', subject.trim()]);
  }
  res.status(201).json({ id: result.lastInsertRowid, status: 'gözləmədə' });
 } catch (error) { next(error); }
});

router.get('/', requireAdmin, async (_req, res, next) => {
 try {
  res.json(await db.all('SELECT * FROM support_tickets ORDER BY createdAt DESC'));
 } catch (error) { next(error); }
});

router.post('/:id/reply', requireAdmin, async (req, res, next) => {
 try {
  const { reply } = req.body || {};
  if (!reply?.trim()) return res.status(400).json({ error: 'Cavab mətni tələb olunur.' });
  const result = await db.run(`
    UPDATE support_tickets
    SET reply = ?, status = 'cavablandırıldı', repliedAt = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [reply.trim(), Number(req.params.id)]);
  if (!result.changes) return res.status(404).json({ error: 'Dəstək müraciəti tapılmadı.' });
  const ticket = await db.get('SELECT email, subject FROM support_tickets WHERE id = ?', [Number(req.params.id)]);
  const recipient = await db.get('SELECT id FROM users WHERE email = ?', [ticket.email]);
  const admin = await db.get("SELECT id FROM users WHERE email = 'admin@freelancer.az'");
  if (recipient && admin) {
    await db.run('INSERT INTO messages (fromUserId, toUserId, text) VALUES (?, ?, ?) RETURNING id',
      [admin.id, recipient.id, `[Dəstək cavabı] ${reply.trim()}`]);
    await db.run(`INSERT INTO notifications (userId, type, referenceId, title, description) VALUES (?, 'support', ?, ?, ?) RETURNING id`,
      [recipient.id, req.params.id, 'Dəstək cavabı', ticket.subject]);
  }
  res.json(await db.get('SELECT * FROM support_tickets WHERE id = ?', [Number(req.params.id)]));
 } catch (error) { next(error); }
});

export default router;
