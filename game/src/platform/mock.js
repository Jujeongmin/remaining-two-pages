/*
 * 모의 서버. 주소에 ?mock=1 을 붙였을 때만 불러온다.
 *
 * Verse8 없이도 "붙은 화면" 을 그대로 보려는 것이다. 이름 칸과 등수, 상점 단추 둘,
 * 광고 보고 받기, 광고제거를 산 뒤의 모습까지 전부 여기서 흉내 낸다.
 *
 * 이 파일은 평소에 아예 안 실려 있는다. main.js 가 깃발을 보고 그때만 불러오므로,
 * 올린 게임에는 이 코드가 딸려 가지 않는다.
 *
 * 서버 쪽 규칙은 저장소 루트의 server.js 를 그대로 옮겨 적었다. 한쪽을 고치면 다른
 * 쪽도 같이 고쳐야 화면과 실제가 어긋나지 않는다.
 */
import { configure } from './config.js';
import * as backend from './backend.js';
import * as ads from './ads.js';
import * as shop from './shop.js';

const KEY = 'dugrimja.mock.v1';

const AD = { placement: 'mock-rewarded' };

/* server.js 의 값을 그대로 옮겨 적는다. */
const COIN_BY_GRADE = { 1: 1, 2: 3, 3: 5 };
const COIN_PER_ENDLESS = 2;
const PREMIUM_COIN = 1.5;
const PRICE = { undo: 4, hint: 15 };
const PRODUCT = { premium: 'mock-premium' };

const FRESH = {
  best: {}, unlocked: 1, endlessBest: 0, hints: 3, undos: 10, coins: 0, adFree: false,
  nickname: '', hero: '', lang: '', volume: null, seenIntro: false, updatedAt: 0,
  purchased: {},
};

/* 남들 기록. 등수 화면이 비어 있으면 무엇을 보는지 알 수 없다. */
const OTHERS = [
  { nickname: '도편수', score: 31 }, { nickname: '먹줄', score: 24 },
  { nickname: '자귀', score: 19 }, { nickname: '대패', score: 12 },
  { nickname: '끌', score: 8 },
];

function load() {
  try { return { ...FRESH, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; }
  catch { return { ...FRESH }; }
}

let state = load();
const store = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* 그냥 논다 */ } };

/* ── 게임 서버 흉내 ────────────────────────────────── */
function progress() {
  return {
    best: { ...state.best },
    unlocked: state.unlocked,
    endlessBest: state.endlessBest,
    hints: state.hints,
    undos: state.undos,
    coins: state.coins,
    adFree: state.adFree,
    nickname: state.nickname,
    hero: state.hero,
    lang: state.lang,
    volume: state.volume,
    seenIntro: state.seenIntro,
    updatedAt: state.updatedAt,
  };
}

const FN = {
  loadProgress: () => progress(),

  saveProgress: (patch) => {
    let bonus = 0;
    let earned = 0;
    for (const [id, stars] of Object.entries(patch.best || {})) {
      const n = Number(stars);
      if (!Number.isInteger(n) || n < 1 || n > 3) continue;
      const was = state.best[id] || 0;
      if (n === 3 && was < 3) bonus++;                        // 갑으로 처음 맺은 판의 덤
      if (n > was) { earned += (COIN_BY_GRADE[n] || 0) - (COIN_BY_GRADE[was] || 0); state.best[id] = n; }
    }
    if (earned && state.adFree) earned = Math.round(earned * PREMIUM_COIN);
    if (earned) state.coins += earned;
    state.unlocked = Math.max(state.unlocked, Math.min(200, Number(patch.unlocked) || 1));
    state.endlessBest = Math.max(state.endlessBest, Math.min(9999, Number(patch.endlessBest) || 0));
    if (bonus) state.hints += bonus;
    if (typeof patch.nickname === 'string') state.nickname = patch.nickname.slice(0, 15);
    if (typeof patch.hero === 'string') state.hero = patch.hero;
    if (typeof patch.lang === 'string') state.lang = patch.lang;
    if (typeof patch.volume === 'number') state.volume = patch.volume;
    if (patch.seenIntro) state.seenIntro = true;
    state.updatedAt = 1;
    store();
    return progress();
  },

  wipeProgress: () => {
    state = { ...state, best: {}, unlocked: 1, endlessBest: 0, seenIntro: false };
    store();
    return progress();
  },

  getHints: () => state.hints,
  spendHint: () => {
    if (state.hints <= 0) return { ok: false, hints: 0 };
    state.hints--; store();
    return { ok: true, hints: state.hints };
  },

  spendUndo: () => {
    if (state.adFree) return { ok: true, undos: -1 };
    if (state.undos <= 0) return { ok: false, undos: 0 };
    state.undos--; store();
    return { ok: true, undos: state.undos };
  },

  claimAdReward: (kind) => {
    const R = { hint: { hints: 1 }, undo: { undos: 3 }, revive: { free: true } }[kind];
    if (!R) return { ok: false, reason: 'ad_unknown' };
    if (R.free) return { ok: true };
    const now = 1;
    if (R.hints) state.hints += R.hints;
    if (R.undos) state.undos += R.undos;
    store();
    return { ok: true, hints: state.hints, undos: state.undos };
  },

  buy: (what, n) => {
    const cost = (PRICE[what] || 0) * n;
    if (!cost || state.coins < cost) return { ok: false, reason: 'poor', coins: state.coins };
    state.coins -= cost;
    if (what === 'undo') state.undos += n; else state.hints += n;
    store();
    return { ok: true, coins: state.coins, undos: state.undos, hints: state.hints };
  },

  claimEndlessCoins: (n) => {
    const got = Math.round(Math.min(Number(n) || 0, 200) * COIN_PER_ENDLESS * (state.adFree ? PREMIUM_COIN : 1));
    state.coins += got; store();
    return { ok: true, coins: state.coins, got };
  },

  /* 서버와 같은 규칙 — 사람마다 한 줄, 더 높을 때만 갈아 끼운다. */
  submitScore: (score, nickname) => {
    state.nickname = nickname;
    if (score > state.endlessBest) state.endlessBest = score;
    store();
    return { updated: score >= state.endlessBest, best: state.endlessBest };
  },

  getTopRankings: () => {
    const me = { nickname: state.nickname || '그림자', score: state.endlessBest, mine: true };
    return [...OTHERS, ...(me.score > 0 ? [me] : [])]
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);
  },

  getMyBestRank: () => {
    if (!state.endlessBest) return { bestEntry: null, rank: -1 };
    const above = OTHERS.filter((r) => r.score > state.endlessBest).length;
    return { bestEntry: { nickname: state.nickname || '그림자', score: state.endlessBest }, rank: above + 1 };
  },
};

