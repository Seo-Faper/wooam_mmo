// db.js
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const DB_PATH = path.join(__dirname, "data", "game.db");

// 1) DB 연결
const db = new sqlite3.Database(DB_PATH);

// 2) 초기화 함수
function init() {
  db.serialize(() => {
    // users 테이블
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id        INTEGER PRIMARY KEY AUTOINCREMENT,
        username  TEXT    UNIQUE NOT NULL,
        password  TEXT    NOT NULL,
        exp       INTEGER NOT NULL DEFAULT 0
      )
    `);

    // inventory 테이블
    db.run(`
  CREATE TABLE IF NOT EXISTS inventory_items (
    user_id     INTEGER NOT NULL,
    item_id     INTEGER NOT NULL,
    quantity    INTEGER NOT NULL DEFAULT 1,
    acquired_at TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
    PRIMARY KEY(user_id, item_id),
    FOREIGN KEY(user_id)  REFERENCES users(id)  ON DELETE CASCADE,
    FOREIGN KEY(item_id)  REFERENCES items(id)
  )
    `);

    // items 테이블
    db.run(`
      CREATE TABLE IF NOT EXISTS items (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        name        TEXT    UNIQUE NOT NULL,
        type        TEXT    NOT NULL CHECK(type IN ('consumable','equipment')),
        description TEXT
      )
    `);

    // monsters 테이블
    db.run(`
      CREATE TABLE IF NOT EXISTS monsters (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        name        TEXT    UNIQUE NOT NULL,
        hp          INTEGER NOT NULL,
        attack      INTEGER NOT NULL,
        defense     INTEGER NOT NULL,
        exp_reward  INTEGER NOT NULL DEFAULT 0
      )
    `);
  });
}

// 모듈로 내보내기
module.exports = { db, init };
