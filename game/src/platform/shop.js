import { isPlaceholder } from './config.js';

/*
 * VXShop 뼈대. 실제 연동은 Verse8 안에서 한다.
 *
 *   1) 스크립트 한 줄이면 window.VXShop 이 생긴다. 여기서 알아서 집는다.
 *      <script src="https://unpkg.com/@verse8/platform/dist/index.global.js"></script>
 *      이 방식은 빌드 때 환경 변수를 못 읽으므로 init({ verseId, account }) 를 직접 넘겨야 한다.
 *   2) 번들러로 쓸 때는 붙이는 자리에서 한 줄.
 *      import { VXShop } from '@verse8/platform/vanilla';  register(VXShop);
 *
 * 가장 중요한 규칙: 물건을 실제로 얹는 일은 서버의 $onItemPurchased 에서만 한다.
 * 창이 닫혔다는 신호는 알림일 뿐이라, 그걸 믿고 힌트를 주면 공짜로 받아 갈 수 있다.
 */
let impl = null;
let started = false;
let initOptions;

/*
 * 결제 창이 닫힐 때 부를 것들.
 *
 * 게임 쪽은 화면을 짤 때 한 번 걸어 두는데, 그때는 아직 SDK 가 안 붙어 있을 수 있다.
 * 붙는 차례에 기대면 조용히 안 걸린 채로 남아, 사고 나와도 화면이 그대로다.
 * 그래서 여기서 들고 있다가 붙는 순간 이어 준다.
 */
const closers = new Set();
let closeWired = null;

export function register(sdk, options) {
  impl = sdk || null;
  initOptions = options;
  started = false;
  closeWired = null;
  sdk_();       // 붙자마자 열어 둔다
  wireClose();
}

function wireClose() {
  const s = sdk_();
  if (!s || closeWired === s || typeof s.onClose !== 'function') return;
  closeWired = s;
  try {
    s.onClose((payload) => {
      closers.forEach((cb) => { try { cb(payload); } catch { /* 하나가 터져도 나머지는 부른다 */ } });
    });
  } catch { /* 못 걸면 그냥 논다 */ }
}

/** 처음 쓸 때 한 번만 init 한다. 스크립트 한 줄로 붙인 경우에도 이 자리에서 열린다. */
function sdk_() {
  const s = impl || globalThis.VXShop || null;
  if (s && !started) {
    started = true;
    try { s.init(initOptions); } catch { /* 못 열면 상점만 빠진다 */ }
  }
  return s;
}
const sdk = sdk_;

export function available(productId) {
  return !!sdk() && !isPlaceholder(productId);
}

/** 결제 창을 연다. 지급 여부는 여기서 알 수 없다. 서버가 넣어 준 값을 다시 읽어야 한다. */
export async function buy(productId) {
  if (!available(productId)) return false;
  try {
    await sdk().buyItem(productId);
    return true;
  } catch {
    return false;
  }
}

/** 상점 상태가 바뀔 때마다 부른다. 안 붙어 있으면 아무 일도 안 하는 해지 함수를 준다. */
export function subscribe(cb) {
  const s = sdk();
  if (!s || typeof s.subscribe !== 'function') return () => {};
  try { return s.subscribe(cb) || (() => {}); } catch { return () => {}; }
}

/**
 * 상품 한 줄. 값과 함께 몇 번 샀는지, 더 살 수 있는지가 들어 있다.
 * { productId, price, purchasable, purchaseLimitReached, purchasedCount, ... }
 */
function item(productId) {
  const s = sdk();
  if (!s || typeof s.getItem !== 'function') return null;
  try { return s.getItem(productId) || null; } catch { return null; }
}

/*
 * 한 번 사면 끝인 물건을 이미 샀는지. 광고제거가 그렇다.
 *
 * 다만 이것만 믿고 광고를 건너뛰지는 않는다. 여기 값은 상점 화면을 어떻게 그릴지
 * 정하는 데만 쓴다. 진짜 판단은 서버가 $onItemPurchased 에서 얹어 준 값으로 한다.
 * 클라이언트가 가진 값으로 물건을 주기 시작하면 안 사고도 받아 갈 길이 열린다.
 */
export function owned(productId) {
  const it = item(productId);
  return !!it && (it.purchaseLimitReached || it.purchasedCount > 0);
}

/**
 * 결제 창이 닫힐 때마다 부른다. 닫혔다고 산 것은 아니므로, 서버 값을 다시 읽는 신호로만 쓴다.
 * SDK 가 아직 안 붙었어도 걸어 둘 수 있다. 붙는 순간 이어진다.
 */
export function onClose(cb) {
  closers.add(cb);
  wireClose();
  return () => closers.delete(cb);
}

/** 상점 쪽 값을 다시 받아 온다. */
export async function refresh() {
  const s = sdk();
  if (!s || typeof s.refresh !== 'function') return false;
  try { await s.refresh(); return true; } catch { return false; }
}
