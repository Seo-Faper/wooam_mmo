// src/game/Player.js

const BASE_EXP = 100;
const EXP_GROWTH = 1.2;

function requiredExpForLevel(level) {
  return Math.floor(BASE_EXP * Math.pow(EXP_GROWTH, level - 1));
}

export default class Player {
  constructor(username, exp) {
    this.username = username;
    this.exp = exp;
    this.level = this.calculateLevel();
    
    // 플레이어의 스탯
    this.damage = 0;
    
    this.recalculateStats();
  }

  calculateLevel() {
    let level = 1;
    while (this.exp >= requiredExpForLevel(level + 1)) {
      level++;
    }
    return level;
  }
  
  // 경험치를 추가하고, 레벨업 여부를 반환
  addExp(amount) {
    const previousLevel = this.level;
    this.exp += amount;
    this.level = this.calculateLevel();

    if (this.level > previousLevel) {
      this.recalculateStats();
      return { leveledUp: true, old: previousLevel, new: this.level };
    }
    return { leveledUp: false };
  }

  // 레벨에 따라 스탯 재계산
  recalculateStats() {
    this.damage = this.level; // 공격력 = 레벨
    // 추후 방어력, 치명타 확률 등 추가
  }
  
  // 다음 레벨업에 필요한 경험치
  getRequiredExp() {
      return requiredExpForLevel(this.level + 1);
  }
}