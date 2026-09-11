import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { toProfile } from '../helpers.js';

const router = Router();

router.get('/', requireAuth, async (req, res, next) => {
 try {
  const row = await db.get('SELECT * FROM users WHERE id = ?', [req.userId]);
  res.json(toProfile(row));
 } catch (error) { next(error); }
});

router.put('/', requireAuth, async (req, res, next) => {
 try {
  const current = await db.get('SELECT * FROM users WHERE id = ?', [req.userId]);
  if (!current) return res.status(404).json({ error: 'İstifadəçi tapılmadı.' });

  const body = req.body || {};
  const updated = {
    fullName: body.fullName ?? current.fullName,
    about: body.about ?? current.about,
    avatarUrl: body.avatarUrl ?? current.avatarUrl,
    bannerUrl: body.bannerUrl ?? current.bannerUrl,
    isProfileVisible: body.isProfileVisible === undefined ? current.isProfileVisible : (body.isProfileVisible ? 1 : 0),
    status: body.status ?? current.status,
    activityAreas: body.activityAreas ? JSON.stringify(body.activityAreas) : current.activityAreas,
    experience: body.experience ?? current.experience,
    hourlyRate: body.hourlyRate ?? current.hourlyRate,
    rateType: body.rateType ?? current.rateType,
    nickname: body.nickname ?? current.nickname,
    phone: body.phone ?? current.phone,
    privacySettings: body.privacySettings ? JSON.stringify(body.privacySettings) : current.privacySettings,
  };

  await db.run(`UPDATE users SET fullName=?, about=?, avatarUrl=?, bannerUrl=?, isProfileVisible=?,
    status=?, activityAreas=?, experience=?, hourlyRate=?, rateType=?, nickname=?, phone=?, privacySettings=? WHERE id=?`,
    [updated.fullName, updated.about, updated.avatarUrl, updated.bannerUrl, Boolean(updated.isProfileVisible),
      updated.status, updated.activityAreas, updated.experience, updated.hourlyRate, updated.rateType,
      updated.nickname, updated.phone, updated.privacySettings, req.userId]);

  const row = await db.get('SELECT * FROM users WHERE id = ?', [req.userId]);
  res.json(toProfile(row));
 } catch (error) { next(error); }
});

router.patch('/media', requireAuth, async (req, res, next) => {
 try {
  const { field, url } = req.body || {};
  if (!['avatarUrl', 'bannerUrl'].includes(field) || typeof url !== 'string' || !url.trim()) {
    return res.status(400).json({ error: 'Şəkil sahəsi və URL tələb olunur.' });
  }
  const column = field === 'avatarUrl' ? 'avatarUrl' : 'bannerUrl';
  await db.run(`UPDATE users SET ${column} = ? WHERE id = ?`, [url.trim(), req.userId]);
  const row = await db.get('SELECT * FROM users WHERE id = ?', [req.userId]);
  if (!row) return res.status(404).json({ error: 'İstifadəçi tapılmadı.' });
  res.json(toProfile(row));
 } catch (error) { next(error); }
});

router.get('/specialties', requireAuth, async (req, res, next) => {
 try {
  res.json(await db.all('SELECT * FROM freelancer_specialties WHERE freelancerId = ? ORDER BY createdAt DESC', [req.userId]));
 } catch (error) { next(error); }
});

router.post('/specialties', requireAuth, async (req, res, next) => {
 try {
  const { category, title, about, hourlyRate, experience } = req.body || {};
  if (req.userRole !== 'freelancer') return res.status(403).json({ error: 'Yalnız freelancerlər ixtisas əlavə edə bilər.' });
  if (!category?.trim() || !title?.trim()) return res.status(400).json({ error: 'Kateqoriya və başlıq tələb olunur.' });
  const result = await db.run(`INSERT INTO freelancer_specialties (freelancerId, category, title, about, hourlyRate, experience)
    VALUES (?, ?, ?, ?, ?, ?) RETURNING id`, [req.userId, category.trim(), title.trim(), about?.trim() || '', Number(hourlyRate) || 0, experience || '']);
  res.status(201).json(await db.get('SELECT * FROM freelancer_specialties WHERE id = ?', [result.lastInsertRowid]));
 } catch (error) { next(error); }
});

router.delete('/specialties/:id', requireAuth, async (req, res, next) => {
 try {
  const result = await db.run('DELETE FROM freelancer_specialties WHERE id = ? AND freelancerId = ?', [req.params.id, req.userId]);
  if (!result.changes) return res.status(404).json({ error: 'İxtisas tapılmadı.' });
  res.json({ success: true });
 } catch (error) { next(error); }
});

export default router;
