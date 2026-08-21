import { N, H, fromKeep, front, side, count, sameGrid } from './core/grid.js';
import { cam, setCam, resetCam } from './render/camera.js';
import { drawScene, setWoodArt } from './render/scene3d.js';
import { drawPlans } from './render/plans.js';
import { attachRotator } from './input/rotate.js';
import { attachPicker } from './input/pick.js';
import { state, load, toggle, undo, reset } from './game/state.js';
import { JOBS, STAGES, TUTORIAL_COUNT, endlessStage, prepare } from './game/stages.js';
import { nextHint } from './game/hint.js';
import * as save from './game/progress.js';
import * as hero from './game/hero.js';
import * as talk from './ui/talk.js';
import { prologue, jobIntro, jobOutro, stageTip, verdict, verdictReply, endlessStart, endlessDone } from './game/dialogue.js';
import { show, toast, renderJobList, openClear, gradeText, fitButtons } from './ui/screens.js';
import { t, applyStatic, setLang, detect, lang, LANGS } from './i18n/index.js';
import { jobName, stageName, jobIntroText, jobOutroText } from './game/stages.js';
import * as sound from './ui/sound.js';
import * as bgm from './ui/bgm.js';
import * as ambient from './ui/ambient.js';
import * as ads from './platform/ads.js';
import * as leaderboard from './platform/leaderboard.js';
import * as shop from './platform/shop.js';
import * as account from './platform/account.js';
import { boot } from './platform/boot.js';
import { AD_PLACEMENT, AD_REWARD, SHOP_PRODUCTS, HINT_PER_AD } from './platform/config.js';
import { PRICE, PACK, UNDO_PER_AD } from './game/economy.js';

const $ = (s) => document.querySelector(s);
const iso = $('#s-iso');
const plans = $('#s-plans');

/*
 * 지금 하고 있는 한 판. 검수 등급을 매기려면 되돌리기와 힌트를 몇 번 썼는지 세어야 하고,
 * 다 맞춘 뒤에는 더 못 건드리게 막아야 한다. done 이 그 빗장이다.
 */
const run = { stage: null, index: -1, endless: false, endlessCount: 0, undos: 0, hintsUsed: 0, done: false, misses: 0 };

/*
 * 끝없이 풀기에서 허락하는 물림 횟수.
 * 시간을 재지 않는 것은 이 게임이 들여다보고 궁리하는 놀이이기 때문이다. 대신 틀린 채로
 * 검수에 올리는 것을 세 번까지만 받아 준다. 오래 앉아 있는 사람이 아니라 정확한 사람이
 * 멀리 가야 등수에 뜻이 생긴다.
 */
const ENDLESS_LIVES = 3;

/*
 * 지금 손대고 있는 층. 아래에서부터 센 층수이고 0 이면 전체다.
 * 전체로 두면 뒷칸을 찍자고 판을 돌려야 한다. 한 층만 켜면 그 층 열여섯 칸이 전부
 * 드러나므로 돌릴 일이 없다. 돌리기는 다 세운 뒤 구경하는 데 쓴다.
 */
let floor = 0;

/** 층 고르개를 새로 칠한다. 고른 칸만 눌린 꼴로 둔다. */
function paintFloors() {
  document.querySelectorAll('#s-floor-chips .chip').forEach((b) => {
    b.classList.toggle('on', Number(b.dataset.floor) === floor);
    b.setAttribute('aria-pressed', Number(b.dataset.floor) === floor ? 'true' : 'false');
  });
}

function setFloor(n) {
  floor = n;
  paintFloors();
  draw();
}

/** 도면에 없는데 켜진 칸 수. 화면에서 붉게 뜨는 그 칸이다. */
function redCount(a, goal) {
  const f = front(a), fg = front(goal), s = side(a), sg = side(goal);
  let n = 0;
  for (let y = 0; y < H; y++) for (let c = 0; c < N; c++) {
    if (f[y][c] && !fg[y][c]) n++;
    if (s[y][c] && !sg[y][c]) n++;
  }
  return n;
}

/* ── 그리기 ─────────────────────────────────────────────── */
function draw() {
  const goal = fromKeep(run.stage.keep);
  const tFront = front(goal), tSide = side(goal), budget = count(goal);
  const a = state.blocks;
  const spent = count(a);

  const cur = { front: front(a), side: side(a) };
  // 층을 골랐으면 두 도면에서 그 층에 해당하는 줄을 짚어 준다. 도면 맨 윗줄이 꼭대기다.
  drawPlans(plans, cur, tFront, tSide, floor ? H - floor : -1);

  setCam();
  // 자재는 자재표에 적힌 수뿐이다. 다 쓰고 나면 먼저 빼야 다시 세울 수 있다.
  drawScene(iso, a, floor, spent < budget);

  const okFront = sameGrid(cur.front, tFront);
  const okSide = sameGrid(cur.side, tSide);
  const st = $('#s-status');
  /* 맺기 전에는 맞다는 말을 하지 않는다. 스스로 맞다고 보고 검수에 올리는 것이 이 일의
   * 마지막 손질인데, 화면이 먼저 맞다고 일러 주면 검수 올리기가 확인 단추로 전락한다. */
  if (okFront && okSide && spent === budget && run.done) {
    st.textContent = t('status.passed', { n: budget });
    st.className = 'status win';
    return true;
  }
  /* 남은 자재 수만 적는다. 도면이 맞았는지 틀렸는지는 적지 않는다. 두 장 다 맞았다고
   * 띄우는 순간 검수 올리기가 확인 단추가 되고, 도면을 읽는 대신 화면을 읽게 된다. */
  st.innerHTML = `${t('status.count')} <span class="budget">${spent} / ${budget}</span>`;
  st.className = 'status bad';
  return false;
}

