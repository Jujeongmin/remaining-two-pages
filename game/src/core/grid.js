/*
 * 판 한 벌을 다루는 곳. 블록 배열은 [깊이][줄][가로] 순서의 참/거짓 3차원 배열이다.
 * 여기 있는 함수는 화면도 DOM 도 모르고 배열만 만진다.
 */
/*
 * 판 크기. 바닥은 N×N, 높이는 H 줄이다. 의뢰마다 다르므로 판을 열 때 갈아 끼운다.
 *
 * const 가 아니라 let 인 것이 중요하다. 모듈에서 내보낸 값은 살아 있는 이름이라, 여기서
 * 바꾸면 이 값을 가져다 쓰는 쪽에서도 그대로 바뀐다. 판마다 크기를 인자로 들고 다니지
 * 않아도 되는 이유다. 한 번에 한 판만 여는 게임이라 이래도 헷갈릴 일이 없다.
 */
export let N = 4;
export let H = 4;

export function setSize(n, h) { N = n; H = h; }

export function empty() {
  const a = [];
  for (let d = 0; d < N; d++) { a[d] = []; for (let y = 0; y < H; y++) { a[d][y] = []; for (let x = 0; x < N; x++) a[d][y][x] = false; } }
  return a;
}

export function clone(a) { return a.map((L) => L.map((r) => r.slice())); }

/** keep 은 [x, y, d] 목록으로 "여기에 자재가 있다" 를 적은 것이다. */
export function fromKeep(keep) { const a = empty(); keep.forEach(([x, y, d]) => a[d][y][x] = true); return a; }

/*
 * 배열은 [d][y][x] 로 담지만, 어느 축을 가로로 보고 어느 축을 깊이로 볼지는 우리가 정한다.
 * 판을 처음 시점에서 봤을 때 왼쪽 아래 모서리가 정면도 쪽이 되도록, d 를 가로로 삼는다.
 * 그래서 정면도는 x(깊이)를 뭉개고, 측면도는 d(가로)를 뭉갠다.
 */

/*
 * 앞에서 본 모양. 깊이가 뭉개지므로 한 칸이라도 차 있으면 채워진 것으로 보인다.
 *
 * 칸 차례를 뒤집어 담는 것이 중요하다. 처음 시점에서 부지를 보면 d 가 커질수록 왼쪽으로
 * 가는데, 도면을 d 순서 그대로 그리면 도면과 부지가 좌우로 뒤집혀 보인다. 도면을 보고
 * 부지에 손을 얹는 게임이라, 둘이 어긋나면 그 자체가 함정이 된다.
 */
export function front(a) { const g = []; for (let y = 0; y < H; y++) { g[y] = []; for (let d = 0; d < N; d++) g[y][N - 1 - d] = a[d][y].some(Boolean); } return g; }

/** 옆에서 본 모양. 이번엔 가로가 뭉개지고 가로축이 깊이로 바뀐다. */
export function side(a) { const g = []; for (let y = 0; y < H; y++) { g[y] = []; for (let x = 0; x < N; x++) g[y][x] = a.some((L) => L[y][x]); } return g; }

export function count(a) { let n = 0; a.forEach((L) => L.forEach((r) => r.forEach((c) => { if (c) n++; }))); return n; }

export function sameGrid(a, b) { return a.every((r, y) => r.every((c, x) => c === b[y][x])); }
