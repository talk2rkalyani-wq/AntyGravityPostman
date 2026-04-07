const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

let pool;

async function initDb() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.warn("DATABASE_URL is not set. Database will not connect.");
    // We exit. If they don't set this on Render, it will crash nicely or error on queries.
    return;
  }
  
  pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  await pool.query(`
    CREATE TABLE IF NOT EXISTS history (
      id TEXT PRIMARY KEY,
      url TEXT,
      method TEXT,
      status INTEGER,
      time INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS collections (
      id TEXT PRIMARY KEY,
      name TEXT,
      data JSONB,
      workspace_id TEXT DEFAULT 'default',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS environments (
      id TEXT PRIMARY KEY,
      name TEXT,
      data JSONB,
      workspace_id TEXT DEFAULT 'default',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS members (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT,
      role TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS workspaces (
      id TEXT PRIMARY KEY,
      name TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE,
      email TEXT UNIQUE,
      password_hash TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS password_resets (
      email TEXT PRIMARY KEY,
      otp TEXT,
      reset_token TEXT,
      expires_at TIMESTAMP
    );
  `);

  try {
    await pool.query('ALTER TABLE history ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id) ON DELETE CASCADE;');
    await pool.query('ALTER TABLE collections ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id) ON DELETE CASCADE;');
    await pool.query('ALTER TABLE environments ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id) ON DELETE CASCADE;');
    await pool.query('ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id) ON DELETE CASCADE;');
  } catch(e) { /* ignore pg versions that lack IF NOT EXISTS or other conflicts */ }

  try {
    await pool.query("ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'personal';");
    await pool.query("ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS owner_id TEXT REFERENCES users(id);");
  } catch(e) {}

  await pool.query(`
    CREATE TABLE IF NOT EXISTS workspace_members (
      id TEXT PRIMARY KEY,
      workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      role TEXT,
      joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(workspace_id, user_id)
    );
  `);

  const wpRes = await pool.query('SELECT count(*) as cnt FROM workspaces');
  if (parseInt(wpRes.rows[0].cnt) === 0) {
    await pool.query("INSERT INTO workspaces (id, name) VALUES ('default', 'My Workspace') ON CONFLICT DO NOTHING");
  }
}

async function saveHistory({ url, method, status, time, userId }) {
  if (!pool || !userId) return;
  await pool.query('INSERT INTO history (id, url, method, status, time, user_id) VALUES ($1, $2, $3, $4, $5, $6)', [uuidv4(), url, method, status, time, userId]);
}

async function getHistory(userId) {
  if (!pool || !userId) return [];
  const res = await pool.query('SELECT * FROM history WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100', [userId]);
  return res.rows;
}

async function getCollections(userId, workspaceId = 'default') {
  if (!pool || !userId) return [];
  const res = await pool.query('SELECT * FROM collections WHERE user_id = $1 AND workspace_id = $2 ORDER BY created_at DESC', [userId, workspaceId]);
  return res.rows;
}

async function createCollection(name, data, userId, workspaceId = 'default') {
  const id = uuidv4();
  await pool.query('INSERT INTO collections (id, name, data, user_id, workspace_id) VALUES ($1, $2, $3, $4, $5)', [id, name, JSON.stringify(data), userId, workspaceId]);
  return { id, name, data };
}

async function getCollection(id) {
  const res = await pool.query('SELECT * FROM collections WHERE id = $1', [id]);
  return res.rows[0];
}

async function updateCollection(id, data) {
  await pool.query('UPDATE collections SET data = $1 WHERE id = $2', [JSON.stringify(data), id]);
  return { id, data };
}

async function getEnvironments(userId, workspaceId = 'default') {
  if (!pool || !userId) return [];
  const res = await pool.query('SELECT * FROM environments WHERE user_id = $1 AND workspace_id = $2 ORDER BY created_at DESC', [userId, workspaceId]);
  return res.rows;
}

