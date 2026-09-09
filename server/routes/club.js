import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { safeParseArray } from '../helpers.js';

const router = Router();

function toPost(row) {
  return { id: row.id, authorId: row.authorId, author: row.author, title: row.title, type: row.type,
    tags: safeParseArray(row.tags), content: row.content, mediaUrl: row.mediaUrl || '', views: row.views, comments: row.comments || 0, createdAt: row.createdAt };
}

router.get('/', optionalAuth, (req, res) => {
  const search = req.query.search || '';
  const rows = db.prepare(`SELECT p.*, u.fullName AS author,
    (SELECT COUNT(*) FROM club_comments c WHERE c.postId = p.id) AS comments
    FROM club_posts p JOIN users u ON u.id = p.authorId
    WHERE (? = '' OR p.title LIKE '%' || ? || '%' OR p.content LIKE '%' || ? || '%')
    ORDER BY p.createdAt DESC`).all(search, search, search);
  res.json(rows.map(toPost));
});

router.get('/:id', optionalAuth, (req, res) => {
  const row = db.prepare(`SELECT p.*, u.fullName AS author,
    (SELECT COUNT(*) FROM club_comments c WHERE c.postId = p.id) AS comments
    FROM club_posts p JOIN users u ON u.id = p.authorId WHERE p.id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Yazı tapılmadı.' });
  db.prepare('UPDATE club_posts SET views = views + 1 WHERE id = ?').run(row.id);
  const comments = db.prepare(`SELECT c.*, u.fullName AS author FROM club_comments c JOIN users u ON u.id = c.authorId WHERE c.postId = ? ORDER BY c.createdAt DESC`).all(row.id);
  res.json({ ...toPost({ ...row, views: row.views + 1 }), commentsList: comments });
});

router.post('/', requireAuth, (req, res) => {
  const { title, content, type, tags, mediaUrl } = req.body || {};
  if (!title || !content) return res.status(400).json({ error: 'Başlıq və məzmun tələb olunur.' });
  const info = db.prepare(`INSERT INTO club_posts (authorId, title, type, tags, content, mediaUrl) VALUES (?, ?, ?, ?, ?, ?)`).run(
    req.userId, title.trim(), type || 'müzakirə', JSON.stringify(Array.isArray(tags) ? tags : []), content.trim(), mediaUrl || '');
  const row = db.prepare(`SELECT p.*, u.fullName AS author FROM club_posts p JOIN users u ON u.id = p.authorId WHERE p.id = ?`).get(info.lastInsertRowid);
  res.status(201).json(toPost(row));
});

router.post('/:id/comments', requireAuth, (req, res) => {
  const { text } = req.body || {};
  if (!text || !text.trim()) return res.status(400).json({ error: 'Rəy mətni tələb olunur.' });
  const post = db.prepare('SELECT id FROM club_posts WHERE id = ?').get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Yazı tapılmadı.' });
  const info = db.prepare('INSERT INTO club_comments (postId, authorId, text) VALUES (?, ?, ?)').run(post.id, req.userId, text.trim());
  const row = db.prepare(`SELECT c.*, u.fullName AS author FROM club_comments c JOIN users u ON u.id = c.authorId WHERE c.id = ?`).get(info.lastInsertRowid);
  res.status(201).json(row);
});

router.delete('/:id', requireAuth, (req, res) => {
  const row = db.prepare('SELECT authorId FROM club_posts WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Yazı tapılmadı.' });
  if (row.authorId !== req.userId) return res.status(403).json({ error: 'Bu yazını silmək icazəniz yoxdur.' });
  db.prepare('DELETE FROM club_posts WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

export default router;