const server = {
  async remoteFunction(fn, args = []) {
    // 실제 서버는 오가는 시간이 있다. 값이 늦게 오는 것도 화면에서 봐야 한다.
    await new Promise((r) => setTimeout(r, 120));
    const f = FN[fn];
    if (!f) return null;
    return f(...args);
  },
};

/* ── 광고 흉내 ──────────────────────────────────────
 * 실제 광고 대신 검은 막을 잠깐 덮는다. 끝까지 본 것으로 친다.
 */
const Verse8Ads = {
  async showRewarded({ placementId }) {
    await curtain('광고 (모의)', 1200);
    return { status: 'rewarded', requestId: `mock-${placementId}-${state.updatedAt}` };
  },
};

function curtain(text, ms) {
  return new Promise((done) => {
    const el = document.createElement('div');
    el.style.cssText = 'position:fixed;inset:0;z-index:9999;background:#111;color:#eee;'
      + 'display:flex;align-items:center;justify-content:center;font:14px monospace;letter-spacing:4px';
    el.textContent = text;
    document.body.appendChild(el);
    setTimeout(() => { el.remove(); done(); }, ms);
  });
}

/* ── 상점 흉내 ──────────────────────────────────────
 * 사면 서버 쪽 $onItemPurchased 가 하는 일을 그대로 한다.
 */
const listeners = new Set();
const closers = new Set();

function items() {
  return [
    itemOf(PRODUCT.premium, '프리미엄', 500, 1),
  ];
}

function itemOf(productId, name, price, limit) {
  const bought = state.purchased[productId] || 0;
  return {
    productId, name, price,
    purchaseLimit: limit,
    purchasedCount: bought,
    purchaseLimitReached: limit != null && bought >= limit,
    remainingPurchaseQuantity: limit == null ? null : Math.max(0, limit - bought),
    purchasable: limit == null || bought < limit,
  };
}

const VXShop = {
  init() {},
  getItems: items,
  getItem: (id) => items().find((i) => i.productId === id),
  getState: () => ({ items: items(), isLoading: false, error: null }),
  subscribe(cb) { listeners.add(cb); cb(VXShop.getState()); return () => listeners.delete(cb); },
  onClose(cb) { closers.add(cb); return () => closers.delete(cb); },
  async refresh() {},

  async buyItem(productId) {
    await curtain('결제 (모의)', 900);

    // 서버의 $onItemPurchased 와 같은 일
    state.purchased[productId] = (state.purchased[productId] || 0) + 1;
    if (productId === PRODUCT.premium) state.adFree = true;
    store();

    listeners.forEach((cb) => { try { cb(VXShop.getState()); } catch { /* 그냥 논다 */ } });
    closers.forEach((cb) => { try { cb({ productId }); } catch { /* 그냥 논다 */ } });
  },
};

/* ── 붙이기 ────────────────────────────────────────── */
export function install() {
  configure({ products: PRODUCT });
  backend.register(server);
  ads.register(Verse8Ads);
  shop.register(VXShop);
  badge();
  return { reset() { state = { ...FRESH }; store(); } };
}

/* 모의 서버로 돌고 있다는 표시. 이걸 안 달아 두면 실제로 붙은 줄 알기 쉽다. */
function badge() {
  const el = document.createElement('div');
  el.textContent = '모의 서버';
  el.style.cssText = 'position:fixed;left:6px;bottom:6px;z-index:9998;pointer-events:none;'
    + 'font:10px monospace;letter-spacing:2px;color:#8a6a3a;border:1px solid #8a6a3a;'
    + 'padding:2px 6px;opacity:.7;background:rgba(217,203,168,.8)';
  document.body.appendChild(el);
}
