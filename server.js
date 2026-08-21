/*
 * 남은 두 장 — 게임 서버.
 *
 * 이 파일은 저장소 루트에 있어야 하고 이름도 server.js 여야 한다. 클래스를 내보내면 안 된다.
 * 고친 뒤에는 다시 올려야 반영된다.
 *
 *   npx -y @agent8/deploy
 *
 * 올리고 나면 .env 에 VITE_AGENT8_VERSE 가 생기고, 그때부터 클라이언트가 붙을 수 있다.
 * 요청 하나마다 인스턴스가 새로 만들어지므로 클래스 변수에는 상수만 둔다.
 * setTimeout / setInterval 은 쓰지 않는다.
 */
/*
 * 엽전과 값. game/src/game/economy.js 와 같은 값을 둔다. 한쪽을 고치면 다른 쪽도
 * 고쳐야 화면에 적힌 값과 실제로 깎이는 값이 어긋나지 않는다.
 */
const COIN_BY_GRADE = { 1: 1, 2: 3, 3: 5 };
const COIN_PER_ENDLESS = 2;
const PREMIUM_COIN = 1.5;   // 프리미엄이 받는 배수
const PRICE = { undo: 4, hint: 15 };
const START = { hints: 3, undos: 10, coins: 0 };

/* 광고 보상 사이에 두는 간격. 이 안에 또 청구하면 거절한다. */
const AD_COOLDOWN_MS = 30 * 1000;

class Server {

  /* ── 리더보드 ──────────────────────────────────────
   * 끝없는 판에서 넘긴 판 수를 올린다.
   *
   * 사람마다 한 줄만 남긴다. 칠 때마다 줄을 더하면 잘하는 사람 서넛이 상위 스무 줄을
   * 통째로 차지해, 표가 순위표가 아니라 그 사람의 기록장이 된다. 더 높을 때만 갈아
   * 끼우고, 낮은 기록은 아예 받지 않는다.
   */
  async submitScore(score, nickname) {
    if (typeof score !== 'number' || !Number.isFinite(score) || score < 0) {
      throw new Error('Invalid score.');
    }
    if (typeof nickname !== 'string' || nickname.length < 1 || nickname.length > 15) {
      throw new Error('Nickname must be between 1 and 15 characters.');
    }

    const mine = await $global.getCollectionItems('rankings', {
      filters: [{ field: 'account', operator: '==', value: $sender.account }],
    });

    const entry = {
      account: $sender.account,
      score,
      nickname,
      createdAt: Date.now(),
    };

    /*
     * 항목을 가리키는 이름은 id 가 아니라 __id 다. 고치기와 지우기가 전부 이 값으로
     * 도는데, 잘못 쓰면 아무 말 없이 아무것도 안 지워진다. 그러면 칠 때마다 줄이
     * 쌓여 "사람마다 한 줄" 이 조용히 무너진다.
     */
    const best = (mine || []).reduce((a, b) => (!a || b.score > a.score ? b : a), null);
    if (best && best.score >= score) {
      // 이미 더 높은 기록이 있다. 이름만 바뀌었을 수 있으니 그것만 갈아 끼운다.
      if (best.nickname !== nickname) {
        await $global.updateCollectionItem('rankings', { ...best, nickname });
      }
      return { updated: false, best: best.score };
    }

    // 예전 줄은 지우고 새 줄 하나만 남긴다. 여러 줄이 쌓여 있던 기록도 여기서 정리된다.
    for (const row of mine || []) {
      await $global.deleteCollectionItem('rankings', row.__id);
    }
    await $global.addCollectionItem('rankings', entry);
    return { updated: true, best: score };
  }

  async getTopRankings() {
    return await $global.getCollectionItems('rankings', {
      orderBy: [{ field: 'score', direction: 'desc' }],
      limit: 20,
    });
  }

  async getMyBestRank() {
    const mine = await $global.getCollectionItems('rankings', {
      filters: [{ field: 'account', operator: '==', value: $sender.account }],
    });
    if (!mine || mine.length === 0) return { bestEntry: null, rank: -1 };

    const bestEntry = mine.reduce((a, b) => (b.score > a.score ? b : a));
    const above = await $global.countCollectionItems('rankings', {
      filters: [{ field: 'score', operator: '>', value: bestEntry.score }],
    });
    return { bestEntry, rank: above + 1 };
  }

