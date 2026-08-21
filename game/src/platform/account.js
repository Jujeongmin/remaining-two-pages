import { call, available } from './backend.js';
import * as save from '../game/progress.js';
import * as ads from './ads.js';

/*
 * 계정에 기록 얹기.
 *
 * 브라우저에만 적어 두면 폰에서 깬 것을 컴퓨터에서 잇지 못하고, 틀 안에서 저장이 막히면
 * 통째로 날아간다. 서버가 붙어 있으면 같은 것을 계정에도 얹는다.
 *
 * 힌트와 광고제거는 서버 값만 쓴다. 브라우저에서 늘릴 수 있으면 살 이유가 없다.
 */
export function attach() {
  if (!available()) return false;

  save.attachSync({
    load: () => call('loadProgress'),
    save: (patch) => call('saveProgress', [patch]),
    wipe: () => call('wipeProgress'),
    spendHint: () => call('spendHint'),
    spendUndo: () => call('spendUndo'),
    buy: (what, n) => call('buy', [what, n]),
    claimAd: (kind) => call('claimAdReward', [kind]),
    earnEndless: (n) => call('claimEndlessCoins', [n]),
    hints: () => call('getHints'),
  });
  return true;
}

/**
 * 붙자마자 한 번 맞춘다. 브라우저에만 있던 기록이 이때 계정으로 옮겨 붙는다.
 * 광고제거를 샀는지도 여기서 광고 쪽에 알려 준다.
 */
export async function sync() {
  const ok = await save.pull();
  ads.setAdFree(save.adFree());
  return ok;
}