async function getEnvironment(id) {
  const res = await pool.query('SELECT * FROM environments WHERE id = $1', [id]);
  return res.rows[0];
}

async function createEnvironment(name, data, userId, workspaceId = 'default') {
  const id = uuidv4();
  await pool.query('INSERT INTO environments (id, name, data, user_id, workspace_id) VALUES ($1, $2, $3, $4, $5)', [id, name, JSON.stringify(data), userId, workspaceId]);
  return { id, name, data };
}

async function updateEnvironment(id, name, data) {
  await pool.query('UPDATE environments SET name = $1, data = $2 WHERE id = $3', [name, JSON.stringify(data), id]);
  return { id, name, data };
}

async function deleteEnvironment(id) {
  await pool.query('DELETE FROM environments WHERE id = $1', [id]);
  return true;
}

async function getMembers() {
  if (!pool) return [];
  const res = await pool.query('SELECT * FROM members ORDER BY created_at ASC');
  return res.rows;
}

async function addMember({ name, email, role }) {
  const id = uuidv4();
  await pool.query('INSERT INTO members (id, name, email, role) VALUES ($1, $2, $3, $4)', [id, name, email, role]);
  return { id, name, email, role };
}

async function updateMemberRole(id, role) {
  await pool.query('UPDATE members SET role = $1 WHERE id = $2', [role, id]);
  return { id, role };
}

async function removeMember(id) {
  await pool.query('DELETE FROM members WHERE id = $1', [id]);
  return { id };
}

async function getWorkspaces(userId) {
  if (!pool || !userId) return [];
  const res = await pool.query(`
    SELECT w.* FROM workspaces w
    LEFT JOIN workspace_members wm ON w.id = wm.workspace_id
    WHERE w.user_id = $1 OR w.id = $2 OR wm.user_id = $3
    GROUP BY w.id
    ORDER BY w.created_at ASC
  `, [userId, 'default', userId]);
  return res.rows;
}

async function addWorkspace(name, userId, type = 'personal') {
  const id = uuidv4();
  await pool.query('INSERT INTO workspaces (id, name, user_id, type, owner_id) VALUES ($1, $2, $3, $4, $5)', [id, name, userId, type, userId]);
  if (type === 'team') {
     await addWorkspaceMember(id, userId, 'admin');
  }
  return { id, name, type, owner_id: userId };
}

async function addWorkspaceMember(workspaceId, userId, role) {
  const id = uuidv4();
  await pool.query(`
    INSERT INTO workspace_members (id, workspace_id, user_id, role) 
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (workspace_id, user_id) DO UPDATE SET role = EXCLUDED.role
  `, [id, workspaceId, userId, role]);
  return { id, workspaceId, userId, role };
}

async function getWorkspaceMembers(workspaceId) {
  const res = await pool.query(`
    SELECT wm.*, u.email, u.username as name
    FROM workspace_members wm
    JOIN users u ON wm.user_id = u.id
    WHERE wm.workspace_id = $1
  `, [workspaceId]);
  return res.rows;
}

async function updateWorkspaceMemberRole(workspaceId, userId, role) {
  await pool.query('UPDATE workspace_members SET role = $1 WHERE workspace_id = $2 AND user_id = $3', [role, workspaceId, userId]);
}

async function removeWorkspaceMember(workspaceId, userId) {
  await pool.query('DELETE FROM workspace_members WHERE workspace_id = $1 AND user_id = $2', [workspaceId, userId]);
}

async function getWorkspaceMember(workspaceId, userId) {
  const res = await pool.query('SELECT * FROM workspace_members WHERE workspace_id = $1 AND user_id = $2', [workspaceId, userId]);
  return res.rows[0];
}

async function updateWorkspace(id, name, userId) {
  await pool.query('UPDATE workspaces SET name = $1 WHERE id = $2 AND user_id = $3', [name, id, userId]);
  return { id, name };
}

