import { Router } from 'express';
import { db } from '../db.js';
import { toProfile } from '../helpers.js';

const router = Router();

// GET /api/users/freelancers — public list of visible freelancer profiles
router.get('/freelancers', (req, res) => {
  const rows = db.prepare(`SELECT * FROM users WHERE role = 'freelancer' AND isProfileVisible = 1 ORDER BY createdAt DESC`).all();
  res.json(rows.map(toProfile));
});

// GET /api/users/:id — public profile
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'İstifadəçi tapılmadı.' });
  const profile = toProfile(row);
  profile.socialLinks = db.prepare('SELECT github, instagram, linkedin, facebook, displayLink1, displayLink2 FROM social_links WHERE userId = ?').get(row.id) || {};
  profile.specialties = db.prepare('SELECT id, category, title, about, hourlyRate, experience FROM freelancer_specialties WHERE freelancerId = ? ORDER BY createdAt DESC').all(row.id);
  profile.followers = db.prepare('SELECT COUNT(*) count FROM follows WHERE followingId = ?').get(row.id).count;
  return res.json(profile);
});

export default router;
