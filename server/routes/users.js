import { Router } from 'express';
import { db } from '../db.js';
import { toProfile } from '../helpers.js';

const router = Router();

function enrichProfile(row) {
  const profile = toProfile(row);
  profile.socialLinks = db.prepare('SELECT github, instagram, linkedin, facebook, displayLink1, displayLink2 FROM social_links WHERE userId = ?').get(row.id) || {};
  profile.specialties = db.prepare('SELECT id, category, title, about, hourlyRate, experience FROM freelancer_specialties WHERE freelancerId = ? ORDER BY createdAt DESC').all(row.id);
  profile.followers = db.prepare('SELECT COUNT(*) count FROM follows WHERE followingId = ?').get(row.id).count;
  profile.onlineStatus = db.prepare('SELECT isOnline, lastSeenAt FROM user_online_status WHERE userId = ?').get(row.id) || { isOnline: 0, lastSeenAt: '' };
  profile.projects = db.prepare('SELECT id, title, category, imageUrl AS image, description, likes, views, createdAt FROM projects WHERE ownerId = ? ORDER BY createdAt DESC').all(row.id);
  profile.stats = {
    completedOrders: db.prepare("SELECT COUNT(*) count FROM tasks t JOIN applications a ON a.taskId = t.id WHERE a.freelancerId = ? AND t.status = 'tamamlandı'").get(row.id).count,
    activeOrders: db.prepare("SELECT COUNT(*) count FROM tasks t JOIN applications a ON a.taskId = t.id WHERE a.freelancerId = ? AND t.status = 'davam edir'").get(row.id).count,
    conflictJobs: db.prepare("SELECT COUNT(*) count FROM tasks t JOIN applications a ON a.taskId = t.id WHERE a.freelancerId = ? AND t.status = 'arbitraj'").get(row.id).count,
    projectViews: db.prepare('SELECT COALESCE(SUM(views), 0) total FROM projects WHERE ownerId = ?').get(row.id).total,
  };
  return profile;
}

// GET /api/users/freelancers — public list of visible freelancer profiles
router.get('/freelancers', (req, res) => {
  const rows = db.prepare(`SELECT * FROM users WHERE role = 'freelancer' AND isProfileVisible = 1 ORDER BY createdAt DESC`).all();
  res.json(rows.map(enrichProfile));
});

// GET /api/users/:id — public profile
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'İstifadəçi tapılmadı.' });
  return res.json(enrichProfile(row));
});

export default router;
