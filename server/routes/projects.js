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

router.get('/', optionalAuth, (req, res) => {
  const { search = '', category = '', ownerId = '' } = req.query;
  const rows = db.prepare(`SELECT p.*, u.fullName AS author FROM projects p
    JOIN users u ON u.id = p.ownerId
    WHERE (? = '' OR p.title LIKE '%' || ? || '%' OR u.fullName LIKE '%' || ? || '%')
      AND (? = '' OR p.category = ?)
      AND (? = '' OR p.ownerId = ?)
    ORDER BY p.createdAt DESC    `).all(search, search, search, category, category, ownerId, ownerId);
  res.json(rows.map(toProject));
});

router.get('/:id', optionalAuth, (req, res) => {
  const row = db.prepare(`SELECT p.*, u.fullName AS author FROM projects p JOIN users u ON u.id = p.ownerId WHERE p.id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Layihə tapılmadı.' });
  db.prepare('UPDATE projects SET views = views + 1 WHERE id = ?').run(row.id);
  res.json(toProject({ ...row, views: row.views + 1 }));
});

router.post('/', requireAuth, (req, res) => {
  const { title, category, imageUrl, description } = req.body || {};
  if (!title || !imageUrl) return res.status(400).json({ error: 'Başlıq və görüntü tələb olunur.' });
  const info = db.prepare(`INSERT INTO projects (ownerId, title, category, imageUrl, description) VALUES (?, ?, ?, ?, ?)`)
    .run(req.userId, title.trim(), category || 'Dizayn', imageUrl.trim(), description || '');
  const row = db.prepare(`SELECT p.*, u.fullName AS author FROM projects p JOIN users u ON u.id = p.ownerId WHERE p.id = ?`).get(info.lastInsertRowid);
  res.status(201).json(toProject(row));
});

router.post('/:id/like', requireAuth, (req, res) => {
  const row = db.prepare('SELECT id, likes, ownerId FROM projects WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Layihə tapılmadı.' });
  db.prepare('UPDATE projects SET likes = likes + 1 WHERE id = ?').run(row.id);
  res.json({ likes: row.likes + 1 });
});

router.delete('/:id', requireAuth, (req, res) => {
  const row = db.prepare('SELECT ownerId FROM projects WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Layihə tapılmadı.' });
  if (row.ownerId !== req.userId) return res.status(403).json({ error: 'Bu layihəni silmək icazəniz yoxdur.' });
  db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

export default router;