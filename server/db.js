import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDirectory = path.join(__dirname, 'data');
const usePostgres = Boolean(process.env.DATABASE_URL);
let client;
let sqlite = false;
let initializing = true;

const pgSchema = `
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY, fullname TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('freelancer','musteri')), about TEXT DEFAULT '', avatarurl TEXT DEFAULT '',
  bannerurl TEXT DEFAULT '', isprofilevisible BOOLEAN DEFAULT TRUE, status TEXT DEFAULT '',
  activityareas JSONB DEFAULT '[]'::jsonb, experience TEXT DEFAULT 'bir ilden azdir', hourlyrate NUMERIC DEFAULT 0,
  ratetype TEXT DEFAULT '1 saat üçün', createdat TIMESTAMPTZ DEFAULT NOW(), nickname TEXT DEFAULT '',
  phone TEXT DEFAULT '', privacysettings JSONB DEFAULT '{}'::jsonb
);
CREATE TABLE IF NOT EXISTS tasks (
  id BIGSERIAL PRIMARY KEY, ownerid BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE, title TEXT NOT NULL,
  description TEXT NOT NULL, price NUMERIC DEFAULT 0, currency TEXT DEFAULT 'AZN',
  pricetype TEXT DEFAULT 'Sifarişçi büdcəni təyin edib', categories JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'açıq', views INTEGER DEFAULT 0, createdat TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS applications (
  id BIGSERIAL PRIMARY KEY, taskid BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  freelancerid BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE, message TEXT DEFAULT '',
  status TEXT DEFAULT 'gözləmədə', createdat TIMESTAMPTZ DEFAULT NOW(), UNIQUE(taskid, freelancerid)
);
CREATE TABLE IF NOT EXISTS messages (
  id BIGSERIAL PRIMARY KEY, fromuserid BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  touserid BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE, text TEXT NOT NULL,
  isread BOOLEAN DEFAULT FALSE, createdat TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS projects (
  id BIGSERIAL PRIMARY KEY, ownerid BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL, category TEXT NOT NULL DEFAULT 'Dizayn', imageurl TEXT NOT NULL, description TEXT DEFAULT '',
  likes INTEGER DEFAULT 0, views INTEGER DEFAULT 0, createdat TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS club_posts (
  id BIGSERIAL PRIMARY KEY, authorid BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE, title TEXT NOT NULL,
  type TEXT DEFAULT 'müzakirə', tags JSONB DEFAULT '[]'::jsonb, content TEXT NOT NULL, mediaurl TEXT DEFAULT '',
  views INTEGER DEFAULT 0, createdat TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS club_comments (
  id BIGSERIAL PRIMARY KEY, postid BIGINT NOT NULL REFERENCES club_posts(id) ON DELETE CASCADE,
  authorid BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE, text TEXT NOT NULL, createdat TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS freelancer_specialties (
  id BIGSERIAL PRIMARY KEY, freelancerid BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category TEXT NOT NULL, title TEXT NOT NULL, about TEXT DEFAULT '', hourlyrate NUMERIC DEFAULT 0,
  experience TEXT DEFAULT '', createdat TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS social_links (
  id BIGSERIAL PRIMARY KEY, userid BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  github TEXT DEFAULT '', instagram TEXT DEFAULT '', linkedin TEXT DEFAULT '', facebook TEXT DEFAULT '',
  displaylink1 TEXT DEFAULT '', displaylink2 TEXT DEFAULT ''
);
CREATE TABLE IF NOT EXISTS follows (
  id BIGSERIAL PRIMARY KEY, followerid BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  followingid BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE, createdat TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(followerid, followingid)
);
CREATE TABLE IF NOT EXISTS user_online_status (
  userid BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, isonline BOOLEAN DEFAULT FALSE,
  lastseenat TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY, userid BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('task_accepted','message','project','post','follow','support')),
  referenceid BIGINT DEFAULT 0, title TEXT NOT NULL, description TEXT DEFAULT '', isread BOOLEAN DEFAULT FALSE,
  createdat TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS support_tickets (
  id BIGSERIAL PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL, subject TEXT NOT NULL, message TEXT NOT NULL,
  status TEXT DEFAULT 'gözləmədə', reply TEXT DEFAULT '', createdat TIMESTAMPTZ DEFAULT NOW(), repliedat TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS reviews (
  id BIGSERIAL PRIMARY KEY, taskid BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  authorid BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE, targetid BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5), text TEXT NOT NULL, createdat TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(taskid, authorid, targetid)
);
CREATE INDEX IF NOT EXISTS idx_tasks_ownerid ON tasks(ownerid);
CREATE INDEX IF NOT EXISTS idx_tasks_createdat ON tasks(createdat DESC);
CREATE INDEX IF NOT EXISTS idx_projects_ownerid ON projects(ownerid);
CREATE INDEX IF NOT EXISTS idx_projects_createdat ON projects(createdat DESC);
CREATE INDEX IF NOT EXISTS idx_posts_createdat ON club_posts(createdat DESC);
CREATE INDEX IF NOT EXISTS idx_messages_users ON messages(fromuserid, touserid, createdat DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(userid, createdat DESC);
`;

