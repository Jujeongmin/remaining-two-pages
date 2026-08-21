/*
 * 소리. 파일을 두지 않고 그때그때 만들어 낸다. (배경 음악만 파일을 쓴다 — ui/bgm.js)
 *
 * ── 무슨 소리를 내는가 ────────────────────────────────
 *
 * 가락을 쓰지 않는다. 도–미–솔로 올라가는 소리는 어느 게임에나 붙지만, 이 화면은
 * 낡은 종이와 먹과 마른 나무다. 거기에 맑은 삼각파 화음이 얹히면 그 순간 만화가 된다.
 *
 * 그래서 여기 있는 것은 전부 **물건이 부딪는 소리**다. 나무토막이 놓이고, 종이가
 * 넘어가고, 도장이 찍히고, 놋쇠 엽전이 부딪는다. 만드는 법은 둘뿐이다 —
 *   1) 짧은 잡음을 좁은 체에 통과시킨다 (마찰·바스락·쇳소리)
 *   2) 낮은 음 하나를 아주 빠르게 죽인다 (두드림의 몸통)
 * 이 둘을 겹치면 두드린 소리가 된다. 음정을 길게 끄는 소리는 두지 않는다.
 *
 * 소리통은 첫 소리를 낼 때 만든다. 브라우저가 사람이 누르기 전에는 소리를 못 내게
 * 막아 두는데, 우리 소리는 전부 누른 뒤에 나므로 그 자리에서 만들면 걸리지 않는다.
 */
let ctx = null;
let level = 0.7;   // 0 이면 아무 소리도 내지 않는다

export function setVolume(v) { level = Math.max(0, Math.min(1, v)); }
export function volume() { return level; }
export function isMuted() { return level === 0; }

/** 배경 음악도 같은 소리통을 쓴다. 통이 둘이면 소리 크기가 따로 놀고 통도 두 배로 든다. */
export function context() { return audio(); }

/*
 * 마지막 단.
 *
 * 소리를 여럿 겹치면 그대로 더해져 1 을 넘고, 넘은 만큼은 잘려 지직거린다. 그래서
 * 지금까지는 소리마다 값을 아주 낮게 잡아 두었는데, 그 결과 아무것도 안 겹칠 때가
 * 대부분인 이 게임에서는 전부 너무 작았다.
 *
 * 값을 올리는 대신 여기에 리미터를 하나 둔다. 겹쳐서 커지면 이놈이 눌러 준다.
 * 소리마다 눈치를 보지 않아도 되고, 하나만 날 때는 그대로 크게 난다.
 */
let bus = null;
function output(ac) {
  if (bus) return bus;
  const comp = ac.createDynamicsCompressor();
  comp.threshold.value = -14;
  comp.knee.value = 6;
  comp.ratio.value = 8;
  comp.attack.value = 0.002;
  comp.release.value = 0.12;
  const gain = ac.createGain();
  gain.gain.value = 0.9;
  comp.connect(gain).connect(ac.destination);   // 마지막 단만 직접 나간다
  bus = comp;
  return bus;
}

