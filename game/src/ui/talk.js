/*
 * 대화창. 한 번에 한 줄씩 보여 주고, 아무 데나 누르면 다음 줄로 넘어간다.
 *
 * 그림은 있으면 얹고 없으면 그냥 뺀다. 그림이 아직 안 들어왔다고 대사까지 막히면
 * 그림 받아 오기 전까지 게임을 못 만지게 되기 때문이다.
 */
import { resolveFace } from '../game/hero.js';
import * as sound from './sound.js';

const FACE_DIR = './art/';
const missing = new Set();   // 한 번 없다고 확인한 그림은 다시 부르지 않는다

let resolveDone = null;
let lines = [];
let at = 0;

const el = {};
function grab() {
  if (el.box) return;
  el.box = document.querySelector('#s-talk');
  el.face = document.querySelector('#s-talk-face');
  el.who = document.querySelector('#s-talk-who');
  el.text = document.querySelector('#s-talk-text');
  el.skip = document.querySelector('#s-talk-skip');

  el.box.addEventListener('click', (e) => {
    if (e.target === el.skip) return;   // 건너뛰기는 따로 받는다
    if (fillNow()) return;              // 아직 적는 중이면 마저 채우기만 한다
    next();
  });
  el.skip.addEventListener('click', () => finish());
}

/*
 * 글자를 한 자씩 적어 나간다.
 *
 * 대사 전체가 한꺼번에 뜨면 눈이 먼저 다 읽고 손이 바로 넘긴다. 한 자씩 적히면 읽는
 * 속도가 말하는 속도에 붙어, 사람이 말하고 있다는 느낌이 든다.
 *
 * 다 적히기 전에 누르면 그 자리에서 마저 채운다. 기다리게 하는 것이 목적이 아니다.
 * 급한 사람은 두 번 눌러 넘어가면 된다.
 */
const CHAR_MS = 28;
let typer = null;
let typing = false;

function stopTyping() {
  if (typer) { clearInterval(typer); typer = null; }
  typing = false;
}

/** 아직 적는 중이면 그 자리에서 다 채우고 참을 돌려준다. */
function fillNow() {
  if (!typing) return false;
  stopTyping();
  el.text.textContent = lines[at].text;
  return true;
}

function typeOut(text) {
  stopTyping();
  el.text.textContent = '';
  typing = true;
  let i = 0;
  typer = setInterval(() => {
    // 띄어쓰기는 한 번에 넘긴다. 빈칸에서 멈칫하면 글이 뚝뚝 끊겨 보인다.
    do { i++; } while (i < text.length && text[i - 1] === ' ');
    el.text.textContent = text.slice(0, i);
    if (i >= text.length) stopTyping();
  }, CHAR_MS);
}

function render() {
  const line = lines[at];
  el.who.textContent = line.who || '';
  typeOut(line.text);

  // 건너뛰기는 그림이 있든 없든 늘 자리에 있어야 한다. 화면을 덮고 있는 것이 이 창이라,
  // 빠져나갈 문이 안 보이면 눌러도 아무 일이 없는 것처럼 느껴진다.
  el.skip.hidden = false;

  const src = line.face ? FACE_DIR + resolveFace(line.face) + '.webp' : null;
  if (!src || missing.has(src)) {
    el.face.hidden = true;
    return;
  }
  el.face.hidden = false;
  el.face.src = src;
  el.face.onerror = () => { missing.add(src); el.face.hidden = true; };
}

function next() {
  at++;
  if (at >= lines.length) { finish(); return; }
  sound.tick();   // 종이 넘기는 정도로만
  render();
}

function finish() {
  stopTyping();
  el.box.hidden = true;
  const done = resolveDone;
  resolveDone = null;
  lines = [];
  if (done) done();
}

/**
 * 대사 여러 줄을 보여 주고, 다 넘길 때까지 기다린다.
 * lines: [{ who, face, text }]
 */
export function say(list) {
  grab();
  if (!list || !list.length) return Promise.resolve();
  if (resolveDone) finish();   // 앞의 대화가 남아 있으면 접고 새로 연다
  lines = list;
  at = 0;
  el.box.hidden = false;
  render();
  return new Promise((res) => { resolveDone = res; });
}

