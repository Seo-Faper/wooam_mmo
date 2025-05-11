// server.js
const express = require('express');
const path    = require('path');
const crypto  = require('crypto');

const { db, init } = require('./db');
const authRouter   = require('./auth');

const app = express();

// DB 스키마 초기화
init();

// JSON 바디 파싱
app.use(express.json());

// 인증·회원가입·로그인 라우터
app.use('/api', authRouter);

// 정적 파일 서빙
app.use(express.static(path.join(__dirname, 'public')));

// 기타 API 라우터가 있다면 여기에 추가…

// 서버 실행
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
