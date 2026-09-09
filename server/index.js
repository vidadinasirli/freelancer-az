import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { db, dbReady } from './db.js';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import taskRoutes from './routes/tasks.js';
import userRoutes from './routes/users.js';
import messageRoutes from './routes/messages.js';
import projectRoutes from './routes/projects.js';
import clubRoutes from './routes/club.js';
import supportRoutes from './routes/support.js';
import socialRoutes from './routes/social.js';
import notificationRoutes from './routes/notifications.js';
import uploadRoutes from './routes/uploads.js';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 4000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'data', 'uploads'), {
  maxAge: '7d',
  index: false,
}));

app.get('/api/health', async (req, res) => {
  try {
    await dbReady;
    res.json({ ok: true, database: { ready: true, provider: db.isPostgres ? 'postgres' : 'sqlite' } });
  } catch (error) {
    res.status(503).json({ ok: false, database: { ready: false } });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/club', clubRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/uploads', uploadRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Server xətası baş verdi.' });
});

await dbReady;
app.listen(PORT, () => {
  console.log(`Freelancer.az backend http://localhost:${PORT} ünvanında işləyir (${db.isPostgres ? 'PostgreSQL' : 'SQLite'} database)`);
});
