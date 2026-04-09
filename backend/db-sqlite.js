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
      first_name TEXT,
      last_name TEXT,
      contact_number TEXT,
      role TEXT DEFAULT 'Organization Admin',
      timezone TEXT DEFAULT 'UTC',
      profile_photo TEXT,
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

  try {
    db.exec('ALTER TABLE users ADD COLUMN first_name TEXT');
    db.exec('ALTER TABLE users ADD COLUMN last_name TEXT');
    db.exec('ALTER TABLE users ADD COLUMN contact_number TEXT');
    db.exec("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'Organization Admin'");
    db.exec("ALTER TABLE users ADD COLUMN timezone TEXT DEFAULT 'UTC'");
    db.exec('ALTER TABLE users ADD COLUMN profile_photo TEXT');
  } catch(e) {}

  try {
    db.exec("ALTER TABLE collections ADD COLUMN workspace_id TEXT DEFAULT 'default'");
    db.exec("ALTER TABLE environments ADD COLUMN workspace_id TEXT DEFAULT 'default'");
  } catch(e) {}

  try {
    db.exec("ALTER TABLE workspaces ADD COLUMN type TEXT DEFAULT 'personal'");
    db.exec("ALTER TABLE workspaces ADD COLUMN owner_id TEXT REFERENCES users(id)");
  } catch(e) {}

  db.exec(`
    CREATE TABLE IF NOT EXISTS workspace_members (
      id TEXT PRIMARY KEY,
      workspace_id TEXT,
      user_id TEXT,
      role TEXT,
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(workspace_id, user_id)
    );
  `);


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

function getCollections(userId, workspaceId = 'default') {
  if (!db || !userId) return [];
  const stmt = db.prepare('SELECT * FROM collections WHERE user_id = ? AND workspace_id = ? ORDER BY created_at DESC');
  const rows = stmt.all(userId, workspaceId);
  return rows.map(r => ({ ...r, data: r.data ? JSON.parse(r.data) : null }));
}

function createCollection(name, data, userId, workspaceId = 'default') {
  const id = uuidv4();
  const stmt = db.prepare('INSERT INTO collections (id, name, data, user_id, workspace_id) VALUES (?, ?, ?, ?, ?)');
  stmt.run(id, name, JSON.stringify(data), userId, workspaceId);
  return { id, name, data };
}

function getCollection(id) {
  return db.prepare('SELECT * FROM collections WHERE id = ?').get(id);
}

function updateCollection(id, data) {
  const stmt = db.prepare('UPDATE collections SET data = ? WHERE id = ?');
  stmt.run(JSON.stringify(data), id);
  return { id, data };
}

function deleteCollection(id) {
  const stmt = db.prepare('DELETE FROM collections WHERE id = ?');
  stmt.run(id);
  return true;
}

// --- Environments ---
function getEnvironments(userId, workspaceId = 'default') {
  if (!db || !userId) return [];
  const stmt = db.prepare('SELECT * FROM environments WHERE user_id = ? AND workspace_id = ? ORDER BY created_at DESC');
  const rows = stmt.all(userId, workspaceId);
  return rows.map(r => ({ ...r, data: r.data ? JSON.parse(r.data) : null }));
}

function getEnvironment(id) {
  const stmt = db.prepare('SELECT * FROM environments WHERE id = ?');
  const r = stmt.get(id);
  if (r) r.data = r.data ? JSON.parse(r.data) : null;
  return r;
}

function createEnvironment(name, data, userId, workspaceId = 'default') {
  const id = uuidv4();
  const stmt = db.prepare('INSERT INTO environments (id, name, data, user_id, workspace_id) VALUES (?, ?, ?, ?, ?)');
  stmt.run(id, name, JSON.stringify(data), userId, workspaceId);
  return { id, name, data };
}

function updateEnvironment(id, name, data) {
  const stmt = db.prepare('UPDATE environments SET name = ?, data = ? WHERE id = ?');
  stmt.run(name, JSON.stringify(data), id);
  return { id, name, data };
}