/**
 * 검수에 올린다. 다 세웠다고 저절로 끝나지 않는다. 스스로 맞다고 판단해 올리는 것이
 * 이 일의 마지막 손질이다. 틀렸으면 물리기만 하고 판은 그대로 둔다.
 */
function submit() {
  if (run.done) return;
  const goal = fromKeep(run.stage.keep);
  const a = state.blocks;
  const budget = count(goal), spent = count(a);

  /* 자재 수가 안 맞는 것은 아직 다 세우지 않았다는 뜻이라 물림으로 치지 않는다.
   * 다 세워 놓고 틀린 것만 물림이다. */
  if (spent !== budget) {
    sound.reject();
    toast(spent < budget ? t('toast.short', { n: budget - spent }) : t('toast.over', { n: spent - budget }));
    return;
  }
  if (!sameGrid(front(a), front(goal)) || !sameGrid(side(a), side(goal))) {
    sound.reject();
    toast(t('toast.mismatch'));
    return;
  }

  run.done = true;
  sound.stamp();
  showOff().then(finish);
}

/*
 * 다 세운 것을 한 바퀴 돌려 보여 준다.
 *
 * 검수 창이 바로 덮어 버리면 정작 무엇을 세웠는지 볼 틈이 없다. 도면과 조작 줄을
 * 잠깐 걷고 부지만 남겨, 제 손으로 세운 것이 어떤 꼴인지 보게 한다. 층을 골라 두었다면
 * 전체로 되돌린다. 한 층만 보이는 채로 자랑할 것은 없다.
 *
 * 급한 사람은 아무 데나 누르면 건너뛴다.
 */
/*
 * 광고가 안 됐을 때 무엇이라고 할지.
 *
 * 한 마디로 뭉뚱그리면 쓰는 사람은 제가 뭘 잘못했나 싶어진다. 스스로 닫은 것인지,
 * 아직 준비가 안 된 것인지, 정말 터진 것인지는 갈라서 말해 준다.
 */
const AD_WHY = {
  dismissed: 'toast.adDismissed',
  notready: 'toast.notready',
  unavailable: 'toast.notready',
};
const adWhy = (reason) => AD_WHY[reason] || 'toast.adFail';

const SHOW_MS = 2200;
function showOff() {
  return new Promise((done) => {
    floor = 0;
    paintFloors();
    turnToken++;                       // 돌리던 것이 있으면 버린다
    const screen = $('#scr-play');
    screen.classList.add('showing');

    const from = cam.yaw, to = from + Math.PI * 2, t0 = performance.now();
    let over = false;
    const end = () => {
      if (over) return;
      over = true;
      screen.removeEventListener('pointerdown', end);
      cam.yaw = to;
      screen.classList.remove('showing');
      draw();
      done();
    };
    screen.addEventListener('pointerdown', end);

    const step = () => {
      if (over) return;
      const k = Math.min(1, (performance.now() - t0) / SHOW_MS);
      // 처음과 끝을 눅여, 돌기 시작하고 멎는 것이 눈에 걸리지 않게 한다.
      const e = k < 0.5 ? 2 * k * k : 1 - 2 * (1 - k) * (1 - k);
      cam.yaw = from + (to - from) * e;
      draw();
      if (k < 1) setTimeout(step, 16);
      else end();
    };
    step();
  });
}

/*
 * 되돌리기와 힌트 단추. 남은 수를 단추에 적는다.
 * 광고제거를 산 사람에게는 되돌리기 수를 세지 않으므로 수 대신 무한 표시를 둔다.
 */
function refreshHintBtn() {
  $('#s-hint-count').textContent = t('btn.hint', { n: save.hintsLeft() });
  $('#s-undo-count').textContent = save.adFree()
    ? t('btn.undoFree')
    : t('btn.undo', { n: save.undosLeft() });
}

/*
 * 하던 판은 적어 두지 않는다.
 *
 * 판에서 나가면 그 판은 없던 일이 된다. 이어서 하기를 두면 "나가서 판을 살펴보고
 * 다시 들어오기" 가 되고, 검수 등급이 되돌리기와 힌트를 세는 뜻이 옅어진다.
 * 나가는 것 자체가 물리는 것이다.
 */

/* ── 돌리기 단추 ─────────────────────────────────────
 * 한 모서리씩(90도) 돈다. 그냥 값을 바꿔 버리면 어느 쪽으로 돌았는지 안 보이므로
 * 짧게 돌려서 보여 준다.
 */
let turnToken = 0;
function turn(delta) {
  const from = cam.yaw, to = from + delta, t0 = performance.now(), mine = ++turnToken;

  /* 타이머로 돌린다. 화면 프레임(requestAnimationFrame)에 걸면 창이 안 그려지는 동안
   * 아예 오지 않아서, 눌러도 안 돌아간 채로 남는다. 타이머는 늦게라도 끝까지 간다. */
  const step = () => {
    if (mine !== turnToken) return;   // 그새 또 눌렀으면 이 회전은 버린다
    const k = Math.min(1, (performance.now() - t0) / 220);
    const e = k < 0.5 ? 2 * k * k : 1 - 2 * (1 - k) * (1 - k);   // 처음과 끝을 눅인다
    cam.yaw = k < 1 ? from + (to - from) * e : to;
    draw();
    if (k < 1) setTimeout(step, 16);
  };
  step();
}

/** 끝없이 풀기의 머리줄. 몇 판째인지와 남은 기회를 함께 보인다. */
function refreshEndlessName() {
  $('#s-stage-name').textContent = t('endless.name', { n: run.endlessCount + 1 })
    + t('endless.lives', { n: ENDLESS_LIVES - run.misses });
}

