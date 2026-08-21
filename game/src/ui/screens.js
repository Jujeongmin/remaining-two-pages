import { gradeName } from '../game/dialogue.js';
import { jobName, stageName } from '../game/stages.js';
import { t } from '../i18n/index.js';
import { resolveFace } from '../game/hero.js';
import * as sound from './sound.js';
import * as bgm from './bgm.js';
import * as ambient from './ambient.js';

/*
 * 화면 갈아 끼우기와 알림창. 한 번에 한 화면만 보인다.
 * 여기서는 무엇을 보여 줄지만 다루고, 무엇을 할지는 부르는 쪽이 정한다.
 */
const SCREENS = { title: '#scr-title', select: '#scr-select', play: '#scr-play' };

export function show(name) {
  for (const [key, sel] of Object.entries(SCREENS)) {
    document.querySelector(sel).hidden = key !== name;
  }
  /* 판에는 판 전용 소리가 따로 난다. 그동안 배경 음악은 물러난다.
   * 두 곡이 겹치면 어느 쪽도 안 들린다. */
  const playing = name === 'play';
  bgm.duck(playing);
  if (playing) ambient.start(); else ambient.stop();
}

export const gradeText = gradeName;

const SEAL = { 3: 'seal-gap', 2: 'seal-eul', 1: 'seal-byeong' };

/**
 * 의뢰 목록. 아직 안 열린 판은 눌리지 않게 두어 어디까지 왔는지 한눈에 보이게 한다.
 * 판 번호는 의뢰를 가로질러 이어지므로, 의뢰를 훑으며 세어 나간다.
 */
export function renderJobList(el, jobs, { bestOf, isUnlocked, onPick }) {
  el.innerHTML = '';
  let index = 0;

  jobs.forEach((job) => {
    const done = job.stages.filter((s) => bestOf(s.id)).length;

    const box = document.createElement('section');
    const head = document.createElement('p');
    head.className = 'job-head';
    head.innerHTML = `<span class="job-name">${jobName(job)}</span>`
      + `<span class="cap">${done} / ${job.stages.length}</span>`;
    box.appendChild(head);

    const grid = document.createElement('div');
    grid.className = 'job-stages';
    job.stages.forEach((s) => {
      const i = index++;
      const open = isUnlocked(i);
      const grade = bestOf(s.id);
      const b = document.createElement('button');
      b.className = 'act stage-btn' + (open ? '' : ' locked');
      b.disabled = !open;

      /* 판마다 세우는 것이 다르므로 그림으로 고르게 한다. 맺은 판에는 그 그림 위에
       * 검수 도장이 찍힌다. 그림이 아직 없으면 알아서 빠지고 이름만 남는다. */
      const thumb = `<img class="stage-thumb" src="./art/stage/${s.id}.webp" alt=""`
        + ` onerror="this.hidden=true">`;
      const stamp = grade
        ? `<img class="stage-stamp" src="./art/${SEAL[grade]}.webp" alt="" onerror="this.hidden=true">`
        : '';
      b.innerHTML = thumb + stamp
        + `<span class="stage-btn-name">${stageName(s)}</span>`
        + `<span class="stage-btn-sub">${open ? (grade ? t('stage.graded', { g: gradeText(grade) }) : t('stage.pieces', { n: s.total || s.keep.length })) : t('stage.locked')}</span>`;
      if (open) b.onclick = () => onPick(i);
      grid.appendChild(b);
    });
    box.appendChild(grid);
    el.appendChild(box);
  });
}

/*
 * 글자 줄여 담기.
 *
 * 말을 바꾸면 같은 단추에 들어갈 글자 길이가 통째로 달라진다(되돌리기 ↔ Undo ↔ 復原).
 * 넘치는 것을 잘라 버리면 무슨 단추인지 알 수 없게 되므로, 먼저 글자를 조금씩 줄여
 * 담아 본다. 아무리 줄여도 안 들어갈 때만 잘린다.
 */
const MIN_PX = 9;
export function fitButtons(root = document) {
  root.querySelectorAll('.act, .stage-btn-name, .stage-btn-sub, .stage-name').forEach((el) => {
    el.style.fontSize = '';
    const start = parseFloat(getComputedStyle(el).fontSize);
    let size = start;
    // 한 번에 재고 한 번에 줄인다. 재고 고치기를 번갈아 하면 화면이 여러 번 다시 계산된다.
    while (size > MIN_PX && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1)) {
      size -= 0.5;
      el.style.fontSize = `${size}px`;
    }
    if (size === start) el.style.fontSize = '';
  });
}

/* ── 알림 ─────────────────────────────────────────────
 * 짧은 말은 창을 띄울 것도 없다. 잠깐 떴다 스스로 사라진다.
 */
let toastTimer = null;
export function toast(msg) {
  let el = document.querySelector('#s-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 's-toast';
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('on'), 1600);
}

/* ── 판을 맺는 창 ─────────────────────────────────── */
const clearSheet = () => document.querySelector('#s-clear');

/** 그림 한 장 얹기. 파일이 아직 없으면 그 자리만 빠지고 나머지는 그대로 뜬다. */
function setArt(el, name) {
  if (!name) { el.hidden = true; return; }
  el.hidden = false;
  el.src = `./art/${resolveFace(name)}.webp`;
  el.onerror = () => { el.hidden = true; };
}

/*
 * 판을 맺는 창은 그림이 작게 들어간다. 반신 그림을 줄이면 얼굴이 뭉개지므로, 작게 봐도
 * 읽히는 캐릭터 그림을 따로 쓴다. 아직 없으면 원래 반신 그림으로 물러나고, 그것도 없으면
 * 말만 남는다.
 */
