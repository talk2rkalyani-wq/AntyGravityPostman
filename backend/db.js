let currentDb = null;
const pgDb = require('./db-pg.js');
const sqliteDb = require('./db-sqlite.js');

const hasDatabaseUrl = !!process.env.DATABASE_URL;

async function initDb() {
  if (hasDatabaseUrl) {
    try {
      console.log("[Data Layer] Attempting to connect to PostgreSQL Database...");
      currentDb = pgDb;
      await currentDb.initDb();
      console.log("[Data Layer] Successfully connected to PostgreSQL Database");
      return;
    } catch (err) {
      console.error("[Data Layer] PostgreSQL connection failed! Error:", err.message);
      console.warn("[Data Layer] Falling back to local SQLite Database...");
    }
  }
  
  console.log("[Data Layer] Using local SQLite Database");
  currentDb = sqliteDb;
  await currentDb.initDb();
}

// Create a proxy/wrapper for all DB operations
const dbWrapper = {
  initDb
};

// List of all DB functions that are exported
const dbFunctions = [
  'saveHistory', 'getHistory', 'getCollections', 'getCollection', 'createCollection', 'updateCollection', 'deleteCollection',
  'getEnvironments', 'getEnvironment', 'createEnvironment', 'updateEnvironment', 'deleteEnvironment',
  'getMembers', 'addMember', 'updateMemberRole', 'removeMember', 'getWorkspaces', 'addWorkspace',
  'updateWorkspace', 'deleteWorkspace', 'createUser', 'getUserByEmailOrUsername', 'getUserById',
  'createSession', 'getUserBySession', 'deleteSession', 'updateUserProfile', 'saveOtp', 'verifyOtp', 'verifyResetToken',
  'updatePasswordByEmail', 'addWorkspaceMember', 'getWorkspaceMembers', 'updateWorkspaceMemberRole', 
  'removeWorkspaceMember', 'getWorkspaceMember'
];

dbFunctions.forEach(fn => {
  dbWrapper[fn] = async function(...args) {
    if (!currentDb) {
      // Fallback in case initDb wasn't complete
      currentDb = sqliteDb;
      await currentDb.initDb();
    }
    // Check if the current DB implements the function (handling missing updateUserProfile gracefully)
    if (typeof currentDb[fn] === 'function') {
      return currentDb[fn](...args);
    } else if (currentDb === pgDb && typeof sqliteDb[fn] === 'function') {
      // If PostgreSQL is missing this function, fallback to SQLite implementation or log warning
      console.warn(`[Data Layer] Function ${fn} not implemented in PostgreSQL, falling back to SQLite`);
      return sqliteDb[fn](...args);
    }
    throw new Error(`DB function ${fn} is not implemented`);
  };
});

module.exports = dbWrapper;