/* ── 판 열기 ─────────────────────────────────────────── */
function openStage(stage, index, endless) {
  /* 부지 크기를 먼저 갈아 끼운다. 씨앗만 적힌 판은 이때 그 크기로 뽑힌다.
   * 차례가 바뀌면 앞 판 크기로 뽑혀 바닥에 닿지 않고 뜬다. */
  stage = prepare(stage);
  run.stage = stage;
  run.index = index;
  run.endless = endless;
  run.undos = 0;
  run.hintsUsed = 0;
  run.done = false;

  load(stage.keep, stage.name);
  floor = 0;
  buildFloors();
  resetCam();

  if (endless) refreshEndlessName();
  else $('#s-stage-name').textContent = `${jobName({ id: stage.jobId })} — ${stageName(stage)}`;
  $('#s-back').textContent = endless ? t('play.quit') : t('play.back');

  refreshHintBtn();
  show('play');
  draw();
  fitButtons();
}

/**
 * 의뢰의 첫 판을 처음 열면 일지가 한 번 흐르고, 연습판이면 도편수가 한 마디 붙인다.
 * 이미 검수를 받은 판을 다시 열 때는 아무 말도 하지 않는다. 두 번째부터는 잔소리다.
 */
async function startStage(i) {
  const stage = STAGES[i];
  const firstTime = !save.bestOf(stage.id);

  // 판을 먼저 펼쳐 놓고 말을 건다. 말하는 동안 고르개를 보고 있으면 어디로 가는지 모른다.
  openStage(stage, i, false);
  // 아주 처음 여는 사람에게는 누구로 갈지 묻고, 둘이 누구인지부터 알린다. 한 번뿐이다.
  if (!hero.isChosen()) await pickHero();
  if (!save.seenIntro()) { save.markIntroSeen(); await talk.say(prologue()); }
  if (stage.first && firstTime) {
    const job = JOBS.find((j) => j.id === stage.jobId);
    await talk.say(jobIntro(job));
  }
  if (stage.tip && firstTime) await talk.say(stageTip(stage));
}

async function startEndless() {
  run.endlessCount = 0;
  run.misses = 0;
  revived = false;   // 되살리기는 한 판에 한 번뿐이다
  openStage(endlessStage(0), -1, true);
  await talk.say(endlessStart());
}

/* ── 판 맺기 ─────────────────────────────────────────── */
function finish() {
  if (run.endless) {
    run.endlessCount++;
    toast(t('toast.endlessCleared', { n: run.endlessCount }));
    setTimeout(() => {
      if (run.endless && run.done) { const keep = run.misses; openStage(endlessStage(run.endlessCount), -1, true); run.misses = keep; refreshEndlessName(); }
    }, 900);
    return;
  }
  const grade = save.grade(run.undos, run.hintsUsed);
  const before = save.bestOf(run.stage.id);
  const coinGot = save.recordClear(run.stage.id, run.index, grade, STAGES.length);
  /* 갑으로 처음 맺은 판은 힌트 하나로 갚아 준다. 잘 세운 사람이 다음 판에서 덜 막힌다.
   * 서버가 붙어 있으면 얹는 것은 서버가 한다(saveProgress). 여기서 또 더하면 두 번 얹힌다. */
  if (grade === 3 && before < 3 && !save.synced()) save.bonusHint();

  const last = run.index >= STAGES.length - 1;
  const nextIndex = run.index + 1;
  const stage = run.stage;
  const detail = [];
  if (run.undos) detail.push(t('clear.undos', { n: run.undos }));
  if (run.hintsUsed) detail.push(t('clear.hints', { n: run.hintsUsed }));
  if (grade === 3 && before < 3) detail.push(t('clear.bonus'));
  if (coinGot) detail.push(t('clear.coins', { n: coinGot }));

  openClear({
    title: t('clear.title', { name: stageName(stage) }),
    grade,
    quote: verdict(grade),
    reply: verdictReply(grade),
    body: detail.join(' · '),
    actions: last
      ? [{ label: t('clear.toSelect'), onClick: openSelect }]
      : [{ label: t('clear.next'), onClick: () => nextStage(nextIndex, stage) },
         { label: t('clear.toSelect'), onClick: () => afterJob(stage).then(openSelect) }],
  });
}

/**
 * 의뢰의 마지막 판을 맺었을 때. 세운 건물을 한 장 보여 주고 나서 일지 뒷장이 흐른다.
 * 다섯 판을 푼 값이 눈에 보여야 다음 의뢰로 넘어갈 마음이 든다.
 */
function afterJob(stage) {
  if (!stage.last) return Promise.resolve();
  const job = JOBS.find((j) => j.id === stage.jobId);
  return new Promise((done) => {
    openClear({
      title: t('job.done', { name: jobName(job) }),
      image: job.art,
      body: jobOutroText(job),
      actions: [{ label: t('clear.continue'), onClick: () => talk.say(jobOutro()).then(done) }],
    });
  });
}

/* 다음 판. 사이에 광고를 끼우지 않는다. 방금 세운 것을 볼 틈도 없이 광고가 덮으면
 * 판을 맺은 보람이 사라진다. 광고는 스스로 누를 때만 나온다. */
async function nextStage(i, fromStage) {
  await afterJob(fromStage);
  startStage(i);
}

/*
 * 물림 셋으로 끝났을 때 한 번만. 광고를 보면 기회 하나를 돌려주고 그 자리에서 잇는다.
 *
 * 광고를 붙일 자리로 이만한 데가 없다. 쌓아 온 기록이 눈앞에서 사라지는 참이라, 억지로
 * 보여 주지 않아도 스스로 누른다. 한 판에 한 번만 받는다. 그러지 않으면 광고만 보면
 * 끝나지 않는 판이 되어 순위표가 뜻을 잃는다.
 */
