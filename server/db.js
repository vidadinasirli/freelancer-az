import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'data', 'freelancer.db');

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fullName TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('freelancer','musteri')),
  about TEXT DEFAULT '',
  avatarUrl TEXT DEFAULT '',
  bannerUrl TEXT DEFAULT '',
  isProfileVisible INTEGER DEFAULT 1,
  status TEXT DEFAULT '',
  activityAreas TEXT DEFAULT '[]',
  experience TEXT DEFAULT 'bir ilden azdir',
  hourlyRate REAL DEFAULT 0,
  rateType TEXT DEFAULT '1 saat üçün',
  createdAt TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ownerId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price REAL DEFAULT 0,
  currency TEXT DEFAULT 'AZN',
  priceType TEXT DEFAULT 'Sifarişçi büdcəni təyin edib',
  categories TEXT DEFAULT '[]',
  status TEXT DEFAULT 'açıq',
  views INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  taskId INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  freelancerId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT DEFAULT '',
  status TEXT DEFAULT 'gözləmədə',
  createdAt TEXT DEFAULT (datetime('now')),
  UNIQUE(taskId, freelancerId)
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fromUserId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  toUserId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  isRead INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ownerId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Dizayn',
  imageUrl TEXT NOT NULL,
  description TEXT DEFAULT '',
  likes INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS club_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  authorId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT DEFAULT 'müzakirə',
  tags TEXT DEFAULT '[]',
  content TEXT NOT NULL,
  views INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS club_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  postId INTEGER NOT NULL REFERENCES club_posts(id) ON DELETE CASCADE,
  authorId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS freelancer_specialties (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  freelancerId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  about TEXT DEFAULT '',
  hourlyRate REAL DEFAULT 0,
  experience TEXT DEFAULT '',
  createdAt TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS social_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  github TEXT DEFAULT '',
  instagram TEXT DEFAULT '',
  linkedin TEXT DEFAULT '',
  facebook TEXT DEFAULT '',
  displayLink1 TEXT DEFAULT '',
  displayLink2 TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS follows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  followerId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  followingId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  createdAt TEXT DEFAULT (datetime('now')),
  UNIQUE(followerId, followingId)
);

