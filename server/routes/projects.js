import { Router } from 'express';
import { db } from '../db.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import { safeParseArray } from '../helpers.js';

const router = Router();

function toProject(row) {
  return {
    id: row.id, ownerId: row.ownerId, title: row.title, author: row.author,
    category: row.category, image: row.imageUrl, description: row.description || '',
    likes: row.likes, views: row.views, createdAt: row.createdAt,
  };
}

router.get('/', optionalAuth, async (req, res, next) => {
 try {
  const { search = '', category = '', ownerId = '' } = req.query;
  const rows = await db.all(`SELECT p.*, u.fullName AS author FROM projects p
    JOIN users u ON u.id = p.ownerId
    WHERE (? = '' OR p.title LIKE '%' || ? || '%' OR u.fullName LIKE '%' || ? || '%')
      AND (? = '' OR p.category = ?)
      AND (? = '' OR p.ownerId = ?)
    ORDER BY p.createdAt DESC`, [search, search, search, category, category, ownerId, ownerId]);
  res.json(rows.map(toProject));
 } catch (error) { next(error); }
});

router.get('/:id', optionalAuth, async (req, res, next) => {
 try {
  const row = await db.get(`SELECT p.*, u.fullName AS author FROM projects p JOIN users u ON u.id = p.ownerId WHERE p.id = ?`, [req.params.id]);
  if (!row) return res.status(404).json({ error: 'Layihə tapılmadı.' });
  await db.run('UPDATE projects SET views = views + 1 WHERE id = ?', [row.id]);
  res.json(toProject({ ...row, views: row.views + 1 }));
 } catch (error) { next(error); }
});

router.post('/', requireAuth, async (req, res, next) => {
 try {
  const { title, category, imageUrl, description } = req.body || {};
  if (!title || !imageUrl) return res.status(400).json({ error: 'Başlıq və görüntü tələb olunur.' });
  const info = await db.run(`INSERT INTO projects (ownerId, title, category, imageUrl, description) VALUES (?, ?, ?, ?, ?) RETURNING id`,
    [req.userId, title.trim(), category || 'Dizayn', imageUrl.trim(), description || '']);
  const row = await db.get(`SELECT p.*, u.fullName AS author FROM projects p JOIN users u ON u.id = p.ownerId WHERE p.id = ?`, [info.lastInsertRowid]);
  res.status(201).json(toProject(row));
 } catch (error) { next(error); }
});

router.post('/:id/like', requireAuth, async (req, res, next) => {
 try {
  const row = await db.get('SELECT id, likes, ownerId FROM projects WHERE id = ?', [req.params.id]);
  if (!row) return res.status(404).json({ error: 'Layihə tapılmadı.' });
  await db.run('UPDATE projects SET likes = likes + 1 WHERE id = ?', [row.id]);
  res.json({ likes: row.likes + 1 });
 } catch (error) { next(error); }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
 try {
  const row = await db.get('SELECT ownerId FROM projects WHERE id = ?', [req.params.id]);
  if (!row) return res.status(404).json({ error: 'Layihə tapılmadı.' });
  if (row.ownerId !== req.userId) return res.status(403).json({ error: 'Bu layihəni silmək icazəniz yoxdur.' });
  await db.run('DELETE FROM projects WHERE id = ?', [req.params.id]);
  res.json({ success: true });
 } catch (error) { next(error); }
});

export default router;