function offerRevive() {
  return new Promise((done) => {
    openClear({
      title: t('revive.title'),
      icon: 'shard',
      body: t('revive.body', { n: run.endlessCount }),
      actions: [
        {
          label: ads.isAdFree() ? t('revive.freeWatch') : t('revive.watch'),
          onClick: async () => {
            const r = await ads.rewarded(AD_PLACEMENT);
            if (!r.ok) { toast(t(adWhy(r.reason))); done(false); return; }
            save.claimAd(AD_REWARD.revive);   // 기회는 판 안에서만 쓰는 것이라 지갑을 안 건드린다
            run.misses = ENDLESS_LIVES - 1;   // 기회 하나를 돌려준다
            revived = true;
            refreshEndlessName();
            toast(t('toast.revived'));
            done(true);
          },
        },
        { label: t('revive.give'), onClick: () => done(false) },
      ],
    });
  });
}

/** 이번 끝없이 풀기에서 이미 되살아났는지. 판을 새로 열 때 다시 거짓이 된다. */
let revived = false;

async function quitEndless(overByMiss = false) {
  const n = run.endlessCount;
  const isBest = save.recordEndless(n);
  const coinGot = save.earnEndless(n);   // 넘긴 판만큼 엽전. 본편을 다 깬 뒤에도 벌 길이 남는다.
  run.endless = false;

  // 기록은 서버에 올리고 등수는 서버에서 받아 온다. 안 붙어 있으면 이 줄만 통째로 빠진다.
  let rankLine = '';
  if (n > 0 && leaderboard.available()) {
    await leaderboard.submitScore(n, save.nickname());
    const mine = await leaderboard.myBestRank();
    if (mine && mine.rank > 0) rankLine = t('endless.rank', { n: mine.rank });
  }

  openClear({
    title: t(overByMiss ? 'endless.overTitle' : 'endless.quitTitle'),
    quote: endlessDone(n)[0],
    reply: endlessDone(n)[1],
    body: (overByMiss ? t('endless.overBody') : '') + t('endless.quitBody', { n })
      + (isBest ? t('endless.best') : t('endless.notBest', { n: save.endlessBest() }))
      + (coinGot ? t('endless.coins', { n: coinGot }) : '')
      + rankLine,
    actions: [{ label: t('endless.toTitle'), onClick: openTitle }],
  });
}

/* ── 복원공 고르기 ───────────────────────────────────
 * 처음 시작할 때 한 번 묻고, 그 뒤로는 타이틀에서 다시 열 수 있다.
 * 고른 뒤에는 대사에 붙는 얼굴도, 타이틀에 선 사람도 그쪽으로 바뀐다.
 */
/*
 * 복원공 고르기.
 *
 * 잠긴 쪽은 감추지 않고 잠긴 채로 보여 준다. 있는 줄도 몰랐던 것은 사고 싶어지지
 * 않는다. 누르면 무엇을 사면 열리는지 그 자리에서 말해 준다.
 */
function pickHero() {
  const sheet = $('#s-hero');
  return new Promise((done) => {
    sheet.querySelectorAll('.hero-card').forEach((b) => {
      const id = b.dataset.hero;
      const open = hero.unlocked(id);
      b.classList.toggle('locked', !open);
      const tag = b.querySelector('.hero-lock');
      if (tag) tag.hidden = open;

      b.onclick = () => {
        if (!hero.unlocked(id)) { toast(t('hero.locked')); return; }
        sound.chip();
        hero.choose(id);
        sheet.hidden = true;
        refreshTitleFigure();
        done();
      };
    });
    sheet.hidden = false;
  });
}

/** 타이틀에 세워 둔 사람을 고른 쪽으로 갈아 끼운다. */
function refreshTitleFigure() {
  const el = $('#s-title-figure');
  el.onerror = () => { el.hidden = true; };
  el.hidden = false;
  el.src = `./art/apprentice-${hero.chosen() || 'm'}.webp`;
}

/* ── 화면 ─────────────────────────────────────────────── */
const gradeSum = () => STAGES.reduce((n, s) => n + save.bestOf(s.id), 0);
const clearedCount = () => STAGES.filter((s) => save.bestOf(s.id)).length;

function openTitle() {
  $('#s-title-note').textContent = t('title.note', {
    done: clearedCount(), total: STAGES.length,
    hints: save.hintsLeft(),
    undos: save.adFree() ? t('btn.undoFree') : save.undosLeft(),
    coins: save.coins(),
  })
    + (save.endlessBest() ? t('title.endlessBest', { n: save.endlessBest() }) : '');
  /* 끝없이 풀기가 잠겨 있으면 무엇을 해야 열리는지 단추에 적는다.
   * 눌러 봐야 알림이 뜨는 것보다, 눌러 보기 전에 아는 편이 낫다. */
  const endlessBtn = $('#s-endless');
  const opened = save.tutorialDone(TUTORIAL_COUNT);
  endlessBtn.disabled = !opened;
  if (opened) {
    endlessBtn.textContent = t('menu.endless');
  } else {
    const left = TUTORIAL_COUNT - STAGES.slice(0, TUTORIAL_COUNT).filter((s) => save.bestOf(s.id)).length;
    endlessBtn.textContent = t('menu.endlessLocked', { n: left, job: jobName(JOBS[0]) });
  }


  // Verse8 쪽이 안 붙었으면 등수도 상점도 있을 이유가 없다. 아예 감춘다.
  const online = leaderboard.available();
  $('#s-rank').hidden = !online;
  /* 광고제거는 한 번 사면 끝이라, 산 뒤에는 단추를 감춘다. 산 물건을 계속 권하는
   * 것만큼 볼썽사나운 것이 없다. 힌트는 팔지 않는다. */
  $('#s-buy-adfree').hidden = !shop.available(SHOP_PRODUCTS.premium)
    || save.adFree() || shop.owned(SHOP_PRODUCTS.premium);

  show('title');
  fitButtons();
}

