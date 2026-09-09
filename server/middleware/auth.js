import jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET || 'freelancer-az-dev-secret-change-me';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Giriş tələb olunur.' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.id;
    req.userRole = payload.role;
    next();
  } catch {
    return res.status(401).json({ error: 'Sessiya etibarsızdır, yenidən daxil olun.' });
  }
}

export function optionalAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      req.userId = payload.id;
      req.userRole = payload.role;
    } catch {
      // ignore invalid token in optional mode
    }
  }
  next();
}
