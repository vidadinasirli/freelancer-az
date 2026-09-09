import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db.js';
import { JWT_SECRET, requireAuth } from '../middleware/auth.js';
import { toPublicUser, toProfile } from '../helpers.js';

const router = Router();

function sign(user) {
  return jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '30d' });
}

router.post('/register', async (req, res, next) => {
 try {
  const { fullName, email, password, role } = req.body || {};
  if (!fullName || !email || !password) {
    return res.status(400).json({ error: 'Ad, e-poçt və şifrə tələb olunur.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Şifrə ən azı 6 simvol olmalıdır.' });
  }
  const finalRole = role === 'musteri' ? 'musteri' : 'freelancer';
  const existing = await db.get('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
  if (existing) {
    return res.status(409).json({ error: 'Bu e-poçt ilə hesab artıq mövcuddur.' });
  }
  const hash = bcrypt.hashSync(password, 10);
  const info = await db.run(
    `INSERT INTO users (fullName, email, password, role) VALUES (?, ?, ?, ?) RETURNING id`,
    [fullName.trim(), email.toLowerCase().trim(), hash, finalRole],
  );

  const row = await db.get('SELECT * FROM users WHERE id = ?', [info.lastInsertRowid]);
  const token = sign(row);
  res.status(201).json({ token, user: toPublicUser(row), profile: toProfile(row) });
 } catch (error) { next(error); }
});

router.post('/login', async (req, res, next) => {
 try {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'E-poçt və şifrə tələb olunur.' });
  const row = await db.get('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
  if (!row || !(await bcrypt.compare(password, row.password))) {
    return res.status(401).json({ error: 'E-poçt və ya şifrə yanlışdır.' });
  }
  const token = sign(row);
  res.json({ token, user: toPublicUser(row), profile: toProfile(row) });
 } catch (error) { next(error); }
});

router.get('/me', requireAuth, async (req, res, next) => {
 try {
  const row = await db.get('SELECT * FROM users WHERE id = ?', [req.userId]);
  if (!row) return res.status(404).json({ error: 'İstifadəçi tapılmadı.' });
  res.json({ user: toPublicUser(row), profile: toProfile(row) });
 } catch (error) { next(error); }
});

export default router;