function openSelect() {
  renderJobList($('#s-stage-grid'), JOBS, {
    bestOf: save.bestOf,
    isUnlocked: save.isUnlocked,
    onPick: startStage,
  });
  $('#s-select-note').textContent = t('title.note', {
    done: clearedCount(), total: STAGES.length,
    hints: save.hintsLeft(),
    undos: save.adFree() ? t('btn.undoFree') : save.undosLeft(),
    coins: save.coins(),
  });
  show('select');
  fitButtons();
}

/** 복원 일지. 세운 것만 적힌다. 아직 안 한 의뢰는 줄만 비워 둔다. */
function openLog() {
  const rows = [];
  JOBS.forEach((job) => {
    const done = job.stages.filter((s) => save.bestOf(s.id));
    if (!done.length) { rows.push(t('log.untouched', { name: jobName(job) })); return; }
    rows.push(t('log.head', { name: jobName(job), done: done.length, total: job.stages.length })
      + '\n' + jobIntroText(job).split('\n')[0]);
    done.forEach((s) => rows.push(t('log.stage', { name: stageName(s), g: gradeText(save.bestOf(s.id)) })));
    if (done.length === job.stages.length) rows.push('  ' + jobOutroText(job));
  });
  openClear({
    title: t('log.title'),
    list: rows,
    actions: [{ label: t('clear.close'), onClick: () => {} }],
  });
}

/* ── 손잡이 달기 ─────────────────────────────────────────
 * 돌리기도 누르기도 부지 하나에 한 번만 단다. 그린 뒤에 다시 달 일이 없다.
 */
attachRotator(iso, draw);
attachPicker(iso, (d, y, x, solid) => {
  if (run.done) return;  // 다 맞춘 판은 더 건드리지 않는다

  /*
   * 세운 자재는 눌러서 못 뺀다. 물리려면 되돌리기를 써야 한다.
   *
   * 눌러서 빼는 길을 열어 두면 그것이 값 없는 되돌리기가 된다. 검수 등급은 되돌리기를
   * 몇 번 썼는지로 갈리는데, 옆에 공짜로 무르는 길이 있으면 아무도 되돌리기를 누르지
   * 않고 등급도 뜻을 잃는다. 한 번 세운 것은 되돌리는 값을 치러야 한다.
   */
  if (solid) { toast(t('toast.cannotRemove')); return; }

  const goal = fromKeep(run.stage.keep);
  const before = redCount(state.blocks, goal);
  toggle(d, y, x, solid);
  if (solid) sound.remove(); else sound.place();
  draw();

  /* 끝없이 풀기에서는 도면에 없는 칸을 켜는 것이 곧 잘못 놓은 것이다. 화면에 붉은 칸이
   * 뜨는 그 순간이라, 무엇 때문에 깎였는지 눈으로 바로 보인다. 빼는 손질은 세지 않는다. */
  if (run.endless && !solid && redCount(state.blocks, goal) > before) {
    run.misses++;
    const left = ENDLESS_LIVES - run.misses;
    sound.miss();
    refreshEndlessName();
    if (left <= 0) {
      /* 기회를 다 썼다. 광고가 붙어 있고 아직 안 되살아났으면 한 번 물어본다. */
      if (!revived && ads.available(AD_PLACEMENT)) {
        offerRevive().then((ok) => { if (!ok) quitEndless(true); });
      } else {
        quitEndless(true);
      }
      return;
    }
    toast(t('toast.miss', { n: left }));
  }
});

/* ── 조작 ─────────────────────────────────────────────── */

/* 층 고르개를 채운다. 아래에서부터 1층이라 칸은 뒤집어 놓는다. 화면에서 위에 있는
 * 칸이 실제로도 위층이어야 손이 헷갈리지 않는다. */
function buildFloors() {
  const box = $('#s-floor-chips');
  const rows = [];
  for (let f = H; f >= 1; f--) rows.push(`<button class="chip" data-floor="${f}">${t('play.floorN', { n: f })}</button>`);
  rows.push(`<button class="chip" data-floor="0">${t('play.floorAll')}</button>`);
  box.innerHTML = rows.join('');
  box.querySelectorAll('.chip').forEach((b) => {
    b.onclick = () => { sound.chip(); setFloor(Number(b.dataset.floor)); };
  });
  paintFloors();
}
buildFloors();

/*
 * 되돌리기.
 *
 * 물리는 데 값을 매기지 않으면 아무렇게나 세워 보고 물리는 것이 가장 빠른 길이 된다.
 * 되돌릴 것이 남아 있는지 먼저 보고, 그 다음에야 물린다. 되돌릴 판이 없으면 재고도
 * 깎지 않는다. 판이 비어 있는데 하나 깎이면 억울하다.
 */
$('#s-undo').onclick = () => {
  if (run.done) return;
  if (!save.canUndo()) { offerUndo(); return; }
  if (!undo()) return;              // 되돌릴 것이 없다. 값도 안 치른다.
  save.spendUndo();
  sound.undo();
  run.undos++;
  refreshHintBtn();
  draw();
};

/*
 * 되돌리기가 떨어졌을 때. 광고를 보거나 엽전으로 산다.
 * 여기서 못 사면 처음부터 세우는 수밖에 없으므로, 두 길을 다 보여 준다.
 */
