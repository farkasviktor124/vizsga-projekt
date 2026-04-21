const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'webshopretrog.db');

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error('DB hiba:', err.message);
  } else {
    console.log('SQLite csatlakoztatva');
  }
});

module.exports = db;