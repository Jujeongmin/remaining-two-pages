import { context } from './sound.js';

/*
 * 배경 음악.
 *
 * 효과음과 달리 이것만은 파일을 쓴다. 몇 분짜리 가락을 코드로 만들어 낼 수는 없다.
 * 파일이 없으면 아무 일도 안 하고 조용히 빠진다 — 음악을 못 구해도 게임은 그대로 돈다.
 *
 * 넣을 자리: game/public/audio/bgm.ogg (없으면 bgm.mp3 를 찾는다)
 *
 * 소리통은 효과음과 같은 것을 쓴다. 통이 둘이면 소리 크기가 따로 놀고, 폰에서는 통
 * 하나가 곧 배터리다.
 *
 * 브라우저는 사람이 누르기 전에 소리를 못 내게 막는다. 그래서 첫 누름을 기다렸다가
 * 튼다. 화면을 열자마자 틀려고 하면 막히고, 막힌 뒤에는 다시 시도해도 잘 안 붙는다.
 */
const SRC = ['./audio/bgm.ogg', './audio/bgm.mp3'];

let buffer = null;
let node = null;
let gain = null;
let level = 0.4;      // 음악은 효과음보다 낮게 깐다. 같은 크기면 말소리를 덮는다
let want = false;     // 틀어 두기로 했는가
let loading = false;

/*
 * 눌러 두기.
 *
 * 판에 들어가면 음악을 반쯤 낮추고 높은 쪽을 깎는다. 판을 푸는 동안은 들여다보고
 * 세는 시간이라, 앞에서 울리는 음악이 그대로 있으면 셈이 흐트러진다.
 *
 * 아예 끄지는 않는다. 화면을 옮길 때마다 음악이 났다 말았다 하면 그 자체가 눈에 걸리고,
 * 무엇보다 사람이 가장 오래 머무는 화면이 판이다. 거기서 조용하면 이 게임에는 음악이
 * 없는 것이나 마찬가지다. 소리를 낮추고 멀리 두면 "다른 방에서 들리는 소리" 가 된다.
 */
/*
 * 판에서는 이 곡이 아예 물러난다. 그 자리를 판 전용 소리(ui/ambient.js)가 대신한다.
 * 멈추지 않고 소리만 0 으로 내린다 — 멈췄다 다시 틀면 늘 같은 데서 시작해, 판을
 * 드나들 때마다 같은 도입부를 듣게 된다.
 */
const DUCK = 0;
let ducked = false;
let tone = null;        // 높은 쪽을 깎는 체

export function duck(on) {
  ducked = !!on;
  apply();
}

function apply() {
  const ac = context();
  if (!gain || !ac) return;
  const at = ac.currentTime;
  // 뚝 바뀌면 그 자체가 소리가 된다. 반 초에 걸쳐 넘긴다.
  gain.gain.cancelScheduledValues(at);
  gain.gain.setValueAtTime(gain.gain.value, at);
  gain.gain.linearRampToValueAtTime(Math.max(0.0001, level * (ducked ? DUCK : 1)), at + 0.7);
  if (tone) {
    tone.frequency.cancelScheduledValues(at);
    tone.frequency.setValueAtTime(tone.frequency.value, at);
    tone.frequency.linearRampToValueAtTime(ducked ? 700 : 16000, at + 0.5);
  }
}

export function setLevel(v) {
  level = Math.max(0, Math.min(1, v));
  apply();
  if (level === 0) stop();
  else if (want) start();
}


/** 파일을 받아 둔다. 없으면 거짓을 돌려주고 다시는 찾지 않는다. */
async function load(ac) {
  if (buffer || loading) return buffer;
  loading = true;
  for (const url of SRC) {
    try {
      const res = await fetch(new URL(url, document.baseURI).href);
      if (!res.ok) continue;
      buffer = await ac.decodeAudioData(await res.arrayBuffer());
      break;
    } catch { /* 다음 것을 본다 */ }
  }
  loading = false;
  return buffer;
}

/*
 * 소리가 실제로 있는 구간. 앞뒤에 붙은 무음을 잘라 낸다.
 *
 * 파일을 다시 만들지 않고 도는 지점만 옮긴다. 받아 온 음원마다 여백 길이가 다른데,
 * 여기서 재면 어떤 파일을 넣어도 그 파일에 맞게 돈다.
 *
 * 무음선은 그 곡의 가장 큰 소리를 기준으로 잡는다. 절대값으로 잡으면 조용한 곡은
 * 통째로 무음으로 읽히고 시끄러운 곡은 여백이 안 잘린다.
 */
let cut = null;
function edges(buf) {
  if (cut) return cut;
  const L = buf.getChannelData(0);
  const R = buf.numberOfChannels > 1 ? buf.getChannelData(1) : L;
  const win = Math.floor(buf.sampleRate * 0.02);

  let peak = 0;
  for (let i = 0; i < L.length; i += 97) peak = Math.max(peak, Math.abs(L[i]));
  const quiet = peak * 0.008;

  const loud = (i) => {
    let x = 0;
    for (let k = 0; k < win; k++) {
      const v = Math.max(Math.abs(L[i + k] || 0), Math.abs(R[i + k] || 0));
      x += v * v;
    }
    return Math.sqrt(x / win) >= quiet;
  };

  let a = 0;
  while (a < L.length - win && !loud(a)) a += win;
  let b = L.length - win;
  while (b > a + win && !loud(b)) b -= win;

  cut = { from: a / buf.sampleRate, to: Math.min(buf.duration, (b + win) / buf.sampleRate) };
  return cut;
}

/**
 * 튼다. 이미 틀고 있으면 아무 일도 안 한다.
 * 소리통이 아직 없거나(첫 누름 전) 파일이 없으면 조용히 물러난다.
 */
export async function start() {
  want = true;
  if (node || level === 0) return;
  const ac = context();
  if (!ac) return;                    // 소리를 꺼 두었거나 아직 통이 없다
  if (!(await load(ac))) return;      // 음악 파일이 없다
  if (node) return;                   // 받아 오는 동안 또 불렸다

  gain = ac.createGain();
  gain.gain.value = level * (ducked ? DUCK : 1);
  tone = ac.createBiquadFilter();
  tone.type = 'lowpass';
  tone.frequency.value = ducked ? 900 : 16000;
  node = ac.createBufferSource();
  node.buffer = buffer;
  node.loop = true;
  /* 앞뒤 무음을 빼고 돈다. 받아 온 음원은 끝에 몇 초씩 여백이 붙어 있는 일이 흔한데,
   * 그대로 돌리면 한 바퀴마다 그만큼 조용해져 음악이 끊긴 것처럼 들린다. */
  const span = edges(buffer);
  node.loopStart = span.from;
  node.loopEnd = span.to;
  node.connect(tone).connect(gain).connect(ac.destination);
  try { node.start(0, span.from); } catch { node = null; }
}

export function stop() {
  want = false;
  if (!node) return;
  try { node.stop(); } catch { /* 이미 멎었다 */ }
  node = null;
  gain = null;
  tone = null;
}

/*
 * 첫 누름에 튼다. 화면을 짤 때 한 번만 걸어 두면 된다.
 * once 로 걸어 두므로 한 번 붙고 나면 스스로 떨어진다.
 */
export function armAutoStart() {
  const go = () => { start(); };
  addEventListener('pointerdown', go, { once: true });
  addEventListener('keydown', go, { once: true });
}