function offerUndo() {
  const canAd = ads.available(AD_PLACEMENT);
  const actions = [];

  if (canAd) {
    actions.push({
      label: ads.isAdFree() ? t('undo.freeWatch', { n: UNDO_PER_AD }) : t('undo.watch', { n: UNDO_PER_AD }),
      onClick: async () => {
        const r = await ads.rewarded(AD_PLACEMENT);
        if (!r.ok) { toast(t(adWhy(r.reason))); return; }
        const got = await save.claimAd(AD_REWARD.undo, { undos: UNDO_PER_AD });
        if (got.ok) sound.gain();
        refreshHintBtn();
        toast(got.ok ? t('toast.undoGot', { n: UNDO_PER_AD }) : t(`toast.${got.reason}`, { n: 0 }));
      },
    });
  }
  actions.push({ label: t('undo.cancel'), onClick: () => {} });

  openClear({
    title: t('undo.none'),
    icon: 'shard',
    body: t('undo.body', { c: save.coins() }),
    buys: buyRows(),
    actions,
  });
}

$('#s-reset').onclick = () => {
  if (run.done) return;
  sound.reset();
  reset();
  run.undos++;   // 통째로 되돌린 것이므로 되돌리기와 같이 친다
  draw();
};

$('#s-view').onclick = () => { sound.view(); resetCam(); draw(); };
/* 왼쪽 단추를 누르면 판이 왼쪽으로 도는 것처럼 보여야 한다. 화면에서 어느 쪽으로
 * 움직이는지가 기준이지, 카메라가 어느 쪽으로 도는지가 기준이 아니다. */
$('#s-rot-l').onclick = () => { sound.turn(); turn(Math.PI / 2); };
$('#s-rot-r').onclick = () => { sound.turn(); turn(-Math.PI / 2); };
$('#s-submit').onclick = submit;

function useHint() {
  const h = nextHint(state.blocks, run.stage.keep);
  if (!h) { toast(t('toast.noFix')); return; }
  if (!save.spendHint()) return;
  run.hintsUsed++;
  /* 짚어 준 자리가 감춰진 층이면 그 층으로 옮겨 준다. 돈 주고 산 힌트가 안 보이는
   * 데서 놓이면 무엇을 알려 준 것인지 알 길이 없다. */
  if (floor && H - h.y !== floor) { floor = H - h.y; paintFloors(); }
  toggle(h.d, h.y, h.x, !h.place);
  if (h.place) sound.place(); else sound.remove();
  refreshHintBtn();
  toast(t(h.place ? 'toast.hintPlaced' : 'toast.hintRemoved'));
  draw();
}

/* 힌트가 떨어졌을 때. 광고가 붙어 있으면 보고 하나 받을 수 있게 물어본다. */
function offerAdForHint() {
  openClear({
    title: t('hint.none'),
    icon: 'shard',
    body: t('hint.adBody', { n: HINT_PER_AD, c: save.coins() }),
    buys: buyRows(),
    actions: [
      ...(ads.available(AD_PLACEMENT) ? [{
        label: ads.isAdFree() ? t('hint.freeWatch') : t('hint.watch'),
        onClick: async () => {
          const r = await ads.rewarded(AD_PLACEMENT);
          if (!r.ok) { toast(t(adWhy(r.reason))); return; }
          const got = await save.claimAd(AD_REWARD.hint, { hints: HINT_PER_AD });
          if (got.ok) sound.gain();
          refreshHintBtn();
          toast(got.ok ? t('toast.hintGot', { n: HINT_PER_AD }) : t(`toast.${got.reason}`, { n: 0 }));
        },
      }] : []),
      { label: t('hint.cancel'), onClick: () => {} },
    ],
  });
}

$('#s-hintbtn').onclick = () => {
  if (run.done) return;
  if (save.hintsLeft() > 0) { useHint(); return; }
  if (ads.available(AD_PLACEMENT) || save.coins() >= PRICE.hint * PACK.hint) offerAdForHint();
  else toast(t('toast.noHint'));
};

$('#s-back').onclick = () => {
  if (run.endless) quitEndless();
  else openSelect();
};

/* ── 타이틀 ─────────────────────────────────────────── */
$('#s-start').onclick = openSelect;
$('#s-select-back').onclick = openTitle;
$('#s-log').onclick = openLog;
$('#s-endless').onclick = () => {
  if (!save.tutorialDone(TUTORIAL_COUNT)) { toast(t('toast.endlessLocked', { job: jobName(JOBS[0]) })); return; }
  startEndless();
};

/* ── 소리 ─────────────────────────────────────────────
 * 크기는 설정에서 정하고, 판을 푸는 중에는 머리의 단추로 끄고 켜기만 한다.
 * 껐다 켜면 끄기 전 크기로 돌아와야 하므로 그 값을 들고 있는다.
 */
let lastVolume = save.volume() || 0.7;

function refreshSoundBtn() {
  const off = sound.isMuted();
  // 아이콘 한 벌에 든 종은 빗금 그은 것뿐이다. 꺼졌을 때만 붙인다.
  $('#s-play-sound').innerHTML = off
    ? `<i class="ico ico-mute"></i>${t('play.soundOff')}`
    : t('play.soundOn');
}

function applyVolume(v, { remember = true } = {}) {
  sound.setVolume(v);
  // 소리를 끄면 소리통이 안 열려 음악도 멎는다. 다시 켜면 그때 되살린다.
  if (v > 0) bgm.start(); else bgm.stop();
  save.setVolume(v);
  if (remember && v > 0) lastVolume = v;
  refreshSoundBtn();
  const slider = $('#s-volume');
  slider.value = Math.round(v * 100);
  $('#s-volume-label').textContent = `${Math.round(v * 100)}%`;
}

