import Phaser     from 'phaser';
import LoginScene from './scenes/LoginScene.js';
import MainScene  from './scenes/MainScene.js';
window.addEventListener('load', () => {
  // 이미 game-container 안에 canvas가 있으면 중복 생성하지 않음
  const container = document.getElementById('game-container');
  if (container.children.length > 0) return;
  const token = localStorage.getItem('token');
  const config = {
    type: Phaser.AUTO,
    width:  800,
    height: 600,
    parent: 'game-container',
    dom:    { createContainer: true },
    // 토큰 유무에 따라 scene 배열을 다르게 설정
    scene: token
      ? [ MainScene ]     // 토큰이 있으면 MainScene만 로드
      : [ LoginScene ]    // 토큰 없으면 LoginScene만 로드
  };

  // 전역에 보관하면 HMR dispose 시 파괴도 가능
  window.game = new Phaser.Game(config);

  // HMR로 교체될 때 이전 인스턴스 파괴
  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => {
      window.game.destroy(true);
    });
  }
});
