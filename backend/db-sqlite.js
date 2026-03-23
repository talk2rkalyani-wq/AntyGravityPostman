const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

let db;

async function initDb() {
  const dataDir = process.env.DATA_DIR || __dirname;
  const dbPath = path.resolve(dataDir, 'postman_clone.db');
  db = new Database(dbPath);

  // Create tables if they don't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS history (
      id TEXT PRIMARY KEY,
      url TEXT,
      method TEXT,
      status INTEGER,
      time INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS collections (
      id TEXT PRIMARY KEY,
      name TEXT,
      data JSON,
      workspace_id TEXT DEFAULT 'default',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS environments (
      id TEXT PRIMARY KEY,
      name TEXT,
      data JSON,
      workspace_id TEXT DEFAULT 'default',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS members (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT,
      role TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS workspaces (
      id TEXT PRIMARY KEY,
      name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE,
      email TEXT UNIQUE,
      password_hash TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS password_resets (
      email TEXT PRIMARY KEY,
      otp TEXT,
      reset_token TEXT,
      expires_at DATETIME
    );
  `);

  try {
    db.exec('ALTER TABLE history ADD COLUMN user_id TEXT REFERENCES users(id)');
    db.exec('ALTER TABLE collections ADD COLUMN user_id TEXT REFERENCES users(id)');
    db.exec('ALTER TABLE environments ADD COLUMN user_id TEXT REFERENCES users(id)');
    db.exec('ALTER TABLE workspaces ADD COLUMN user_id TEXT REFERENCES users(id)');
  } catch(e) {}

  // Ensure 'My Workspace' exists
  const wpStmt = db.prepare('SELECT count(*) as cnt FROM workspaces');
  if (wpStmt.get().cnt === 0) {
    const insertWp = db.prepare("INSERT INTO workspaces (id, name) VALUES ('default', 'My Workspace')");
    insertWp.run();
  }
}

function saveHistory({ url, method, status, time, userId }) {
  if (!userId) return;
  const stmt = db.prepare('INSERT INTO history (id, url, method, status, time, user_id) VALUES (?, ?, ?, ?, ?, ?)');
  stmt.run(uuidv4(), url, method, status, time, userId);
}

function getHistory(userId) {
  if (!userId) return [];
  const stmt = db.prepare('SELECT * FROM history WHERE user_id = ? ORDER BY created_at DESC LIMIT 100');
  return stmt.all(userId);
}

function getCollections(userId) {
  if (!userId) return [];
  const stmt = db.prepare('SELECT * FROM collections WHERE user_id = ? ORDER BY created_at DESC');
  return stmt.all(userId);
}

function createCollection(name, data, userId) {
  const id = uuidv4();
  const stmt = db.prepare('INSERT INTO collections (id, name, data, user_id) VALUES (?, ?, ?, ?)');
  stmt.run(id, name, JSON.stringify(data), userId);
  return { id, name, data };
}

function updateCollection(id, data, userId) {
  const stmt = db.prepare('UPDATE collections SET data = ? WHERE id = ? AND user_id = ?');
  stmt.run(JSON.stringify(data), id, userId);
  return { id, data };
}

// --- Environments ---
function getEnvironments(userId) {
  if (!userId) return [];
  const stmt = db.prepare('SELECT * FROM environments WHERE user_id = ? ORDER BY created_at DESC');
  return stmt.all(userId);
}

function createEnvironment(name, data, userId) {
  const id = uuidv4();
  const stmt = db.prepare('INSERT INTO environments (id, name, data, user_id) VALUES (?, ?, ?, ?)');
  stmt.run(id, name, JSON.stringify(data), userId);
  return { id, name, data };
}

function updateEnvironment(id, name, data, userId) {
  const stmt = db.prepare('UPDATE environments SET name = ?, data = ? WHERE id = ? AND user_id = ?');
  stmt.run(name, JSON.stringify(data), id, userId);
  return { id, name, data };
}

function deleteEnvironment(id, userId) {
  const stmt = db.prepare('DELETE FROM environments WHERE id = ? AND user_id = ?');
  stmt.run(id, userId);
  return true;
}

// --- Members ---
function getMembers() {
  const stmt = db.prepare('SELECT * FROM members ORDER BY created_at ASC');
  return stmt.all();
}

function addMember({ name, email, role }) {
  const id = uuidv4();
  const stmt = db.prepare('INSERT INTO members (id, name, email, role) VALUES (?, ?, ?, ?)');
  stmt.run(id, name, email, role);
  return { id, name, email, role };
}

function updateMemberRole(id, role) {
  const stmt = db.prepare('UPDATE members SET role = ? WHERE id = ?');
  stmt.run(role, id);
  return { id, role };
}

function removeMember(id) {
  const stmt = db.prepare('DELETE FROM members WHERE id = ?');
  stmt.run(id);
  return { id };
}

// --- Workspaces ---
function getWorkspaces(userId) {
  if (!userId) return [];
  const stmt = db.prepare('SELECT * FROM workspaces WHERE user_id = ? OR id = ? ORDER BY created_at ASC');
  return stmt.all(userId, 'default');
}

function addWorkspace(name, userId) {
  const id = uuidv4();
  const stmt = db.prepare('INSERT INTO workspaces (id, name, user_id) VALUES (?, ?, ?)');
  stmt.run(id, name, userId);
  return { id, name };
}

function updateWorkspace(id, name, userId) {
  const stmt = db.prepare('UPDATE workspaces SET name = ? WHERE id = ? AND user_id = ?');
  stmt.run(name, id, userId);
  return { id, name };
}

function deleteWorkspace(id, userId) {
  if (id === 'default') return false; // Prevent deleting default
  const stmt = db.prepare('DELETE FROM workspaces WHERE id = ? AND user_id = ?');
  stmt.run(id, userId);
  return true;
}

// --- Auth ---
function createUser(username, email, passwordHash) {
  try {
    const id = uuidv4();
    const stmt = db.prepare('INSERT INTO users (id, username, email, password_hash) VALUES (?, ?, ?, ?)');
    stmt.run(id, username, email, passwordHash);
    return { id, username, email };
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      throw new Error('Username or Email already exists');
    }
    throw err;
  }
}

function getUserByEmailOrUsername(identifier) {
  const stmt = db.prepare('SELECT * FROM users WHERE email = ? OR username = ?');
  return stmt.get(identifier, identifier);
}

function getUserById(id) {
  const stmt = db.prepare('SELECT id, username, email, created_at FROM users WHERE id = ?');
  return stmt.get(id);
}

function createSession(userId) {
  const token = uuidv4(); // Use UUID as Bearer token for simplicity/security
  const stmt = db.prepare('INSERT INTO sessions (token, user_id) VALUES (?, ?)');
  stmt.run(token, userId);
  return token;
}

function getUserBySession(token) {
  const stmt = db.prepare(`
    SELECT users.id, users.username, users.email 
    FROM users 
    JOIN sessions ON users.id = sessions.user_id 
    WHERE sessions.token = ?
  `);
  return stmt.get(token);
}

function deleteSession(token) {
  const stmt = db.prepare('DELETE FROM sessions WHERE token = ?');
  stmt.run(token);
}

// --- Password Reset ---
function saveOtp(email, otp) {
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 mins
  const stmt = db.prepare(`
    INSERT INTO password_resets (email, otp, expires_at) 
    VALUES (?, ?, ?) 
    ON CONFLICT(email) DO UPDATE SET otp=excluded.otp, expires_at=excluded.expires_at, reset_token=NULL
  `);
  stmt.run(email, otp, expiresAt);
}

function verifyOtp(email, otp) {
  const stmt = db.prepare('SELECT * FROM password_resets WHERE email = ? AND otp = ? AND expires_at > ?');
  const record = stmt.get(email, otp, new Date().toISOString());
  if (!record) return null;
  
  // Valid OTP, now generate a reset token
  const resetToken = uuidv4();
  db.prepare('UPDATE password_resets SET reset_token = ?, otp = NULL WHERE email = ?').run(resetToken, email);
  return resetToken;
}

function verifyResetToken(email, resetToken) {
  const stmt = db.prepare('SELECT * FROM password_resets WHERE email = ? AND reset_token = ? AND expires_at > ?');
  return !!stmt.get(email, resetToken, new Date().toISOString());
}

function updatePasswordByEmail(email, passwordHash) {
  db.prepare('UPDATE users SET password_hash = ? WHERE email = ?').run(passwordHash, email);
  db.prepare('DELETE FROM password_resets WHERE email = ?').run(email);
  
  // Clear any existing sessions for this user so they are forced to log in again
  const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (user) {
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(user.id);
  }
}

module.exports = {
  initDb,
  saveHistory,
  getHistory,
  getCollections,
  createCollection,
  updateCollection,
  getEnvironments,
  createEnvironment,
  updateEnvironment,
  deleteEnvironment,
  getMembers,
  addMember,
  updateMemberRole,
  removeMember,
  getWorkspaces,
  addWorkspace,
  updateWorkspace,
  deleteWorkspace,
  createUser,
  getUserByEmailOrUsername,
  getUserById,
  createSession,
  getUserBySession,
  deleteSession,
  saveOtp,
  verifyOtp,
  verifyResetToken,
  updatePasswordByEmail
};