CREATE TABLE IF NOT EXISTS user_online_status (
  userId INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  isOnline INTEGER DEFAULT 0,
  lastSeenAt TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK(type IN ('task_accepted','message','project','post','follow','support')),
  referenceId INTEGER DEFAULT 0,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  isRead INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS support_tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'gözləmədə',
  reply TEXT DEFAULT '',
  createdAt TEXT DEFAULT (datetime('now')),
  repliedAt TEXT
);
`);

try { db.exec("ALTER TABLE club_posts ADD COLUMN mediaUrl TEXT DEFAULT ''"); } catch (error) {
  if (!String(error.message).includes('duplicate column name')) throw error;
}

for (const statement of [
  "ALTER TABLE users ADD COLUMN nickname TEXT DEFAULT ''",
  "ALTER TABLE users ADD COLUMN phone TEXT DEFAULT ''",
  "ALTER TABLE users ADD COLUMN privacySettings TEXT DEFAULT '{}'",
]) {
  try { db.exec(statement); } catch (error) {
    if (!String(error.message).includes('duplicate column name')) throw error;
  }
}

db.exec(`
CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  taskId INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  authorId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  targetId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
  text TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')),
  UNIQUE(taskId, authorId, targetId)
);
`);

// --- Seed demo data (only once) ---
const userCount = db.prepare('SELECT COUNT(*) c FROM users').get().c;
if (userCount === 0) {
  const hash = bcrypt.hashSync('parol123', 10);
  const insertUser = db.prepare(`INSERT INTO users
    (fullName, email, password, role, about, status, activityAreas, experience, hourlyRate, rateType, isProfileVisible)
    VALUES (@fullName, @email, @password, @role, @about, @status, @activityAreas, @experience, @hourlyRate, @rateType, 1)`);

  const elgun = insertUser.run({
    fullName: 'Elgun Yusifli', email: 'elgun@nümune.az', password: hash, role: 'freelancer',
    about: 'Professional Web-Developer, Graphic Designer and SEO Engineer.',
    status: 'Founder Frilans.az',
    activityAreas: JSON.stringify(['Veb-Saytların hazırlanması', 'Back-end', 'Front-end']),
    experience: '5+ il', hourlyRate: 1500, rateType: '1 layihə üçün'
  });
  const fidan = insertUser.run({
    fullName: 'Fidan Əsgərova', email: 'fidan@nümune.az', password: hash, role: 'freelancer',
    about: 'SMM, Mobilograph. Sosial medyanın idarə edilməsi, video edit.',
    status: 'SMM/Mobilograph',
    activityAreas: JSON.stringify(['Kopiraytinq', 'Video montaj', 'SMM']),
    experience: '2-5 il', hourlyRate: 30, rateType: '1 saat üçün'
  });
  const ahmed = insertUser.run({
    fullName: 'Əhməd Hacıtalıbov', email: 'ahmed@nümune.az', password: hash, role: 'musteri',
    about: 'Sifarişçi hesabı.', status: '', activityAreas: '[]', experience: 'bir ilden azdir', hourlyRate: 0, rateType: ''
  });

  const insertTask = db.prepare(`INSERT INTO tasks (ownerId, title, description, price, currency, priceType, categories)
    VALUES (@ownerId, @title, @description, @price, @currency, @priceType, @categories)`);
  insertTask.run({
    ownerId: ahmed.lastInsertRowid,
    title: 'Veb saytın hazırlanması və dizaynı',
    description: 'Şirkətimiz üçün müasir, responsiv və sürətli veb sayt yığılmalıdır. UI/UX dizayn daxildir.',
    price: 1500, currency: 'AZN', priceType: 'Sifarişçi büdcəni təyin edib',
    categories: JSON.stringify(['Veb-Saytların hazırlanması', 'Front-end'])
  });
  insertTask.run({
    ownerId: ahmed.lastInsertRowid,
    title: 'Instagram üçün SMM içeriği hazırlanması',
    description: 'Aylıq 12 post + 8 story hazırlanması, video montaj daxildir.',
    price: 300, currency: 'AZN', priceType: 'Sifarişçi büdcəni təyin edib',
    categories: JSON.stringify(['SMM', 'Video montaj'])
  });

  const insertProject = db.prepare(`INSERT INTO projects (ownerId, title, category, imageUrl, description)
    VALUES (?, ?, ?, ?, ?)`);
  insertProject.run(elgun.lastInsertRowid, 'Freelance Başlanğıc Paketi', 'Dizayn', 'https://placehold.co/600x600/1e293b/ffffff?text=Freelance+Paket', 'Brend üçün başlanğıc dizayn paketi.');
  insertProject.run(fidan.lastInsertRowid, 'SMM Marketinq Post', 'Media', 'https://placehold.co/600x600/000000/ef4444?text=SMM+Sale', 'Sosial media üçün kampaniya vizualı.');

  const insertPost = db.prepare(`INSERT INTO club_posts (authorId, title, type, tags, content)
    VALUES (?, ?, ?, ?, ?)`);
  insertPost.run(elgun.lastInsertRowid, 'Frilans-da ilk post', 'müzakirə', JSON.stringify(['Müxtəlif']), 'Hər kəsə salam! Bu platformada ilk postumu paylaşıram. Faydalı müzakirələr aparaq.');
  insertPost.run(elgun.lastInsertRowid, 'Vacib məlumat!', 'müzakirə', JSON.stringify(['Müxtəlif']), 'Platforma üzvləri üçün vacib yeniliklər və iş prinsipi haqqında məlumat.');
}

if (!db.prepare("SELECT id FROM users WHERE email = 'admin@freelancer.az'").get()) {
  const hash = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'Admin12345!', 10);
  db.prepare(`INSERT INTO users (fullName, email, password, role, nickname, about)
    VALUES ('Freelancer.az Admin', 'admin@freelancer.az', ?, 'musteri', 'admin', 'Platforma dəstək administratoru')`).run(hash);
}

if (db.prepare('SELECT COUNT(*) c FROM projects').get().c === 0) {
  const freelancer = db.prepare("SELECT id FROM users WHERE role = 'freelancer' ORDER BY id LIMIT 1").get();
  if (freelancer) {
    const insertProject = db.prepare(`INSERT INTO projects (ownerId, title, category, imageUrl, description) VALUES (?, ?, ?, ?, ?)`);
    insertProject.run(freelancer.id, 'Freelance Başlanğıc Paketi', 'Dizayn', 'https://placehold.co/600x600/1e293b/ffffff?text=Freelance+Paket', 'Brend üçün başlanğıc dizayn paketi.');
  }
}
if (db.prepare('SELECT COUNT(*) c FROM club_posts').get().c === 0) {
  const author = db.prepare("SELECT id FROM users ORDER BY id LIMIT 1").get();
  if (author) {
    const insertPost = db.prepare(`INSERT INTO club_posts (authorId, title, type, tags, content) VALUES (?, ?, ?, ?, ?)`);
    insertPost.run(author.id, 'Frilans-da ilk post', 'müzakirə', JSON.stringify(['Müxtəlif']), 'Hər kəsə salam! Bu platformada ilk postumu paylaşıram. Faydalı müzakirələr aparaq.');
  }
}

export default db;
