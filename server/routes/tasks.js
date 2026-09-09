import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { toTask } from '../helpers.js';

const router = Router();

router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { search = '', category = '' } = req.query;
    const rows = await db.all(`SELECT t.*, u.fullName AS ownerName,
      (SELECT COUNT(*) FROM applications a WHERE a.taskId = t.id) AS applicationCount
      FROM tasks t JOIN users u ON u.id = t.ownerId
      WHERE (? = '' OR t.title LIKE '%' || ? || '%' OR t.description LIKE '%' || ? || '%')
        AND (? = '' OR CAST(t.categories AS TEXT) LIKE '%' || ? || '%')
      ORDER BY t.createdAt DESC`, [search, search, search, category, category]);
    res.json(rows.map((row) => toTask(row, { ownerName: row.ownerName, applicationCount: row.applicationCount })));
  } catch (error) { next(error); }
});

router.get('/mine', requireAuth, async (req, res, next) => {
  try {
    const rows = await db.all(`SELECT t.*, (SELECT COUNT(*) FROM applications a WHERE a.taskId = t.id) AS applicationCount
      FROM tasks t WHERE t.ownerId = ? ORDER BY t.createdAt DESC`, [req.userId]);
    res.json(rows.map((row) => toTask(row, { applicationCount: row.applicationCount })));
  } catch (error) { next(error); }
});

router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const row = await db.get(`SELECT t.*, u.fullName AS ownerName FROM tasks t JOIN users u ON u.id = t.ownerId WHERE t.id = ?`, [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Tapşırıq tapılmadı.' });
    await db.run('UPDATE tasks SET views = views + 1 WHERE id = ?', [row.id]);
    const applications = await db.all(`SELECT a.*, u.fullName AS freelancerName FROM applications a
      JOIN users u ON u.id = a.freelancerId WHERE a.taskId = ? ORDER BY a.createdAt DESC`, [row.id]);
    res.json({ ...toTask(row, { ownerName: row.ownerName }), applications });
  } catch (error) { next(error); }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    if (req.userRole !== 'musteri') return res.status(403).json({ error: 'Yalnız sifarişçi hesabları tapşırıq yarada bilər.' });
    const { title, description, price, currency, priceType, categories } = req.body || {};
    if (!title || !description) return res.status(400).json({ error: 'Başlıq və təsvir tələb olunur.' });
    const info = await db.run(`INSERT INTO tasks (ownerId, title, description, price, currency, priceType, categories)
      VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id`,
      [req.userId, title.trim(), description.trim(), Number(price) || 0, currency || 'AZN',
        priceType || 'Sifarişçi büdcəni təyin edib', JSON.stringify(Array.isArray(categories) ? categories : [])]);
    res.status(201).json(toTask(await db.get('SELECT * FROM tasks WHERE id = ?', [info.lastInsertRowid])));
  } catch (error) { next(error); }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const row = await db.get('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Tapşırıq tapılmadı.' });
    if (Number(row.ownerId) !== Number(req.userId)) return res.status(403).json({ error: 'Bu tapşırığı silmək icazəniz yoxdur.' });
    await db.run('DELETE FROM tasks WHERE id = ?', [row.id]);
    res.json({ success: true });
  } catch (error) { next(error); }
});

