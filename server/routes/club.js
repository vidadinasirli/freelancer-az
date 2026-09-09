import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { safeParseArray } from '../helpers.js';

const router = Router();

function toPost(row) {
  return { id: row.id, authorId: row.authorId, author: row.author, title: row.title, type: row.type,
    tags: safeParseArray(row.tags), content: row.content, mediaUrl: row.mediaUrl || '', views: row.views, comments: row.comments || 0, createdAt: row.createdAt };
}

router.get('/', optionalAuth, async (req, res, next) => {
 try {
  const search = req.query.search || '';
  const rows = await db.all(`SELECT p.*, u.fullName AS author,
    (SELECT COUNT(*) FROM club_comments c WHERE c.postId = p.id) AS comments
    FROM club_posts p JOIN users u ON u.id = p.authorId
    WHERE (? = '' OR p.title LIKE '%' || ? || '%' OR p.content LIKE '%' || ? || '%')
    ORDER BY p.createdAt DESC`, [search, search, search]);
  res.json(rows.map(toPost));
 } catch (error) { next(error); }
});

router.get('/:id', optionalAuth, async (req, res, next) => {
 try {
  const row = await db.get(`SELECT p.*, u.fullName AS author,
    (SELECT COUNT(*) FROM club_comments c WHERE c.postId = p.id) AS comments
    FROM club_posts p JOIN users u ON u.id = p.authorId WHERE p.id = ?`, [req.params.id]);
  if (!row) return res.status(404).json({ error: 'Yazı tapılmadı.' });
  await db.run('UPDATE club_posts SET views = views + 1 WHERE id = ?', [row.id]);
  const comments = await db.all(`SELECT c.*, u.fullName AS author FROM club_comments c JOIN users u ON u.id = c.authorId WHERE c.postId = ? ORDER BY c.createdAt DESC`, [row.id]);
  res.json({ ...toPost({ ...row, views: row.views + 1 }), commentsList: comments });
 } catch (error) { next(error); }
});

router.post('/', requireAuth, async (req, res, next) => {
 try {
  const { title, content, type, tags, mediaUrl } = req.body || {};
  if (!title || !content) return res.status(400).json({ error: 'Başlıq və məzmun tələb olunur.' });
  const info = await db.run(`INSERT INTO club_posts (authorId, title, type, tags, content, mediaUrl) VALUES (?, ?, ?, ?, ?, ?) RETURNING id`,
    [req.userId, title.trim(), type || 'müzakirə', JSON.stringify(Array.isArray(tags) ? tags : []), content.trim(), mediaUrl || '']);
  const row = await db.get(`SELECT p.*, u.fullName AS author FROM club_posts p JOIN users u ON u.id = p.authorId WHERE p.id = ?`, [info.lastInsertRowid]);
  res.status(201).json(toPost(row));
 } catch (error) { next(error); }
});

router.post('/:id/comments', requireAuth, async (req, res, next) => {
 try {
  const { text } = req.body || {};
  if (!text || !text.trim()) return res.status(400).json({ error: 'Rəy mətni tələb olunur.' });
  const post = await db.get('SELECT id FROM club_posts WHERE id = ?', [req.params.id]);
  if (!post) return res.status(404).json({ error: 'Yazı tapılmadı.' });
  const info = await db.run('INSERT INTO club_comments (postId, authorId, text) VALUES (?, ?, ?) RETURNING id', [post.id, req.userId, text.trim()]);
  const row = await db.get(`SELECT c.*, u.fullName AS author FROM club_comments c JOIN users u ON u.id = c.authorId WHERE c.id = ?`, [info.lastInsertRowid]);
  res.status(201).json(row);
 } catch (error) { next(error); }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
 try {
  const row = await db.get('SELECT authorId FROM club_posts WHERE id = ?', [req.params.id]);
  if (!row) return res.status(404).json({ error: 'Yazı tapılmadı.' });
  if (row.authorId !== req.userId) return res.status(403).json({ error: 'Bu yazını silmək icazəniz yoxdur.' });
  await db.run('DELETE FROM club_posts WHERE id = ?', [req.params.id]);
  res.json({ success: true });
 } catch (error) { next(error); }
});

export default router;