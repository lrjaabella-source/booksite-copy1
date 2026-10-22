const express = require('express');
const app = express();
const port = 3000;

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { promisify } = require('util');
const scrypt = promisify(crypto.scrypt);
const bookwormPath = path.join(__dirname, "index.html");
const booksPath = path.join(__dirname, "data", "books.json");
const streakPath = path.join(__dirname, "data", "streak.json");
const authDirectory = path.join(__dirname, "data", ".auth");
const usersPath = path.join(authDirectory, "users.json");
const sessionsPath = path.join(authDirectory, "sessions.json");
const sessionCookie = 'bookworm_session';
const sessionDurationMs = 7 * 24 * 60 * 60 * 1000;

app.use(express.static(__dirname));
app.use(express.json({ limit: '10kb' }));

function readAuthFile(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

function writeAuthFile(filePath, data) {
  fs.mkdirSync(authDirectory, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), { mode: 0o600 });
}

function getSessionToken(req) {
  const cookies = String(req.headers.cookie || '').split(';');
  const entry = cookies.map(cookie => cookie.trim()).find(cookie => cookie.startsWith(`${sessionCookie}=`));
  return entry ? decodeURIComponent(entry.slice(sessionCookie.length + 1)) : '';
}

function cleanExpiredSessions(sessions) {
  const now = Date.now();
  return sessions.filter(session => session.expiresAt > now);
}

function publicUser(user) {
  return { id: user.id, email: user.email, name: user.name };
}

