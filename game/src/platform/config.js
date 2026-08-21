/*
 * Verse8 쪽 이름들.
 *
 * 여기 적힌 것은 **받아 오는 값이 아니라 우리가 지은 이름**이다. 콘솔에서 하는 일은
 * 같은 이름에 값과 그림과 한도를 붙이는 것뿐이다. 그러니 이름은 여기서 먼저 정하고,
 * 콘솔에는 그대로 옮겨 적는다.
 *
 * 저절로 생기는 것은 verse 하나뿐이다 — npx @agent8/deploy 를 돌리면 .env 에
 * VITE_AGENT8_VERSE 가 적힌다. 그건 우리가 손댈 것이 아니다.
 */

/*
 * 광고 자리. **하나만 쓴다.**
 *
 * 쓰임은 셋(힌트·되돌리기·되살리기)이지만 자리는 하나로 둔다. 자리를 셋으로 쪼개면
 * 콘솔에 셋 다 만들어 두어야 하고, 하나라도 빠지면 그 자리만 조용히 안 뜬다.
 * 무엇을 줄지는 자리가 아니라 아래 AD_REWARD 로 가른다.
 *
 * 광고는 보상형만 쓴다. 판과 판 사이에 끼우는 전면 광고는 두지 않는다. 이 게임은 한
 * 판을 들여다보며 궁리하는 놀이라, 판을 맺자마자 광고가 덮으면 방금 세운 것을 볼 틈이
 * 없어진다. 보상형은 스스로 눌러서 보는 것이므로 그 흐름을 끊지 않는다.
 */
export const AD_PLACEMENT = 'two-sheets-rewarded';

/*
 * 광고를 보고 무엇을 청구하는가. 실제 수량은 server.js 가 쥔다 — 여기 있는 것은
 * 이름뿐이라, 이 값을 고쳐 불러도 서버가 아는 셋 말고는 아무것도 안 준다.
 */
export const AD_REWARD = {
  hint: 'hint',       // 힌트 한 개
  undo: 'undo',       // 되돌리기 세 번
  revive: 'revive',   // 끝없이 풀기에서 기회 한 번 더 (지갑은 안 건드린다)
};

/*
 * 파는 것은 하나뿐이다. 힌트는 팔지 않는다. 힌트를 돈으로 살 수 있으면 판을 푸는 것이
 * 아니라 사는 것이 되고, 검수 등급도 그만큼 값이 떨어진다.
 *
 * 콘솔(VX Shop)에 **이 이름 그대로** 만들어 두어야 한다. 한 사람이 두 번 살 것이
 * 아니므로 Lifetime Limit 을 1 로 건다.
 */
export const SHOP_PRODUCTS = {
  premium: 'two-sheets-premium',
};

/** 보상형 광고 한 번에 주는 힌트 수. 실제 지급은 서버가 한다. 여기 값은 화면에 적는 용도다. */
export const HINT_PER_AD = 1;

/** 아직 안 정한 이름. 이렇게 남아 있으면 그 기능은 조용히 빠진다. */
export const isPlaceholder = (id) => !id || id.startsWith('REPLACE_ME__');

/**
 * 파일을 고치는 대신 붙이는 자리에서 넣어도 된다. 넘긴 것만 바뀌고 나머지는 그대로다.
 *
 *   configure({ products: { premium: '다른-이름' } });
 */
export function configure({ products } = {}) {
  if (products) Object.assign(SHOP_PRODUCTS, products);
}
