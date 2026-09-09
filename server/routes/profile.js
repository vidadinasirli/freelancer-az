import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { toProfile } from '../helpers.js';

const router = Router();

router.get('/', requireAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  res.json(toProfile(row));
});

router.put('/', requireAuth, (req, res) => {
  const current = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
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

  db.prepare(`UPDATE users SET fullName=@fullName, about=@about, avatarUrl=@avatarUrl, bannerUrl=@bannerUrl,
    isProfileVisible=@isProfileVisible, status=@status, activityAreas=@activityAreas, experience=@experience,
    hourlyRate=@hourlyRate, rateType=@rateType, nickname=@nickname, phone=@phone,
    privacySettings=@privacySettings WHERE id=${req.userId}`).run(updated);

  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  res.json(toProfile(row));
});

router.get('/specialties', requireAuth, (req, res) => {
  res.json(db.prepare('SELECT * FROM freelancer_specialties WHERE freelancerId = ? ORDER BY createdAt DESC').all(req.userId));
});

router.post('/specialties', requireAuth, (req, res) => {
  const { category, title, about, hourlyRate, experience } = req.body || {};
  if (req.userRole !== 'freelancer') return res.status(403).json({ error: 'Yalnız freelancerlər ixtisas əlavə edə bilər.' });
  if (!category?.trim() || !title?.trim()) return res.status(400).json({ error: 'Kateqoriya və başlıq tələb olunur.' });
  const result = db.prepare(`INSERT INTO freelancer_specialties (freelancerId, category, title, about, hourlyRate, experience)
    VALUES (?, ?, ?, ?, ?, ?)`).run(req.userId, category.trim(), title.trim(), about?.trim() || '', Number(hourlyRate) || 0, experience || '');
  res.status(201).json(db.prepare('SELECT * FROM freelancer_specialties WHERE id = ?').get(result.lastInsertRowid));
});

router.delete('/specialties/:id', requireAuth, (req, res) => {
  const result = db.prepare('DELETE FROM freelancer_specialties WHERE id = ? AND freelancerId = ?').run(req.params.id, req.userId);
  if (!result.changes) return res.status(404).json({ error: 'İxtisas tapılmadı.' });
  res.json({ success: true });
});

export default router;
