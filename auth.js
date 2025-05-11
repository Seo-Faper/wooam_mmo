// auth.js
const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const crypto  = require('crypto');
const { db }  = require('./db');

const router = express.Router();

// 안전한 시크릿 생성 (환경변수 우선)
const JWT_SECRET = process.env.JWT_SECRET
  || crypto.randomBytes(32).toString('hex');

// 토큰 생성 헬퍼
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

// JWT 검증 미들웨어
function authenticateToken(req, res, next) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: '인증 토큰 필요' });
  }
  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;    // 이후 핸들러에서 req.user.userId, req.user.username 사용 가능
    next();
  } catch (err) {
    return res.status(401).json({ error: '유효하지 않은 토큰' });
  }
}

// ─── 회원가입 ───────────────────────────────────
router.post('/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: '아이디/비번 필요' });
  }

  const hash = bcrypt.hashSync(password, 8);
  db.run(
    `INSERT INTO users (username, password) VALUES (?, ?)`,
    [username, hash],
    function(err) {
      if (err) {
        if (err.code === 'SQLITE_CONSTRAINT') {
          return res.status(409).json({ error: '이미 존재하는 아이디' });
        }
        return res.status(500).json({ error: 'DB 오류' });
      }
      res.json({ success: true, userId: this.lastID });
    }
  );
});

// ─── 로그인 ───────────────────────────────────
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: '아이디/비번 필요' });
  }

  db.get(
    `SELECT * FROM users WHERE username = ?`,
    [username],
    (err, row) => {
      if (err) return res.status(500).json({ error: 'DB 오류' });
      if (!row || !bcrypt.compareSync(password, row.password)) {
        return res.status(401).json({ error: '인증 실패' });
      }
      const token = generateToken({ userId: row.id, username });
      res.json({ token });
    }
  );
});

// ─── 프로필 조회 (인증 필요) ───────────────────
// auth.js

// ─── 프로필 조회 (인증 필요) ───────────────────
router.get('/profile', authenticateToken, (req, res) => {
  const userId = req.user.userId;

  // DB에서 username, exp 가져오기
  db.get(
    `SELECT username, exp FROM users WHERE id = ?`,
    [userId],
    (err, row) => {
      if (err) return res.status(500).json({ error: 'DB 오류' });
      if (!row) return res.status(404).json({ error: '사용자 없음' });
      res.json({
        username: row.username,
        exp:      row.exp
      });
    }
  );
});
router.put('/profile', authenticateToken, (req, res) => {
  const { exp } = req.body;
  if (typeof exp !== 'number') {
    return res.status(400).json({ error: 'exp는 숫자여야 합니다' });
  }
  const userId = req.user.userId;
  db.run(
    `UPDATE users SET exp = ? WHERE id = ?`,
    [exp, userId],
    function(err) {
      if (err) return res.status(500).json({ error: 'DB 오류' });
      res.json({ success: true, exp });
    }
  );
});



module.exports = router;