const sqliteSchema = `
CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, fullName TEXT NOT NULL, email TEXT UNIQUE NOT NULL,
 password TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('freelancer','musteri')), about TEXT DEFAULT '', avatarUrl TEXT DEFAULT '',
 bannerUrl TEXT DEFAULT '', isProfileVisible INTEGER DEFAULT 1, status TEXT DEFAULT '', activityAreas TEXT DEFAULT '[]',
 experience TEXT DEFAULT 'bir ilden azdir', hourlyRate REAL DEFAULT 0, rateType TEXT DEFAULT '1 saat üçün',
 createdAt TEXT DEFAULT (datetime('now')), nickname TEXT DEFAULT '', phone TEXT DEFAULT '', privacySettings TEXT DEFAULT '{}');
CREATE TABLE IF NOT EXISTS tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, ownerId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 title TEXT NOT NULL, description TEXT NOT NULL, price REAL DEFAULT 0, currency TEXT DEFAULT 'AZN',
 priceType TEXT DEFAULT 'Sifarişçi büdcəni təyin edib', categories TEXT DEFAULT '[]', status TEXT DEFAULT 'açıq',
 views INTEGER DEFAULT 0, createdAt TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS applications (id INTEGER PRIMARY KEY AUTOINCREMENT, taskId INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
 freelancerId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, message TEXT DEFAULT '', status TEXT DEFAULT 'gözləmədə',
 createdAt TEXT DEFAULT (datetime('now')), UNIQUE(taskId, freelancerId));
CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, fromUserId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 toUserId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, text TEXT NOT NULL, isRead INTEGER DEFAULT 0, createdAt TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS projects (id INTEGER PRIMARY KEY AUTOINCREMENT, ownerId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 title TEXT NOT NULL, category TEXT NOT NULL DEFAULT 'Dizayn', imageUrl TEXT NOT NULL, description TEXT DEFAULT '',
 likes INTEGER DEFAULT 0, views INTEGER DEFAULT 0, createdAt TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS club_posts (id INTEGER PRIMARY KEY AUTOINCREMENT, authorId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 title TEXT NOT NULL, type TEXT DEFAULT 'müzakirə', tags TEXT DEFAULT '[]', content TEXT NOT NULL, mediaUrl TEXT DEFAULT '',
 views INTEGER DEFAULT 0, createdAt TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS club_comments (id INTEGER PRIMARY KEY AUTOINCREMENT, postId INTEGER NOT NULL REFERENCES club_posts(id) ON DELETE CASCADE,
 authorId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, text TEXT NOT NULL, createdAt TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS freelancer_specialties (id INTEGER PRIMARY KEY AUTOINCREMENT, freelancerId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 category TEXT NOT NULL, title TEXT NOT NULL, about TEXT DEFAULT '', hourlyRate REAL DEFAULT 0, experience TEXT DEFAULT '',
 createdAt TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS social_links (id INTEGER PRIMARY KEY AUTOINCREMENT, userId INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
 github TEXT DEFAULT '', instagram TEXT DEFAULT '', linkedin TEXT DEFAULT '', facebook TEXT DEFAULT '', displayLink1 TEXT DEFAULT '', displayLink2 TEXT DEFAULT '');
CREATE TABLE IF NOT EXISTS follows (id INTEGER PRIMARY KEY AUTOINCREMENT, followerId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 followingId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, createdAt TEXT DEFAULT (datetime('now')), UNIQUE(followerId, followingId));
CREATE TABLE IF NOT EXISTS user_online_status (userId INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, isOnline INTEGER DEFAULT 0, lastSeenAt TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS notifications (id INTEGER PRIMARY KEY AUTOINCREMENT, userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 type TEXT NOT NULL CHECK(type IN ('task_accepted','message','project','post','follow','support')), referenceId INTEGER DEFAULT 0,
 title TEXT NOT NULL, description TEXT DEFAULT '', isRead INTEGER DEFAULT 0, createdAt TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS support_tickets (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT NOT NULL, subject TEXT NOT NULL,
 message TEXT NOT NULL, status TEXT DEFAULT 'gözləmədə', reply TEXT DEFAULT '', createdAt TEXT DEFAULT (datetime('now')), repliedAt TEXT);
CREATE TABLE IF NOT EXISTS reviews (id INTEGER PRIMARY KEY AUTOINCREMENT, taskId INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
 authorId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, targetId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5), text TEXT NOT NULL, createdAt TEXT DEFAULT (datetime('now')), UNIQUE(taskId, authorId, targetId));
CREATE INDEX IF NOT EXISTS idx_tasks_owner ON tasks(ownerId);
CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(ownerId);
CREATE INDEX IF NOT EXISTS idx_messages_users ON messages(fromUserId, toUserId, createdAt);
`;