  /* ── 계정에 저장 ────────────────────────────────────
   * 깬 판과 등급, 끝없는 판 최고 기록, 힌트, 설정을 계정에 얹는다. 브라우저에만 두면
   * 폰에서 깬 것을 컴퓨터에서 잇지 못하고, 틀 안에서 저장이 막히면 통째로 날아간다.
   *
   * 클라이언트가 보낸 것을 그대로 믿지 않는다. 판별 등급과 최고 기록은 큰 쪽만 받고,
   * 힌트는 아예 받지 않는다. 힌트는 사고파는 것이라 서버가 쥐고 있어야 한다.
   */
  async loadProgress() {
    const me = (await $global.getMyState()) || {};
    return {
      best: me.best || {},
      unlocked: me.unlocked || 1,
      endlessBest: me.endlessBest || 0,
      hints: typeof me.hints === 'number' ? me.hints : START.hints,
      undos: typeof me.undos === 'number' ? me.undos : START.undos,
      coins: typeof me.coins === 'number' ? me.coins : START.coins,
      adFree: !!me.adFree,
      nickname: me.nickname || '',
      hero: me.hero || '',
      lang: me.lang || '',
      volume: typeof me.volume === 'number' ? me.volume : null,
      music: typeof me.music === 'number' ? me.music : null,
      seenIntro: !!me.seenIntro,
      updatedAt: me.updatedAt || 0,
    };
  }

  /**
   * 클라이언트가 가진 것을 올린다. 기록은 큰 쪽으로 합치고, 설정은 나중 것으로 덮는다.
   * 합친 결과를 그대로 돌려주므로 클라이언트는 받은 것을 그대로 쓰면 된다.
   */
  async saveProgress(patch) {
    if (!patch || typeof patch !== 'object') throw new Error('Invalid progress.');

    const me = (await $global.getMyState()) || {};
    const best = { ...(me.best || {}) };

    /*
     * 갑으로 처음 맺은 판마다 힌트 하나를 얹어 준다. 이것도 서버가 한다. 클라이언트가
     * 제 손으로 힌트를 늘릴 수 있으면 상점이 설 자리가 없다.
     *
     * 판마다 한 번뿐이라 아무리 다시 올려도 두 번 얹히지 않는다. 등급은 1~3 으로 막아
     * 두었으므로, 최악의 경우에도 판 수만큼이 천장이다.
     */
    let bonus = 0;
    let earned = 0;
    for (const [id, stars] of Object.entries(patch.best || {})) {
      const n = Number(stars);
      if (!Number.isInteger(n) || n < 1 || n > 3) continue;      // 등급은 1~3 뿐이다
      const was = best[id] || 0;
      if (n === 3 && was < 3) bonus++;
      /* 엽전은 등급이 오른 만큼만. 같은 판을 되풀이해 벌 수 없고, 나중에 더 잘 세우면
       * 그 차액을 마저 받는다. */
      if (n > was) earned += (COIN_BY_GRADE[n] || 0) - (COIN_BY_GRADE[was] || 0);
      if (n > was) best[id] = n;
    }

    const next = {
      best,
      unlocked: Math.max(me.unlocked || 1, Math.min(200, Number(patch.unlocked) || 1)),
      endlessBest: Math.max(me.endlessBest || 0, Math.min(9999, Number(patch.endlessBest) || 0)),
      updatedAt: Date.now(),
    };
    if (bonus) next.hints = (typeof me.hints === 'number' ? me.hints : START.hints) + bonus;
    // 프리미엄은 더 받는다. 배수는 서버가 쥔다.
    if (earned && me.adFree) earned = Math.round(earned * PREMIUM_COIN);
    if (earned) next.coins = (typeof me.coins === 'number' ? me.coins : START.coins) + earned;

    /* 설정은 맞고 틀리고가 없으니 마지막에 손댄 것을 따른다. 힌트와 광고제거는
     * 여기서 건드리지 않는다. 클라이언트가 보내도 무시된다. */
    if (typeof patch.nickname === 'string') next.nickname = patch.nickname.slice(0, 15);
    if (typeof patch.hero === 'string') next.hero = patch.hero.slice(0, 4);
    if (typeof patch.lang === 'string') next.lang = patch.lang.slice(0, 8);
    if (typeof patch.volume === 'number') next.volume = Math.max(0, Math.min(1, patch.volume));
    if (typeof patch.music === 'number') next.music = Math.max(0, Math.min(1, patch.music));
    if (patch.seenIntro) next.seenIntro = true;

    await $global.updateMyState(next);
    return await this.loadProgress();
  }

