// src/scenes/MainScene.js
import Phaser from 'phaser';

// 클래스 및 서비스 임포트
import Player from '../game/Player.js';
import Monster from '../game/Monster.js';
import Turret from '../game/Turret.js';
import UIManager from '../ui/UIManager.js';
import * as api from '../services/api.js';

export default class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
    this.player = null;
    this.monster = null;
    this.monsterSprite = null;
    this.ui = null;
    this.turret = null;
  }

  preload() {
    this.load.image('bronze',   'assets/entity/mobs/bronze_scarecrow.png');
    this.load.image('silver',   'assets/entity/mobs/silver_scarecrow.png');
    this.load.image('golden',   'assets/entity/mobs/golden_scarecrow.png');
    this.load.image('platinum', 'assets/entity/mobs/platinum_scarecrow.png');
    this.load.image('diamond',  'assets/entity/mobs/diamond_scarecrow.png');
    this.load.image('master',   'assets/entity/mobs/master_scarecrow.png');
    this.load.image('projectile', 'assets/projectile.png');
  }

  create() {
    // UI 매니저 생성
    this.ui = new UIManager(this);
    
    // 몬스터 레벨 설정
    const savedLevel = localStorage.getItem('monsterLevel');
    this.userMonsterLevel = savedLevel ? parseInt(savedLevel) : 1;

    // 인터랙티브 요소 생성
    this.createInteractiveElements();
    
    // 터렛 생성
    this.turret = new Turret(this, 400, 500);

    // 게임 데이터 로드 및 시작
    this.loadGameData();
  }
  
  async loadGameData() {
    try {
      const { username, exp } = await api.loadProfile();
      this.player = new Player(username, exp);
      this.ui.updatePlayerInfo(this.player);
      this.spawnMonster();
    } catch (error) {
      console.error("Failed to load profile:", error);
      // 로그인 화면으로 보내거나 에러 메시지 표시
    }
  }

  spawnMonster() {
    if (this.monsterSprite) this.monsterSprite.destroy();

    this.monster = new Monster(this.userMonsterLevel);
    this.monsterSprite = this.add.sprite(400, 300, this.monster.spriteKey)
      .setInteractive()
      .on('pointerdown', (pointer) => this.handleDamage(this.player.damage, pointer.x, pointer.y - 10));
      
    this.ui.updateMonsterInfo(this.monster);
  }

  handleDamage(amount, x, y) {
    if (!this.monster || this.monster.isDead()) return;

    this.ui.showDamage(x, y, amount);
    const isDefeated = this.monster.takeDamage(amount);
    this.ui.updateMonsterInfo(this.monster);

    if (isDefeated) {
      this.ui.addLog(`몬스터 처치! (+${this.monster.expReward} EXP)`);
      const levelUpInfo = this.player.addExp(this.monster.expReward);

      if (levelUpInfo.leveledUp) {
        this.ui.addLog(`레벨 업! ${levelUpInfo.old} -> ${levelUpInfo.new}`);
      }
      
      this.ui.updatePlayerInfo(this.player);
      this.saveGameData();
      this.spawnMonster();
    }
  }

  async saveGameData() {
    try {
        await api.saveProfile(this.player.exp);
        this.tweens.add({ targets: this.saveText, alpha: 0.3, yoyo: true, duration: 200 });
    } catch (error) {
        console.error("Failed to save profile:", error);
        this.ui.addLog("저장 실패!");
    }
  }

  createInteractiveElements() {
    const arrowStyle = { fontFamily: 'Galmuri11', fontSize: '24px', color: '#00ff00' };
    this.add.text(this.scale.width-30, 10, '▲', arrowStyle)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.changeMonsterLevel(1));
    this.add.text(this.scale.width-30, 40, '▼', arrowStyle)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.changeMonsterLevel(-1));

    this.saveText = this.add.text(
      this.scale.width - 10, this.scale.height - 10, '저장', 
      { fontFamily: 'Galmuri11', fontSize: '16px', color: '#fff', backgroundColor: '#00f' }
    ).setOrigin(1,1).setInteractive({ useHandCursor: true })
     .on('pointerdown', () => this.saveGameData());
  }

  changeMonsterLevel(delta) {
    this.userMonsterLevel = Math.max(1, this.userMonsterLevel + delta);
    localStorage.setItem('monsterLevel', this.userMonsterLevel);
    this.spawnMonster();
  }
}


