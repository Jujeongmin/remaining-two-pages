import { cam } from '../render/camera.js';

/*
 * 끌어서 돌리기. 끄는 도중에도 다시 그려야 따라 도는 느낌이 난다. 끌고 나서 손을 떼면
 * 클릭도 같이 일어나므로, 얼마나 움직였는지 재 두었다가 조금이라도 돌렸으면 그 클릭은
 * 무시한다. 무시할지 말지는 누르는 쪽에서 isTurning() 으로 물어본다.
 */
let drag = null;
let turned = false;

export function isTurning() { return turned; }

export function attachRotator(svg, onChange) {
  // touch-action 은 CSS 에 있다. 여기서는 끄는 동안의 손 모양만 바꾼다.
  svg.style.cursor = 'grab';

  svg.addEventListener('pointerdown', (e) => {
    drag = { x: e.clientX, y: e.clientY, yaw: cam.yaw, pitch: cam.pitch, moved: 0 };
    turned = false;
    // 손가락을 판에 묶어 두면 판 밖으로 나가도 계속 돌아간다. 묶을 손가락이 없는
    // 이상한 이벤트가 들어와도 돌리기가 통째로 멈추지는 않게 감싸 둔다.
    try { svg.setPointerCapture(e.pointerId); } catch { /* 없으면 그냥 둔다 */ }
    svg.style.cursor = 'grabbing';
  });

  svg.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    drag.moved = Math.max(drag.moved, Math.abs(dx) + Math.abs(dy));
    if (drag.moved > 4) turned = true;
    cam.yaw = drag.yaw + dx * 0.012;
    // 너무 눕히면 바닥 격자가 선으로 뭉개져 방향을 잃고, 뒤집으면 밑에서 올려다보게 된다.
    cam.pitch = Math.min(1.45, Math.max(0.25, drag.pitch + dy * 0.012));
    onChange();
  });

  const done = () => { drag = null; svg.style.cursor = 'grab'; };
  svg.addEventListener('pointerup', done);
  svg.addEventListener('pointercancel', done);
}
