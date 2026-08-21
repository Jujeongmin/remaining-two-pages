import { call, available as backendUp, register as backendRegister } from './backend.js';

/*
 * 순위표. 실제 함수는 저장소 루트의 server.js 에 있다.
 * 서버로 가는 문은 backend.js 하나뿐이라, 여기서는 어떤 함수를 부를지만 정한다.
 */

/* 예전처럼 여기에 붙여도 되게 남겨 둔다. 실제로 잡아 두는 것은 backend.js 다. */
export const register = backendRegister;

export const available = backendUp;

/** 끝없는 판에서 넘긴 판 수를 올린다. 사람마다 가장 높은 한 줄만 남는다. */
export const submitScore = (score, nickname) => call('submitScore', [score, nickname]);

/** 위에서부터 스무 명. 한 사람이 여러 칸을 먹지 않는다. */
export const topRankings = () => call('getTopRankings').then((r) => r || []);

/** 내 최고 기록과 등수. { bestEntry, rank } 또는 null. 스무 등 밖이어도 등수는 나온다. */
export const myBestRank = () => call('getMyBestRank');
