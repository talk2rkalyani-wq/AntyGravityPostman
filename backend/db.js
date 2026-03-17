const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

let db;

function initDb() {
  const dbPath = path.resolve(__dirname, 'postman_clone.db');
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
  `);

  // Ensure 'My Workspace' exists
  const wpStmt = db.prepare('SELECT count(*) as cnt FROM workspaces');
  if (wpStmt.get().cnt === 0) {
    const insertWp = db.prepare("INSERT INTO workspaces (id, name) VALUES ('default', 'My Workspace')");
    insertWp.run();
  }
}

function saveHistory({ url, method, status, time }) {
  const stmt = db.prepare('INSERT INTO history (id, url, method, status, time) VALUES (?, ?, ?, ?, ?)');
  stmt.run(uuidv4(), url, method, status, time);
}

function getHistory() {
  const stmt = db.prepare('SELECT * FROM history ORDER BY created_at DESC LIMIT 100');
  return stmt.all();
}

function getCollections() {
  const stmt = db.prepare('SELECT * FROM collections ORDER BY created_at DESC');
  return stmt.all();
}

function createCollection(name, data) {
  const id = uuidv4();
  const stmt = db.prepare('INSERT INTO collections (id, name, data) VALUES (?, ?, ?)');
  stmt.run(id, name, JSON.stringify(data));
  return { id, name, data };
}

function updateCollection(id, data) {
  const stmt = db.prepare('UPDATE collections SET data = ? WHERE id = ?');
  stmt.run(JSON.stringify(data), id);
  return { id, data };
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
function getWorkspaces() {
  const stmt = db.prepare('SELECT * FROM workspaces ORDER BY created_at ASC');
  return stmt.all();
}

function addWorkspace(name) {
  const id = uuidv4();
  const stmt = db.prepare('INSERT INTO workspaces (id, name) VALUES (?, ?)');
  stmt.run(id, name);
  return { id, name };
}

function updateWorkspace(id, name) {
  const stmt = db.prepare('UPDATE workspaces SET name = ? WHERE id = ?');
  stmt.run(name, id);
  return { id, name };
}

function deleteWorkspace(id) {
  if (id === 'default') return false; // Prevent deleting default
  const stmt = db.prepare('DELETE FROM workspaces WHERE id = ?');
  stmt.run(id);
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


module.exports = {
  initDb,
  saveHistory,
  getHistory,
  getCollections,
  createCollection,
  updateCollection,
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
  deleteSession
};
