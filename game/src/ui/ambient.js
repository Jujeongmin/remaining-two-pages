import { context, volume } from './sound.js';

/*
 * 판에서 나는 소리. 가야금 한 대가 옆방에서 혼자 뜯는 정도.
 *
 * ── 왜 파일이 아니라 코드인가 ─────────────────────────
 *
 * 판은 사람이 가장 오래 머무는 화면이다. 1분짜리 가락을 스무 번 돌리면 그 스무 번째에는
 * 다음 음이 무엇인지까지 외워져서, 음악이 아니라 소음이 된다. 여기서는 음을 그때그때
 * 뽑는다. 같은 자리로 절대 돌아오지 않으니 외워질 것이 없다.
 *
 * 받아 올 것도 없다. 이음매도 없다. 값도 라이선스도 없다.
 *
 * ── 무엇을 뽑는가 ────────────────────────────────────
 *
 * 평조(平調) 다섯 음만 쓴다. 다섯 음 안에서는 어느 둘을 겹쳐도 서로 부딪지 않아서,
 * 아무렇게나 뽑아도 곡처럼 들린다. 이것이 이 방식이 서는 자리다.
 *
 * 한 음은 세 겹이다 — 손톱이 줄에 닿는 소리, 줄이 우는 몸통, 그리고 방. 뜯은 뒤에
 * 음을 살짝 아래로 흘리는데(농현), 이것이 없으면 실로폰이 된다.
 *
 * 음과 음 사이를 넉넉히 둔다. 셈을 하는 화면이라 소리가 촘촘하면 그 자체가 방해다.
 */

/* 평조 다섯 음. 으뜸음에서 몇 반음 위인지. */
const SCALE = [0, 2, 5, 7, 9];

/* 으뜸음. 낮게 잡아야 앞으로 나서지 않는다. */
const ROOT = 196;        // 솔

/* 음 사이 (초). 이보다 촘촘하면 판을 세는 데 걸린다. */
const GAP = [1.8, 4.2];

/* 몇 옥타브에 걸쳐 뽑을지. 아래쪽을 자주 뽑아 무게를 아래에 둔다. */
const OCTAVES = [-1, 0, 0, 1];

let timer = null;
let on = false;
let level = 0.4;
let bus = null;
let room = null;

export function setLevel(v) {
  level = Math.max(0, Math.min(1, v));
  if (bus) bus.gain.value = gainOf();
}

/* 효과음 크기와 음악 크기를 함께 본다. 소리를 통째로 끄면 이것도 같이 죽어야 한다. */
function gainOf() { return level * 0.5 * (volume() > 0 ? 1 : 0); }

/*
 * 방. 잡음을 지수로 죽인 것을 울림으로 쓴다.
 *
 * 울림이 없으면 음이 허공에서 뚝 끊겨 전자음으로 들린다. 방 하나만 붙여도 "어딘가에서
 * 나는 소리" 가 된다. 짧게 잡는다 — 길면 목욕탕이 된다.
 */
function makeRoom(ac) {
  const dur = 1.6;
  const n = Math.floor(ac.sampleRate * dur);
  const buf = ac.createBuffer(2, n, ac.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < n; i++) {
      // 뒤로 갈수록 급히 죽는다. 앞쪽만 남기면 방이 좁게 들린다.
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.6);
    }
  }
  const cv = ac.createConvolver();
  cv.buffer = buf;
  return cv;
}

function setup(ac) {
  if (bus) return;
  bus = ac.createGain();
  bus.gain.value = gainOf();

  // 높은 쪽을 깎는다. 뜯는 소리가 날카로우면 조용한 화면에서 유난히 튄다.
  const soft = ac.createBiquadFilter();
  soft.type = 'lowpass';
  soft.frequency.value = 2600;

  room = ac.createConvolver ? makeRoom(ac) : null;
  const wet = ac.createGain();
  wet.gain.value = 0.5;

  soft.connect(bus);
  if (room) { soft.connect(room).connect(wet).connect(bus); }
  bus.connect(ac.destination);
  bus._in = soft;
}

/** 한 음. 손톱 · 줄 · 흘림. */
function pluck(ac, f, at, vol) {
  const t0 = ac.currentTime + at;
  const dst = bus._in;

  // 손톱이 줄에 닿는다. 아주 짧게.
  const n = Math.floor(ac.sampleRate * 0.03);
  const nb = ac.createBuffer(1, n, ac.sampleRate);
  const nd = nb.getChannelData(0);
  for (let i = 0; i < n; i++) nd[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const ns = ac.createBufferSource();
  ns.buffer = nb;
  const nbp = ac.createBiquadFilter();
  nbp.type = 'bandpass';
  nbp.frequency.value = f * 6;
  nbp.Q.value = 1.4;
  const ng = ac.createGain();
  ng.gain.value = vol * 0.5;
  ns.connect(nbp).connect(ng).connect(dst);
  ns.start(t0);
  ns.stop(t0 + 0.05);

  /* 줄. 두 겹으로 두되 위 겹은 아주 작게. 한 겹만 쓰면 소리가 얇아 삐 소리에 가깝다.
   * 뜯은 뒤 음을 반음의 몇 분의 일쯤 아래로 흘린다. 이것이 농현 흉내다. */
  const dur = 2.2 + Math.random() * 1.4;
  [[1, 0.9, 'triangle'], [2, 0.16, 'sine']].forEach(([mul, amp, type]) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f * mul, t0);
    o.frequency.linearRampToValueAtTime(f * mul * 0.994, t0 + 0.35);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol * amp), t0 + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(dst);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  });
}

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function noteAt(step) {
  const oct = pick(OCTAVES);
  const semis = pick(SCALE) + oct * 12;
  return ROOT * Math.pow(2, semis / 12);
}

function step() {
  const ac = context();
  if (!ac || !on) return;
  setup(ac);
  bus.gain.value = gainOf();

  const f = noteAt();
  pluck(ac, f, 0, 0.16);

  /* 가끔 두 음을 붙여 짧은 가락을 만든다. 늘 한 음씩만 나면 시계 소리가 된다. */
  if (Math.random() < 0.35) {
    const near = ROOT * Math.pow(2, (pick(SCALE) + pick([0, 0, 1]) * 12) / 12);
    pluck(ac, near, 0.28 + Math.random() * 0.25, 0.1);
  }

  const wait = GAP[0] + Math.random() * (GAP[1] - GAP[0]);
  timer = setTimeout(step, wait * 1000);
}

export function start() {
  if (on) return;
  on = true;
  // 들어오자마자 첫 음이 나면 화면이 바뀐 것과 겹쳐 어수선하다. 한 박 쉬고 시작한다.
  timer = setTimeout(step, 900);
}

export function stop() {
  on = false;
  if (timer) { clearTimeout(timer); timer = null; }
  // 이미 울리고 있는 음은 그냥 두어 스스로 잦아들게 한다. 끊으면 그 끊김이 들린다.
}
