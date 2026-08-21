import { isPlaceholder } from './config.js';

/*
 * 광고 뼈대. 실제 연동은 Verse8 안에서 한다.
 *
 * 붙이는 방법은 둘 중 하나다.
 *   1) index.html 에 스크립트 한 줄을 넣으면 window.Verse8Ads 가 생긴다. 여기서 알아서 집는다.
 *      <script src="https://unpkg.com/@verse8/ads@latest/dist/index.global.js" crossorigin="anonymous"></script>
 *   2) 번들러로 쓸 때는 붙이는 자리에서 한 줄이면 된다.
 *      import { Verse8Ads } from '@verse8/ads';  register(Verse8Ads);
 *
 * 어느 쪽도 아니면 available() 이 거짓이 되고, 게임은 광고가 없는 셈 치고 그냥 굴러간다.
 * 광고가 없다고 못 노는 게임이 되면 안 되기 때문이다.
 *
 * 문서상 showRewarded 는 다음 중 하나로 끝난다.
 *   { status:'rewarded', reward, requestId } | { status:'dismissed', requestId }
 *   | { status:'failed', error:{ code }, requestId }
 */
/*
 * 기다리는 시간을 이쪽에서 정하지 않는다.
 *
 * 0.5.0 부터 showRewarded 는 호스트가 답할 때까지 그냥 기다린다. 여기서 시간을 걸면
 * 광고가 다 끝나기 전에 이쪽이 먼저 손을 떼는 일이 생기고, 그러면 끝까지 본 사람이
 * 보상을 못 받는다. 광고는 사람이 닫을 때까지가 한 번이고, 닫으면 그 자리에서 돌아온다.
 */

let impl = null;

/*
 * 이 환경이 광고를 아예 못 트는가. 한 번 unsupported_env 를 받으면 그 세션 동안
 * 단추를 감춘다. 눌러도 아무 일이 없는 단추는 고장으로 읽힌다.
 *
 * SDK 에 "지금 틀 수 있나" 를 묻는 길이 없어서, 처음에는 틀 수 있는 것으로 보고
 * 첫 실패에서 알아낸다.
 */
let unsupported = false;
let onBroken = () => {};

/** 지난번에 광고가 안 됐다는 것을 알고 시작한다. 그러면 헛물 켜는 한 번이 아예 없다. */
export function setUnsupported(on) { unsupported = !!on; }

/** 광고가 처음 실패했을 때 부른다. 그 사실을 어딘가에 적어 두라는 뜻이다. */
export function whenBroken(fn) { onBroken = fn || (() => {}); }

export function register(sdk) {
  impl = sdk || null;
  unsupported = false;
  init();
}

/*
 * 핸드셰이크. 부모 오리진을 정하는 자리이기도 하고, 무엇보다 광고가 어디서 끊겼는지
 * 볼 길이 이것뿐이다. "다 봤는데 보상이 없다" 는 말이 들어왔을 때 결과값(rewarded ·
 * dismissed · failed)만으로는 어디서 끊겼는지 알 수 없다.
 */
let started = false;
function init() {
  const s = sdk();
  if (!s || started || typeof s.init !== 'function') return;
  started = true;
  try {
    s.init({ onAdTelemetry: (e) => console.info('[ads]', e && e.type, e) });
  } catch { /* 못 열어도 광고 자체는 돌아갈 수 있다 */ }
}

function sdk() { return impl || globalThis.Verse8Ads || null; }

/*
 * 광고제거를 산 사람.
 *
 * 단추를 감추지 않는다. 감추면 그동안 받아 가던 보상까지 같이 사라져, 돈을 내고 손해를
 * 보는 꼴이 된다. 단추는 그대로 두고 광고만 건너뛴다. 누르면 그 자리에서 보상이 들어온다.
 * 산 사람에게는 "광고 없이" 가 값이지 "광고 안 보임" 이 값이 아니다.
 */
let adFree = false;

export function setAdFree(on) { adFree = !!on; }
export function isAdFree() { return adFree; }

/**
 * 광고 단추를 띄울지.
 *
 * 광고가 안 되는 것과 단추를 감추는 것은 다른 일이다. 감춰 버리면 쓰는 사람은 그런
 * 길이 있는 줄도 모른 채 막힌다. 단추는 그대로 두고, 눌렀을 때 왜 안 되는지 말해 준다.
 *
 * 광고제거를 샀으면 SDK 가 없어도 참이다. 보상이 광고가 아니라 산 물건에서 나온다.
 */
export function available(placementId) {
  if (isPlaceholder(placementId)) return false;
  if (adFree) return true;
  return !!sdk();
}

/** 지금 실제로 틀 수 있는가. 단추를 낼지가 아니라, 눌렀을 때 트로 갈지를 가른다. */
export function ready(placementId) {
  return available(placementId) && (adFree || !unsupported);
}

/**
 * 보상형. 끝까지 본 경우에만 참을 돌려준다.
 * requestId 를 함께 돌려주는 것은, 값나가는 보상을 줄 때 서버에서 이 번호로 다시 확인하기
 * 위해서다. (docs/ads/server-verification) 힌트 한 개짜리는 그 확인 없이 그냥 준다.
 */
export async function rewarded(placementId) {
  if (isPlaceholder(placementId)) return { ok: false, reason: 'unavailable' };
  // 광고제거를 산 사람은 볼 것 없이 바로 받는다. 서버에 다시 물을 번호도 없다.
  if (adFree) return { ok: true, skipped: true };
  if (!available(placementId)) return { ok: false, reason: 'unavailable' };
  /* 지난번에 안 됐던 자리는 아예 안 튼다. 검은 막이 떴다 사라지고 실패만 되풀이하면
   * 게임이 고장 난 것처럼 보인다. 왜 안 되는지 말해 주는 편이 낫다. */
  if (unsupported) return { ok: false, reason: 'notready' };
  try {
    init();
    const r = await sdk().showRewarded({ placementId });
    /* 결과를 남긴다. 화면은 "끝까지 안 봤다" 로만 말하는데, 그것이 사람이 닫은 것인지
     * 무엇이 실패한 것인지에 따라 손댈 곳이 완전히 다르다. */
    console.info('[ads] result', r && r.status, r);
    /*
     * 실패하면 그 세션 동안 광고를 접는다.
     *
     * 자리가 콘솔에 아직 없거나 이 환경이 광고를 못 틀면 몇 번을 눌러도 똑같이 실패한다.
     * 그때마다 검은 막이 잠깐 떴다 사라지고 "받지 못했다" 만 뜨면, 쓰는 사람은 게임이
     * 고장 난 줄 안다. 한 번 실패한 뒤로는 단추를 아예 감춘다.
     *
     * 사람이 중간에 닫은 것(dismissed)은 실패가 아니다. 그건 다음에 또 볼 수 있다.
     */
    if (r && r.status === 'failed') {
      unsupported = true;
      console.info('[ads] 광고를 접는다:', r.error && r.error.code);
      try { onBroken(); } catch { /* 적어 두지 못해도 이번 판은 그대로 간다 */ }
    }
    if (r && r.status === 'rewarded') return { ok: true, requestId: r.requestId };
    return { ok: false, reason: r ? r.status : 'failed', requestId: r && r.requestId };
  } catch (e) {
    return { ok: false, reason: 'threw' };   // 광고가 터져도 게임은 이어진다
  }
}
