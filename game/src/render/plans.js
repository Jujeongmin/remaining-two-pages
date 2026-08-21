import { N, H } from '../core/grid.js';
import { t } from '../i18n/index.js';

/*
 * 도면 두 장. 기울이지 않은 격자로 그린다. 자재를 아무리 쌓아도 이쪽은 가려지지
 * 않으므로, 도면만 보고 모양을 궁리할 수 있다.
 */

/** 한 칸의 색. lit 은 지금 세운 모양, want 는 남은 도면. 점선은 "아직 못 세웠다" 는 뜻이다. */
function cellStyle(lit, want) {
  if (lit && want) return { fill: 'var(--gold)', dash: false };
  if (lit && !want) return { fill: 'var(--bad)', dash: false };
  if (want) return { fill: '#cdbb96', dash: true };
  return { fill: '#d3c39e', dash: false };
}

/* hi 는 지금 고른 층의 줄 번호다. -1 이면 아무 줄도 짚지 않는다. */
export function drawPlans(svg, cur, tFront, tSide, hi = -1) {
  const C = 34, GAP = 34, TOP = 16, FOOT = 16;
  const parts = [];

  const sheet = (ox, title, foot, now, want) => {
    parts.push(`<text x="${ox}" y="11" fill="var(--gold)" font-size="12" font-family="monospace">${title}</text>`);
    for (let y = 0; y < H; y++) for (let i = 0; i < N; i++) {
      const s = cellStyle(now[y][i], want[y][i]);
      const px = ox + i * C, py = TOP + y * C;
      parts.push(`<rect x="${px}" y="${py}" width="${C}" height="${C}" fill="${s.fill}" stroke="#8a7a58"/>`);
      if (s.dash) {
        parts.push(`<rect x="${px + 2}" y="${py + 2}" width="${C - 4}" height="${C - 4}" fill="none"`
          + ` stroke="var(--gold)" stroke-width="2" stroke-dasharray="5 4"/>`);
      }
    }
    /* 고른 층에 해당하는 줄을 짚어 준다. 두 장에서 같은 줄을 하나씩 읽어 한 층을
     * 세우는 것이 이 판을 푸는 방법이다. 짚어 주지 않으면 아무도 모른다. */
    if (hi >= 0) {
      parts.push(`<rect x="${ox - 3}" y="${TOP + hi * C - 3}" width="${N * C + 6}" height="${C + 6}"`
        + ` fill="none" stroke="var(--gold)" stroke-width="2.5" rx="3"/>`);
    }
    parts.push(`<text x="${ox}" y="${TOP + H * C + 12}" fill="#7b6a4c" font-size="11" font-family="monospace">${foot}</text>`);
  };

  sheet(0, t('plans.front'), t('plans.frontFoot'), cur.front, tFront);
  sheet(N * C + GAP, t('plans.side'), t('plans.sideFoot'), cur.side, tSide);
  // front 는 깊이를 뭉갠 것, side 는 가로를 뭉갠 것이다. grid.js 를 볼 것.

  // 크기는 CSS 가 정한다. 여기서는 좌표계만 알려 주어 화면 폭에 맞춰 늘고 줄게 둔다.
  /* 좌우로 조금 여유를 둔다. 격자가 좌표계에 딱 맞아떨어져서, 줄을 짚는 테가 바깥으로
   * 조금이라도 나가면 그대로 잘려 나간다. */
  const M = 6;
  svg.setAttribute('viewBox', `${-M} 0 ${2 * N * C + GAP + 2 * M} ${TOP + H * C + FOOT}`);
  svg.innerHTML = parts.join('');
}