const keyMap = {
  fullname: 'fullName', avatarurl: 'avatarUrl', bannerurl: 'bannerUrl', isprofilevisible: 'isProfileVisible',
  activityareas: 'activityAreas', hourlyrate: 'hourlyRate', ratetype: 'rateType', createdat: 'createdAt',
  ownerid: 'ownerId', pricetype: 'priceType', taskid: 'taskId', freelancerid: 'freelancerId',
  fromuserid: 'fromUserId', touserid: 'toUserId', isread: 'isRead', imageurl: 'imageUrl', authorid: 'authorId',
  mediaurl: 'mediaUrl', postid: 'postId', displaylink1: 'displayLink1', displaylink2: 'displayLink2',
  followerid: 'followerId', followingid: 'followingId', userid: 'userId', isonline: 'isOnline',
  lastseenat: 'lastSeenAt', referenceid: 'referenceId', repliedat: 'repliedAt', privacysettings: 'privacySettings',
  applicationcount: 'applicationCount', ownername: 'ownerName', freelancername: 'freelancerName',
  tasktitle: 'taskTitle', taskstatus: 'taskStatus', otherid: 'otherId', lastmessage: 'lastMessage',
  projectviews: 'projectViews', completedorders: 'completedOrders', activeorders: 'activeOrders', conflictjobs: 'conflictJobs',
};
const numericKeys = new Set(['id', 'ownerId', 'taskId', 'freelancerId', 'fromUserId', 'toUserId', 'authorId', 'postId',
  'userId', 'followerId', 'followingId', 'referenceId', 'price', 'hourlyRate', 'likes', 'views', 'rating',
  'count', 'c', 'total', 'comments', 'applicationCount', 'followers', 'completedOrders', 'activeOrders', 'conflictJobs', 'projectViews']);

