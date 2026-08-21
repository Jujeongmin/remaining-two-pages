import { LEVELS } from '../core/levels.js';
import { genKeep } from '../core/generator.js';
import { setSize } from '../core/grid.js';
import { t } from '../i18n/index.js';

/*
 * 의뢰와 판.
 *
 * 판은 네 의뢰로 묶어 다섯 개씩 둔다. 이름과 일지 글은 여기 두지 않고 말 꾸러미에서
 * 꺼내 쓴다. 판을 하나 옮기거나 이름을 고칠 때 네 나라 말을 따로 손대지 않으려는 것이다.
 *
 * 뽑은 판의 씨앗을 번호에서 만드는 것이 중요하다. 그래야 누가 언제 열어도 열두 번째
 * 판은 늘 같은 판이다. 판마다 검수 등급이 남는 이상, 어제 푼 판과 오늘 푼 판이 다르면
 * 곤란하다.
 */

/*
 * 의뢰마다 부지 크기가 다르다. 바닥 n×n 에 높이 h 다.
 *
 * 창고는 네모반듯한 광이라 그대로 두고, 종탑은 위로 한 단 올린다. 돌다리는 건너지르는
 * 것이라 바닥을 넓히고, 성문은 둘 다 크다. 크기가 곧 난이도다. 줄이 늘면 읽을 줄이
 * 늘고, 바닥이 넓어지면 한 줄 안에서 고를 자리가 늘어난다.
 */
const SIZES = {
  j1: { n: 4, h: 4 },
  j2: { n: 4, h: 5 },
  j3: { n: 5, h: 4 },
  j4: { n: 5, h: 5 },
};

const L = LEVELS.map((lv) => lv.keep);

const T1 = [[0, 3, 0], [2, 3, 2]];
const T2 = [[1, 3, 1], [2, 3, 3], [0, 2, 0]];
const T3 = [[0, 3, 2], [2, 3, 0], [3, 3, 3], [1, 1, 1]];

/*
 * 판 하나. keep 을 그 자리에 적어 둔 판도 있고, 씨앗과 자재 수만 적어 두고 열 때
 * 뽑는 판도 있다. 뽑는 쪽을 미루는 이유는 판마다 부지 크기가 다르기 때문이다. 불러올
 * 때 뽑아 버리면 그때의 크기(4×4×4)로 만들어져, 높은 부지에서는 바닥에 닿지 않고 뜬다.
 */
export const JOBS = [
  {
    id: 'j1',
    art: 'job-warehouse',
    stages: [
      { id: 's1', keep: T1, tip: true },
      { id: 's2', keep: T2 },
      { id: 's3', keep: T3 },
      { id: 's4', keep: L[0] },
      { id: 's5', keep: L[1] },
    ],
  },
  {
    id: 'j2',
    art: 'job-belltower',
    stages: [
      { id: 's6', seed: 0x5EED, total: 6 },
      { id: 's7', seed: 0x7A11, total: 7 },
      { id: 's8', seed: 0x91C3, total: 8 },
      { id: 's9', seed: 0xB0D5, total: 9 },
      { id: 's10', seed: 0xC7E9, total: 10 },
    ],
  },
  {
    id: 'j3',
    art: 'job-bridge',
    stages: [
      { id: 's11', seed: 0xD1A7, total: 7 },
      { id: 's12', seed: 0xE33B, total: 8 },
      { id: 's13', seed: 0xF54D, total: 9 },
      { id: 's14', seed: 0x1067, total: 10 },
      { id: 's15', seed: 0x2279, total: 11 },
    ],
  },
  {
    id: 'j4',
    art: 'job-gate',
    stages: [
      { id: 's16', seed: 0x348B, total: 9, skew: true },
      { id: 's17', seed: 0x469D, total: 10, skew: true },
      { id: 's18', seed: 0x58AF, total: 11, skew: true },
      { id: 's19', seed: 0x6AC1, total: 12, skew: true },
      { id: 's20', seed: 0x7CD3, total: 13, skew: true },
    ],
  },
];

/** 판 하나하나에 어느 의뢰인지와 그 의뢰에서 몇 번째인지를 붙여 한 줄로 편다. */
export const STAGES = JOBS.flatMap((job) =>
  job.stages.map((s, i) => ({
    ...s,
    jobId: job.id,
    size: SIZES[job.id],
    first: i === 0,
    last: i === job.stages.length - 1,
  })));

/**
 * 판을 펼칠 준비를 한다. 부지 크기를 갈아 끼우고, 씨앗만 적힌 판이면 그 크기로 뽑는다.
 * 크기를 먼저 바꿔야 뽑은 판이 그 부지에 맞는다. 차례가 바뀌면 판이 공중에 뜬다.
 */
export function prepare(stage) {
  const size = stage.size || { n: 4, h: 4 };
  setSize(size.n, size.h);
  return stage.keep ? stage : { ...stage, keep: genKeep(stage.seed, stage.total, !!stage.skew) };
}

/* 이름과 일지 글은 말 꾸러미에서 꺼낸다. 말을 바꾸면 그 자리에서 같이 바뀐다. */
export const jobName = (job) => t(`job.${job.id}.name`);
export const jobIntroText = (job) => t(`job.${job.id}.intro`);
export const jobOutroText = (job) => t(`job.${job.id}.outro`);
export const stageName = (stage) => (stage.endless ? stage.name : t(`stage.${stage.id}.name`));
export const stageTipText = (stage) => t(`stage.${stage.id}.tip`);


/** 연습이 붙은 판. 이만큼 떼야 끝없이 풀기가 열린다. */
export const TUTORIAL_COUNT = 3;

/*
 * 끝없이 풀기. 번호만 넘기면 그때그때 하나 뽑아 준다.
 * 다섯 판마다 부지가 한 단계씩 커진다. 본편에서 지나온 네 크기를 그대로 밟고, 그 뒤로는
 * 가장 큰 부지에서 자재만 늘어난다.
 */
const ENDLESS_SIZES = [SIZES.j1, SIZES.j2, SIZES.j3, SIZES.j4];

export function endlessStage(n) {
  const step = Math.floor(n / 5);
  const size = ENDLESS_SIZES[Math.min(ENDLESS_SIZES.length - 1, step)];
  /*
   * 자재 수 천장. 부지가 담을 수 있는 최대치의 절반쯤에서 멈춘다.
   * 한 줄에 자재가 많이 설수록 그 줄의 답이 k! 가지로 불어나 오히려 헐거워진다.
   * 자재를 늘리는 것은 어렵게 만드는 것이 아니라 손만 바쁘게 하는 것이다.
   */
  const cap = Math.ceil(size.h * (size.n - 1) * 0.55);
  return {
    id: `e${n}`,
    endless: true,
    size,
    name: t('endless.name', { n: n + 1 }),
    seed: (0xE7D1E55 + n * 2654435761) >>> 0,
    total: Math.max(6, Math.min(cap, 6 + Math.floor(n / 2))),
    // 가장 큰 부지까지 온 사람에게는 성문에서 쓰던 규칙을 그대로 건다
    skew: step >= ENDLESS_SIZES.length - 1,
  };
}
