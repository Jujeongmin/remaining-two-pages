import * as backend from './backend.js';
import * as ads from './ads.js';
import * as shop from './shop.js';

/*
 * Verse8 붙이기.
 *
 * 세 가지를 붙인다 — 게임 서버(순위표·계정 저장), 광고, 상점. 셋 다 없어도 게임은
 * 그대로 돌아간다. 여기서 하는 일은 "있으면 잡아서 넘겨주는 것" 뿐이다.
 *
 * ── 어떻게 잡는가 ──────────────────────────────────
 *
 * 광고와 상점은 index.html 의 스크립트 한 줄로 붙는다. 그러면 window 에
 * Verse8Ads / VXShop 이 생긴다. 다만 그 스크립트가 언제 다 받아졌는지는 알 수 없으므로,
 * 잠깐 동안 여러 번 들여다본다. 한 번만 보고 없다고 판단하면, 스크립트가 조금 늦게
 * 온 날에는 광고가 통째로 빠진다.
 *
 * 게임 서버는 npm 꾸러미다. 안 깔려 있으면 import 자체가 터지므로 따로 떼어 받아 온다.
 * 못 받아도 그 줄만 조용히 빠진다.
 */

/** 스크립트가 늦게 와도 잡는다. 0.2초마다, 최대 10초. */
function waitFor(name, ms = 10000) {
  return new Promise((done) => {
    if (globalThis[name]) return done(globalThis[name]);
    const t0 = Date.now();
    const tick = setInterval(() => {
      if (globalThis[name]) { clearInterval(tick); done(globalThis[name]); return; }
      if (Date.now() - t0 > ms) { clearInterval(tick); done(null); }
    }, 200);
  });
}

/*
 * 게임 서버. 꾸러미가 없거나 verse 를 못 찾으면 붙지 않는다.
 * .env 의 VITE_AGENT8_VERSE 는 npx @agent8/deploy 를 한 번 돌리면 생긴다.
 */
async function connectServer() {
  try {
    const mod = await import('@agent8/gameserver');
    const GameServer = mod.GameServer || (mod.default && mod.default.GameServer);
    if (!GameServer) return false;
    const server = GameServer.getInstance();
    await server.connect();
    backend.register(server);
    return true;
  } catch {
    return false;   // 안 깔렸거나 못 붙었다. 기록은 브라우저에만 남는다.
  }
}

/**
 * 붙는다. 셋을 따로 기다리므로 하나가 늦거나 없어도 나머지는 그대로 붙는다.
 * 무엇이 붙었는지 돌려준다.
 */
export async function boot() {
  const [server, adSdk, shopSdk] = await Promise.all([
    connectServer(),
    waitFor('Verse8Ads'),
    waitFor('VXShop'),
  ]);

  if (adSdk) ads.register(adSdk);
  if (shopSdk) shop.register(shopSdk);

  return { server, ads: !!adSdk, shop: !!shopSdk };
}