const CHIBI_MASTER = {
  'master-pleased': 'pleased', 'master-surprised': 'pleased',
  'master-calm': 'calm', 'master-pointing': 'calm',
  'master-stern': 'stern',
};
function chibiOf(name) {
  if (!name) return null;
  if (CHIBI_MASTER[name]) return `chibi-master-${CHIBI_MASTER[name]}`;
  const m = /^apprentice-([mf])(?:-(\w+))?$/.exec(resolveFace(name));
  if (!m) return null;
  const mood = { bright: 'bright', surprised: 'bright', determined: 'plain',
    worried: 'down', tired: 'down' }[m[2]] || 'plain';
  return `chibi-${m[1]}-${mood}`;
}

/** 앞에서부터 있는 그림을 쓴다. 없으면 다음 것, 다 없으면 자리를 비운다. */
function setArtChain(el, names) {
  const list = names.filter(Boolean);
  let i = 0;
  const next = () => {
    if (i >= list.length) { el.hidden = true; return; }
    el.hidden = false;
    el.src = `./art/${list[i++]}.webp`;
  };
  el.onerror = next;
  next();
}

export function openClear({ title, grade = 0, quote = null, reply = null, image = null, icon = null, body = '', input = null, buys = null, list = null, actions = [] }) {
  setArt(document.querySelector('#s-clear-art'), image);
  setArt(document.querySelector('#s-clear-icon'), icon);   // 물건 하나를 작게 보일 때
  document.querySelector('#s-clear-title').textContent = title;

  // 검수 도장. 등급 글자는 도장 아래 작게 남겨 둔다. 도장만으로는 갑인지 을인지 못 읽는 사람이 있다.
  setArt(document.querySelector('#s-clear-seal'), quote && quote.seal);
  const gradeEl = document.querySelector('#s-clear-stars');
  gradeEl.textContent = grade ? t('clear.grade', { g: gradeText(grade) }) : '';
  gradeEl.hidden = !grade;

  // 도편수 한마디. 그림이 아직 없으면 말만 남는다.
  const quoteEl = document.querySelector('#s-clear-quote');
  quoteEl.hidden = !quote;
  if (quote) {
    document.querySelector('#s-clear-quote-text').textContent = quote.text;
    setArtChain(document.querySelector('#s-clear-face'), [chibiOf(quote.face), resolveFace(quote.face)]);
  }

  // 견습이 받는 말. 한 마디 오가야 혼잣말이 아니게 된다.
  const replyEl = document.querySelector('#s-clear-reply');
  replyEl.hidden = !reply;
  if (reply) {
    document.querySelector('#s-clear-reply-text').textContent = reply.text;
    setArtChain(document.querySelector('#s-clear-reply-face'), [chibiOf(reply.face), resolveFace(reply.face)]);
  }

  document.querySelector('#s-clear-body').textContent = body;

  /* 글 적는 칸. 등수 창에서 이름을 적을 때만 쓴다. 이름은 등수에 걸 것이라 등수를
   * 보는 그 자리에서 적는 것이 맞다. 다른 창에서는 아예 안 나온다. */
  const inputRow = document.querySelector('#s-clear-input-row');
  const inputEl = document.querySelector('#s-clear-input');
  inputRow.hidden = !input;
  inputEl.oninput = null;
  if (input) {
    document.querySelector('#s-clear-input-label').textContent = input.label || '';
    inputEl.placeholder = input.placeholder || '';
    inputEl.value = input.value || '';
    inputEl.oninput = (e) => input.onInput(e.target.value);
  }

  /*
   * 가게 칸. 살 것 하나에 큼직한 칸 하나씩.
   *
   * 값을 창 아래 단추 줄에 늘어놓아 보았더니, 닫기와 사기가 같은 꼴로 붙어 있어 무엇이
   * 사는 것인지 한눈에 안 갈렸다. 살 것은 살 것끼리 위에 모으고, 창을 여닫는 단추만
   * 아래에 남긴다. 못 사는 것은 지우지 않고 꺼 둔다 — 무엇이 있는지는 보여야 모을 마음이 선다.
   */
  const buysEl = document.querySelector('#s-clear-buys');
  buysEl.innerHTML = '';
  buysEl.hidden = !buys || !buys.length;
  (buys || []).forEach(({ name, note, cost, afford, onClick }) => {
    const b = document.createElement('button');
    b.className = 'act buy';
    b.disabled = !afford;
    b.innerHTML = `<span class="buy-name">${name}</span>`
      + `<span class="buy-note">${note}</span>`
      + `<span class="buy-cost">${cost}</span>`;
    if (afford) b.onclick = onClick;
    buysEl.appendChild(b);
  });

  // 등수처럼 줄줄이 늘어놓을 것이 있을 때만 쓴다. 글자로만 넣어 꾸밈이 섞이지 않게 한다.
  const listEl = document.querySelector('#s-clear-list');
  listEl.innerHTML = '';
  listEl.hidden = !list || !list.length;
  (list || []).forEach((row) => {
    const li = document.createElement('li');
    li.textContent = row;
    listEl.appendChild(li);
  });

  const box = document.querySelector('#s-clear-actions');
  box.innerHTML = '';
  actions.forEach(({ label, onClick }) => {
    const b = document.createElement('button');
    b.className = 'act big';
    b.textContent = label;
    b.onclick = () => { closeClear(); onClick(); };
    box.appendChild(b);
  });

  sound.open();
  clearSheet().hidden = false;
}

function closeClear() {
  if (!clearSheet().hidden) sound.close();
  clearSheet().hidden = true;
}
