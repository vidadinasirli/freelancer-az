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

router.post('/', (req, res) => {
  const { name, email, subject, message } = req.body || {};
  if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
    return res.status(400).json({ error: 'Ad, e-poçt, mövzu və mesaj tələb olunur.' });
  }
  const result = db.prepare(`
    INSERT INTO support_tickets (name, email, subject, message)
    VALUES (?, ?, ?, ?)
  `).run(name.trim(), email.trim().toLowerCase(), subject.trim(), message.trim());
  const sender = db.prepare('SELECT id FROM users WHERE email = ?').get(email.trim().toLowerCase());
  const admin = db.prepare("SELECT id FROM users WHERE email = 'admin@freelancer.az'").get();
  if (sender && admin) {
    db.prepare('INSERT INTO messages (fromUserId, toUserId, text) VALUES (?, ?, ?)')
      .run(sender.id, admin.id, `[Dəstək] ${subject.trim()}\n${message.trim()}`);
    db.prepare(`INSERT INTO notifications (userId, type, referenceId, title, description) VALUES (?, 'support', ?, ?, ?)`)
      .run(admin.id, result.lastInsertRowid, 'Yeni dəstək müraciəti', subject.trim());
  }
  res.status(201).json({ id: result.lastInsertRowid, status: 'gözləmədə' });
});

router.get('/', requireAdmin, (_req, res) => {
  res.json(db.prepare('SELECT * FROM support_tickets ORDER BY createdAt DESC').all());
});

router.post('/:id/reply', requireAdmin, (req, res) => {
  const { reply } = req.body || {};
  if (!reply?.trim()) return res.status(400).json({ error: 'Cavab mətni tələb olunur.' });
  const result = db.prepare(`
    UPDATE support_tickets
    SET reply = ?, status = 'cavablandırıldı', repliedAt = datetime('now')
    WHERE id = ?
  `).run(reply.trim(), Number(req.params.id));
  if (!result.changes) return res.status(404).json({ error: 'Dəstək müraciəti tapılmadı.' });
  const ticket = db.prepare('SELECT email, subject FROM support_tickets WHERE id = ?').get(Number(req.params.id));
  const recipient = db.prepare('SELECT id FROM users WHERE email = ?').get(ticket.email);
  const admin = db.prepare("SELECT id FROM users WHERE email = 'admin@freelancer.az'").get();
  if (recipient && admin) {
    db.prepare('INSERT INTO messages (fromUserId, toUserId, text) VALUES (?, ?, ?)')
      .run(admin.id, recipient.id, `[Dəstək cavabı] ${reply.trim()}`);
    db.prepare(`INSERT INTO notifications (userId, type, referenceId, title, description) VALUES (?, 'support', ?, ?, ?)`)
      .run(recipient.id, req.params.id, 'Dəstək cavabı', ticket.subject);
  }
  res.json(db.prepare('SELECT * FROM support_tickets WHERE id = ?').get(Number(req.params.id)));
});

export default router;
