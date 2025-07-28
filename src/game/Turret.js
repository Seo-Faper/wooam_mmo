// src/game/Turret.js
import Phaser from 'phaser';

export default class Turret {
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
    const sc = this.scene;
    // MainScene에 monster 인스턴스가 없으면 발사하지 않음
    if (!sc.monster || !sc.monsterSprite) return;
    
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
        // MainScene의 플레이어 공격력으로 데미지 처리 요청
        sc.handleDamage(sc.player.damage, mx, my - 10);
      }
    });
  }

  destroy() {
    this.timer.remove(false);
    this.sprite.destroy();
  }
}