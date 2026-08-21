import ko from './ko.js';
import en from './en.js';
import ja from './ja.js';
import zh from './zh.js';

/*
 * 말. 화면에 뜨는 글자는 전부 여기를 거쳐 나간다.
 *
 * 한국어를 바탕으로 삼는다. 다른 말에서 빠진 자리가 있으면 한국어로 메워, 번역이 덜 된
 * 채로 올려도 빈칸이 뜨지는 않게 한다.
 */
const PACKS = { ko, en, ja, zh };
export const LANGS = Object.keys(PACKS).map((id) => ({ id, label: PACKS[id].lang }));

let cur = 'ko';

/** 브라우저가 쓰는 말에서 고른다. 아무것도 안 맞으면 영어로 둔다. */
export function detect() {
  const want = (navigator.languages || [navigator.language || '']).join(',').toLowerCase();
  if (want.includes('ko')) return 'ko';
  if (want.includes('ja')) return 'ja';
  // 번체를 쓰는 곳만 중국어로 본다. 간체는 글자가 달라 이 묶음으로 덮을 수 없다.
  if (/zh-(hant|tw|hk|mo)/.test(want)) return 'zh';
  return 'en';
}

export function setLang(id) {
  cur = PACKS[id] ? id : 'ko';
  document.documentElement.lang = cur === 'zh' ? 'zh-Hant' : cur;
}

export const lang = () => cur;

/** {n} 같은 자리는 넘긴 값으로 채운다. */
export function t(key, vars) {
  const s = PACKS[cur][key] ?? PACKS.ko[key] ?? key;
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] ?? m)) : s;
}

/**
 * 화면에 박아 둔 글자를 한 번에 갈아 끼운다.
 * data-i18n 은 글자, -html 은 굵게 같은 꾸밈이 섞인 글, -aria 는 읽어 주는 이름,
 * -ph 는 빈칸에 흐리게 뜨는 글이다.
 */
export function applyStatic(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  root.querySelectorAll('[data-i18n-html]').forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
  root.querySelectorAll('[data-i18n-aria]').forEach((el) => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
  root.querySelectorAll('[data-i18n-ph]').forEach((el) => { el.placeholder = t(el.dataset.i18nPh); });
}
