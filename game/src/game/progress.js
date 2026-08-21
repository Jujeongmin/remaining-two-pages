/*
 * 저장. Verse8 안에서는 틀 안에 얹혀 도는 만큼 저장이 막혀 있을 수 있다. 그래서 읽고
 * 쓰는 자리마다 막힌 경우를 받아 두고, 막혔으면 이번 판만 기억한 채 그냥 논다.
 * 못 쓴다고 게임이 멈출 이유는 없다.
 */
import { COIN_BY_GRADE, COIN_PER_ENDLESS, PREMIUM_COIN, PRICE, START } from './economy.js';

const KEY = 'dugrimja.save.v1';
const FRESH = { v: 1, best: {}, hints: START.hints, undos: START.undos, coins: START.coins,
  endlessBest: 0, unlocked: 1, nickname: '', muted: false, hero: '', adFree: false };

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...FRESH, best: {} };
    const d = JSON.parse(raw);
    return { ...FRESH, ...d, best: { ...(d.best || {}) } };
  } catch {
    return { ...FRESH, best: {} };
  }
}

let data = read();

function write() {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* 못 써도 그냥 논다 */ }
}

export const bestOf = (id) => data.best[id] || 0;
export const isUnlocked = (i) => i < data.unlocked;
export const hintsLeft = () => data.hints;
export const coins = () => data.coins;

/*
 * 남은 되돌리기.
 *
 * 광고제거를 산 사람에게는 세지 않는다. 그 물건이 없애 주는 것은 광고를 보는 수고인데,
 * 되돌리기는 그 수고를 치르고 받던 것이라 함께 풀어 주는 것이 앞뒤가 맞는다.
 */
export const undosLeft = () => (data.adFree ? Infinity : data.undos);
export const canUndo = () => data.adFree || data.undos > 0;
export const endlessBest = () => data.endlessBest;

/** 연습판을 다 뗐는지. 끝없는 판은 그 뒤에 열린다. */
export const tutorialDone = (tutorialCount) => data.unlocked > tutorialCount;

/** 리더보드에 올릴 이름. 안 적었으면 그냥 '그림자'로 올린다. */
export const nickname = () => data.nickname || '그림자';

export function setNickname(name) {
  data.nickname = String(name || '').slice(0, 15);
  write();
  push();
}

/* 소리 크기는 0~1. 켬·끔만 있던 예전 기록도 그대로 읽을 수 있게 받아 준다. */
export function volume() {
  if (typeof data.volume === 'number') return data.volume;
  return data.muted ? 0 : 0.7;
}

export function setVolume(v) {
  data.volume = Math.max(0, Math.min(1, v));
  data.muted = data.volume === 0;
  write();
  push();
}

/** 고른 말. 안 골랐으면 빈 값이고, 그때 브라우저가 쓰는 말을 따라간다. */
/* 음악 크기. 효과음과 따로 둔다. 말소리를 덮지 않으려면 음악만 낮춰야 할 때가 있다. */
export function music() {
  return typeof data.music === 'number' ? data.music : 0.4;
}

export function setMusic(v) {
  data.music = Math.max(0, Math.min(1, v));
  write();
  push();
}

export const lang = () => data.lang || '';

export function setLang(id) {
  data.lang = id;
  write();
  push();
}

/** 고른 복원공. 아직 안 골랐으면 빈 값이고, 그때 고르개를 띄운다. */
export const hero = () => data.hero || '';

export function setHero(id) {
  data.hero = id;
  write();
  push();
}

/** 첫머리 이야기를 이미 봤는지. 두 번 볼 것은 아니다. */
export const seenIntro = () => !!data.seenIntro;

export function markIntroSeen() {
  data.seenIntro = true;
  write();
  push();
}

/*
 * 되돌리기 하나 쓰기. 서버가 붙어 있으면 서버가 주인이라, 여기서 먼저 하나 깎아 보이고
 * 서버가 돌려준 수로 다시 맞춘다. 광고제거를 샀으면 세지 않고 그냥 통과한다.
 */