function audio() {
  if (level === 0) return null;
  if (!ctx) {
    const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AC) return null;
    try { ctx = new AC(); } catch { return null; }
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

/*
 * 두드림의 몸통. 낮은 음 하나를 아주 빠르게 죽인다.
 *
 * 음을 길게 끌지 않는 것이 핵심이다. 0.1초를 넘기면 그 순간 "삐" 하는 악기 소리가
 * 되어 버린다. 나무를 놓는 소리에는 높이가 아니라 두께만 있으면 된다.
 */
function body(ac, { f, to, at = 0, dur = 0.08, type = 'sine', vol = 0.14 }) {
  const t0 = ac.currentTime + at;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(f, t0);
  if (to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), t0 + dur);
  gain.gain.setValueAtTime(Math.max(0.0002, vol * level), t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(output(ac));
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

/*
 * 마찰. 잡음을 좁은 체(밴드패스)에 통과시킨다.
 * 체를 어디에 두느냐로 무엇이 부딪는지가 갈린다 — 낮으면 나무, 가운데면 종이,
 * 높고 좁으면 쇠붙이다.
 */
function rub(ac, { at = 0, dur = 0.1, f = 1200, to, q = 1.2, vol = 0.1 }) {
  const t0 = ac.currentTime + at;
  const n = Math.max(1, Math.floor(ac.sampleRate * dur));
  const buf = ac.createBuffer(1, n, ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;

  const src = ac.createBufferSource();
  src.buffer = buf;
  const bp = ac.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.setValueAtTime(f, t0);
  if (to) bp.frequency.exponentialRampToValueAtTime(Math.max(20, to), t0 + dur);
  bp.Q.value = q;
  const gain = ac.createGain();
  gain.gain.setValueAtTime(Math.max(0.0002, vol * level), t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

  src.connect(bp).connect(gain).connect(output(ac));
  src.start(t0);
  src.stop(t0 + dur + 0.02);
}

function play(seq) {
  const ac = audio();
  if (!ac) return;
  try { seq.forEach((n) => (n.rub ? rub(ac, n) : body(ac, n))); }
  catch { /* 소리가 안 나도 게임은 논다 */ }
}

/* ── 자재 ─────────────────────────────────────────── */

/** 자재를 놓는다. 나무토막이 판에 닿는 소리. 딱 한 번, 짧게. */
export const place = () => play([
  { rub: true, dur: 0.045, f: 1700, to: 800, q: 1.4, vol: 0.216 },
  { f: 190, to: 120, dur: 0.075, vol: 0.384 },
]);

/** 자재를 뺀다. 놓는 것보다 마르고 짧다. */
export const remove = () => play([
  { rub: true, dur: 0.06, f: 2200, to: 900, q: 1.1, vol: 0.168 },
  { f: 150, to: 95, dur: 0.06, vol: 0.264 },
]);

/*
 * 되돌리기. 이제 공짜가 아니라 재고를 하나 치르는 조작이라, 뺀 것과 같은 소리로는
 * 안 된다. 끼운 나무를 뽑는 소리를 조금 길게 두어 "무언가를 썼다" 가 들리게 한다.
 */
export const undo = () => play([
  { rub: true, dur: 0.13, f: 2600, to: 520, q: 0.8, vol: 0.216 },
  { f: 165, to: 100, at: 0.06, dur: 0.1, vol: 0.288 },
]);

/** 처음부터. 판을 통째로 쓸어낸다. 길게 한 번. */
export const reset = () => play([
  { rub: true, dur: 0.34, f: 3000, to: 300, q: 0.6, vol: 0.24 },
  { f: 120, to: 70, at: 0.14, dur: 0.2, vol: 0.216 },
]);

/* ── 조작 ─────────────────────────────────────────── */

/*
 * 층 갈아 끼우기. 나무 표찰이 부딪는 아주 짧은 소리 하나.
 * 자주 누르는 자리라 조금만 길어도 금세 성가시다. 눌렸다는 것만 알리면 된다.
 */
export const chip = () => play([
  { rub: true, dur: 0.028, f: 2600, q: 2.2, vol: 0.12 },
  { f: 320, to: 240, dur: 0.03, vol: 0.144 },
]);

/** 판 돌리기. 나무가 도는 결. */
export const turn = () => play([{ rub: true, dur: 0.16, f: 600, to: 1300, q: 1.4, vol: 0.12 }]);

/** 처음 시점으로. 돌리기와 반대로 내려온다. */
export const view = () => play([{ rub: true, dur: 0.18, f: 1300, to: 520, q: 1.4, vol: 0.12 }]);

/** 대화 한 줄 넘김. 종이 넘기는 정도로만. */
export const tick = () => play([{ rub: true, dur: 0.055, f: 2400, to: 1500, q: 0.9, vol: 0.108 }]);

/** 창이 열린다. 종이 한 장을 든다. */
export const open = () => play([{ rub: true, dur: 0.12, f: 1100, to: 2400, q: 0.8, vol: 0.12 }]);

/** 창이 닫힌다. 종이가 내려앉는다. */
export const close = () => play([
  { rub: true, dur: 0.11, f: 2400, to: 900, q: 0.8, vol: 0.12 },
  { f: 140, to: 90, at: 0.06, dur: 0.07, vol: 0.144 },
]);

/* ── 셈 ───────────────────────────────────────────── */

/*
 * 엽전이 나간다. 놋쇠 두 닢이 부딪는 소리.
 * 체를 높고 좁게 두면 쇳소리가 난다. 아주 짧게 두 번 겹쳐야 동전이지, 길게 끌면
 * 종소리가 되어 버린다.
 */
export const coin = () => play([
  { rub: true, dur: 0.05, f: 4200, q: 6, vol: 0.144 },
  { rub: true, at: 0.035, dur: 0.07, f: 3100, q: 5, vol: 0.12 },
  { f: 260, to: 180, dur: 0.05, vol: 0.12 },
]);

/** 광고나 덤으로 무언가를 받았다. 엽전 한 닢이 상에 떨어져 구른다. */
export const gain = () => play([
  { rub: true, dur: 0.06, f: 3600, q: 5, vol: 0.144 },
  { rub: true, at: 0.07, dur: 0.05, f: 3900, q: 6, vol: 0.108 },
  { rub: true, at: 0.13, dur: 0.09, f: 3300, to: 2600, q: 4, vol: 0.084 },
]);

/* ── 검수 ─────────────────────────────────────────── */

/** 검수에서 물렸다. 나무가 안 맞아 둔하게 두 번. */
export const reject = () => play([
  { rub: true, dur: 0.07, f: 500, q: 1.0, vol: 0.168 },
  { f: 110, to: 82, dur: 0.1, vol: 0.288 },
  { rub: true, at: 0.12, dur: 0.08, f: 430, q: 1.0, vol: 0.144 },
  { f: 96, to: 70, at: 0.12, dur: 0.13, vol: 0.264 },
]);

/*
 * 끝없이 풀기에서 기회가 하나 깎였다.
 * 판 물림과 같은 소리로 두었더니 "틀렸다" 와 "기회가 줄었다" 가 안 갈렸다. 여기서는
 * 뒤에 낮게 떨어지는 것을 하나 더 붙여, 무언가를 잃었다는 것이 들리게 한다.
 */
export const miss = () => play([
  { rub: true, dur: 0.07, f: 480, q: 1.0, vol: 0.168 },
  { f: 110, to: 80, dur: 0.1, vol: 0.288 },
  { f: 78, to: 46, at: 0.16, dur: 0.32, vol: 0.216 },
]);

/*
 * 판을 맺었다. **도장 찍는 소리 하나.**
 *
 * 등급마다 다른 가락을 냈더니 그것부터가 만화였다. 이 게임에서 판이 맺히는 순간에
 * 실제로 나는 소리는 도장이 종이에 닿는 소리 하나뿐이다. 잘했는지 아닌지는 도장의
 * 글자와 검수 창이 말한다 — 소리까지 거들 일이 아니다.
 *
 * 세 겹이다. 인주 묻은 도장이 종이에 눌리는 마찰, 상을 치는 몸통, 그리고 종이가
 * 눌리며 나는 짧은 바스락.
 */
export const stamp = () => play([
  { rub: true, dur: 0.05, f: 1500, to: 600, q: 0.9, vol: 0.24 },
  { f: 105, to: 62, dur: 0.16, vol: 0.48 },
  { rub: true, at: 0.04, dur: 0.1, f: 700, to: 380, q: 0.7, vol: 0.144 },
]);

/** 예전 이름. 등급은 더 보지 않는다. */
export const clear = () => stamp();
