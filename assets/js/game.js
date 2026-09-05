/* BattleQuiz - game logic.
 * Two to four players share one device and take turns. Every question exists in
 * both Turkish and English, so a player's language choice is purely how they
 * read it; their *age* decides how hard it is. Answer correctly and you pick
 * the topic the next player has to face.
 */
(function () {
  "use strict";

  /* ---------- constants ---------- */
  var TOPICS = ["science", "nature", "geography", "history", "sport",
                "music", "screen", "books", "tech", "life"];
  var TOPIC_KEY = {
    science: "topicScience", nature: "topicNature", geography: "topicGeography",
    history: "topicHistory", sport: "topicSport", music: "topicMusic",
    screen: "topicScreen", books: "topicBooks", tech: "topicTech", life: "topicLife"
  };
  var MAX_PLAYERS = 4;
  var MIN_PLAYERS = 2;
  var TIME_NORMAL = 20;
  var TIME_BOMB = 25;
  var TIER_VALUE = [100, 200, 300];   // points by tier within your own band
  var TF_VALUE_SHARE = 0.6;   // a coin flip should not pay like a four-way choice
  var TF_ROUND_SHARE = 0.3;   // roughly this fraction of rounds are true-or-false
  var TIME_BONUS_SHARE = 0.5;
  var STREAK_BONUS = 20;
  var MAX_STREAK_BONUS = 100;
  var BOMB_FLOOR = 200;          // payout when a bomb is won from a zero score
  var BOMB_MAX_GAIN = 1500;      // doubling is capped here, or it compounds away
  var STEAL_TIER_MULTIPLE = 1.5; // a heist takes this much of the round's value...
  var STEAL_FAIL_SHARE = 0.5;    // ...and a botched one hands the target half of it
  var RING = 2 * Math.PI * 17;

  /* ---------- helpers ---------- */
  function $(id) { return document.getElementById(id); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function T(key, vars) { return window.t(state.uiLang, key, vars); }
  function topicName(topic) { return T(TOPIC_KEY[topic] || topic); }
  function isTf(q) { return q.k === "tf"; }

  // Age decides the difficulty window. The bands are three levels wide and
  // stepped so a child and an adult never draw from the same pool.
  function bandFor(age) {
    if (age <= 6) return [1, 2];
    if (age <= 8) return [1, 3];
    if (age <= 10) return [2, 4];
    if (age <= 12) return [3, 5];
    if (age <= 15) return [4, 6];
    if (age <= 17) return [5, 7];
    return [6, 8];
  }
  // Tier 0/1/2 is "easy / medium / hard *for you*", mapped into your own band.
  function levelFor(band, tier) {
    return Math.round(band[0] + (band[1] - band[0]) * (tier / 2));
  }

  /* ---------- state ---------- */
  var state = {
    uiLang: "en",
    players: [],
    rounds: 10,
    bombRounds: [],
    plan: [],          // one tier per round, shared by everyone
    turn: 0,
    used: {},          // question ids already asked this match, by anyone
    recent: {},        // ids asked in recent matches, avoided when possible
    recentList: [],
    nextTopic: null,   // topic the upcoming player must answer
    topicChooser: null,
    pending: null,
    timerId: null,
    timeLeft: 0,
    timeTotal: 0,
    locked: false
  };

  /* ---------- persistence ---------- */
  var STORE = "battlequiz.setup.v2";
  var RECENT_STORE = "battlequiz.recent.v1";
  var RECENT_CAP = 400;          // ids remembered across matches
  var MATCH_STORE = "battlequiz.match.v1";
  function saveSetup(cfg) { try { localStorage.setItem(STORE, JSON.stringify(cfg)); } catch (e) {} }
  function loadSetup() { try { return JSON.parse(localStorage.getItem(STORE) || "null"); } catch (e) { return null; } }

  // Questions asked in recent matches, so playing twice in a row does not serve
  // the same ones again. Kept as a list so the oldest fall off first.
  function loadRecent() {
    try {
      var a = JSON.parse(localStorage.getItem(RECENT_STORE) || "[]");
      return Array.isArray(a) ? a : [];
    } catch (e) { return []; }
  }
  function rememberAsked(id) {
    state.recent[id] = true;
    state.recentList.push(id);
    while (state.recentList.length > RECENT_CAP) delete state.recent[state.recentList.shift()];
    try { localStorage.setItem(RECENT_STORE, JSON.stringify(state.recentList)); } catch (e) {}
  }

  // Enough to rebuild the match after a refresh. Everything here is plain data.
  function saveMatch() {
    if (!state.players.length || state.turn >= totalTurns()) return clearMatch();
    try {
      localStorage.setItem(MATCH_STORE, JSON.stringify({
        players: state.players, rounds: state.rounds, plan: state.plan,
        bombRounds: state.bombRounds, turn: state.turn, used: state.used,
        nextTopic: state.nextTopic, topicChooser: state.topicChooser
      }));
    } catch (e) {}
  }
  function loadMatch() {
    try {
      var m = JSON.parse(localStorage.getItem(MATCH_STORE) || "null");
      if (!m || !m.players || m.players.length < MIN_PLAYERS) return null;
      if (!(m.turn >= 0) || m.turn >= m.rounds * m.players.length) return null;
      return m;
    } catch (e) { return null; }
  }
  function clearMatch() { try { localStorage.removeItem(MATCH_STORE); } catch (e) {} }

  function resumeMatch(m) {
    state.players = m.players;
    state.rounds = m.rounds;
    state.plan = m.plan;
    state.bombRounds = m.bombRounds;
    state.turn = m.turn;
    state.used = m.used || {};
    state.nextTopic = m.nextTopic;
    state.topicChooser = m.topicChooser;
    state.recentList = loadRecent();
    state.recent = {};
    state.recentList.forEach(function (id) { state.recent[id] = true; });
    window.SFX.unlock();
    nextTurn();
  }

  // Screen changes are invisible to a screen reader unless focus moves, so send
  // it to each screen's landing point. On the quiz that is the question itself,
  // not an answer button - focusing a button would arm Enter and let a stray
  // keypress answer for you.
  var LANDING = {
    "screen-handover": "ho-go",
    "screen-bomb": "bomb-risk",
    "screen-steal": "steal-pick",
    "screen-quiz": "q-text",
    "screen-topic": "tp-title",
    "screen-result": "res-winner"
  };

  function show(id) {
    qsa(".screen").forEach(function (s) { s.classList.toggle("is-active", s.id === id); });
    window.scrollTo(0, 0);
    var target = $(LANDING[id]);
    if (target && !target.hidden) {
      try { target.focus({ preventScroll: true }); } catch (e) { target.focus(); }
    }
  }

  /* ---------- setup screen ---------- */
  var setupRows = [];   // {name, age, lang}

  function defaultRows() {
    return [
      { name: "Kaan", age: 12, lang: "tr" },
      { name: "Dave", age: 49, lang: "en" }
    ];
  }

  function renderSetup() {
    var box = $("players");
    box.innerHTML = "";
    setupRows.forEach(function (row, i) {
      var band = bandFor(row.age);
      var el = document.createElement("fieldset");
      el.className = "pcard";
      el.setAttribute("data-player", i);
      el.innerHTML =
        '<legend></legend>' +
        '<label><span></span><input type="text" class="f-name" maxlength="16"></label>' +
        '<div class="pcard__row">' +
          '<label><span></span><input type="number" class="f-age" min="4" max="120"></label>' +
          '<label><span></span><select class="f-lang">' +
            '<option value="tr">Türkçe</option><option value="en">English</option>' +
          '</select></label>' +
        '</div>' +
        '<p class="pcard__meta"></p>' +
        '<button type="button" class="pcard__remove"></button>';

      el.querySelector("legend").textContent = T("player") + " " + (i + 1);
      var labels = el.querySelectorAll("label > span");
      labels[0].textContent = T("name");
      labels[1].textContent = T("age");
      labels[2].textContent = T("language");
      el.querySelector(".f-name").value = row.name;
      el.querySelector(".f-age").value = row.age;
      el.querySelector(".f-lang").value = row.lang;
      el.querySelector(".pcard__meta").textContent =
        T("level", { a: band[0], b: band[1] }) + " · " + T("bankSize", { n: bankCount(band) });
      var rm = el.querySelector(".pcard__remove");
      rm.textContent = T("removePlayer");
      rm.hidden = setupRows.length <= MIN_PLAYERS;

      el.querySelector(".f-name").addEventListener("input", function (e) { row.name = e.target.value; });
      el.querySelector(".f-lang").addEventListener("change", function (e) { row.lang = e.target.value; });
      el.querySelector(".f-age").addEventListener("input", function (e) {
        row.age = parseInt(e.target.value, 10) || 12;
        var b = bandFor(row.age);
        el.querySelector(".pcard__meta").textContent =
          T("level", { a: b[0], b: b[1] }) + " · " + T("bankSize", { n: bankCount(b) });
      });
      rm.addEventListener("click", function () {
        syncRowsFromDom();
        setupRows.splice(i, 1);
        window.SFX.click();
        renderSetup();
      });
      box.appendChild(el);
    });

    $("add-player").hidden = setupRows.length >= MAX_PLAYERS;
    $("add-player").textContent = T("addPlayer");
  }

  function bankCount(band) {
    return (window.BANK || []).filter(function (q) { return q.d >= band[0] && q.d <= band[1]; }).length;
  }

  function applyStaticI18n() {
    document.documentElement.lang = state.uiLang;
    qsa("[data-i18n]").forEach(function (el) { el.textContent = T(el.getAttribute("data-i18n")); });
    qsa(".uilang__btn").forEach(function (b) {
      b.classList.toggle("is-on", b.getAttribute("data-uilang") === state.uiLang);
    });
    $("opt-sound").textContent = T(window.SFX.isEnabled() ? "on" : "off");
    renderSetup();
    renderResume();
  }

  function renderResume() {
    var m = loadMatch();
    var card = $("resume-card");
    card.hidden = !m;
    if (!m) return;
    var n = m.players.length;
    var who = m.players[(m.turn % n + Math.floor(m.turn / n)) % n];
    $("resume-label").textContent = T("resume");
    $("resume-where").textContent = T("resumeRound", {
      name: who.name, n: Math.floor(m.turn / n) + 1, total: m.rounds
    });
    $("resume-go").textContent = T("go");
    $("resume-drop").textContent = T("discardMatch");
  }

  function initSetup() {
    var saved = loadSetup();
    setupRows = defaultRows();
    if (saved && Array.isArray(saved.players) && saved.players.length >= MIN_PLAYERS) {
      setupRows = saved.players.slice(0, MAX_PLAYERS).map(function (p) {
        return { name: String(p.name || ""), age: parseInt(p.age, 10) || 12, lang: p.lang === "en" ? "en" : "tr" };
      });
      state.uiLang = saved.uiLang || "en";
      if (saved.rounds) $("opt-rounds").value = saved.rounds;
      if (saved.bomb) $("opt-bomb").value = saved.bomb;
      window.SFX.setEnabled(saved.sound !== false);
    }
    setSound(window.SFX.isEnabled());

    qsa(".uilang__btn").forEach(function (b) {
      b.addEventListener("click", function () {
        state.uiLang = b.getAttribute("data-uilang");
        applyStaticI18n();
        window.SFX.click();
      });
    });
    $("add-player").addEventListener("click", function () {
      if (setupRows.length >= MAX_PLAYERS) return;
      syncRowsFromDom();
      setupRows.push({ name: "", age: 30, lang: setupRows.length % 2 ? "tr" : "en" });
      window.SFX.click();
      renderSetup();
    });
    $("opt-sound").addEventListener("click", function () {
      setSound(!window.SFX.isEnabled());
      window.SFX.click();
    });
    $("setup-form").addEventListener("submit", function (ev) {
      ev.preventDefault();
      startMatch();
    });
    $("resume-go").addEventListener("click", function () {
      var m = loadMatch();
      window.SFX.click();
      if (m) resumeMatch(m); else renderResume();
    });
    $("resume-drop").addEventListener("click", function () {
      window.SFX.click();
      clearMatch();
      renderResume();
    });
    applyStaticI18n();
  }

  function setSound(on) {
    window.SFX.setEnabled(on);
    var btn = $("opt-sound");
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    btn.textContent = T(on ? "on" : "off");
    btn.classList.toggle("is-on", on);
  }

  /* ---------- match ---------- */
  function bombRoundsFor(rounds, mode) {
    var share = mode === "low" ? 0.1 : mode === "high" ? 0.35 : 0.2;
    var count = Math.max(mode === "high" ? 2 : 1, Math.round(rounds * share));
    var pool = [];
    for (var r = 2; r <= rounds; r++) pool.push(r);
    if (!pool.length) return [];
    return shuffle(pool).slice(0, Math.min(count, pool.length)).sort(function (a, b) { return a - b; });
  }

  // One shared tier AND one shared question kind per round. Everybody meets the
  // same shape of match; only the absolute level differs, so no age bracket
  // earns more for equal play - and nobody gets a cheap true-or-false in a
  // round where their rivals face four options.
  function buildPlan(rounds, bombRounds) {
    var mix = [0, 1, 0, 1, 2, 0, 1, 1, 0, 2];
    var plan = [], bag = shuffle(mix);
    for (var i = 0; i < rounds; i++) {
      if (!bag.length) bag = shuffle(mix);
      plan.push({ tier: bag.pop(), tf: false });
    }
    bombRounds.forEach(function (r) { if (r <= rounds) plan[r - 1].tier = 2; });

    // Bomb rounds stay multiple choice: doubling your whole score on a coin
    // flip is not a gamble, it is a shrug.
    var eligible = [];
    for (var j = 0; j < rounds; j++) {
      if (bombRounds.indexOf(j + 1) === -1) eligible.push(j);
    }
    var wanted = Math.min(eligible.length, Math.round(rounds * TF_ROUND_SHARE));
    shuffle(eligible).slice(0, wanted).forEach(function (j) { plan[j].tf = true; });
    return plan;
  }

  // The inputs on screen are the source of truth at kick-off, so a value that
  // never fired an event (autofill, a paste, an untouched default) still counts.
  function syncRowsFromDom() {
    qsa(".pcard").forEach(function (el, i) {
      if (!setupRows[i]) return;
      setupRows[i].name = el.querySelector(".f-name").value;
      setupRows[i].age = parseInt(el.querySelector(".f-age").value, 10) || setupRows[i].age;
      setupRows[i].lang = el.querySelector(".f-lang").value;
    });
  }

  function startMatch() {
    syncRowsFromDom();
    var err = $("setup-error");
    if (setupRows.length < MIN_PLAYERS) {
      err.textContent = T("needPlayers"); err.hidden = false; return;
    }
    if (setupRows.some(function (r) { return !r.name.trim(); })) {
      err.textContent = T("invalidName"); err.hidden = false; return;
    }
    err.hidden = true;

    state.rounds = parseInt($("opt-rounds").value, 10);
    state.bombRounds = bombRoundsFor(state.rounds, $("opt-bomb").value);
    state.plan = buildPlan(state.rounds, state.bombRounds);
    state.turn = 0;
    state.tb = null;
    state.used = {};
    state.recentList = loadRecent();
    state.recent = {};
    state.recentList.forEach(function (id) { state.recent[id] = true; });
    state.nextTopic = null;
    state.topicChooser = null;

    state.players = setupRows.map(function (r) {
      return {
        name: r.name.trim(),
        age: r.age,
        lang: r.lang,
        band: bandFor(r.age),
        score: 0,
        correct: 0,
        bombsTaken: 0,
        steals: stealTokensFor(state.rounds),
        stealsUsed: 0,
        stolen: 0,
        streak: 0,
        bestStreak: 0
      };
    });

    saveSetup({
      players: setupRows.map(function (r) { return { name: r.name, age: r.age, lang: r.lang }; }),
      rounds: state.rounds,
      bomb: $("opt-bomb").value,
      uiLang: state.uiLang,
      sound: window.SFX.isEnabled()
    });

    window.SFX.unlock();
    window.SFX.click();
    nextTurn();
  }

  function stealTokensFor(rounds) { return Math.max(2, Math.round(rounds / 4)); }
  function playerCount() { return state.players.length; }
  // Who goes first rotates by one seat each round, so the first-mover advantage
  // (and the last seat's disadvantage) is shared out instead of falling on the
  // same player all match. Round 1 runs 1-2-3-4, round 2 runs 2-3-4-1, and so on.
  function playerIndexAtTurn(turn) {
    var n = playerCount();
    return (turn % n + Math.floor(turn / n)) % n;
  }
  function currentPlayerIndex() { return playerIndexAtTurn(state.turn); }
  function activePlayer() {
    return state.tb ? state.tb.players[state.tb.idx] : state.players[currentPlayerIndex()];
  }
  function activeIndex() { return state.players.indexOf(activePlayer()); }
  function nextPlayerIndex() { return playerIndexAtTurn(state.turn + 1); }
  function currentRound() { return Math.floor(state.turn / playerCount()) + 1; }
  function isBombRound() { return state.bombRounds.indexOf(currentRound()) !== -1; }
  function totalTurns() { return state.rounds * playerCount(); }
  function currentPlanEntry() { return state.plan[currentRound() - 1] || { tier: 0, tf: false }; }
  // Sudden death is always at the hardest tier, and never true-or-false: a coin
  // flip is no way to settle a drawn match.
  function currentTier() { return state.tb ? 2 : currentPlanEntry().tier; }
  function isTrueFalseRound() { return state.tb ? false : currentPlanEntry().tf; }
  function opponentsOf(i) {
    return state.players.filter(function (p, j) { return j !== i; });
  }

  /* ---------- question selection ---------- */
  // Pick from the player's own band, honouring the topic the previous player
  // chose, and never repeating a question for that player. Each fallback widens
  // the search by one step rather than giving up.
  function drawQuestion(p, topic, tier, wantTf) {
    var bank = window.BANK || [];
    var level = levelFor(p.band, tier);
    var fresh = bank.filter(function (q) { return !state.used[q.id]; });
    // Two passes: everything not seen in a recent match, then everything.
    var unseen = fresh.filter(function (q) { return !state.recent[q.id]; });
    return bestOf(unseen, p, topic, level, wantTf)
        || bestOf(fresh, p, topic, level, wantTf)
        || (bank.length ? pick(bank) : null);
  }

  function bestOf(pool, p, topic, level, wantTf) {
    var kind = pool.filter(function (q) { return isTf(q) === !!wantTf; });
    var inBand = kind.filter(function (q) { return q.d >= p.band[0] && q.d <= p.band[1]; });
    var tries = [
      inBand.filter(function (q) { return q.t === topic && q.d === level; }),
      inBand.filter(function (q) { return q.t === topic; }),
      inBand.filter(function (q) { return q.d === level; }),
      inBand,
      kind,
      pool
    ];
    for (var i = 0; i < tries.length; i++) {
      if (tries[i].length) return pick(tries[i]);
    }
    return null;
  }

  /* ---------- turn ---------- */
  function nextTurn() {
    if (state.turn >= totalTurns()) return showResult();
    saveMatch();
    var pi = currentPlayerIndex();
    var p = state.players[pi];
    state.uiLang = p.lang;
    document.documentElement.lang = p.lang;

    if (!state.nextTopic) {
      state.nextTopic = pick(TOPICS);
      state.topicChooser = null;
    }

    $("ho-pass").textContent = T("passDevice", { name: p.name });
    $("ho-name").textContent = T("ready", { name: p.name });
    $("ho-hint").textContent = T("readyHint", {
      lang: window.I18N[p.lang].langName, age: p.age, a: p.band[0], b: p.band[1]
    });
    $("ho-topic").textContent = T("topicIs", { topic: topicName(state.nextTopic) });
    $("ho-topic-by").textContent = state.topicChooser
      ? T("topicBy", { name: state.topicChooser })
      : T("topicRandom");
    $("ho-round").textContent = T("round", { n: currentRound(), total: state.rounds })
      + " · " + T("score") + ": " + p.score;
    $("ho-go").textContent = T("go");

    var targets = stealTargets(pi);
    var canSteal = !isBombRound() && p.steals > 0 && targets.length > 0;
    $("ho-steal").hidden = !canSteal;
    $("ho-steal").textContent = T("stealUse", { n: p.steals });
    $("ho-steals").textContent = p.steals > 0 ? T("stealsLeft", { n: p.steals }) : "";

    show("screen-handover");
  }

  $("ho-go").addEventListener("click", function () {
    window.SFX.click();
    if (isBombRound()) showBombChoice(); else beginQuestion(false, null);
  });

  /* ---------- bomb ---------- */
  // Winning doubles your score, but the gain is capped: uncapped doubling
  // compounds, and four wins in a row made every other rule in the game noise.
  function bombWinScore(before) {
    return before > 0 ? before + Math.min(before, BOMB_MAX_GAIN) : BOMB_FLOOR;
  }

  function showBombChoice() {
    var p = state.players[currentPlayerIndex()];
    $("bomb-title").textContent = T("bombIncoming");
    $("bomb-text").innerHTML = T("bombExplain");
    $("bomb-stake").textContent = "✅ " + p.score + " → " + bombWinScore(p.score)
      + "   ❌ " + p.score + " → 0";
    // With nothing to lose the gamble is free, so it is not a decision. A player
    // on zero can still take it, but only while they have a steal token to burn.
    var canRisk = p.score > 0 || p.steals > 0;
    $("bomb-risk").textContent = T("bombRisk");
    $("bomb-risk").hidden = !canRisk;
    $("bomb-nothing").hidden = canRisk;
    $("bomb-nothing").textContent = T("bombNothingToLose");
    $("bomb-cost").textContent = p.steals > 0 ? T("bombCost") : "";
    $("bomb-safe").textContent = T("bombSafe");
    window.SFX.fuse();
    show("screen-bomb");
    if (!canRisk) $("bomb-safe").focus();
  }
  $("bomb-risk").addEventListener("click", function () {
    window.SFX.bomb();
    state.players[currentPlayerIndex()].bombsTaken++;
    beginQuestion(true, null);
  });
  $("bomb-safe").addEventListener("click", function () {
    window.SFX.click();
    beginQuestion(false, null);
  });

  /* ---------- steal ---------- */
  // A flat amount tied to the round's stakes. Taking a share of the target's
  // score made robbing the leader strictly best, so the target screen offered a
  // choice with only one right answer.
  function stealValue() { return Math.round(TIER_VALUE[currentTier()] * STEAL_TIER_MULTIPLE); }
  function stealAmountFrom(victim) { return Math.min(victim.score, stealValue()); }
  function stealTargets(pi) {
    return opponentsOf(pi).filter(function (o) { return o.score > 0; });
  }

  $("ho-steal").addEventListener("click", function () {
    window.SFX.click();
    showStealChoice();
  });

  function showStealChoice() {
    var pi = currentPlayerIndex();
    var targets = stealTargets(pi);
    $("steal-title").textContent = T("stealTitle");
    $("steal-text").innerHTML = T("stealExplain");
    $("steal-pick").textContent = T("stealPickTarget");

    var box = $("steal-targets");
    box.innerHTML = "";
    targets.forEach(function (foe) {
      var amount = stealAmountFrom(foe);
      var b = document.createElement("button");
      b.type = "button";
      b.className = "btn btn--steal";
      b.textContent = T("stealTarget", { name: foe.name, n: amount });
      b.addEventListener("click", function () {
        window.SFX.fuse();
        var p = state.players[pi];
        p.steals--;
        p.stealsUsed++;
        beginQuestion(false, foe);
      });
      box.appendChild(b);
    });
    $("steal-cancel").textContent = T("stealPlain");
    show("screen-steal");
  }
  $("steal-cancel").addEventListener("click", function () {
    window.SFX.click();
    beginQuestion(false, null);
  });

  /* ---------- question ---------- */
  function beginQuestion(armed, victim) {
    var pi = activeIndex();
    var p = state.players[pi];
    var tier = currentTier();
    var raw = drawQuestion(p, state.nextTopic, tier, isTrueFalseRound());
    if (!raw) return showResult();       // empty bank; nothing left to ask
    state.used[raw.id] = true;
    rememberAsked(raw.id);

    var text = raw[p.lang] || raw.en;
    var tf = isTf(raw);
    var opts, value;
    if (tf) {
      // True always sits first. Position leaks nothing, because whether the
      // statement is true varies question to question.
      opts = [
        { text: T("tfTrue"), correct: raw.v === true },
        { text: T("tfFalse"), correct: raw.v !== true }
      ];
      value = Math.round(TIER_VALUE[tier] * TF_VALUE_SHARE);
    } else {
      opts = shuffle(text.a.map(function (t, i) { return { text: t, correct: i === raw.c }; }));
      value = TIER_VALUE[tier];
    }

    state.pending = {
      raw: raw, opts: opts, armed: armed, victim: victim || null,
      tf: tf, value: value, answered: false
    };
    state.locked = false;

    $("q-topic").textContent = topicName(raw.t);
    $("q-diff").textContent = T("diffTier", { n: raw.d }) + " · " + T("worth", { n: value });
    $("q-diff").className = "chip chip--t" + tier;
    $("q-tf").hidden = !tf;
    $("q-tf").textContent = T("tfBadge");
    $("q-bomb").hidden = !armed;
    $("q-bomb").textContent = T("bombArmed");
    $("q-steal").hidden = !victim;
    $("q-steal").textContent = T("stealArmed");
    $("q-text").textContent = text.q;
    $("hud-round").textContent = state.tb
      ? T("tieBreakRound", { n: state.tb.round })
      : T("round", { n: currentRound(), total: state.rounds });
    $("quit-btn").textContent = T("quit");
    document.body.classList.toggle("is-armed", !!armed);
    document.body.classList.toggle("is-heist", !!victim);

    var box = $("answers");
    box.innerHTML = "";
    box.className = "answers" + (tf ? " answers--tf" : "");
    opts.forEach(function (o, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "answer";
      b.innerHTML = '<span class="answer__key">' + (i + 1) + '</span><span class="answer__text"></span>';
      b.querySelector(".answer__text").textContent = o.text;
      b.addEventListener("click", function () { answer(i); });
      box.appendChild(b);
    });

    $("feedback").hidden = true;
    renderHud();
    show("screen-quiz");
    startTimer(armed ? TIME_BOMB : TIME_NORMAL);
  }

  function renderHud() {
    var hud = $("hud-players");
    hud.innerHTML = "";
    hud.className = "hud__players is-n" + playerCount();
    state.players.forEach(function (p, i) {
      var el = document.createElement("div");
      el.className = "hud__side" + (i === activeIndex() ? " is-active" : "");
      el.setAttribute("data-seat", i);
      var tags = [];
      if (p.streak > 1) tags.push("🔥 " + p.streak);
      if (p.steals > 0) tags.push("💰 " + p.steals);
      el.innerHTML = '<div class="hud__name"></div><div class="hud__score"></div><div class="hud__streak"></div>';
      el.querySelector(".hud__name").textContent = p.name;
      el.querySelector(".hud__score").textContent = p.score;
      el.querySelector(".hud__streak").textContent = tags.join("  ");
      hud.appendChild(el);
    });
  }

  /* ---------- timer ---------- */
  function startTimer(seconds) {
    stopTimer();
    state.timeLeft = seconds;
    state.timeTotal = seconds;
    paintTimer();
    state.timerId = setInterval(function () {
      state.timeLeft--;
      paintTimer();
      if (state.timeLeft <= 5 && state.timeLeft > 0) window.SFX.tick();
      if (state.timeLeft <= 0) { stopTimer(); answer(-1); }
    }, 1000);
  }
  function stopTimer() { if (state.timerId) { clearInterval(state.timerId); state.timerId = null; } }
  function paintTimer() {
    var frac = Math.max(0, state.timeLeft) / state.timeTotal;
    var bar = $("timer-bar");
    bar.style.strokeDasharray = RING;
    bar.style.strokeDashoffset = RING * (1 - frac);
    $("timer-num").textContent = Math.max(0, state.timeLeft);
    $("timer").classList.toggle("is-low", state.timeLeft <= 5);
  }

  // Not every question has an explanation yet, so this hides the line rather
  // than leaving a blank gap when one is missing.
  function renderWhy(raw, lang) {
    var ex = raw.ex && (raw.ex[lang] || raw.ex.en);
    var el = $("fb-why");
    el.textContent = ex || "";
    el.hidden = !ex;
  }

  /* ---------- answering ---------- */
  function answer(index) {
    if (state.locked || !state.pending || state.pending.answered) return;
    state.locked = true;
    state.pending.answered = true;
    stopTimer();

    var q = state.pending;
    var pi = activeIndex();
    var p = state.players[pi];
    var timedOut = index === -1;
    var right = !timedOut && q.opts[index].correct;

    qsa(".answer").forEach(function (b, i) {
      b.disabled = true;
      if (q.opts[i].correct) b.classList.add("is-correct");
      else if (i === index) b.classList.add("is-wrong");
    });

    if (state.tb) return resolveTieBreak(q, p, right, timedOut);

    var before = p.score;
    var delta = "";

    if (right) {
      p.correct++;
      p.streak++;
      if (p.streak > p.bestStreak) p.bestStreak = p.streak;
      if (q.armed) {
        p.score = bombWinScore(before);
        delta = T("doubled", { from: before, to: p.score });
        window.SFX.doubled();
      } else {
        var timeBonus = Math.round(q.value * TIME_BONUS_SHARE * (state.timeLeft / state.timeTotal));
        var streakBonus = Math.min(MAX_STREAK_BONUS, Math.max(0, p.streak - 1) * STREAK_BONUS);
        var gain = q.value + timeBonus + streakBonus;
        p.score += gain;
        if (q.victim) {
          var taken = stealAmountFrom(q.victim);
          q.victim.score -= taken;
          p.score += taken;
          p.stolen += taken;
          delta = T("stolen", { gain: gain, n: taken, name: q.victim.name });
          window.SFX.doubled();
        } else {
          delta = T("gained", { n: gain });
          window.SFX.correct();
        }
      }
    } else {
      p.streak = 0;
      if (q.armed) {
        p.score = 0;
        // Losing a token is what makes the gamble cost something even at zero.
        var lostToken = p.steals > 0;
        if (lostToken) p.steals--;
        delta = before > 0 ? T("wiped", { from: before }) : T("noChange");
        if (lostToken) delta += " " + T("bombTokenLost");
        window.SFX.bomb();
      } else if (q.victim) {
        var penalty = Math.round(stealAmountFrom(q.victim) * STEAL_FAIL_SHARE);
        q.victim.score += penalty;
        delta = T("stealFailed", { name: q.victim.name, n: penalty });
        window.SFX.wrong();
      } else {
        delta = T("noChange");
        window.SFX.wrong();
      }
    }

    var correctText = q.opts.filter(function (o) { return o.correct; })[0].text;
    $("fb-verdict").textContent = right ? T("correct") : (timedOut ? T("timeUp") : T("wrong"));
    $("fb-verdict").className = "feedback__verdict " + (right ? "is-good" : "is-bad");
    $("fb-detail").textContent = right ? "" : T("theAnswerWas", { answer: correctText });
    renderWhy(q.raw, p.lang);
    $("fb-delta").textContent = delta;
    $("fb-delta").className = "feedback__delta"
      + ((q.armed || q.victim) ? (right ? " is-boom" : " is-wiped") : "");

    var last = state.turn === totalTurns() - 1;
    var nextP = state.players[nextPlayerIndex()];
    // Getting it right buys you the right to set the next player's topic.
    state.pending.awardTopicPick = right && !last;
    $("fb-next").textContent = last ? T("finish")
      : (right ? T("pickTopicShort") : T("nextPlayer", { name: nextP.name }));
    $("feedback").hidden = false;
    $("fb-next").focus({ preventScroll: true });
    renderHud();
    document.body.classList.remove("is-armed", "is-heist");
  }

  $("fb-next").addEventListener("click", function () {
    window.SFX.click();
    if (state.tb) { state.pending = null; return tieBreakTurn(); }
    var pick = state.pending && state.pending.awardTopicPick;
    var chooser = state.players[currentPlayerIndex()];
    state.turn++;
    state.pending = null;
    if (pick) showTopicPicker(chooser);
    else { state.nextTopic = null; state.topicChooser = null; nextTurn(); }
  });

  /* ---------- topic picker ---------- */
  function showTopicPicker(chooser) {
    var nextP = state.players[currentPlayerIndex()];
    state.uiLang = chooser.lang;                 // the chooser is still at the device
    document.documentElement.lang = chooser.lang;
    $("tp-title").textContent = T("pickTopic", { name: nextP.name });

    var grid = $("tp-grid");
    grid.innerHTML = "";
    TOPICS.forEach(function (topic) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "topic";
      b.textContent = topicName(topic);
      b.addEventListener("click", function () {
        window.SFX.click();
        state.nextTopic = topic;
        state.topicChooser = chooser.name;
        nextTurn();
      });
      grid.appendChild(b);
    });
    show("screen-topic");
  }

  $("quit-btn").addEventListener("click", function () {
    if (window.confirm(T("quitConfirm"))) {
      stopTimer();
      clearMatch();
      state.tb = null;
      document.body.classList.remove("is-armed", "is-heist");
      show("screen-setup");
      applyStaticI18n();
    }
  });

  /* ---------- sudden death ---------- */
  var TB_MAX_ROUNDS = 5;

  function startTieBreak(contenders) {
    state.tb = { players: contenders, idx: 0, round: 1, right: [] };
    tieBreakTurn();
  }

  function tieBreakTurn() {
    var tb = state.tb;
    if (tb.idx >= tb.players.length) {
      // Everyone level has answered. One right answer settles it; several
      // survivors go again against each other; none, and the same field repeats.
      if (tb.right.length === 1) { var w = tb.right[0]; state.tb = null; return showResult(w); }
      if (tb.round >= TB_MAX_ROUNDS) { state.tb = null; return showResult(null); }
      tb.players = tb.right.length ? tb.right : tb.players;
      tb.right = [];
      tb.idx = 0;
      tb.round++;
    }
    var p = tb.players[tb.idx];
    state.uiLang = p.lang;
    document.documentElement.lang = p.lang;
    state.nextTopic = pick(TOPICS);
    state.topicChooser = null;

    $("ho-pass").textContent = T("passDevice", { name: p.name });
    $("ho-name").textContent = T("ready", { name: p.name });
    $("ho-hint").textContent = T("tieBreakWho", {
      names: tb.players.map(function (x) { return x.name; }).join(", ")
    });
    $("ho-topic").textContent = T("topicIs", { topic: topicName(state.nextTopic) });
    $("ho-topic-by").textContent = T("tieBreak");
    $("ho-round").textContent = T("tieBreakRound", { n: tb.round })
      + " · " + T("score") + ": " + p.score;
    $("ho-go").textContent = T("go");
    $("ho-steal").hidden = true;
    $("ho-steals").textContent = "";
    show("screen-handover");
  }

  function resolveTieBreak(q, p, right, timedOut) {
    var tb = state.tb;
    if (right) tb.right.push(p);
    var correctText = q.opts.filter(function (o) { return o.correct; })[0].text;
    $("fb-verdict").textContent = right ? T("correct") : (timedOut ? T("timeUp") : T("wrong"));
    $("fb-verdict").className = "feedback__verdict " + (right ? "is-good" : "is-bad");
    $("fb-detail").textContent = right ? "" : T("theAnswerWas", { answer: correctText });
    renderWhy(q.raw, p.lang);

    tb.idx++;
    var last = tb.idx >= tb.players.length;
    var decided = last && tb.right.length === 1;
    $("fb-delta").textContent = decided ? "" : (last ? T("tieBreakAgain") : "");
    $("fb-delta").className = "feedback__delta";
    $("fb-next").textContent = decided || (last && tb.round >= TB_MAX_ROUNDS)
      ? T("finish")
      : T("nextPlayer", { name: (last ? (tb.right.length ? tb.right : tb.players) : tb.players)[last ? 0 : tb.idx].name });
    $("feedback").hidden = false;
    $("fb-next").focus({ preventScroll: true });
    renderHud();
    document.body.classList.remove("is-armed", "is-heist");
  }

  /* ---------- result ---------- */
  function showResult(forcedWinner) {
    stopTimer();
    clearMatch();
    document.body.classList.remove("is-armed", "is-heist");
    var ranked = state.players.slice().sort(function (a, b) { return b.score - a.score; });
    var level = ranked.filter(function (p) { return p.score === ranked[0].score; });

    // A drawn match goes to sudden death rather than just stopping. forcedWinner
    // is how the tie-break reports back: a player, or null when it ran out of
    // rounds and the draw stands.
    if (forcedWinner === undefined && level.length > 1) return startTieBreak(level);

    var top = forcedWinner || ranked[0];
    var tie = forcedWinner === null || (forcedWinner === undefined && level.length > 1);

    state.uiLang = top.lang;
    document.documentElement.lang = state.uiLang;
    $("res-title").textContent = T("results");
    $("res-crown").textContent = tie ? "🤝" : "🏆";
    $("res-winner").textContent = tie ? T("draw") : T("winner", { name: top.name });
    if (!tie) window.SFX.fanfare();

    var grid = $("res-grid");
    grid.innerHTML = "";
    grid.className = "result__grid is-n" + playerCount();
    ranked.forEach(function (p) {
      var card = document.createElement("div");
      card.className = "rescard" + (!tie && p === top ? " is-winner" : "");
      if (!tie && p === top) card.setAttribute("data-winner", "1");
      card.innerHTML = '<div class="rescard__name"></div><div class="rescard__score"></div><ul class="rescard__stats"></ul>';
      card.querySelector(".rescard__name").textContent =
        p.name + " · " + window.I18N[p.lang].langName + " · " + p.age
        + " · " + T("level", { a: p.band[0], b: p.band[1] });
      card.querySelector(".rescard__score").textContent = p.score;
      var ul = card.querySelector(".rescard__stats");
      [
        T("correctCount", { n: p.correct }) + " / " + state.rounds,
        T("bombsTaken", { n: p.bombsTaken }),
        T("stealsUsed", { n: p.stealsUsed }) + (p.stolen ? " · " + T("stolenTotal", { n: p.stolen }) : ""),
        T("best", { n: p.bestStreak })
      ].forEach(function (s) {
        var li = document.createElement("li");
        li.textContent = s;
        ul.appendChild(li);
      });
      grid.appendChild(card);
    });

    $("res-again").textContent = T("playAgain");
    $("res-setup").textContent = T("newSetup");
    show("screen-result");
  }

  $("res-again").addEventListener("click", function () { window.SFX.click(); startMatch(); });
  $("res-setup").addEventListener("click", function () {
    window.SFX.click();
    show("screen-setup");
    applyStaticI18n();
  });

  /* ---------- keyboard ---------- */
  document.addEventListener("keydown", function (ev) {
    var quizOpen = $("screen-quiz").classList.contains("is-active");
    if (quizOpen && !$("feedback").hidden && (ev.key === "Enter" || ev.key === " ")) {
      ev.preventDefault(); $("fb-next").click(); return;
    }
    if (quizOpen && $("feedback").hidden && /^[1-4]$/.test(ev.key)) {
      var btns = qsa(".answer");
      if (btns[parseInt(ev.key, 10) - 1]) btns[parseInt(ev.key, 10) - 1].click();
    }
    if ($("screen-handover").classList.contains("is-active") && (ev.key === "Enter" || ev.key === " ")) {
      ev.preventDefault(); $("ho-go").click();
    }
  });

  initSetup();
})();
