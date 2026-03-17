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
  deleteWorkspace
};
