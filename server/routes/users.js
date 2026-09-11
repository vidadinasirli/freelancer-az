import { Router } from 'express';
import { db } from '../db.js';
import { toProfile } from '../helpers.js';

const router = Router();

async function enrichProfile(row) {
  const profile = toProfile(row);
  const [socialLinks, specialties, followers, onlineStatus, projects, completedOrders, activeOrders, conflictJobs, projectViews] = await Promise.all([
    db.get('SELECT github, instagram, linkedin, facebook, displayLink1, displayLink2 FROM social_links WHERE userId = ?', [row.id]),
    db.all('SELECT id, category, title, about, hourlyRate, experience FROM freelancer_specialties WHERE freelancerId = ? ORDER BY createdAt DESC', [row.id]),
    db.get('SELECT COUNT(*) count FROM follows WHERE followingId = ?', [row.id]),
    db.get('SELECT isOnline, lastSeenAt FROM user_online_status WHERE userId = ?', [row.id]),
    db.all('SELECT id, title, category, imageUrl AS image, description, likes, views, createdAt FROM projects WHERE ownerId = ? ORDER BY createdAt DESC', [row.id]),
    db.get("SELECT COUNT(*) count FROM tasks t JOIN applications a ON a.taskId = t.id WHERE a.freelancerId = ? AND t.status = 'tamamlandı'", [row.id]),
    db.get("SELECT COUNT(*) count FROM tasks t JOIN applications a ON a.taskId = t.id WHERE a.freelancerId = ? AND t.status = 'davam edir'", [row.id]),
    db.get("SELECT COUNT(*) count FROM tasks t JOIN applications a ON a.taskId = t.id WHERE a.freelancerId = ? AND t.status = 'arbitraj'", [row.id]),
    db.get('SELECT COALESCE(SUM(views), 0) total FROM projects WHERE ownerId = ?', [row.id]),
  ]);
  profile.socialLinks = socialLinks || {};
  profile.specialties = specialties;
  profile.followers = followers?.count || 0;
  profile.onlineStatus = onlineStatus || { isOnline: 0, lastSeenAt: '' };
  profile.projects = projects;
  profile.stats = { completedOrders: completedOrders?.count || 0, activeOrders: activeOrders?.count || 0, conflictJobs: conflictJobs?.count || 0, projectViews: projectViews?.total || 0 };
  return profile;
}

// GET /api/users/freelancers — public list of visible freelancer profiles
router.get('/freelancers', async (req, res, next) => {
 try {
  const rows = await db.all(`SELECT * FROM users WHERE role = 'freelancer' AND isProfileVisible = TRUE ORDER BY createdAt DESC`);
  const specialties = await db.all(
    'SELECT freelancerId, category FROM freelancer_specialties ORDER BY createdAt DESC'
  );
  const categoriesByFreelancer = new Map();
  specialties.forEach(({ freelancerId, category }) => {
    if (!category) return;
    const categories = categoriesByFreelancer.get(freelancerId) || [];
    if (!categories.includes(category)) categories.push(category);
    categoriesByFreelancer.set(freelancerId, categories);
  });

  // The list only needs card data. Load detailed projects, social links and
  // order statistics lazily when a freelancer profile is opened.
  res.json(rows.map((row) => {
    const profile = toProfile(row);
    profile.activityAreas = [
      ...new Set([...(profile.activityAreas || []), ...(categoriesByFreelancer.get(row.id) || [])]),
    ];
    profile.specialties = [];
    profile.projects = [];
    profile.stats = { completedOrders: 0, activeOrders: 0, conflictJobs: 0, projectViews: 0 };
    return profile;
  }));
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