function mapRows(rows) {
  return rows.map((row) => Object.fromEntries(Object.entries(row).map(([key, value]) => {
    const mapped = keyMap[key] || key;
    let normalized = value instanceof Date ? value.toISOString() : value;
    if (numericKeys.has(mapped) && normalized !== null && normalized !== undefined) normalized = Number(normalized);
    return [mapped, normalized];
  })));
}

function convertPlaceholders(text) {
  let index = 0;
  return text.replace(/\?/g, () => `$${++index}`);
}

function postgresParams(params) {
  return params.map((value) => {
    if (typeof value !== 'string' || !/^\s*[\[{]/.test(value)) return value;
    try { return JSON.parse(value); } catch { return value; }
  });
}

async function initialize() {
  if (usePostgres) {
    const postgres = (await import('postgres')).default;
    client = postgres(process.env.DATABASE_URL, {
      max: Number(process.env.DATABASE_POOL_SIZE || 10),
      idle_timeout: 20,
      connect_timeout: 10,
      ssl: process.env.DATABASE_SSL === 'false' ? false : 'require',
    });
    await client.unsafe(pgSchema);
  } else {
    fs.mkdirSync(dataDirectory, { recursive: true });
    const { default: Database } = await import('better-sqlite3');
    client = new Database(path.join(dataDirectory, 'freelancer.db'));
    sqlite = true;
    client.pragma('foreign_keys = ON');
    client.exec(sqliteSchema);
    for (const statement of [
      "ALTER TABLE users ADD COLUMN nickname TEXT DEFAULT ''", "ALTER TABLE users ADD COLUMN phone TEXT DEFAULT ''",
      "ALTER TABLE users ADD COLUMN privacySettings TEXT DEFAULT '{}'", "ALTER TABLE club_posts ADD COLUMN mediaUrl TEXT DEFAULT ''",
    ]) {
      try { client.exec(statement); } catch (error) {
        if (!String(error.message).includes('duplicate column name')) throw error;
      }
    }
  }
  await seed();
  initializing = false;
}

async function seed() {
  const count = (await db.get('SELECT COUNT(*) AS count FROM users')).count;
  if (Number(count) === 0) {
    const password = await bcrypt.hash('parol123', 10);
    const users = [
      ['Elgun Yusifli', 'elgun@nümune.az', password, 'freelancer', 'Professional Web-Developer, Graphic Designer and SEO Engineer.', 'Founder Frilans.az', JSON.stringify(['Veb-Saytların hazırlanması', 'Back-end', 'Front-end']), '5+ il', 1500, '1 layihə üçün'],
      ['Fidan Əsgərova', 'fidan@nümune.az', password, 'freelancer', 'SMM, Mobilograph. Sosial medyanın idarə edilməsi, video edit.', 'SMM/Mobilograph', JSON.stringify(['Kopiraytinq', 'Video montaj', 'SMM']), '2-5 il', 30, '1 saat üçün'],
      ['Əhməd Hacıtalıbov', 'ahmed@nümune.az', password, 'musteri', 'Sifarişçi hesabı.', '', '[]', 'bir ilden azdir', 0, ''],
    ];
    for (const user of users) {
      await db.run(`INSERT INTO users (fullName, email, password, role, about, status, activityAreas, experience, hourlyRate, rateType)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`, user);
    }
    const customer = await db.get(`SELECT id FROM users WHERE email = ?`, ['ahmed@nümune.az']);
    const elgun = await db.get(`SELECT id FROM users WHERE email = ?`, ['elgun@nümune.az']);
    const fidan = await db.get(`SELECT id FROM users WHERE email = ?`, ['fidan@nümune.az']);
    await db.run(`INSERT INTO tasks (ownerId, title, description, price, currency, priceType, categories) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id`,
      [customer.id, 'Veb saytın hazırlanması və dizaynı', 'Şirkətimiz üçün müasir, responsiv və sürətli veb sayt yığılmalıdır. UI/UX dizayn daxildir.', 1500, 'AZN', 'Sifarişçi büdcəni təyin edib', JSON.stringify(['Veb-Saytların hazırlanması', 'Front-end'])]);
    await db.run(`INSERT INTO tasks (ownerId, title, description, price, currency, priceType, categories) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id`,
      [customer.id, 'Instagram üçün SMM içeriği hazırlanması', 'Aylıq 12 post + 8 story hazırlanması, video montaj daxildir.', 300, 'AZN', 'Sifarişçi büdcəni təyin edib', JSON.stringify(['SMM', 'Video montaj'])]);
    await db.run(`INSERT INTO projects (ownerId, title, category, imageUrl, description) VALUES (?, ?, ?, ?, ?) RETURNING id`,
      [elgun.id, 'Freelance Başlanğıc Paketi', 'Dizayn', 'https://placehold.co/600x600/1e293b/ffffff?text=Freelance+Paket', 'Brend üçün başlanğıc dizayn paketi.']);
    await db.run(`INSERT INTO projects (ownerId, title, category, imageUrl, description) VALUES (?, ?, ?, ?, ?) RETURNING id`,
      [fidan.id, 'SMM Marketinq Post', 'Media', 'https://placehold.co/600x600/000000/ef4444?text=SMM+Sale', 'Sosial media üçün kampaniya vizualı.']);
    await db.run(`INSERT INTO club_posts (authorId, title, type, tags, content) VALUES (?, ?, ?, ?, ?) RETURNING id`,
      [elgun.id, 'Frilans-da ilk post', 'müzakirə', JSON.stringify(['Müxtəlif']), 'Hər kəsə salam! Bu platformada ilk postumu paylaşıram. Faydalı müzakirələr aparaq.']);
    await db.run(`INSERT INTO club_posts (authorId, title, type, tags, content) VALUES (?, ?, ?, ?, ?) RETURNING id`,
      [elgun.id, 'Vacib məlumat!', 'müzakirə', JSON.stringify(['Müxtəlif']), 'Platforma üzvləri üçün vacib yeniliklər və iş prinsipi haqqında məlumat.']);
  }
  const admin = await db.get('SELECT id FROM users WHERE email = ?', ['admin@freelancer.az']);
  if (!admin) {
    const password = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin12345!', 10);
    await db.run(`INSERT INTO users (fullName, email, password, role, nickname, about) VALUES (?, ?, ?, ?, ?, ?) RETURNING id`,
      ['Freelancer.az Admin', 'admin@freelancer.az', password, 'musteri', 'admin', 'Platforma dəstək administratoru']);
  }
}

export const dbReady = initialize();
export const db = {
  async all(text, params = []) {
    if (!initializing) await dbReady;
    if (sqlite) return mapRows(client.prepare(text).all(...params));
    return mapRows(await client.unsafe(convertPlaceholders(text), postgresParams(params)));
  },
  async get(text, params = []) {
    const rows = await this.all(text, params);
    return rows[0];
  },
  async run(text, params = []) {
    if (!initializing) await dbReady;
    if (sqlite) {
      const statement = client.prepare(text);
      if (/\bRETURNING\b/i.test(text)) {
        const row = statement.get(...params);
        return { changes: row ? 1 : 0, lastInsertRowid: row?.id, rows: row ? [row] : [] };
      }
      const result = statement.run(...params);
      return { changes: result.changes, lastInsertRowid: result.lastInsertRowid };
    }
    const rows = await client.unsafe(convertPlaceholders(text), postgresParams(params));
    return { changes: rows.count ?? rows.length, lastInsertRowid: rows[0]?.id, rows };
  },
  async close() {
    if (client && sqlite) client.close();
    if (client && !sqlite) await client.end({ timeout: 5 });
  },
  get isPostgres() { return usePostgres; },
  get ready() { return dbReady; },
};

export default db;
