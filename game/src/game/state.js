import { empty, clone, fromKeep } from '../core/grid.js';

/*
 * 지금 푸는 판. 고정 판이든 뽑은 판이든 keep 한 벌로만 들고 있는다.
 * 되돌리기는 손대기 직전 모습을 통째로 쌓아 두는 방식이다. 판이 4×4×4 뿐이라
 * 무엇을 어떻게 바꿨는지 따로 적어 두는 것보다 이쪽이 훨씬 덜 헷갈린다.
 */
export const state = { keep: null, info: '', blocks: null, history: [] };

export function load(keep, info) {
  state.keep = keep;
  state.info = info;
  state.blocks = empty();
  state.history = [];
}

export function toggle(d, y, x, solid) {
  state.history.push(clone(state.blocks));
  state.blocks[d][y][x] = !solid;
}

export function undo() {
  if (!state.history.length) return false;
  state.blocks = state.history.pop();
  return true;
}

export function reset() {
  state.blocks = empty();
  state.history = [];
}

