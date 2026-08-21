import { N, H, fromKeep } from '../core/grid.js';

/*
 * 힌트 하나가 하는 일. 잘못 세운 자재가 있으면 그것부터 뺀다. 빠진 칸을 채워 주면
 * 자재가 모자라 아무것도 못 하는 자리에 몰릴 수 있기 때문이다. 잘못 세운 것이 없으면
 * 아직 못 채운 자리 하나를 세워 준다.
 */
export function nextHint(blocks, keep) {
  const goal = fromKeep(keep);

  for (let d = 0; d < N; d++) for (let y = 0; y < H; y++) for (let x = 0; x < N; x++) {
    if (blocks[d][y][x] && !goal[d][y][x]) return { d, y, x, place: false };
  }
  for (let d = 0; d < N; d++) for (let y = 0; y < H; y++) for (let x = 0; x < N; x++) {
    if (!blocks[d][y][x] && goal[d][y][x]) return { d, y, x, place: true };
  }
  return null;  // 이미 다 맞다
}
