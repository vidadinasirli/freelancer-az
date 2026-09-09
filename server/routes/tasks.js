import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { toTask, toPublicUser } from '../helpers.js';

const router = Router();

// GET /api/tasks  — list all open tasks (with owner name + application count)
router.get('/', optionalAuth, (req, res) => {
  const { search = '', category = '' } = req.query;
  const rows = db.prepare(`
    SELECT t.*, u.fullName as ownerName,
      (SELECT COUNT(*) FROM applications a WHERE a.taskId = t.id) as applicationCount
    FROM tasks t JOIN users u ON u.id = t.ownerId
    WHERE (? = '' OR t.title LIKE '%' || ? || '%' OR t.description LIKE '%' || ? || '%')
      AND (? = '' OR t.categories LIKE '%' || ? || '%')
    ORDER BY t.createdAt DESC
  `).all(search, search, search, category, category);
  res.json(rows.map(r => toTask(r, { ownerName: r.ownerName, applicationCount: r.applicationCount })));
});

// GET /api/tasks/mine — tasks created by the logged-in customer
router.get('/mine', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT t.*, (SELECT COUNT(*) FROM applications a WHERE a.taskId = t.id) as applicationCount
    FROM tasks t WHERE t.ownerId = ? ORDER BY t.createdAt DESC
  `).all(req.userId);
  res.json(rows.map(r => toTask(r, { applicationCount: r.applicationCount })));
});

// GET /api/tasks/:id
router.get('/:id', optionalAuth, (req, res) => {
  const row = db.prepare(`
    SELECT t.*, u.fullName as ownerName FROM tasks t JOIN users u ON u.id = t.ownerId WHERE t.id = ?
  `).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Tapşırıq tapılmadı.' });
  db.prepare('UPDATE tasks SET views = views + 1 WHERE id = ?').run(row.id);
  const applications = db.prepare(`
    SELECT a.*, u.fullName as freelancerName FROM applications a
    JOIN users u ON u.id = a.freelancerId WHERE a.taskId = ? ORDER BY a.createdAt DESC
  `).all(row.id);
  res.json({ ...toTask(row, { ownerName: row.ownerName }), applications });
});

// POST /api/tasks — create (musteri only)
router.post('/', requireAuth, (req, res) => {
  if (req.userRole !== 'musteri') {
    return res.status(403).json({ error: 'Yalnız sifarişçi hesabları tapşırıq yarada bilər.' });
  }
  const { title, description, price, currency, priceType, categories } = req.body || {};
  if (!title || !description) {
    return res.status(400).json({ error: 'Başlıq və təsvir tələb olunur.' });
  }
  const info = db.prepare(`
    INSERT INTO tasks (ownerId, title, description, price, currency, priceType, categories)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.userId, title.trim(), description.trim(), Number(price) || 0,
    currency || 'AZN', priceType || 'Sifarişçi büdcəni təyin edib',
    JSON.stringify(Array.isArray(categories) ? categories : [])
  );
  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(toTask(row));
});

// DELETE /api/tasks/:id — owner only
router.delete('/:id', requireAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Tapşırıq tapılmadı.' });
  if (row.ownerId !== req.userId) return res.status(403).json({ error: 'Bu tapşırığı silmək icazəniz yoxdur.' });
  db.prepare('DELETE FROM tasks WHERE id = ?').run(row.id);
  res.json({ success: true });
});