  /**
   * 기록 지우기. 처음 상태로 되돌린다 — 힌트 셋, 되돌리기 열, 엽전 영.
   *
   * 엽전을 남기면 스무 판 깨서 벌고 지우고 또 깨는 것이 그대로 돈벌이가 된다.
   * 힌트를 남기면 바닥난 채로 새로 시작하게 된다. 남기는 것은 광고제거뿐이다 —
   * 그것만 실제로 돈을 주고 산 것이다.
   */
  async wipeProgress() {
    await $global.updateMyState({
      best: {}, unlocked: 1, endlessBest: 0, seenIntro: false,
      hints: START.hints, undos: START.undos, coins: START.coins,
      updatedAt: Date.now(),
    });
    return await this.loadProgress();
  }

  /* ── 지갑 ────────────────────────────────────────
   * 엽전과 되돌리기, 힌트는 전부 서버가 쥔다. 클라이언트가 제 손으로 늘릴 수 있으면
   * 벌 이유도 살 이유도 없어진다.
   */
  async spendUndo() {
    const me = (await $global.getMyState()) || {};
    if (me.adFree) return { ok: true, undos: -1 };          // 무한이라 세지 않는다
    const have = typeof me.undos === 'number' ? me.undos : START.undos;
    if (have <= 0) return { ok: false, undos: 0 };
    await $global.updateMyState({ undos: have - 1 });
    return { ok: true, undos: have - 1 };
  }

  /** 엽전으로 되돌리기나 힌트를 산다. what 은 'undo' 또는 'hint'. */
  async buy(what, n) {
    const unit = PRICE[what];
    const count = Number(n);
    if (!unit || !Number.isInteger(count) || count < 1 || count > 99) {
      return { ok: false, reason: 'bad-request' };
    }

    const me = (await $global.getMyState()) || {};
    const coins = typeof me.coins === 'number' ? me.coins : START.coins;
    const cost = unit * count;
    if (coins < cost) return { ok: false, reason: 'poor', coins };

    const next = { coins: coins - cost };
    if (what === 'undo') next.undos = (typeof me.undos === 'number' ? me.undos : START.undos) + count;
    else next.hints = (typeof me.hints === 'number' ? me.hints : START.hints) + count;

    await $global.updateMyState(next);
    return {
      ok: true,
      coins: next.coins,
      undos: typeof next.undos === 'number' ? next.undos : (typeof me.undos === 'number' ? me.undos : START.undos),
      hints: typeof next.hints === 'number' ? next.hints : (typeof me.hints === 'number' ? me.hints : START.hints),
    };
  }

  /*
   * 끝없이 풀기에서 넘긴 판만큼 엽전을 얹는다. 판을 접을 때 한 번만 부른다.
   *
   * 넘긴 판 수는 클라이언트가 세어 보낸다. 서버가 판마다 검사하지 않는 이상 이보다
   * 촘촘히 막을 길이 없다. 다만 한 번에 받을 수 있는 수를 막아 두었고, 엽전은 게임
   * 안에서만 쓰는 것이라 속여도 남의 기록이나 결제에는 닿지 않는다.
   */
  async claimEndlessCoins(n) {
    const count = Number(n);
    if (!Number.isInteger(count) || count < 1) return { ok: false, reason: 'bad-request' };

    const me = (await $global.getMyState()) || {};
    const got = Math.round(Math.min(count, 200) * COIN_PER_ENDLESS * (me.adFree ? PREMIUM_COIN : 1));
    const coins = (typeof me.coins === 'number' ? me.coins : START.coins) + got;
    await $global.updateMyState({ coins });
    return { ok: true, coins, got };
  }

  /* ── 힌트 ────────────────────────────────────────
   * 힌트는 서버에 쌓아 둔다. 클라이언트가 제 손으로 늘릴 수 있으면 살 이유가 없다.
   */
  async getHints() {
    const me = await $global.getMyState();
    return (me && me.hints) || 0;
  }



  async spendHint() {
    const me = await $global.getMyState();
    const have = (me && me.hints) || 0;
    if (have <= 0) return { ok: false, hints: 0 };
    await $global.updateMyState({ hints: have - 1 });
    return { ok: true, hints: have - 1 };
  }