router.post('/:id/apply', requireAuth, async (req, res, next) => {
  try {
    if (req.userRole !== 'freelancer') return res.status(403).json({ error: 'Yalnız frilanser hesabları müraciət edə bilər.' });
    const task = await db.get('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    if (!task) return res.status(404).json({ error: 'Tapşırıq tapılmadı.' });
    const { message, price, priceType, deliveryDays } = req.body || {};
    const info = await db.run(`INSERT INTO applications (taskId, freelancerId, message) VALUES (?, ?, ?) RETURNING id`,
      [task.id, req.userId, JSON.stringify({ text: message || '', price: Number(price) || 0, priceType: priceType || 'iş başına', deliveryDays: Number(deliveryDays) || 0 })]);
    res.status(201).json(await db.get('SELECT * FROM applications WHERE id = ?', [info.lastInsertRowid]));
  } catch (error) {
    if (String(error.message).includes('UNIQUE') || error.code === '23505') return res.status(409).json({ error: 'Bu tapşırığa artıq müraciət etmisiniz.' });
    next(error);
  }
});

router.get('/applications/mine', requireAuth, async (req, res, next) => {
  try {
    res.json(await db.all(`SELECT a.*, t.title AS taskTitle, t.price, t.currency FROM applications a
      JOIN tasks t ON t.id = a.taskId WHERE a.freelancerId = ? ORDER BY a.createdAt DESC`, [req.userId]));
  } catch (error) { next(error); }
});

router.get('/dashboard/mine', requireAuth, async (req, res, next) => {
  try {
    const applications = await db.all(`SELECT a.*, t.title AS taskTitle, t.status AS taskStatus, t.ownerId
      FROM applications a JOIN tasks t ON t.id = a.taskId WHERE a.freelancerId = ? ORDER BY a.createdAt DESC`, [req.userId]);
    const owned = await db.all('SELECT * FROM tasks WHERE ownerId = ? ORDER BY createdAt DESC', [req.userId]);
    res.json({
      replies: applications.filter((item) => item.status === 'gözləmədə'),
      active: [...applications.filter((item) => item.taskStatus === 'davam edir'), ...owned.filter((item) => item.status === 'davam edir')],
      completed: [...applications.filter((item) => item.taskStatus === 'tamamlandı'), ...owned.filter((item) => item.status === 'tamamlandı')],
      arbitration: [...applications.filter((item) => item.taskStatus === 'arbitraj'), ...owned.filter((item) => item.status === 'arbitraj')],
    });
  } catch (error) { next(error); }
});

router.post('/:id/applications/:appId/accept', requireAuth, async (req, res, next) => {
  try {
    const task = await db.get('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    if (!task) return res.status(404).json({ error: 'Tapşırıq tapılmadı.' });
    if (Number(task.ownerId) !== Number(req.userId)) return res.status(403).json({ error: 'İcazəniz yoxdur.' });
    await db.run(`UPDATE applications SET status = 'qəbul edilib' WHERE id = ? AND taskId = ?`, [req.params.appId, task.id]);
    await db.run(`UPDATE tasks SET status = 'davam edir' WHERE id = ?`, [task.id]);
    const application = await db.get('SELECT freelancerId FROM applications WHERE id = ?', [req.params.appId]);
    if (application) await db.run(`INSERT INTO notifications (userId, type, referenceId, title, description)
      VALUES (?, 'task_accepted', ?, ?, ?) RETURNING id`, [application.freelancerId, task.id, 'Təklifiniz qəbul edildi', task.title]);
    res.json({ success: true });
  } catch (error) { next(error); }
});

router.post('/:id/status', requireAuth, async (req, res, next) => {
  try {
    const task = await db.get('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    if (!task) return res.status(404).json({ error: 'Tapşırıq tapılmadı.' });
    if (Number(task.ownerId) !== Number(req.userId)) return res.status(403).json({ error: 'İcazəniz yoxdur.' });
    const allowed = ['açıq', 'davam edir', 'tamamlandı', 'arbitraj'];
    if (!allowed.includes(req.body?.status)) return res.status(400).json({ error: 'Status düzgün deyil.' });
    await db.run('UPDATE tasks SET status = ? WHERE id = ?', [req.body.status, task.id]);
    res.json({ success: true, status: req.body.status });
  } catch (error) { next(error); }
});

router.post('/:id/reviews', requireAuth, async (req, res, next) => {
  try {
    const task = await db.get('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    if (!task || task.status !== 'tamamlandı') return res.status(400).json({ error: 'Rəy yalnız tamamlanmış tapşırıq üçün yazıla bilər.' });
    if (req.userRole !== 'musteri' || Number(task.ownerId) !== Number(req.userId)) return res.status(403).json({ error: 'Yalnız sifarişçi rəy yaza bilər.' });
    const application = await db.get(`SELECT freelancerId FROM applications WHERE taskId = ? AND status = 'qəbul edilib'`, [task.id]);
    if (!application) return res.status(400).json({ error: 'Qəbul edilmiş freelancer tapılmadı.' });
    const { rating, text } = req.body || {};
    if (!text?.trim() || Number(rating) < 1 || Number(rating) > 5) return res.status(400).json({ error: 'Qiymət və rəy mətni tələb olunur.' });
    const result = await db.run('INSERT INTO reviews (taskId, authorId, targetId, rating, text) VALUES (?, ?, ?, ?, ?) RETURNING id',
      [task.id, req.userId, application.freelancerId, Number(rating), text.trim()]);
    res.status(201).json(await db.get('SELECT * FROM reviews WHERE id = ?', [result.lastInsertRowid]));
  } catch (error) {
    if (String(error.message).includes('UNIQUE') || error.code === '23505') return res.status(409).json({ error: 'Bu tapşırığa artıq rəy yazmısınız.' });
    next(error);
  }
});

router.delete('/:id/applications/:appId', requireAuth, async (req, res, next) => {
  try {
    const row = await db.get('SELECT freelancerId FROM applications WHERE id = ? AND taskId = ?', [req.params.appId, req.params.id]);
    if (!row) return res.status(404).json({ error: 'Təklif tapılmadı.' });
    if (Number(row.freelancerId) !== Number(req.userId)) return res.status(403).json({ error: 'Bu təklifi silmək icazəniz yoxdur.' });
    await db.run('DELETE FROM applications WHERE id = ?', [req.params.appId]);
    res.json({ success: true });
  } catch (error) { next(error); }
});

export default router;
