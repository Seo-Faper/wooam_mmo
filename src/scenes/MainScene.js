// src/scenes/MainScene.js
import Phaser from 'phaser';

const BASE_EXP   = 100;   // 1→2레벨 필요 기본 EXP
const EXP_GROWTH = 1.2;   // 레벨업마다 20%씩 증가
// 턴마다 체력 감소 등 피해량

function requiredExp(level) {
  return Math.floor(BASE_EXP * Math.pow(EXP_GROWTH, level - 1));
}

function getLevel(exp) {
  let lvl = 1;
  while (exp >= requiredExp(lvl + 1)) lvl++;
  return lvl;
}

// 몬스터 등급별 스프라이트 매핑
const MONSTER_TIERS = [
  { max: 10,    key: 'bronze'   },
  { max: 50,    key: 'silver'   },
  { max: 100,   key: 'golden'   },
  { max: 200,   key: 'platinum' },
  { max: 500,   key: 'diamond'  },
  { max: Infinity, key: 'master' }
];

function getMonsterSpriteKey(level) {
  for (const tier of MONSTER_TIERS) {
    if (level <= tier.max) return tier.key;
  }
  return 'bronze';
}

// 터렛 로직 분리
class Turret {
  constructor(scene, x, y, fireRate = 1000) {
    this.scene = scene;
    this.x = x; this.y = y;
    this.fireRate = fireRate;
    this.sprite = scene.add.rectangle(x, y, 40, 40, 0x888888);
    this.timer = scene.time.addEvent({
      delay: fireRate,
      loop: true,
      callback: () => this.fire()
    });
  }

  fire() {
    const sc = this.scene; const m = sc.monster;
    if (!m) return;
    const tx = this.x, ty = this.y;
    const mx = sc.monsterSprite.x, my = sc.monsterSprite.y;
    const proj = sc.add.image(tx, ty, 'projectile').setScale(0.5);
    sc.tweens.add({
      targets: proj,
      x: mx, y: my,
      duration: this.fireRate * 0.3,
      ease: 'Linear',
      onUpdate: () => {
        proj.x += Phaser.Math.Between(-2, 2);
        proj.y += Phaser.Math.Between(-2, 2);
      },
      onComplete: () => {
        proj.destroy();
        // 터렛 데미지
        sc.applyDamage(sc.damageAmount, mx, my - 10);
      }
    });
  }

  destroy() {
    this.timer.remove(false);
    this.sprite.destroy();
  }
}

export default class MainScene extends Phaser.Scene {
  constructor() { super('MainScene'); }

  preload() {
    // 몬스터 스프라이트
    this.load.image('bronze',   'assets/entity/mobs/bronze_scarecrow.png');
    this.load.image('silver',   'assets/entity/mobs/silver_scarecrow.png');
    this.load.image('golden',   'assets/entity/mobs/golden_scarecrow.png');
    this.load.image('platinum', 'assets/entity/mobs/platinum_scarecrow.png');
    this.load.image('diamond',  'assets/entity/mobs/diamond_scarecrow.png');
    this.load.image('master',   'assets/entity/mobs/master_scarecrow.png');
    // 투사체
    this.load.image('projectile', 'assets/projectile.png');
  }

  create() {
    // 플레이어 데미지
    this.damageAmount = 1;

    // UI 스타일
    const uiStyle = { fontFamily: 'Galmuri11', fontSize: '18px', color: '#00ff00' };
    this.nameText  = this.add.text(10, 10, '로딩 중...', uiStyle);
    this.expText   = this.add.text(10, 30, '', uiStyle);
    this.levelText = this.add.text(10, 50, '', uiStyle);

    this.monsterLevelText = this.add.text(10, 80, '', uiStyle);
    this.monsterHPText    = this.add.text(10, 100, '', uiStyle);

    // 로그 UI
    this.logs = []; this.logTexts = []; this.maxLogs = 5; this.logStyle = uiStyle;

    // 저장 버튼
    this.saveText = this.add.text(
      this.scale.width - 10, this.scale.height - 10,
      '저장', { fontFamily: 'Galmuri11', fontSize: '16px', color: '#fff', backgroundColor: '#00f' }
    ).setOrigin(1,1).setInteractive({ useHandCursor: true })
     .on('pointerdown', () => this.saveToServer());

    // HP바 베이스
    const barW = 300, barH = 20;
    this.barX = this.scale.width/2 - barW/2;
    this.barY = 80;
    this.barWidth = barW; this.barHeight = barH;
    this.hpBarBg = this.add.graphics().fillStyle(0x444444).fillRect(this.barX, this.barY, barW, barH);
    this.hpBarFg = this.add.graphics();

    // 몬스터 레벨 조정 (persist)
    const saved = localStorage.getItem('monsterLevel');
    this.userMonsterLevel = saved ? parseInt(saved) : 1;
    const arrowStyle = { fontFamily: 'Galmuri11', fontSize: '24px', color: '#00ff00' };
    this.upArrow = this.add.text(this.scale.width-30, 10, '▲', arrowStyle)
      .setInteractive({ useHandCursor: true }).on('pointerdown', () => this.changeMonsterLevel(1));
    this.downArrow = this.add.text(this.scale.width-30, 40, '▼', arrowStyle)
      .setInteractive({ useHandCursor: true }).on('pointerdown', () => this.changeMonsterLevel(-1));

    // 터렛 (always)
    this.turret = new Turret(this, 400, 500);

    // 프로필 로드 & 몬스터
    this.loadProfile();
  }