  /*
   * 상점에서 산 것은 여기로 들어온다. 창이 닫혔다는 클라이언트 신호로는 절대 주지 않는다.
   *
   * metadata 는 안 쓴다. 콘솔에서 상품에 붙여 둔 JSON 이 그대로 넘어오는 자리인데,
   * 이 게임은 파는 것이 하나뿐이고 그 하나가 무엇을 주는지는 아래 표에 적혀 있다.
   * 줄 것을 콘솔에 적어 두면, 값을 고치러 두 군데를 봐야 하고 콘솔을 잘못 만지면
   * 조용히 다른 것이 나간다. 상품이 여럿 되고 같은 처리로 묶고 싶어질 때에나 쓴다.
   */
  async $onItemPurchased({ account, purchaseId, productId, quantity }) {
    const state = (await $global.getUserState(account)) || {};

    switch (productId) {
      /* 광고 없이 보상 받기. 한 번 사면 계속 남는 물건이라, 콘솔에서 한 사람당 한 번만
       * 살 수 있게(Lifetime Limit 1) 걸어 두어야 한다. */
      case 'two-sheets-premium': {
        await $global.updateUserState(account, { adFree: true, adFreeAt: Date.now() });
        break;
      }
      default:
        break;   // 모르는 상품은 건드리지 않는다
    }
    return { success: true };
  }

  /* ── 광고 보상 ────────────────────────────────────
   *
   * **검증 서버(ads-verifier)를 쓰지 않는다.** 광고를 막 본 직후에 물어보면 아직
   * pending 이 오는데, server.js 는 setTimeout 을 못 써서 잠시 뒤 다시 물어볼 수가
   * 없다. 그대로 두면 광고를 끝까지 본 사람이 보상을 못 받는다. 같은 자리에서 이미
   * 깨진 것을 확인했다.
   *
   * 대신 클라이언트가 rewarded 를 받은 뒤에만 이 함수를 부르고, 서버는 바로 지급한다.
   * **서버가 여전히 쥐고 있는 것**: 얼마를 줄지(클라이언트가 액수를 못 보낸다), 얼마나
   * 자주 받을 수 있는지. "봤는지"만 안 보고 "무한"은 막는다.
   *
   * 조작된 클라이언트가 이 함수를 직접 부르면 광고 없이 받을 수 있다. 주는 것이 게임
   * 안에서만 쓰는 힌트와 되돌리기라 거기까지가 감당할 만한 값이다.
   */
  async claimAdReward(kind) {
    /* 무엇을 줄지는 여기서만 정한다. 클라이언트는 이름만 보낸다. */
    const AD_REWARD = {
      hint: { hints: 1 },
      undo: { undos: 3 },
      /* 되살리기는 지갑을 안 건드린다. 그 판 안에서만 쓰는 기회라 클라이언트가 세고,
       * 서버는 광고를 봤다는 것만 받아 둔다. 쿨다운도 걸지 않는다 — 여기서 막히면
       * 기록이 눈앞에서 끝난다. */
      revive: { free: true },
    };

    const reward = AD_REWARD[kind];
    if (!reward) return { ok: false, reason: 'ad_unknown' };
    if (reward.free) return { ok: true };

    /*
     * 자물쇠. 같은 계정이 두 창에서 동시에 청구하면 읽고-더하고-쓰기가 엇갈려 한쪽이
     * 통째로 묻힌다. 쿨다운도 같은 이유로 자물쇠 안에서 봐야 뜻이 있다.
     */
    return await $lock(`acct:${$sender.account}`, async () => {
      const me = (await $global.getMyState()) || {};
      const now = Date.now();
      if (now - (me.adAt || 0) < AD_COOLDOWN_MS) return { ok: false, reason: 'ad_cooldown' };

      const next = { adAt: now };
      if (reward.hints) next.hints = (typeof me.hints === 'number' ? me.hints : START.hints) + reward.hints;
      if (reward.undos) next.undos = (typeof me.undos === 'number' ? me.undos : START.undos) + reward.undos;
      await $global.updateMyState(next);

      return {
        ok: true,
        hints: typeof next.hints === 'number' ? next.hints : (typeof me.hints === 'number' ? me.hints : START.hints),
        undos: typeof next.undos === 'number' ? next.undos : (typeof me.undos === 'number' ? me.undos : START.undos),
      };
    });
  }
}
