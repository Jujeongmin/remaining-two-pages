import { N, H } from '../core/grid.js';
import { cam, project } from './camera.js';
import { t } from '../i18n/index.js';

/*
 * 부지를 그린다. 축에 나란한 정육면체만 놓이므로, 칸 한가운데의 카메라 거리로 정렬해
 * 먼 것부터 칠하면 가림이 정확히 맞는다. 그려 넣는 순서가 곧 눌리는 순서이기도 해서,
 * 눈에 보이는 것이 눌린다. 면은 바깥을 향한 것만 남기고 뒤쪽을 향한 면은 버린다.
 */
const ptsOf = (ps) => ps.map((p) => `${p.sx.toFixed(1)},${p.sy.toFixed(1)}`).join(' ');
const hOf = (y) => H - 1 - y;  // 위쪽 줄이 높은 자리다

/*
 * 보이는 범위. 돌리는 동안 판이 커졌다 작아졌다 하면 눈이 어지러우므로 한 번 정해 두고
 * 안 바꾼다. 다만 그 값을 어림으로 잡아 두면 눕혔을 때 글자와 모서리가 잘려 나간다.
 * 그래서 돌릴 수 있는 모든 각도를 미리 훑어, 어느 각도에서도 안 잘리는 크기를 구해 둔다.
 */
function edgesOf() {
  const e = [];
  for (const x of [0, N]) for (const d of [0, N]) for (const z of [0, H]) e.push([x, d, z]);
  // 바닥에 적는 글자도 범위 안에 들어와야 한다. 글자는 판 가장자리에 바짝 붙여 둔다.
  e.push([N / 2, -0.9, 0], [-0.9, N / 2, 0], [N / 2, N + 0.9, 0], [N + 0.9, N / 2, 0]);
  return e;
}

/*
 * 지금 각도에서 판이 차지하는 넓이. 좌우로 도는 것(yaw)은 한 바퀴 훑어 가장 넓을 때로
 * 잡는다. 그래야 팽이처럼 돌려도 판 크기가 그대로다. 위아래로 눕히는 것(pitch)은 자주
 * 건드리지 않으므로 그때그때 다시 잰다. 그러면 평소 시점에서 판이 화면을 꽉 채운다.
 *
 * 한 번 잰 값은 적어 둔다. 끄는 동안 같은 각도가 여러 번 들어오기 때문이다.
 */
const fitCache = new Map();
function fitFor(pitch) {
  const key = `${pitch.toFixed(2)}|${N}x${H}`;   // 판 크기가 바뀌면 다시 잰다
  const hit = fitCache.get(key);
  if (hit) return hit;

  const cp = Math.cos(pitch), sp = Math.sin(pitch);
  const edges = edgesOf();
  let mx = 0, my = 0;
  for (let i = 0; i < 24; i++) {
    const yaw = i * Math.PI / 12;
    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    for (const [gx, gd, gz] of edges) {
      const cx = gx - N / 2, cd = gd - N / 2, cz = gz - H / 2;
      const rx = cx * cy - cd * sy, rd = cx * sy + cd * cy;
      mx = Math.max(mx, Math.abs(rx));
      my = Math.max(my, Math.abs(-rd * sp - cz * cp));
    }
  }
  const fit = { x: mx + 0.3, y: my + 0.3 };   // 선 굵기만큼 여유
  fitCache.set(key, fit);
  return fit;
}

/* 정육면체 여섯 면. 꼭짓점은 바깥에서 볼 때 한 방향으로 돌게 적었다. 그래서 화면에
 * 옮긴 뒤 넓이의 부호만 보면 이 면이 우리 쪽인지 반대쪽인지 알 수 있다.
 * shade 는 밝기 단계로, 면 방향마다 달라야 모서리가 눈에 잡힌다. */
const FACES = [
  { v: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]], shade: 0 },
  { v: [[0, 0, 0], [0, 1, 0], [1, 1, 0], [1, 0, 0]], shade: 3 },
  { v: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]], shade: 1 },
  { v: [[1, 1, 0], [0, 1, 0], [0, 1, 1], [1, 1, 1]], shade: 2 },
  { v: [[0, 1, 0], [0, 0, 0], [0, 0, 1], [0, 1, 1]], shade: 2 },
  { v: [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]], shade: 1 },
];

/* 나무는 토막마다 색이 조금씩 다르다. 똑같은 색으로 예순네 개를 세우면 플라스틱으로 보인다.
 * 자리에서 뽑은 값으로 세 벌 중 하나를 고른다. 늘 같은 자리는 늘 같은 색이다. */
const SOLID_SETS = [
  ['#c39a5c', '#a87f45', '#8a6636', '#6d502a'],
  ['#c9a267', '#b08750', '#916d3d', '#735730'],
  ['#bb9251', '#a1783f', '#835f30', '#664a25'],
];
const tintOf = (x, y, d) => (x * 7 + y * 13 + d * 29) % SOLID_SETS.length;
/* 빈 자리는 납작한 한 색이다. 면마다 밝기를 달리하면 예순네 개가 저마다 입체로 보여
 * 세운 자재와 헷갈린다. 자리는 자리일 뿐이라는 것이 한눈에 보여야 한다. */
