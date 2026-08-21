import { N, H } from '../core/grid.js';

/*
 * 격자 좌표 (x, 깊이, 높이) 를 카메라로 돌려 화면에 옮긴다. 끌면 yaw(좌우)와
 * pitch(위아래)가 바뀐다. 원근은 넣지 않는다. 칸이 같은 크기로 보여야 세기 편하다.
 */
/*
 * 처음 시점. 되돌릴 때 여기로 온다.
 * 이 각도에서 판의 앞쪽 모서리 둘이 보는 사람을 향한다. 왼쪽 아래가 정면도 쪽,
 * 오른쪽 아래가 측면도 쪽이다. 도면 두 장을 늘어놓은 순서와 같다.
 */
const CAM0 = { yaw: Math.PI / 4, pitch: 0.62 };
export const cam = { yaw: CAM0.yaw, pitch: CAM0.pitch, S: 58 };  // S 는 칸 한 변의 화면 크기

// 한 번 그리는 동안 삼각함수 값은 바뀌지 않는다. 칸마다 다시 재지 않도록 미리 재 둔다.
let TRIG = null;

export function setCam() {
  TRIG = { cy: Math.cos(cam.yaw), sy: Math.sin(cam.yaw), cp: Math.cos(cam.pitch), sp: Math.sin(cam.pitch) };
}

export function resetCam() { cam.yaw = CAM0.yaw; cam.pitch = CAM0.pitch; }

/** 격자 좌표 하나를 화면 좌표와 카메라 거리로 옮긴다. 판 한가운데가 원점이다. */
export function project(gx, gd, gz) {
  const cx = gx - N / 2, cd = gd - N / 2, cz = gz - H / 2;
  const rx = cx * TRIG.cy - cd * TRIG.sy, rd = cx * TRIG.sy + cd * TRIG.cy;
  return {
    sx: rx * cam.S,
    sy: (-rd * TRIG.sp - cz * TRIG.cp) * cam.S,
    depth: rd * TRIG.cp - cz * TRIG.sp,
  };
}
