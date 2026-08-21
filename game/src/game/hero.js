import * as save from './progress.js';

/*
 * 복원공이 누구인가. 남녀 두 벌을 두고 시작할 때 고르게 한다.
 *
 * 대사 쪽에서는 그냥 'apprentice', 'apprentice-worried' 라고만 적는다. 여기서 고른 쪽에
 * 맞춰 apprentice-m-worried / apprentice-f-worried 로 바꿔 준다. 대사마다 남녀를 나눠
 * 적으면 대사를 하나 고칠 때마다 두 군데를 고쳐야 한다.
 */
const HEROES = {
  m: { id: 'm', name: '견습', label: '남' },
  f: { id: 'f', name: '견습', label: '여' },
};

/*
 * 고를 수 있는가.
 *
 * 지금은 둘 다 열려 있다. 한때 여자 쪽을 프리미엄으로 두었는데, 얼굴을 고르는 일에
 * 값을 매기면 절반은 제 얼굴을 돈 주고 사야 한다. 파는 것은 편의여야지 사람이 아니다.
 *
 * 이 함수는 남겨 둔다. 나중에 차림 같은 것을 잠가 팔 자리가 생기면 여기에 locked 를
 * 다시 달면 된다.
 */
export function unlocked(id) {
  const h = HEROES[id];
  if (!h) return false;
  return !h.locked || save.adFree() || save.hero() === id;
}

export const chosen = () => save.hero();
export const isChosen = () => !!save.hero();

export function choose(id) {
  if (!HEROES[id]) return;
  save.setHero(id);
}

/** 'apprentice-worried' 를 고른 사람에 맞는 파일 이름으로 바꾼다. 나머지는 그대로 둔다. */
export function resolveFace(name) {
  if (!name || !name.startsWith('apprentice')) return name;
  const sex = save.hero() || 'm';
  return name.replace(/^apprentice/, `apprentice-${sex}`);
}

