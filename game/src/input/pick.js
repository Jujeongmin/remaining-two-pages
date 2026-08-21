import { isTurning } from './rotate.js';

/*
 * 칸 누르기.
 *
 * 부지는 그릴 때마다 통째로 다시 만들어지므로, 칸마다 손잡이를 달면 그리는 횟수만큼
 * 다시 다는 일이 된다. 돌리는 동안에는 손가락을 움직이는 내내 그 일이 이어진다.
 * 그래서 부지 전체에 딱 한 번만 단다.
 *
 * 다만 click 은 쓸 수 없다. 돌리기 쪽에서 손을 대는 순간 setPointerCapture 로 포인터를
 * 부지에 묶어 두는데, 그러면 뒤따르는 click 의 target 이 눌린 칸이 아니라 부지 자체로
 * 바뀐다. 눌린 칸을 거슬러 올라가 찾을 수가 없다.
 *
 * 손을 대는 순간(pointerdown)에는 target 이 아직 눌린 칸이다. 그때 어느 칸인지 적어 두고,
 * 손을 뗄 때 그 칸을 쓴다. 도중에 돌렸으면 그것은 누른 것이 아니므로 버린다.
 */
export function attachPicker(svg, onPick) {
  let hit = null;

  svg.addEventListener('pointerdown', (e) => {
    // 왼쪽 단추와 손가락만 받는다. 오른쪽 단추로 자재가 서면 곤란하다.
    hit = e.button > 0 ? null : (e.target.closest ? e.target.closest('.cube, .ghost') : null);
  });

  svg.addEventListener('pointerup', () => {
    const g = hit;
    hit = null;
    if (!g || isTurning()) return;   // 돌리려고 끈 것이지 누른 것이 아니다
    onPick(+g.dataset.d, +g.dataset.y, +g.dataset.x, g.dataset.solid === '1');
  });

  svg.addEventListener('pointercancel', () => { hit = null; });
}