async function deleteWorkspace(id, userId) {
  if (id === 'default') return false;
  await pool.query('DELETE FROM workspaces WHERE id = $1 AND user_id = $2', [id, userId]);
  return true;
}

async function createUser(username, email, passwordHash) {
  try {
    const id = uuidv4();
    await pool.query('INSERT INTO users (id, username, email, password_hash) VALUES ($1, $2, $3, $4)', [id, username, email, passwordHash]);
    return { id, username, email };
  } catch (err) {
    if (err.code === '23505') { // Unique violation in Postgres
      throw new Error('Username or Email already exists');
    }
    throw err;
  }
}

async function getUserByEmailOrUsername(identifier) {
  if (!pool) return null;
  const res = await pool.query('SELECT * FROM users WHERE email = $1 OR username = $2', [identifier, identifier]);
  return res.rows[0];
}

async function getUserById(id) {
  const res = await pool.query('SELECT id, username, email, created_at FROM users WHERE id = $1', [id]);
  return res.rows[0];
}

async function createSession(userId) {
  const token = uuidv4();
  await pool.query('INSERT INTO sessions (token, user_id) VALUES ($1, $2)', [token, userId]);
  return token;
}

async function getUserBySession(token) {
  if (!pool) return null;
  const res = await pool.query(`
    SELECT users.id, users.username, users.email 
    FROM users 
    JOIN sessions ON users.id = sessions.user_id 
    WHERE sessions.token = $1
  `, [token]);
  return res.rows[0];
}

async function deleteSession(token) {
  if (!pool) return;
  await pool.query('DELETE FROM sessions WHERE token = $1', [token]);
}

async function saveOtp(email, otp) {
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  await pool.query(`
    INSERT INTO password_resets (email, otp, expires_at) 
    VALUES ($1, $2, $3) 
    ON CONFLICT (email) DO UPDATE SET otp = EXCLUDED.otp, expires_at = EXCLUDED.expires_at, reset_token = NULL
  `, [email, otp, expiresAt]);
}

async function verifyOtp(email, otp) {
  const now = new Date().toISOString();
  const res = await pool.query('SELECT * FROM password_resets WHERE email = $1 AND otp = $2 AND expires_at > $3', [email, otp, now]);
  if (res.rows.length === 0) return null;
  
  const resetToken = uuidv4();
  await pool.query('UPDATE password_resets SET reset_token = $1, otp = NULL WHERE email = $2', [resetToken, email]);
  return resetToken;
}

async function verifyResetToken(email, resetToken) {
  const now = new Date().toISOString();
  const res = await pool.query('SELECT * FROM password_resets WHERE email = $1 AND reset_token = $2 AND expires_at > $3', [email, resetToken, now]);
  return res.rows.length > 0;
}

async function updatePasswordByEmail(email, passwordHash) {
  await pool.query('UPDATE users SET password_hash = $1 WHERE email = $2', [passwordHash, email]);
  await pool.query('DELETE FROM password_resets WHERE email = $1', [email]);
  const userRes = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (userRes.rows.length > 0) {
    await pool.query('DELETE FROM sessions WHERE user_id = $1', [userRes.rows[0].id]);
  }
}

async function deleteCollection(id) {
  await pool.query(`
    DELETE FROM collections
    WHERE id = $1
  `, [id]);
}

module.exports = {
  initDb, saveHistory, getHistory, getCollections, getCollection, createCollection, updateCollection, deleteCollection,
  getEnvironments, getEnvironment, createEnvironment, updateEnvironment, deleteEnvironment,
  getMembers, addMember, updateMemberRole, removeMember, getWorkspaces, addWorkspace,
  updateWorkspace, deleteWorkspace, createUser, getUserByEmailOrUsername, getUserById,
  createSession, getUserBySession, deleteSession, saveOtp, verifyOtp, verifyResetToken,
  updatePasswordByEmail, addWorkspaceMember, getWorkspaceMembers, updateWorkspaceMemberRole, 
  removeWorkspaceMember, getWorkspaceMember
};
