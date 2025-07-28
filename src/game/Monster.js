// src/game/Monster.js

const MONSTER_TIERS = [
    { max: 10,    key: 'bronze'   },
    { max: 50,    key: 'silver'   },
    { max: 100,   key: 'golden'   },
    { max: 200,   key: 'platinum' },
    { max: 500,   key: 'diamond'  },
    { max: Infinity, key: 'master' }
  ];
  
  function getSpriteKey(level) {
    for (const tier of MONSTER_TIERS) {
      if (level <= tier.max) return tier.key;
    }
    return 'bronze';
  }
  
  
  export default class Monster {
    constructor(level) {
      this.level = level;
      this.maxHP = 10 * level;
      this.currentHP = this.maxHP;
      this.expReward = 10 * level;
      this.spriteKey = getSpriteKey(level);
    }
  
    // 데미지를 받고, 사망 여부를 반환
    takeDamage(amount) {
      this.currentHP = Math.max(0, this.currentHP - amount);
      return this.isDead();
    }
  
    isDead() {
      return this.currentHP === 0;
    }
  }