export function spendUndo() {
  if (data.adFree) return true;
  if (data.undos <= 0) return false;
  data.undos--;
  write();
  if (sync && sync.spendUndo) {
    Promise.resolve(sync.spendUndo())
      .then((r) => { if (r && typeof r.undos === 'number') { data.undos = r.undos; write(); changed(); } })
      .catch(() => {});
  }
  return true;
}

/*
 * 엽전으로 사기. 서버가 붙어 있으면 서버가 셈을 하고, 돌려준 값으로 맞춘다.
 * 서버가 없으면 여기서 셈한다. 어차피 브라우저에만 남는 기록이라 속일 상대가 없다.
 */
export function buy(what, n) {
  const cost = PRICE[what] * n;
  if (data.coins < cost) return false;
  data.coins -= cost;
  if (what === 'undo') data.undos += n;
  else data.hints += n;
  write();
  changed();
  if (sync && sync.buy) {
    Promise.resolve(sync.buy(what, n))
      .then((r) => { if (r && r.ok) applyWallet(r); })
      .catch(() => {});
  }
  return true;
}

/** 서버가 돌려준 지갑을 그대로 얹는다. */
function applyWallet(r) {
  if (typeof r.coins === 'number') data.coins = r.coins;
  if (typeof r.hints === 'number') data.hints = r.hints;
  if (typeof r.undos === 'number') data.undos = r.undos;
  write();
  changed();
}

/*
 * 끝없이 풀기에서 넘긴 판만큼 엽전을 받는다. 본편을 다 깬 뒤에도 벌 길이 남아야 한다.
 * 서버가 붙어 있으면 서버가 얹어 준다.
 */
export function earnEndless(n) {
  if (n <= 0) return 0;
  const got = Math.round(n * COIN_PER_ENDLESS * (data.adFree ? PREMIUM_COIN : 1));
  if (sync && sync.earnEndless) {
    Promise.resolve(sync.earnEndless(n)).then((r) => { if (r) applyWallet(r); }).catch(() => {});
  } else {
    data.coins += got;
    write();
    changed();
  }
  return got;
}

export function spendHint() {
  if (data.hints <= 0) return false;
  data.hints--;
  write();
  if (sync && sync.spendHint) {
    Promise.resolve(sync.spendHint())
      .then((r) => { if (r && typeof r.hints === 'number') { data.hints = r.hints; write(); changed(); } })
      .catch(() => {});
  }
  return true;
}

/*
 * 광고를 끝까지 본 뒤 보상을 청구한다.
 *
 * 얼마를 줄지는 서버가 정한다. 여기서 액수를 보내면 그 수를 고쳐 부르는 것만으로
 * 원하는 만큼 받을 수 있다. 서버가 없으면(브라우저에만 남는 판) 여기서 얹는다 —
 * 어차피 제 브라우저에만 남는 기록이라 속일 상대가 없다.
 *
 * fallback 은 서버가 없을 때 얹을 것이다. { hints, undos } 꼴.
 */
/** 갑으로 처음 맺은 판의 덤. 서버가 붙어 있으면 saveProgress 가 얹으므로 안 부른다. */
export function bonusHint() {
  data.hints += 1;
  write();
  changed();
}

export function claimAd(kind, fallback) {
  if (!sync || !sync.claimAd) {
    if (fallback && fallback.hints) data.hints += fallback.hints;
    if (fallback && fallback.undos) data.undos += fallback.undos;
    write();
    changed();
    return Promise.resolve({ ok: true });
  }
  return Promise.resolve(sync.claimAd(kind))
    .then((r) => {
      if (r && r.ok) applyWallet(r);
      return r || { ok: false, reason: 'offline' };
    })
    .catch(() => ({ ok: false, reason: 'offline' }));
}


