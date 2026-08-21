import { t } from '../i18n/index.js';
import { jobIntroText, stageTipText } from './stages.js';

/*
 * 대사. 글자는 말 꾸러미(i18n)에 있고, 여기서는 누가 어떤 얼굴로 말하는지만 엮는다.
 *
 * face 는 game/public/art/ 의 파일 이름이다. 그림이 없으면 대화창이 이름과 말만 띄운다.
 * 그래서 아직 안 들어온 표정을 미리 적어 두어도 게임은 그대로 돈다. 파일을 넣는 순간
 * 그 자리에 얼굴이 붙는다.
 */
const master = (key, face = 'master-calm') => ({ who: t('who.master'), face, text: t(key) });
const self = (key, face = 'apprentice') => ({ who: t('who.self'), face, text: t(key) });

/** 여러 줄로 적힌 일지를 대사 여러 줄로 편다. */
const split = (s, face = 'master-calm') =>
  s.split('\n').map((line) => ({ who: t('who.master'), face, text: line.trim() }));

/*
 * 게임을 처음 여는 사람에게 한 번만.
 * 석 줄이면 족하다. 첫 판을 만져 보기 전에 열 번을 눌러야 하면, 그 뒤가 없다.
 */
export const prologue = () => [
  self('dlg.pro.1', 'apprentice-worried'),
  master('dlg.pro.2', 'master-pointing'),
  self('dlg.pro.3', 'apprentice-determined'),
];

/* 의뢰를 받고 견습이 하는 말. 도편수 혼잣말로 끝나면 둘이 아니라 하나가 된다. */
const REPLY = {
  j1: () => [self('dlg.j1.1', 'apprentice-determined')],
  j2: () => [
    self('dlg.j2.1', 'apprentice-worried'),
    master('dlg.j2.2'),
    self('dlg.j2.3', 'apprentice-determined'),
  ],
  j3: () => [self('dlg.j3.1', 'apprentice-worried')],
  j4: () => [
    self('dlg.j4.1', 'apprentice-determined'),
    master('dlg.j4.2'),
  ],
};

export const jobIntro = (job) => [...split(jobIntroText(job)), ...((REPLY[job.id] || (() => []))())];

/* 연습판에서 배운 것을 견습이 제 말로 되뇐다. 알아들었는지는 이걸로 보인다. */
const TIP_REPLY = {
  s1: ['dlg.tip.s1', 'apprentice-surprised'],
  s2: ['dlg.tip.s2', 'apprentice'],
  s3: ['dlg.tip.s3', 'apprentice-surprised'],
};

/** 연습판에서 알려 주는 말. 판마다 적어 둔 tip 을 도편수 입으로 옮긴다. */
export const stageTip = (stage) => {
  const reply = TIP_REPLY[stage.id];
  return [
    { who: t('who.master'), face: 'master-pointing', text: stageTipText(stage) },
    ...(reply ? [self(reply[0], reply[1])] : []),
  ];
};

/* 의뢰를 맺은 뒤. 세운 건물 그림은 창으로 따로 띄우므로, 여기서는 그 뒤에 오갈 말만 둔다. */
export const jobOutro = () => [
  self('dlg.outro.1', 'apprentice-bright'),
  master('dlg.outro.2'),
];

/** 검수 한 줄. 판을 맺은 창 안에 얹힌다. */
export function verdict(grade) {
  if (grade === 3) return { face: 'master-surprised', seal: 'seal-gap', text: t('dlg.verdict.3') };
  if (grade === 2) return { face: 'master-calm', seal: 'seal-eul', text: t('dlg.verdict.2') };
  return { face: 'master-stern', seal: 'seal-byeong', text: t('dlg.verdict.1') };
}

/** 검수를 받고 견습이 혼자 하는 말. 판을 맺을 때마다 한 줄씩 붙는다. */
export function verdictReply(grade) {
  if (grade === 3) return self('dlg.reply.3', 'apprentice-bright');
  if (grade === 2) return self('dlg.reply.2');
  return self('dlg.reply.1', 'apprentice-worried');
}

export const gradeName = (n) => t(`grade.${n || 0}`);

export const endlessStart = () => [
  master('dlg.endless.1'),
  self('dlg.endless.2', 'apprentice-determined'),
];

export const endlessDone = (n) => [
  n > 0
    ? { who: t('who.master'), face: 'master-pleased', text: t('dlg.endlessDone.some', { n }) }
    : { who: t('who.master'), face: 'master-calm', text: t('dlg.endlessDone.none') },
  n > 0
    ? self('dlg.endlessReply.some', 'apprentice-tired')
    : self('dlg.endlessReply.none', 'apprentice-worried'),
];
