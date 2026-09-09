import { Router } from 'express';
import { db } from '../db.js';
import { toProfile } from '../helpers.js';

const router = Router();

async function enrichProfile(row) {
  const profile = toProfile(row);
  profile.socialLinks = await db.get('SELECT github, instagram, linkedin, facebook, displayLink1, displayLink2 FROM social_links WHERE userId = ?', [row.id]) || {};
  profile.specialties = await db.all('SELECT id, category, title, about, hourlyRate, experience FROM freelancer_specialties WHERE freelancerId = ? ORDER BY createdAt DESC', [row.id]);
  profile.followers = (await db.get('SELECT COUNT(*) count FROM follows WHERE followingId = ?', [row.id])).count;
  profile.onlineStatus = await db.get('SELECT isOnline, lastSeenAt FROM user_online_status WHERE userId = ?', [row.id]) || { isOnline: 0, lastSeenAt: '' };
  profile.projects = await db.all('SELECT id, title, category, imageUrl AS image, description, likes, views, createdAt FROM projects WHERE ownerId = ? ORDER BY createdAt DESC', [row.id]);
  profile.stats = {
    completedOrders: (await db.get("SELECT COUNT(*) count FROM tasks t JOIN applications a ON a.taskId = t.id WHERE a.freelancerId = ? AND t.status = 'tamamlandı'", [row.id])).count,
    activeOrders: (await db.get("SELECT COUNT(*) count FROM tasks t JOIN applications a ON a.taskId = t.id WHERE a.freelancerId = ? AND t.status = 'davam edir'", [row.id])).count,
    conflictJobs: (await db.get("SELECT COUNT(*) count FROM tasks t JOIN applications a ON a.taskId = t.id WHERE a.freelancerId = ? AND t.status = 'arbitraj'", [row.id])).count,
    projectViews: (await db.get('SELECT COALESCE(SUM(views), 0) total FROM projects WHERE ownerId = ?', [row.id])).total,
  };
  return profile;
}

// GET /api/users/freelancers — public list of visible freelancer profiles
router.get('/freelancers', async (req, res, next) => {
 try {
  const rows = await db.all(`SELECT * FROM users WHERE role = 'freelancer' AND isProfileVisible = TRUE ORDER BY createdAt DESC`);
  res.json(await Promise.all(rows.map(enrichProfile)));
 } catch (error) { next(error); }
});

// GET /api/users/:id — public profile
router.get('/:id', async (req, res, next) => {
 try {
  const row = await db.get('SELECT * FROM users WHERE id = ?', [req.params.id]);
  if (!row) return res.status(404).json({ error: 'İstifadəçi tapılmadı.' });
  return res.json(await enrichProfile(row));
 } catch (error) { next(error); }
});

export default router;
