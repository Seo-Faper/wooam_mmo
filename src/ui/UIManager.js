// src/ui/UIManager.js

export default class UIManager {
    constructor(scene) {
      this.scene = scene;
      
      // 스타일 정의
      const uiStyle = { fontFamily: 'Galmuri11', fontSize: '18px', color: '#00ff00' };
      this.logStyle = uiStyle;
  
      // 플레이어 정보 UI
      this.nameText  = scene.add.text(10, 10, '로딩 중...', uiStyle);
      this.expText   = scene.add.text(10, 30, '', uiStyle);
      this.levelText = scene.add.text(10, 50, '', uiStyle);
  
      // 몬스터 정보 UI
      this.monsterLevelText = scene.add.text(10, 80, '', uiStyle);
      this.monsterHPText    = scene.add.text(10, 100, '', uiStyle);
  
      // HP 바 UI
      const barW = 300, barH = 20;
      this.barX = scene.scale.width/2 - barW/2;
      this.barY = 80;
      this.barWidth = barW; this.barHeight = barH;
      scene.add.graphics().fillStyle(0x444444).fillRect(this.barX, this.barY, barW, barH);
      this.hpBarFg = scene.add.graphics();
      
      // 로그 UI
      this.logs = [];
      this.logTexts = [];
      this.maxLogs = 5;
    }
  
    updatePlayerInfo(player) {
      this.nameText.setText(`이름: ${player.username}`);
      this.levelText.setText(`레벨: ${player.level}`);
      this.expText.setText(`경험치: ${player.exp} / ${player.getRequiredExp()}`);
    }
  
    updateMonsterInfo(monster) {
      this.monsterLevelText.setText(`몬스터 레벨: ${monster.level}`);
      this.monsterHPText.setText(`몬스터 HP: ${monster.currentHP} / ${monster.maxHP}`);
      
      const ratio = monster.currentHP / monster.maxHP;
      this.hpBarFg.clear().fillStyle(0xff0000)
        .fillRect(this.barX, this.barY, this.barWidth * ratio, this.barHeight);
    }
  
    addLog(msg) {
      this.logs.push(msg);
      if (this.logs.length > this.maxLogs) this.logs.shift();
      
      this.logTexts.forEach(t => t.destroy());
      this.logTexts = [];
      
      this.logs.forEach((text, i) => {
        const t = this.scene.add.text(10, this.scene.scale.height - 20 * (i+1), text, this.logStyle);
        this.logTexts.push(t);
      });
    }
  
    showDamage(x, y, amount) {
      const style = { fontFamily: 'Galmuri11', fontSize: '24px', color: '#ff0000', stroke: '#000', strokeThickness:3 };
      const txt = this.scene.add.text(x, y, `-${amount}`, style).setOrigin(0.5);
      this.scene.tweens.add({ 
        targets: txt, 
        y: y-30, 
        alpha: 0, 
        duration: 800, 
        ease:'Cubic.easeOut', 
        onComplete:()=>txt.destroy() 
      });
    }
  }