/*
 * 음악 크기. 효과음과 따로 둔다.
 *
 * 하나로 묶으면 "말소리는 들리게 두고 음악만 줄이기" 를 못 한다. 이 게임은 대사가
 * 글로만 나오지만, 오래 켜 두는 것은 음악이라 그쪽만 줄이고 싶은 사람이 반드시 있다.
 */
function applyMusic(v) {
  bgm.setLevel(v);
  ambient.setLevel(v);
  save.setMusic(v);
  $('#s-music').value = Math.round(v * 100);
  $('#s-music-label').textContent = `${Math.round(v * 100)}%`;
}

applyVolume(save.volume(), { remember: false });
applyMusic(save.music());

/* 첫 누름에 튼다. 브라우저가 그 전에는 소리를 못 내게 막는다. */
bgm.armAutoStart();

$('#s-play-sound').onclick = () => {
  const next = sound.isMuted() ? lastVolume : 0;
  applyVolume(next, { remember: false });
  if (next > 0) sound.place();   // 켠 것이 들려야 켠 줄 안다
};

$('#s-volume').oninput = (e) => applyVolume(Number(e.target.value) / 100);
$('#s-music').oninput = (e) => applyMusic(Number(e.target.value) / 100);

/* ── Verse8 쪽 ─────────────────────────────────────────── */
/*
 * 등수 창. 이름도 여기서 적는다.
 *
 * 이름은 등수표에 걸릴 이름이다. 차림표 한구석에 떼어 두면 무엇에 쓰는 이름인지 알 수
 * 없다. 표를 보면서 적어야 "저기에 이 이름이 오르는구나" 가 한눈에 보인다.
 */
$('#s-rank').onclick = async () => {
  const rows = await leaderboard.topRankings();
  const mine = save.nickname();
  openClear({
    title: t('rank.title'),
    input: {
      label: t('menu.name'),
      value: mine === t('menu.namePlaceholder') ? '' : mine,
      placeholder: t('menu.namePlaceholder'),
      onInput: (v) => save.setNickname(v),
    },
    body: rows.length ? '' : t('toast.rankEmpty'),
    list: rows.map((r, i) => t('rank.row', { i: i + 1, name: r.nickname, n: r.score })),
    actions: [{ label: t('clear.close'), onClick: () => {} }],
  });
};

/*
 * 엽전 가게.
 *
 * 파는 것은 되돌리기와 힌트 둘뿐이다. 엽전은 판을 맺어서만 들어오므로, 여기서 쓰는 것은
 * 결국 제가 벌어 온 것이다. 값을 치르는 자리와 버는 자리가 한 화면 안에서 이어져야
 * 얼마를 벌었는지가 뜻을 가진다.
 */
function openShop() {
  openClear({
    title: t('shop.title'),
    icon: 'shard',
    body: t('shop.body', { c: save.coins() }),
    buys: buyRows(() => openShop()),      // 사고 나면 그 자리에서 다시 그린다
    actions: [{ label: t('clear.close'), onClick: () => { openTitle(); } }],
  });
}

/*
 * 살 것 목록. 가게에서도, 힌트나 되돌리기가 떨어졌을 때 뜨는 창에서도 같은 것을 쓴다.
 * 값이 두 군데에 따로 적히면 한쪽만 고치는 일이 생긴다.
 *
 * 못 사는 것도 지우지 않고 꺼 둔 채로 보여 준다. 무엇을 살 수 있는지 알아야 모을
 * 마음이 선다. after 는 사고 난 뒤에 부를 것이다.
 */
function buyRows(after) {
  const rows = [
    { what: 'undo', n: PACK.undo, name: t('shop.undoName', { n: PACK.undo }),
      have: save.adFree() ? t('btn.undoFree') : save.undosLeft(), got: 'toast.undoGot' },
    { what: 'hint', n: PACK.hint, name: t('shop.hintName', { n: PACK.hint }),
      have: save.hintsLeft(), got: 'toast.hintGot' },
  ];

  return rows.map((r) => {
    const cost = PRICE[r.what] * r.n;
    return {
      name: r.name,
      note: t('shop.have', { n: r.have }),
      cost: t('shop.price', { c: cost }),
      afford: save.coins() >= cost,
      onClick: () => {
        if (!save.buy(r.what, r.n)) { toast(t('toast.poor')); return; }
        sound.coin();
        refreshHintBtn();
        toast(t(r.got, { n: r.n }));
        if (after) after();
      },
    };
  });
}

$('#s-shop').onclick = openShop;

$('#s-buy-adfree').onclick = async () => {
  const ok = await shop.buy(SHOP_PRODUCTS.premium);
  toast(t(ok ? 'toast.shopOpen' : 'toast.shopFail'));
};

/*
 * 결제 창이 닫히면 서버 값을 다시 읽는다. 닫혔다는 것은 샀다는 뜻이 아니다. 실제로
 * 얹혔는지는 서버의 $onItemPurchased 가 넣어 준 값으로만 알 수 있다.
 */
shop.onClose(async () => {
  await shop.refresh();
  await account.sync();
  refreshHintBtn();
  if (!$('#scr-title').hidden) openTitle();
});

$('#s-wipe').onclick = () => {
  openClear({
    title: t('wipe.title'),
    body: t('wipe.body'),
    actions: [
      { label: t('wipe.yes'), onClick: () => { save.wipe(); toast(t('toast.wiped')); openTitle(); } },
      { label: t('wipe.no'), onClick: () => {} },
    ],
  });
};

/* ── 설정 ─────────────────────────────────────────────
 * 소리 크기와 말, 기록 지우기가 여기에 모인다. 타이틀 차림표를 짧게 두려는 것이다.
 */
const settingsSheet = $('#s-settings-sheet');
settingsSheet.onclick = (e) => { if (e.target === settingsSheet) settingsSheet.hidden = true; };
$('#s-settings-close').onclick = () => { settingsSheet.hidden = true; };