  async loadProfile() {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/profile', { headers: { 'Authorization': `Bearer ${token}` }});
      if (!res.ok) throw new Error();
      const { username, exp } = await res.json();
      this.user = { username, exp, level: getLevel(exp) };
      this.updateUI();
      this.spawnMonster();
    } catch {
      localStorage.removeItem('token'); window.location.reload();
    }
  }

  updateUI() {
    const nextExp = requiredExp(this.user.level + 1);
    this.nameText.setText(`이름: ${this.user.username}`);
    this.expText.setText(`경험치: ${this.user.exp} / ${nextExp}`);
    this.levelText.setText(`레벨: ${this.user.level}`);
  }

  spawnMonster() {
    if (this.monsterSprite) this.monsterSprite.destroy();
    const lvl = this.userMonsterLevel;
    const maxHP = 10 * lvl;
    const expReward = lvl * 10;
    this.monster = { level: lvl, currentHP: maxHP, maxHP, expReward };
    const key = getMonsterSpriteKey(lvl);
    this.monsterSprite = this.add.sprite(400, 300, key)
      .setInteractive().on('pointerdown', ({x,y}) => this.applyDamage(this.damageAmount, x, y-10));

    this.monsterLevelText.setText(`몬스터 레벨: ${lvl}`);
    this.updateHPBar();
  }

  applyDamage(amount, x, y) {
    this.showDamage(x, y, amount);
    this.monster.currentHP = Math.max(0, this.monster.currentHP - amount);
    this.updateHPBar();
    if (this.monster.currentHP === 0) {
      this.addLog(`몬스터 처치! (+${this.monster.expReward})`);
      this.user.exp += this.monster.expReward;
      this.user.level = getLevel(this.user.exp);
      this.updateUI();
      this.saveToServer();
      this.spawnMonster();
    }
  }

  updateHPBar() {
    const { currentHP, maxHP } = this.monster;
    const ratio = currentHP / maxHP;
    this.hpBarFg.clear().fillStyle(0xff0000)
      .fillRect(this.barX, this.barY, this.barWidth * ratio, this.barHeight);
    this.monsterHPText.setText(`몬스터 HP: ${currentHP} / ${maxHP}`);
  }

  changeMonsterLevel(delta) {
    this.userMonsterLevel = Math.max(1, this.userMonsterLevel + delta);
    localStorage.setItem('monsterLevel', this.userMonsterLevel);
    this.spawnMonster();
  }

  addLog(msg) {
    this.logs.push(msg);
    if (this.logs.length > this.maxLogs) this.logs.shift();
    this.logTexts.forEach(t => t.destroy()); this.logTexts = [];
    this.logs.forEach((text, i) => {
      const t = this.add.text(10, this.scale.height - 20 * (i+1), text, this.logStyle);
      this.logTexts.push(t);
    });
  }

  async saveToServer() {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/profile', {
        method: 'PUT', headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }, body: JSON.stringify({ exp: this.user.exp })
      });
      if (!res.ok) throw new Error();
      this.tweens.add({ targets: this.saveText, alpha: 0.3, yoyo: true, duration: 200 });
    } catch {
      localStorage.removeItem('token'); window.location.reload();
    }
  }

  showDamage(x, y, amount) {
    const style = { fontFamily: 'Galmuri11', fontSize: '24px', color: '#ff0000', stroke: '#000', strokeThickness:3 };
    const txt = this.add.text(x, y, `-${amount}`, style).setOrigin(0.5);
    this.tweens.add({ targets: txt, y: y-30, alpha: 0, duration:800, ease:'Cubic.easeOut', onComplete:()=>txt.destroy() });
  }
}
