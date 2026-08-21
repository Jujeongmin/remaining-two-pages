import { defineConfig } from 'vite';

// game/ 을 Vite 루트로 쓴다. index.html 이 그 안에 있고, public/ 도 game/public 이 된다.
// Verse8 에 올릴 때 어느 경로에 얹힐지 모르므로 base 를 상대 경로로 둔다.
// 산출물은 저장소 루트의 dist/ 로 모은다. server.js 는 루트에 남아야 하므로 건드리지 않는다.
export default defineConfig({
  root: 'game',
  /* .env 는 저장소 루트에 있다(플랫폼이 거기에 VITE_AGENT8_VERSE 를 넣는다).
   * envDir 을 안 주면 Vite 가 root 인 game/ 만 보고 지나쳐, verse 를 못 찾은 채
   * 'default' 로 붙으려다 실패한다. */
  envDir: '..',
  base: './',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
});
