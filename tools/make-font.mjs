/*
 * 명조 글꼴을 게임이 실제로 쓰는 글자만 남기고 잘라 낸다.
 *
 * 통째로 넣으면 3MB 다. 한글 글꼴은 자모가 아니라 완성된 음절마다 한 글자씩 들어 있어
 * 11172 자가 통으로 담기기 때문이다. 그중 이 게임이 쓰는 것은 몇백 자뿐이다.
 *
 * ── 어디서 글자를 긁나
 *
 * 한글은 **빌드된 꾸러미**에서 긁는다. 소스에서 긁으면 뒤에 누가 말을 늘렸을 때 여기
 * 목록에 없는 파일이면 그 글자가 조용히 빠진다. 빌드된 것은 주석이 걷혀 있어 화면에
 * 나갈 말만 남으므로, 이보다 정확한 바닥이 없다.
 *
 * 한자와 나머지는 한국어 쪽에서만 긁는다. 꾸러미에는 중국어 말도 같이 들어 있어서
 * 한자를 통째로 긁으면 쓰지도 않는 수천 자가 딸려 온다.
 *
 * ── 한국어만 자른다
 *
 * 일본어·중국어까지 담으면 한자가 통째로 따라와 크기가 몇 배가 되고, 담더라도 가나만
 * 이 글꼴로 뜨고 한자는 딴 글꼴로 떠서 한 줄 안에서 글씨체가 갈린다. 그쪽은 기기에
 * 있는 명조를 그대로 쓰게 두는 편이 낫다. style.css 가 html[lang="ko"] 에만 건다.
 *
 * 쓰기: npm run build 를 먼저 돌린 뒤 node tools/make-font.mjs
 */
import fs from 'fs';
import path from 'path';
import subsetFont from 'subset-font';

const ROOT = path.resolve(import.meta.dirname, '..');
const SRC = path.join(ROOT, 'assets-src/font');
/* public/ 이 아니라 src/ 아래에 둔다. public/ 은 Vite 가 그대로 복사만 하므로 주소를
 * 직접 맞춰야 하는데, CSS 의 상대 주소는 문서가 아니라 스타일시트를 기준으로 풀려
 * 어긋난다. src/ 에 두면 Vite 가 주소를 고쳐 주고 이름에 해시도 붙여 준다. */
const OUT = path.join(ROOT, 'game/src/fonts');
const DIST = path.join(ROOT, 'dist/assets');

if (!fs.existsSync(DIST)) {
  console.error('dist 가 없다. npm run build 를 먼저 돌릴 것.');
  process.exit(1);
}

const chars = new Set();

/* 늘 있어야 하는 것. 숫자와 문장부호는 말 사이에 섞여 들어오고, 라틴은 섞어 쓴 이름에 나온다. */
for (const c of ' !"#$%&\'()*+,-./0123456789:;<=>?@[\\]^_`{|}~'
  + 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
  + '·—–…‘’“”「」『』〈〉《》×÷±°′″→←↑↓▲▼◀▶■□●○◆◇★☆') chars.add(c);

/* 한글은 꾸러미 전부에서. 어느 파일에 적었든 여기로 모인다. */
const bundle = fs.readdirSync(DIST).filter((f) => f.endsWith('.js'))
  .map((f) => fs.readFileSync(path.join(DIST, f), 'utf8')).join('')
  + fs.readFileSync(path.join(ROOT, 'dist/index.html'), 'utf8');
for (const c of bundle) {
  const u = c.codePointAt(0);
  if ((u >= 0xac00 && u <= 0xd7a3) || (u >= 0x3130 && u <= 0x318f)) chars.add(c);
}

/* 한자는 한국어 쪽에서만. 등급의 甲乙丙 같은 것들이다. */
const KO = ['game/src/i18n/ko.js', 'game/src/game/dialogue.js', 'game/index.html'];
for (const rel of KO) {
  for (const c of fs.readFileSync(path.join(ROOT, rel), 'utf8')) {
    const u = c.codePointAt(0);
    if (u >= 0x4e00 && u <= 0x9fff) chars.add(c);
  }
}

const text = [...chars].sort().join('');
const count = (lo, hi) => [...chars].filter((c) => {
  const u = c.codePointAt(0); return u >= lo && u <= hi;
}).length;

fs.mkdirSync(OUT, { recursive: true });

/* 굵은 짝도 같이 자른다. 창 제목(h2)이 굵게 나가는데, 굵은 짝이 없으면 브라우저가
 * 억지로 부풀린 가짜 굵기를 쓴다. 명조는 그 티가 특히 심하다. */
const FACES = [
  ['NanumMyeongjo-Regular.ttf', 'myeongjo-400.woff2', 400],
  ['NanumMyeongjo-Bold.ttf', 'myeongjo-700.woff2', 700],
];

console.log(`글자 ${chars.size}자 — 한글 ${count(0xac00, 0xd7a3)} · 한자 ${count(0x4e00, 0x9fff)}\n`);

let total = 0;
for (const [src, out, weight] of FACES) {
  const from = path.join(SRC, src);
  if (!fs.existsSync(from)) { console.log(`  ${src} 없음 — 건너뜀`); continue; }
  const before = fs.statSync(from).size;
  const buf = await subsetFont(fs.readFileSync(from), text, { targetFormat: 'woff2' });
  fs.writeFileSync(path.join(OUT, out), buf);
  total += buf.length;
  console.log(`  ${out}  ${(before / 1024 / 1024).toFixed(1)}MB -> ${(buf.length / 1024).toFixed(0)}KB  (${weight})`);
}
console.log(`\n합쳐 ${(total / 1024).toFixed(0)}KB`);
