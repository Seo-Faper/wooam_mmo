// src/scenes/LoginScene.js
import Phaser from "phaser";
import MainScene from "./MainScene.js";

export default class LoginScene extends Phaser.Scene {
  constructor() {
    super("LoginScene");
    this.username = "";
    this.password = "";
    this.activeField = "username"; // 'username' or 'password'
    this.mode = "login"; // 'login' or 'register'
  }

  create() {
    // 캔버스 포커스 설정 (키 입력 받기 위해)
    const canvas = this.sys.game.canvas;
    canvas.setAttribute("tabindex", "0");
    canvas.focus();
    this.input.on("pointerdown", () => canvas.focus());

    // 배경 검정
    this.cameras.main.setBackgroundColor("#000000");

    // 텍스트 스타일
    this.style = {
      fontFamily: "Galmuri11, monospace", // Galmuri11 / Galmuri14 중 골라 쓰세요
      fontSize: "16px", // CSS 단위(px)로 지정
      color: "#00ff00",
      padding: { x: 0, y: 6 }, // underscore 잘리면 패딩 조절
    };
    // 제목 및 모드 표시
    this.add.text(100, 50, "우암 던전", {
      fontFamily: "Galmuri11, sans-serif",
      fontSize: "32px",
      color: "#00ff00",
    });
    this.modeText = this.add.text(150, 140, "Mode: LOGIN", {
      font: "18px Galmuri11",
      color: "#00ff00",
    });

    // 레이블
    this.add.text(150, 180, "Username:", this.style);
    this.add.text(150, 240, "Password:", this.style);
    this.add.text(150, 300, "Tab: 다음, Enter: 접속", this.style);

    // 입력 텍스트 객체
    this.userText = this.add.text(250, 180, "", this.style);
    this.pwText = this.add.text(250, 240, "", this.style);

    // 입력 필드 박스
    this.fieldBox = this.add.graphics();
    this.drawFieldBox();

    // 모드 전환 버튼
    this.toggleBtn = this.add
      .text(150, 340, "Switch to REGISTER", {
        font: "18px Courier",
        color: "#00ff00",
        backgroundColor: "#005500",
      })
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.toggleMode());

    // 에러 메시지
    
    this.msgText = this.add.text(150, 380, "", this.style);

    // 키보드 입력 핸들러
    this.input.keyboard.on("keydown", this.handleKey, this);
  }

  async handleKey(event) {
    const key = event.key;

    // Tab: 입력 필드 전환
    if (key === "Tab") {
      this.activeField =
        this.activeField === "username" ? "password" : "username";
      this.drawFieldBox();
      event.preventDefault();
      return;
    }

    // Backspace: 마지막 글자 삭제
    if (key === "Backspace") {
      if (this.activeField === "username") {
        this.username = this.username.slice(0, -1);
        this.userText.setText(this.username);
      } else {
        this.password = this.password.slice(0, -1);
        this.pwText.setText("*".repeat(this.password.length));
      }
      this.drawFieldBox();
      return;
    }

    // Enter: 로그인 or 회원가입
    if (key === "Enter") {
      const path = this.mode === "login" ? "login" : "register";
      try {
        if (path === "register") {
          const resReg = await fetch("/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: this.username,
              password: this.password,
            }),
          });
          const dataReg = await resReg.json();
          if (!resReg.ok) throw new Error(dataReg.error || resReg.statusText);
        }
        const res = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: this.username,
            password: this.password,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || res.statusText);

        localStorage.setItem("token", data.token);
        this.scene.add("MainScene", MainScene, false);
        this.scene.stop("LoginScene");
        this.scene.start("MainScene");
      } catch (err) {
        this.msgText.setText(err.message);
      }
      return;
    }

    // 문자 입력
    if (key.length === 1) {
      if (this.activeField === "username") {
        this.username += key;
        this.userText.setText(this.username);
      } else {
        this.password += key;
        this.pwText.setText("*".repeat(this.password.length));
      }
      this.drawFieldBox();
    }
  }

  drawFieldBox() {
    this.fieldBox.clear();
    this.fieldBox.lineStyle(2, 0x00ff00);
    if (this.activeField === "username") {
      this.fieldBox.strokeRect(
        245,
        186,
        Math.max(200, this.userText.width + 10),
        28
      );
    } else {
      this.fieldBox.strokeRect(
        245,
        246,
        Math.max(200, this.pwText.width + 10),
        28
      );
    }
  }

  toggleMode() {
    this.mode = this.mode === "login" ? "register" : "login";
    const label = this.mode === "login" ? "LOGIN" : "REGISTER";
    this.modeText.setText("Mode: " + label);
    this.toggleBtn.setText(
      "Switch to " + (this.mode === "login" ? "REGISTER" : "LOGIN")
    );
    this.username = "";
    this.password = "";
    this.userText.setText("");
    this.pwText.setText("");
    this.activeField = "username";
    this.drawFieldBox();
  }
}