// POST /api/tasks/:id/apply — freelancer applies
router.post('/:id/apply', requireAuth, (req, res) => {
  if (req.userRole !== 'freelancer') {
    return res.status(403).json({ error: 'Yalnız frilanser hesabları müraciət edə bilər.' });
  }
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Tapşırıq tapılmadı.' });
  const { message, price, priceType, deliveryDays } = req.body || {};
  try {
    const info = db.prepare(`
      INSERT INTO applications (taskId, freelancerId, message) VALUES (?, ?, ?)
    `).run(task.id, req.userId, JSON.stringify({ text: message || '', price: Number(price) || 0, priceType: priceType || 'iş başına', deliveryDays: Number(deliveryDays) || 0 }));
    const row = db.prepare('SELECT * FROM applications WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(row);
  } catch (e) {
    if (String(e).includes('UNIQUE')) {
      return res.status(409).json({ error: 'Bu tapşırığa artıq müraciət etmisiniz.' });
    }
    res.status(500).json({ error: 'Xəta baş verdi.' });
  }
});

// GET /api/tasks/applications/mine — applications the logged-in freelancer submitted
router.get('/applications/mine', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT a.*, t.title as taskTitle, t.price, t.currency FROM applications a
    JOIN tasks t ON t.id = a.taskId WHERE a.freelancerId = ? ORDER BY a.createdAt DESC
  `).all(req.userId);
  res.json(rows);
});

router.get('/dashboard/mine', requireAuth, (req, res) => {
  const applications = db.prepare(`SELECT a.*, t.title AS taskTitle, t.status AS taskStatus, t.ownerId
    FROM applications a JOIN tasks t ON t.id = a.taskId WHERE a.freelancerId = ? ORDER BY a.createdAt DESC`).all(req.userId);
  const owned = db.prepare('SELECT * FROM tasks WHERE ownerId = ? ORDER BY createdAt DESC').all(req.userId);
  res.json({
    replies: applications.filter((item) => item.status === 'gözləmədə'),
    active: [...applications.filter((item) => item.taskStatus === 'davam edir'), ...owned.filter((item) => item.status === 'davam edir')],
    completed: [...applications.filter((item) => item.taskStatus === 'tamamlandı'), ...owned.filter((item) => item.status === 'tamamlandı')],
    arbitration: [...applications.filter((item) => item.taskStatus === 'arbitraj'), ...owned.filter((item) => item.status === 'arbitraj')],
  });
});

// POST /api/tasks/:id/applications/:appId/accept — owner accepts a freelancer
router.post('/:id/applications/:appId/accept', requireAuth, (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Tapşırıq tapılmadı.' });
  if (task.ownerId !== req.userId) return res.status(403).json({ error: 'İcazəniz yoxdur.' });
  db.prepare(`UPDATE applications SET status = 'qəbul edilib' WHERE id = ? AND taskId = ?`).run(req.params.appId, task.id);
  db.prepare(`UPDATE tasks SET status = 'davam edir' WHERE id = ?`).run(task.id);
  const application = db.prepare('SELECT freelancerId FROM applications WHERE id = ?').get(req.params.appId);
  if (application) {
    db.prepare(`INSERT INTO notifications (userId, type, referenceId, title, description) VALUES (?, 'task_accepted', ?, ?, ?)`)
      .run(application.freelancerId, task.id, 'Təklifiniz qəbul edildi', task.title);
  }
  res.json({ success: true });
});

router.post('/:id/status', requireAuth, (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Tapşırıq tapılmadı.' });
  if (task.ownerId !== req.userId) return res.status(403).json({ error: 'İcazəniz yoxdur.' });
  const allowed = ['açıq', 'davam edir', 'tamamlandı', 'arbitraj'];
  if (!allowed.includes(req.body?.status)) return res.status(400).json({ error: 'Status düzgün deyil.' });
  db.prepare('UPDATE tasks SET status = ? WHERE id = ?').run(req.body.status, task.id);
  res.json({ success: true, status: req.body.status });
});

router.post('/:id/reviews', requireAuth, (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task || task.status !== 'tamamlandı') return res.status(400).json({ error: 'Rəy yalnız tamamlanmış tapşırıq üçün yazıla bilər.' });
  if (req.userRole !== 'musteri' || task.ownerId !== req.userId) return res.status(403).json({ error: 'Yalnız sifarişçi rəy yaza bilər.' });
  const application = db.prepare("SELECT freelancerId FROM applications WHERE taskId = ? AND status = 'qəbul edilib'").get(task.id);
  if (!application) return res.status(400).json({ error: 'Qəbul edilmiş freelancer tapılmadı.' });
  const { rating, text } = req.body || {};
  if (!text?.trim() || Number(rating) < 1 || Number(rating) > 5) return res.status(400).json({ error: 'Qiymət və rəy mətni tələb olunur.' });
  try {
    const result = db.prepare('INSERT INTO reviews (taskId, authorId, targetId, rating, text) VALUES (?, ?, ?, ?, ?)')
      .run(task.id, req.userId, application.freelancerId, Number(rating), text.trim());
    res.status(201).json(db.prepare('SELECT * FROM reviews WHERE id = ?').get(result.lastInsertRowid));
  } catch (error) {
    if (String(error.message).includes('UNIQUE')) return res.status(409).json({ error: 'Bu tapşırığa artıq rəy yazmısınız.' });
    throw error;
  }
});

router.delete('/:id/applications/:appId', requireAuth, (req, res) => {
  const row = db.prepare('SELECT freelancerId FROM applications WHERE id = ? AND taskId = ?').get(req.params.appId, req.params.id);
  if (!row) return res.status(404).json({ error: 'Təklif tapılmadı.' });
  if (row.freelancerId !== req.userId) return res.status(403).json({ error: 'Bu təklifi silmək icazəniz yoxdur.' });
  db.prepare('DELETE FROM applications WHERE id = ?').run(req.params.appId);
  res.json({ success: true });
});

export default router;