const GHOST_FILL = '#c9b894';
const GHOST_LINE = '#8f7c58';

/**
 * shades 가 목록이면 면마다 밝기를 달리하고, 색 하나면 여섯 면을 같은 색으로 칠한다.
 * 빈 자리는 예순네 개나 되므로 한 색으로 납작하게 칠해야 화면이 어지럽지 않다.
 */
/*
 * 나뭇결 그림. 넣으면 면마다 무늬가 깔리고, 없으면 아래의 결 선만으로 간다.
 * 그림은 반듯한 네모인데 면은 기울어져 있으므로, 면이 놓인 방향대로 무늬도 기울여야
 * 스티커처럼 떠 보이지 않는다. 기울이는 값은 판을 돌릴 때마다 다시 잰다.
 */
let woodArt = null;
export function setWoodArt(top, side) { woodArt = { top, side }; }

/** 면 종류마다 무늬를 어느 방향으로 기울일지. 단위 정육면체의 모서리를 화면에 옮겨 잰다. */
function woodDefs() {
  if (!woodArt) return '';
  const o = project(0, 0, 0);
  const ex = project(1, 0, 0), ed = project(0, 1, 0), ez = project(0, 0, 1);
  const v = (p) => [p.sx - o.sx, p.sy - o.sy];
  const [xu, xv] = v(ex), [du, dv] = v(ed), [zu, zv] = v(ez);

  const pat = (id, href, a, b) =>
    `<pattern id="${id}" patternUnits="userSpaceOnUse" width="1" height="1"`
    + ` patternTransform="matrix(${a[0].toFixed(3)} ${a[1].toFixed(3)} ${b[0].toFixed(3)} ${b[1].toFixed(3)} ${o.sx.toFixed(1)} ${o.sy.toFixed(1)})">`
    + `<image href="${href}" x="0" y="0" width="1" height="1" preserveAspectRatio="none"/></pattern>`;

  return '<defs>'
    + pat('wood-top', woodArt.top, [xu, xv], [du, dv])      // 위를 보는 면: x·d 로 펼친다
    + pat('wood-dn', woodArt.side, [xu, xv], [zu, zv])      // 앞뒤를 보는 면: x·z
    + pat('wood-xn', woodArt.side, [du, dv], [zu, zv])      // 좌우를 보는 면: d·z
    + '</defs>';
}

/* 면이 어느 무늬를 쓰는지. FACES 차례와 짝이 맞아야 한다. */
const FACE_PAT = ['wood-top', 'wood-top', 'wood-dn', 'wood-dn', 'wood-xn', 'wood-xn'];

/* 결 선. 면의 마주 보는 두 모서리 사이를 몇 등분해 선을 긋는다. 톱으로 켠 나무는
 * 면마다 결이 한 방향으로 나 있으므로, 이 몇 줄만으로도 나무처럼 읽힌다. */
const GRAIN_AT = [0.28, 0.52, 0.78];
function grainSVG(ps) {
  let out = '';
  for (const k of GRAIN_AT) {   // t 는 말 꾸러미가 쓰고 있으므로 이름을 달리한다
    const ax = ps[0].sx + (ps[3].sx - ps[0].sx) * k, ay = ps[0].sy + (ps[3].sy - ps[0].sy) * k;
    const bx = ps[1].sx + (ps[2].sx - ps[1].sx) * k, by = ps[1].sy + (ps[2].sy - ps[1].sy) * k;
    out += `<line x1="${ax.toFixed(1)}" y1="${ay.toFixed(1)}" x2="${bx.toFixed(1)}" y2="${by.toFixed(1)}"`
      + ` stroke="#5c421f" stroke-width="0.6" stroke-opacity="0.28"/>`;
  }
  return out;
}

function cubeSVG(ox, od, oz, size, shades, stroke = '#3a2c18') {
  let out = '';
  const wood = Array.isArray(shades);
  FACES.forEach((f, fi) => {
    const ps = f.v.map(([a, b, c]) => project(ox + a * size, od + b * size, oz + c * size));
    let area = 0;
    for (let i = 0; i < 4; i++) { const p = ps[i], q = ps[(i + 1) % 4]; area += p.sx * q.sy - q.sx * p.sy; }
    if (area >= 0) return;  // 반대쪽을 향한 면. 그려 봐야 앞면에 덮인다.
    const pts = ptsOf(ps);
    const fill = wood ? shades[f.shade] : shades;
    out += `<polygon points="${pts}" fill="${fill}" stroke="${stroke}" stroke-width="1"/>`;
    if (!wood) return;
    // 무늬는 색 위에 옅게 덮는다. 면마다 다른 밝기를 살리려면 색을 덮어 버리면 안 된다.
    if (woodArt) out += `<polygon points="${pts}" fill="url(#${FACE_PAT[fi]})" opacity="0.42"/>`;
    else out += grainSVG(ps);
  });
  return out;
}

