import { N, H } from './grid.js';

/*
 * 판 뽑기. 손으로 적을 때와 규칙이 똑같다. 한 줄 안에서 x 도 d 도 겹치면 안 된다.
 * 줄마다 x 를 k 개, d 를 k 개 골라 무작위로 짝지으면 그 줄은 저절로 조건을 만족한다.
 * 줄끼리는 아무 상관이 없으므로 줄별로 따로 뽑아 합치면 그것으로 끝이다.
 * 되물리거나 다시 뽑을 일이 없어서, 실패하는 경우가 아예 없다.
 */
function rngOf(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 앞에서 k 개만 쓸 것이므로 끝까지 섞지 않고 k 번만 섞는다. */
function pick(rng, arr, k) {
  const a = arr.slice();
  for (let i = 0; i < k; i++) {
    const j = i + Math.floor(rng() * (a.length - i));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, k);
}

/** 자재 total 개를 줄마다 몇 개씩 세울지 정한다. */
function spread(rng, total) {
  const k = new Array(H).fill(Math.floor(total / H));
  pick(rng, [...Array(H).keys()], total % H).forEach((y) => k[y]++);
  // 고르게만 나누면 뽑을 때마다 판이 비슷해진다. 줄 사이에서 한 개씩 옮겨 굴곡을 준다.
  // 한 줄에 N 개가 다 차면 그 줄은 도면이 꽉 차 아무 자리나 맞는다. 그래서 N-1 에서 막는다.
  for (let t = 0; t < H * 3; t++) {
    const a = Math.floor(rng() * H), b = Math.floor(rng() * H);
    if (a !== b && k[a] > 0 && k[b] < N - 1) { k[a]--; k[b]++; }
  }
  /* 맨 아랫줄은 반드시 한 칸이라도 채운다. 이 게임에 무게는 없지만, 바닥에 닿지 않은
   * 건물은 공중에 뜬 것으로 보인다. 부지가 높아질수록 아랫줄이 비는 일이 잦아진다.
   * 가장 많이 든 줄에서 하나를 내린다. */
  const g = H - 1;
  if (k[g] === 0) {
    let big = 0;
    for (let y = 1; y < H; y++) if (k[y] > k[big]) big = y;
    if (k[big] > 0) { k[big]--; k[g]++; }
  }
  return k;
}

/*
 * 한 줄에 자재 k 개를 세운다.
 *
 * 보통은 가로 k 칸, 깊이 k 칸을 골라 하나씩 짝지어 놓는다. 이러면 도면 두 장에 찍힌
 * 칸 수가 곧 자재 수라, 세어 보면 몇 개인지 바로 나온다.
 *
 * skew 를 켜면 한쪽을 한 칸 줄인다. 깊이 두 줄에 자재 셋을 세우는 식이라, 어느 깊이
 * 한 줄이 자재 둘을 이고 서게 된다. 그러면 도면에 찍힌 칸을 세는 것만으로는 자재 수가
 * 안 나오고, 많은 쪽을 봐야 한다는 것을 스스로 알아내야 한다. 이 게임에서 처음으로
 * 눈이 아니라 머리를 쓰는 자리다.
 */
function rowCells(rng, k, skew) {
  const tight = skew && k >= 2 && rng() < 0.6;
  const many = pick(rng, [...Array(N).keys()], k);          // 자재 수만큼 있는 쪽
  const few = pick(rng, [...Array(N).keys()], tight ? k - 1 : k);
  const swap = rng() < 0.5;                                 // 줄인 쪽이 가로일 때도 있다

  const pairs = [];
  for (let i = 0; i < k; i++) {
    // 적은 쪽은 먼저 한 번씩 다 쓰고, 남는 자재는 그중 아무 데나 얹는다.
    const q = i < few.length ? few[i] : few[Math.floor(rng() * few.length)];
    pairs.push(swap ? [q, many[i]] : [many[i], q]);
  }
  return pairs;
}

export function genKeep(seed, total, skew = false) {
  const rng = rngOf(seed), keep = [];
  spread(rng, total).forEach((k, y) => {
    rowCells(rng, k, skew).forEach(([x, d]) => keep.push([x, y, d]));
  });
  return keep;
}