function deleteEnvironment(id) {
  const stmt = db.prepare('DELETE FROM environments WHERE id = ?');
  stmt.run(id);
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
  const stmt = db.prepare(`
    SELECT w.* FROM workspaces w
    LEFT JOIN workspace_members wm ON w.id = wm.workspace_id
    WHERE w.user_id = ? OR w.id = ? OR wm.user_id = ?
    GROUP BY w.id
    ORDER BY w.created_at ASC
  `);
  return stmt.all(userId, 'default', userId);
}

function addWorkspace(name, userId, type = 'personal') {
  const id = uuidv4();
  const stmt = db.prepare('INSERT INTO workspaces (id, name, user_id, type, owner_id) VALUES (?, ?, ?, ?, ?)');
  stmt.run(id, name, userId, type, userId);
  if (type === 'team') {
     addWorkspaceMember(id, userId, 'admin');
  }
  return { id, name, type, owner_id: userId };
}

function addWorkspaceMember(workspaceId, userId, role) {
  const id = uuidv4();
  const stmt = db.prepare('INSERT INTO workspace_members (id, workspace_id, user_id, role) VALUES (?, ?, ?, ?) ON CONFLICT(workspace_id, user_id) DO UPDATE SET role=excluded.role');
  stmt.run(id, workspaceId, userId, role);
  return { id, workspaceId, userId, role };
}

function getWorkspaceMembers(workspaceId) {
  const stmt = db.prepare(`
    SELECT wm.*, u.email, u.username as name
    FROM workspace_members wm
    JOIN users u ON wm.user_id = u.id
    WHERE wm.workspace_id = ?
  `);
  return stmt.all(workspaceId);
}

function updateWorkspaceMemberRole(workspaceId, userId, role) {
  db.prepare('UPDATE workspace_members SET role = ? WHERE workspace_id = ? AND user_id = ?').run(role, workspaceId, userId);
}

function removeWorkspaceMember(workspaceId, userId) {
  db.prepare('DELETE FROM workspace_members WHERE workspace_id = ? AND user_id = ?').run(workspaceId, userId);
}

function getWorkspaceMember(workspaceId, userId) {
  return db.prepare('SELECT * FROM workspace_members WHERE workspace_id = ? AND user_id = ?').get(workspaceId, userId);
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
  const stmt = db.prepare('SELECT id, username, email, password_hash, first_name, last_name, contact_number, role, timezone, profile_photo FROM users WHERE email = ? OR username = ?');
  return stmt.get(identifier, identifier);
}

function getUserById(id) {
  const stmt = db.prepare('SELECT id, username, email, first_name, last_name, contact_number, role, timezone, profile_photo, created_at FROM users WHERE id = ?');
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
    SELECT users.id, users.username, users.email, users.first_name, users.last_name, users.contact_number, users.role, users.timezone, users.profile_photo 
    FROM users 
    JOIN sessions ON users.id = sessions.user_id 
    WHERE sessions.token = ?
  `);
  return stmt.get(token);
}

function updateUserProfile(id, profileData) {
  const { first_name, last_name, contact_number, timezone, profile_photo } = profileData;
  const updates = [];
  const params = [];

  if (first_name !== undefined) { updates.push('first_name = ?'); params.push(first_name); }
  if (last_name !== undefined) { updates.push('last_name = ?'); params.push(last_name); }
  if (contact_number !== undefined) { updates.push('contact_number = ?'); params.push(contact_number); }
  if (timezone !== undefined) { updates.push('timezone = ?'); params.push(timezone); }
  if (profile_photo !== undefined) { updates.push('profile_photo = ?'); params.push(profile_photo); }

  if (updates.length > 0) {
    params.push(id);
    const stmt = db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`);
    stmt.run(...params);
  }

  return getUserById(id);
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
  getCollection,
  createCollection,
  updateCollection,
  deleteCollection,
  getEnvironments,
  getEnvironment,
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
  updateUserProfile,
  saveOtp,
  verifyOtp,
  verifyResetToken,
  updatePasswordByEmail,
  addWorkspaceMember,
  getWorkspaceMembers,
  updateWorkspaceMemberRole,
  removeWorkspaceMember,
  getWorkspaceMember
};