/**
 * 부지 한 장을 그린다. 누르는 것은 여기서 다루지 않는다. 그릴 때마다 노드마다
 * 손잡이를 다시 달면 돌리는 동안 그 일이 매번 되풀이된다. 대신 바깥에서 부지 전체에
 * 한 번만 달아 두고, 눌린 칸은 data- 값으로 알아낸다.
 */
export function drawScene(svg, a, floor, canPlace) {
  const parts = [woodDefs()];

  // 바닥 격자. 돌리고 나서도 어디가 어느 쪽인지 잡아 주는 것은 이것뿐이다.
  for (let i = 0; i <= N; i++) {
    const a1 = project(i, 0, 0), a2 = project(i, N, 0);
    const b1 = project(0, i, 0), b2 = project(N, i, 0);
    parts.push(`<line x1="${a1.sx.toFixed(1)}" y1="${a1.sy.toFixed(1)}" x2="${a2.sx.toFixed(1)}" y2="${a2.sy.toFixed(1)}" stroke="#a8946c"/>`);
    parts.push(`<line x1="${b1.sx.toFixed(1)}" y1="${b1.sy.toFixed(1)}" x2="${b2.sx.toFixed(1)}" y2="${b2.sy.toFixed(1)}" stroke="#a8946c"/>`);
  }
  /* 어느 쪽에서 본 도면인지 바닥 가장자리에 적어 둔다. 돌리면 글자도 같이 돈다.
   * 자리는 늘 그 축의 시작 쪽이다. 가까운 쪽으로 옮겨 다니면 읽기는 편해도 거짓말이 된다.
   * 대신 맨 나중에 그리고 글자 뒤에 종이색 테를 둘러, 자재에 가려도 읽히게 한다. */
  const marks = [];
  const mark = (gx, gd, text) => {
    const p = project(gx, gd, 0);
    marks.push(`<text x="${p.sx.toFixed(1)}" y="${p.sy.toFixed(1)}" fill="#6b5a3c" font-size="11"`
      + ` font-family="monospace" text-anchor="middle"`
      + ` stroke="#d9cba8" stroke-width="3" paint-order="stroke">${text}</text>`);
  };

  /* 세운 자재와 빈 자리를 한 목록에 담는다. 빈 자리는 칸 한가운데에 작게 그려서 뒤쪽
   * 자재를 덮지 않는다. 자재를 다 쓰면 빈 자리를 아예 그리지 않아, 이제 뺄 수밖에
   * 없다는 것이 눈으로 바로 보인다. */
  /*
   * 층 고르개. floor 는 아래에서부터 센 층수이고, 0 이면 어느 층에나 세울 수 있다.
   *
   * 세운 자재는 층을 골라도 그대로 다 보인다. 감추거나 흐리게 하면 지어 놓은 것이
   * 무슨 꼴인지 볼 수가 없다. 층이 가르는 것은 빈 자리다. 고른 층에만 자리를 띄우면
   * 예순네 개가 열여섯 개로 줄어 어디를 찍는지 헷갈리지 않는다.
   */
  const activeZ = floor ? floor - 1 : -1;

  const cells = [];
  for (let d = 0; d < N; d++) for (let y = 0; y < H; y++) for (let x = 0; x < N; x++) {
    const z = hOf(y);
    const solid = a[d][y][x];
    if (!solid && (!canPlace || (floor && z !== activeZ))) continue;
    cells.push({ x, y, d, z, solid, depth: project(x + 0.5, d + 0.5, z + 0.5).depth });
  }
  cells.sort((p, q) => q.depth - p.depth);  // 먼 것부터 칠한다

  /* 빈 자리 표시의 한 변. 실제 자재와 같은 한 칸으로 키워 보았더니, 앞칸 표시가 뒤칸을
   * 통째로 가려 안쪽에 자재를 세울 수가 없었다. 자리는 작게 두어야 뒤가 뚫린다. */
  const GH = 0.34;
  for (const c of cells) {
    const size = c.solid ? 1 : GH, off = c.solid ? 0 : (1 - GH) / 2;
    parts.push(
      `<g class="${c.solid ? 'cube' : 'ghost'}" data-d="${c.d}" data-y="${c.y}" data-x="${c.x}" data-solid="${c.solid ? 1 : 0}">`
      + (c.solid
        ? cubeSVG(c.x + off, c.d + off, c.z + off, size, SOLID_SETS[tintOf(c.x, c.y, c.d)])
        : cubeSVG(c.x + off, c.d + off, c.z + off, size, GHOST_FILL, GHOST_LINE))
      + '</g>',
    );
  }

  // d 가 가로이므로 정면도는 x=0 모서리에서, 측면도는 d=0 모서리에서 본 것이다.
  mark(-0.6, N / 2, t('scene.frontSide'));
  mark(N / 2, -0.6, t('scene.sideSide'));
  parts.push(...marks);

  // 실제 크기는 CSS 가 정하고, 남는 자리에 맞춰 저절로 줄어든다.
  const fit = fitFor(cam.pitch);
  const rx = cam.S * fit.x, ry = cam.S * fit.y;
  svg.setAttribute('viewBox', `${-rx} ${-ry} ${2 * rx} ${2 * ry}`);
  svg.innerHTML = parts.join('');
}
