if (process.env.DATABASE_URL) {
  console.log("[Data Layer] Using PostgreSQL Database (DATABASE_URL provided)");
  module.exports = require('./db-pg.js');
} else {
  console.log("[Data Layer] Using local SQLite Database (No DATABASE_URL provided)");
  module.exports = require('./db-sqlite.js');
}