function openSettings() {
  renderLangPick();
  applyVolume(save.volume(), { remember: false });
  settingsSheet.hidden = false;
}

/** 말 고르개. 지금 쓰는 말은 눌린 것처럼 두어 어느 것인지 보이게 한다. */
function renderLangPick() {
  const box = $('#s-lang-pick');
  box.innerHTML = '';
  LANGS.forEach((l) => {
    const b = document.createElement('button');
    b.className = 'act lang-btn' + (l.id === lang() ? ' on' : '');
    b.textContent = l.label;
    b.onclick = () => { save.setLang(l.id); setLang(l.id); relang(); renderLangPick(); };
    box.appendChild(b);
  });
}

/** 말을 바꾸면 박아 둔 글자와 지금 떠 있는 화면을 함께 갈아 끼운다. */
function relang() {
  applyStatic();
  buildFloors();
  $('#s-title-sub').textContent = t('title.sub');
  $('#s-talk-hint').textContent = t('talk.hint');
  $('#s-talk-skip').textContent = t('talk.skip');
  $('#s-fig-front').textContent = t('plans.front');
  $('#s-fig-side').textContent = t('plans.side');
  $('#s-fig-cap').textContent = t('rules.fig');
  refreshHintBtn();
  refreshSoundBtn();
  if (run.stage) {
    $('#s-back').textContent = run.endless ? t('play.quit') : t('play.back');
    $('#s-stage-name').textContent = run.endless
      ? t('endless.name', { n: run.endlessCount + 1 })
      : `${jobName({ id: run.stage.jobId })} — ${stageName(run.stage)}`;
    draw();
  }
  if (!$('#scr-title').hidden) openTitle();
  if (!$('#scr-select').hidden) openSelect();
  fitButtons();
}

$('#s-settings-open').onclick = openSettings;

/* ── 규칙 창 ─────────────────────────────────────────── */
const ruleSheet = $('#s-rule');
const helpBtn = $('#s-help');
function showRule(on) {
  ruleSheet.hidden = !on;
  helpBtn.setAttribute('aria-expanded', String(on));
}
helpBtn.onclick = () => showRule(ruleSheet.hidden);
$('#s-title-rule').onclick = () => showRule(true);
$('#s-rule-close').onclick = () => showRule(false);
ruleSheet.onclick = (e) => { if (e.target === ruleSheet) showRule(false); };  // 바깥을 누르면 닫힌다
addEventListener('keydown', (e) => { if (e.key === 'Escape') showRule(false); });

/* 그림 주소는 여기서 넣는다. 상대 경로라야 Verse8 이 어느 경로에 얹든 따라간다.
 * 그림이 없으면 그 겹만 빠지고 글과 판은 그대로 읽힌다. */
/*
 * CSS 변수에 넣는 주소는 반드시 절대 주소로 만들어 둔다. 변수 안의 상대 경로는 문서가
 * 아니라 그 변수를 쓰는 스타일시트를 기준으로 풀려서, src/ui/art/... 같은 없는 자리를
 * 가리킨다. baseURI 로 한 번 펴 두면 Verse8 이 어느 경로에 얹든 그대로 맞는다.
 */
const artUrl = (name) => new URL(`./art/${name}`, document.baseURI).href;

$('#scr-title').style.backgroundImage = `url('${artUrl('title.webp')}')`;
refreshTitleFigure();
$('#s-hero-change').onclick = () => pickHero();
document.documentElement.style.setProperty('--paper', `url('${artUrl('paper.webp')}')`);
document.documentElement.style.setProperty('--icons', `url('${artUrl('icons.webp')}')`);
setWoodArt(artUrl('wood-top.webp'), artUrl('wood-side.webp'));

/* 말을 정한다. 고른 적이 있으면 그것, 없으면 브라우저가 쓰는 말을 따라간다. */
setLang(save.lang() || detect());
relang();

/*
 * 계정에 얹기. 서버가 붙어 있으면 브라우저에만 있던 기록을 계정으로 옮기고, 힌트와
 * 광고제거는 서버 값을 따른다. 안 붙어 있으면 이 줄은 아무 일도 하지 않는다.
 *
 * 첫 화면을 먼저 띄우고 뒤에서 맞춘다. 서버를 기다리느라 화면이 비어 있으면, 서버가
 * 없는 사람에게는 영영 안 뜨는 화면이 된다.
 */
/* 지난번에 광고가 안 됐으면 이번에는 아예 묻지 않는다. */
ads.setUnsupported(save.adsBroken());
ads.whenBroken(() => save.noteAdsBroken());

save.watch(() => {
  refreshHintBtn();
  ads.setAdFree(save.adFree());
  if (!$('#scr-title').hidden) openTitle();
});

/*
 * 주소에 ?mock=1 을 붙이면 모의 서버가 붙는다. Verse8 없이 "붙은 화면" 을 그대로 보려는
 * 것이다. 깃발이 없으면 이 꾸러미는 아예 안 실린다. 올린 게임에 딸려 갈 일이 없다.
 */
if (new URLSearchParams(location.search).has('mock')) {
  import('./platform/mock.js').then((m) => {
    m.install();
    if (account.attach()) account.sync();
    openTitle();
  });
} else {
  /*
   * Verse8 이 붙는 데 잠깐 걸린다. 화면을 먼저 띄우고 뒤에서 붙인다 — 기다렸다 띄우면,
   * 붙을 것이 없는 사람에게는 영영 안 뜨는 화면이 된다.
   */
  boot().then(() => {
    if (account.attach()) account.sync();
    openTitle();
  });
}

/* 첫 화면. 아직 아무것도 안 세운 사람은 창고부터 보게 된다. */
openTitle();