function setSessionCookie(res, token) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${sessionCookie}=${encodeURIComponent(token)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${sessionDurationMs / 1000}${secure}`);
}

function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', `${sessionCookie}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`);
}

function findAuthenticatedUser(req) {
  const token = getSessionToken(req);
  if (!token) return null;
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const sessions = cleanExpiredSessions(readAuthFile(sessionsPath));
  const session = sessions.find(item => item.tokenHash === tokenHash);
  if (!session) return null;
  const users = readAuthFile(usersPath);
  return users.find(user => user.id === session.userId) || null;
}

app.post('/api/auth/register', async (req, res) => {
  const name = String(req.body?.name || '').trim().slice(0, 80);
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  if (!name || name.length > 80) return res.status(400).json({ error: 'Enter a name up to 80 characters.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return res.status(400).json({ error: 'Enter a valid email address.' });
  if (password.length < 8 || password.length > 200) return res.status(400).json({ error: 'Password must be at least 8 characters.' });

  try {
    const users = readAuthFile(usersPath);
    if (users.some(user => user.email === email)) return res.status(409).json({ error: 'An account with that email already exists.' });
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = (await scrypt(password, salt, 64)).toString('hex');
    const user = { id: crypto.randomUUID(), name, email, salt, passwordHash, createdAt: new Date().toISOString() };
    users.push(user);
    writeAuthFile(usersPath, users);

    const token = crypto.randomBytes(32).toString('base64url');
    const sessions = cleanExpiredSessions(readAuthFile(sessionsPath));
    sessions.push({ tokenHash: crypto.createHash('sha256').update(token).digest('hex'), userId: user.id, expiresAt: Date.now() + sessionDurationMs });
    writeAuthFile(sessionsPath, sessions);
    setSessionCookie(res, token);
    res.status(201).json({ user: publicUser(user) });
  } catch (error) {
    console.error('Account registration failed:', error);
    res.status(500).json({ error: 'Could not create your account right now.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  try {
    const users = readAuthFile(usersPath);
    const user = users.find(item => item.email === email);
    if (!user || password.length > 200) return res.status(401).json({ error: 'Email or password is incorrect.' });
    const passwordHash = await scrypt(password, user.salt, 64);
    const storedHash = Buffer.from(user.passwordHash, 'hex');
    if (storedHash.length !== passwordHash.length || !crypto.timingSafeEqual(storedHash, passwordHash)) {
      return res.status(401).json({ error: 'Email or password is incorrect.' });
    }

    const token = crypto.randomBytes(32).toString('base64url');
    const sessions = cleanExpiredSessions(readAuthFile(sessionsPath));
    sessions.push({ tokenHash: crypto.createHash('sha256').update(token).digest('hex'), userId: user.id, expiresAt: Date.now() + sessionDurationMs });
    writeAuthFile(sessionsPath, sessions);
    setSessionCookie(res, token);
    res.json({ user: publicUser(user) });
  } catch (error) {
    console.error('Login failed:', error);
    res.status(500).json({ error: 'Could not log in right now.' });
  }
});

app.get('/api/auth/me', (req, res) => {
  try {
    const user = findAuthenticatedUser(req);
    res.json({ user: user ? publicUser(user) : null });
  } catch (error) {
    console.error('Could not read login session:', error);
    res.status(500).json({ error: 'Could not check login status.' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  try {
    const token = getSessionToken(req);
    if (token) {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const sessions = cleanExpiredSessions(readAuthFile(sessionsPath)).filter(session => session.tokenHash !== tokenHash);
      writeAuthFile(sessionsPath, sessions);
    }
    clearSessionCookie(res);
    res.json({ user: null });
  } catch (error) {
    console.error('Logout failed:', error);
    res.status(500).json({ error: 'Could not log out right now.' });
  }
});

function readStreakData() {
  try {
    const data = JSON.parse(fs.readFileSync(streakPath, 'utf8'));
    return {
      activityDates: Array.isArray(data.activityDates) ? data.activityDates : [],
      longestStreak: Number(data.longestStreak) || 0
    };
  } catch (error) {
    if (error.code !== 'ENOENT') console.error('Could not read streak data:', error);
    return { activityDates: [], longestStreak: 0 };
  }
}

function dateDifference(from, to) {
  return (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000;
}

function streakSummary(data, today) {
  const dates = [...new Set(data.activityDates)].sort();
  const lastReadDate = dates.at(-1) || null;
  const gap = lastReadDate ? dateDifference(lastReadDate, today) : null;
  const isBroken = gap !== null && gap > 1;
  let currentStreak = 0;

  if (lastReadDate && !isBroken) {
    currentStreak = 1;
    for (let index = dates.length - 1; index > 0; index -= 1) {
      if (dateDifference(dates[index - 1], dates[index]) !== 1) break;
      currentStreak += 1;
    }
  }

  return {
    currentStreak,
    longestStreak: data.longestStreak,
    lastReadDate,
    activityDates: dates,
    readToday: dates.includes(today),
    status: isBroken ? 'broken' : currentStreak ? 'active' : 'new'
  };
}

function isDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) &&
    new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
}

function saveStreakData(data) {
  fs.writeFileSync(streakPath, JSON.stringify(data, null, 2));
}

app.get('/api/streak', (req, res) => {
  const today = String(req.query.today || '');
  if (!isDate(today)) return res.status(400).json({ error: 'A valid local date is required.' });
  res.json(streakSummary(readStreakData(), today));
});

app.post('/api/streak/activity', (req, res) => {
  const { date } = req.body || {};
  if (!isDate(date)) return res.status(400).json({ error: 'A valid reading date is required.' });

  try {
    const data = readStreakData();
    data.activityDates = [...new Set([...data.activityDates, date])].sort();
    let run = 0;
    for (let index = 0; index < data.activityDates.length; index += 1) {
      run = index > 0 && dateDifference(data.activityDates[index - 1], data.activityDates[index]) === 1
        ? run + 1
        : 1;
      data.longestStreak = Math.max(data.longestStreak, run);
    }
    saveStreakData(data);
    res.json(streakSummary(data, date));
  } catch (error) {
    console.error('Could not save reading activity:', error);
    res.status(500).json({ error: 'Could not save reading activity.' });
  }
});

app.get('/api/books/search', (req, res) => {
  const query = String(req.query.q || '').trim().slice(0, 100);

  if (!query) {
    return res.json({ results: [] });
  }

  fs.readFile(booksPath, 'utf8', (error, contents) => {
    if (error) {
      console.error('Could not read books data:', error);
      return res.status(500).json({ error: 'Book search is unavailable.' });
    }

    try {
      const books = JSON.parse(contents);
      const needle = query.toLocaleLowerCase();
      const results = books.filter(book =>
        [book.title, book.author, book.genre]
          .some(value => String(value || '').toLocaleLowerCase().includes(needle))
      );

      res.json({ results });
    } catch (parseError) {
      console.error('Could not parse books data:', parseError);
      res.status(500).json({ error: 'Book search is unavailable.' });
    }
  });
});

app.get('/', (req, res) => {
  res.sendFile(bookwormPath);
});

app.get('/about', (req, res) => {
  res.send('About Hello World!');
});

app.listen(port, () => {
  console.log(`App is running on http://localhost:${port}`);
});