/**
 * 별. 힌트도 되돌리기도 없이 풀면 셋, 힌트만 안 쓰면 둘, 풀기만 하면 하나다.
 * 시간은 보지 않는다. 오래 들여다보는 것이 이 게임에서 하는 일이기 때문이다.
 */
export function grade(undos, hintsUsed) {
  if (hintsUsed === 0 && undos === 0) return 3;
  if (hintsUsed === 0) return 2;
  return 1;
}

/** 별은 더 좋을 때만 갈아 끼우고, 다음 판은 한 칸만 연다. */
/**
 * 별은 더 좋을 때만 갈아 끼우고, 다음 판은 한 칸만 연다.
 * 엽전은 등급이 오른 만큼만 받는다. 같은 판을 되풀이해 벌 수 없고, 나중에 더 잘 세우면
 * 그 차액은 마저 받는다. 돌려주는 값이 이번에 받은 엽전이다.
 */
export function recordClear(id, index, stars, total) {
  const was = data.best[id] || 0;
  let got = Math.max(0, (COIN_BY_GRADE[stars] || 0) - (COIN_BY_GRADE[was] || 0));
  if (got && data.adFree) got = Math.round(got * PREMIUM_COIN);   // 프리미엄은 더 받는다
  if (stars > was) data.best[id] = stars;
  data.unlocked = Math.min(total, Math.max(data.unlocked, index + 2));
  // 서버가 붙어 있으면 엽전은 서버가 얹는다. 여기서 또 더하면 두 번 얹힌다.
  if (got && !sync) data.coins += got;
  write();
  push();
  return got;
}

export function recordEndless(count) {
  if (count <= data.endlessBest) return false;
  data.endlessBest = count;
  write();
  push();
  return true;
}


/*
 * 기록 지우기. 서버가 붙어 있으면 서버 것부터 지운다. 여기만 지우고 올리면, 합치는
 * 규칙이 큰 쪽을 남기는 것이라 다음 순간 서버 기록이 도로 내려온다.
 *
 * **처음 상태로 되돌린다** — 힌트 셋, 되돌리기 열, 엽전 영.
 *
 * 한때 힌트와 엽전을 남겨 두었는데 둘 다 틀렸다. 힌트를 남기면 시험하다 하나까지
 * 써 버린 사람이 기록을 지워도 하나로 시작해, 한 번 쓰고 바닥난다. 엽전을 남기면
 * 스무 판 깨서 벌고 지우고 또 깨는 것이 그대로 돈벌이가 된다.
 *
 * 남기는 것은 광고제거뿐이다. 그것만 실제로 돈을 주고 산 것이고, 기록을 지운다고
 * 낸 돈이 사라질 이유는 없다.
 */
export function wipe() {
  const bought = data.adFree;
  data = { ...FRESH, best: {}, adFree: bought };
  write();
  changed();
  if (sync && sync.wipe) Promise.resolve(sync.wipe()).then((r) => { if (r) merge(r); }).catch(() => {});
}

/* ── 계정에 얹기 ────────────────────────────────────
 *
 * 브라우저에 적어 두는 것만으로는 폰에서 깬 것을 컴퓨터에서 잇지 못하고, 틀 안에서
 * 저장이 막히면 통째로 날아간다. 그래서 서버에도 같은 것을 얹는다.
 *
 * 서버를 주인으로 삼되, 브라우저 쪽을 버리지는 않는다. 서버가 없거나 끊긴 채로 논
 * 사람의 기록이 접속하는 순간 사라지면 안 되기 때문이다. 그래서 붙는 순간 양쪽을
 * 큰 쪽으로 합치고, 그 뒤로는 기록이 바뀔 때마다 조용히 올린다.
 *
 * 힌트와 광고제거는 서버 쪽 값만 쓴다. 브라우저에서 늘릴 수 있으면 살 이유가 없다.
 */
let sync = null;          // { load, save, wipe, spendHint, spendUndo, buy, earnEndless, hints }
let changed = () => {};   // 서버가 값을 고쳐 보냈을 때 화면을 다시 그리게 한다

export function watch(fn) { changed = fn || (() => {}); }
let pushing = false;
let dirty = false;

export function attachSync(fns) { sync = fns || null; }

/** 서버가 붙어 있으면 참. 힌트를 서버가 쥐고 있는지 판별하는 데도 쓴다. */
export const synced = () => !!sync;

function snapshot() {
  return {
    best: data.best,
    unlocked: data.unlocked,
    endlessBest: data.endlessBest,
    nickname: data.nickname,
    hero: data.hero,
    lang: data.lang,
    volume: data.volume,
    music: data.music,
    seenIntro: data.seenIntro,
  };
}

/* 올리는 중에 또 바뀌면 표시만 해 두고, 끝난 뒤에 한 번 더 올린다. 한 수 둘 때마다
 * 요청이 줄줄이 날아가는 것을 막는다. */
function push() {
  if (!sync) return;
  if (pushing) { dirty = true; return; }
  pushing = true;
  Promise.resolve(sync.save(snapshot()))
    .then((r) => { if (r) merge(r); })
    .catch(() => {})
    .finally(() => {
      pushing = false;
      if (dirty) { dirty = false; push(); }
    });
}

/** 서버에서 받은 것을 얹는다. 기록은 큰 쪽, 힌트와 광고제거는 서버 것을 그대로. */
function merge(s) {
  for (const [id, stars] of Object.entries(s.best || {})) {
    if (stars > (data.best[id] || 0)) data.best[id] = stars;
  }
  data.unlocked = Math.max(data.unlocked, s.unlocked || 1);
  data.endlessBest = Math.max(data.endlessBest, s.endlessBest || 0);
  if (typeof s.hints === 'number') data.hints = s.hints;
  if (typeof s.undos === 'number') data.undos = s.undos;
  if (typeof s.coins === 'number') data.coins = s.coins;
  data.adFree = !!s.adFree;
  if (s.nickname) data.nickname = s.nickname;
  if (s.hero) data.hero = s.hero;
  if (s.lang) data.lang = s.lang;
  if (typeof s.volume === 'number') data.volume = s.volume;
  if (typeof s.music === 'number') data.music = s.music;
  if (s.seenIntro) data.seenIntro = true;
  write();
  changed();
}

/*
 * 광고가 지난번에 안 됐는가.
 *
 * SDK 에 "지금 틀 수 있나" 를 묻는 길이 없다 — init, showRewarded, showInterstitial
 * 셋뿐이다. 그래서 한 번은 눌러 봐야 아는데, 그 한 번을 세션마다 되풀이하면 켤 때마다
 * 헛물을 켠다. 실패한 사실을 적어 두고 하루 동안은 단추를 안 낸다.
 *
 * 영영 접지 않는 것은, 자리를 나중에 콘솔에 만들어 두면 그때부터는 되기 때문이다.
 */
const ADS_RETRY_MS = 24 * 60 * 60 * 1000;

export const adsBroken = () => !!data.adsFailedAt && (Date.now() - data.adsFailedAt) < ADS_RETRY_MS;

export function noteAdsBroken() {
  data.adsFailedAt = Date.now();
  write();
}

/** 광고제거를 샀는지. 서버가 없으면 늘 거짓이다. */
export const adFree = () => !!data.adFree;

/**
 * 붙자마자 한 번. 서버 것을 받아 합치고, 합친 것을 도로 올린다.
 * 브라우저에만 있던 기록이 이 한 번으로 계정에 옮겨 붙는다.
 */
export async function pull() {
  if (!sync) return false;
  try {
    const s = await sync.load();
    if (s) merge(s);
    push();
    return true;
  } catch {
    return false;   // 못 받아도 브라우저 것으로 그냥 논다
  }
}
