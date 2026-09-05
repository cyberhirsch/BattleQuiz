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
  var BOMB_FLOOR = 200;
  var STEAL_SHARE = 0.3;
  var STEAL_MIN = 100;
  var STEAL_FAIL_SHARE = 0.5;
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
  function saveSetup(cfg) { try { localStorage.setItem(STORE, JSON.stringify(cfg)); } catch (e) {} }
  function loadSetup() { try { return JSON.parse(localStorage.getItem(STORE) || "null"); } catch (e) { return null; } }

  function show(id) {
    qsa(".screen").forEach(function (s) { s.classList.toggle("is-active", s.id === id); });
    window.scrollTo(0, 0);
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
    state.used = {};
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
  function nextPlayerIndex() { return playerIndexAtTurn(state.turn + 1); }
  function currentRound() { return Math.floor(state.turn / playerCount()) + 1; }
  function isBombRound() { return state.bombRounds.indexOf(currentRound()) !== -1; }
  function totalTurns() { return state.rounds * playerCount(); }
  function currentPlanEntry() { return state.plan[currentRound() - 1] || { tier: 0, tf: false }; }
  function currentTier() { return currentPlanEntry().tier; }
  function isTrueFalseRound() { return currentPlanEntry().tf; }
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
    var kind = fresh.filter(function (q) { return isTf(q) === !!wantTf; });
    var inBand = kind.filter(function (q) { return q.d >= p.band[0] && q.d <= p.band[1]; });

    var tries = [
      inBand.filter(function (q) { return q.t === topic && q.d === level; }),
      inBand.filter(function (q) { return q.t === topic; }),
      inBand.filter(function (q) { return q.d === level; }),
      inBand,
      kind,
      fresh,
      bank
    ];
    for (var i = 0; i < tries.length; i++) {
      if (tries[i].length) return pick(tries[i]);
    }
    return null;
  }

  /* ---------- turn ---------- */
  function nextTurn() {
    if (state.turn >= totalTurns()) return showResult();
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
  function showBombChoice() {
    var p = state.players[currentPlayerIndex()];
    var win = p.score > 0 ? p.score * 2 : BOMB_FLOOR;
    $("bomb-title").textContent = T("bombIncoming");
    $("bomb-text").innerHTML = T("bombExplain");
    $("bomb-stake").textContent = "✅ " + p.score + " → " + win + "   ❌ " + p.score + " → 0";
    $("bomb-risk").textContent = T("bombRisk");
    $("bomb-safe").textContent = T("bombSafe");
    window.SFX.fuse();
    show("screen-bomb");
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
  function stealAmountFrom(victim) {
    return Math.min(victim.score, Math.max(STEAL_MIN, Math.round(victim.score * STEAL_SHARE)));
  }
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
    var pi = currentPlayerIndex();
    var p = state.players[pi];
    var tier = currentTier();
    var raw = drawQuestion(p, state.nextTopic, tier, isTrueFalseRound());
    if (!raw) return showResult();       // empty bank; nothing left to ask
    state.used[raw.id] = true;

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
    $("hud-round").textContent = T("round", { n: currentRound(), total: state.rounds });
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
      el.className = "hud__side" + (i === currentPlayerIndex() ? " is-active" : "");
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

  /* ---------- answering ---------- */
  function answer(index) {
    if (state.locked || !state.pending || state.pending.answered) return;
    state.locked = true;
    state.pending.answered = true;
    stopTimer();

    var q = state.pending;
    var pi = currentPlayerIndex();
    var p = state.players[pi];
    var timedOut = index === -1;
    var right = !timedOut && q.opts[index].correct;

    qsa(".answer").forEach(function (b, i) {
      b.disabled = true;
      if (q.opts[i].correct) b.classList.add("is-correct");
      else if (i === index) b.classList.add("is-wrong");
    });

    var before = p.score;
    var delta = "";

    if (right) {
      p.correct++;
      p.streak++;
      if (p.streak > p.bestStreak) p.bestStreak = p.streak;
      if (q.armed) {
        p.score = before > 0 ? before * 2 : BOMB_FLOOR;
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
        delta = before > 0 ? T("wiped", { from: before }) : T("noChange");
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
    renderHud();
    document.body.classList.remove("is-armed", "is-heist");
  }

  $("fb-next").addEventListener("click", function () {
    window.SFX.click();
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
      document.body.classList.remove("is-armed", "is-heist");
      show("screen-setup");
      applyStaticI18n();
    }
  });

  /* ---------- result ---------- */
  function showResult() {
    stopTimer();
    document.body.classList.remove("is-armed", "is-heist");
    var ranked = state.players.slice().sort(function (a, b) { return b.score - a.score; });
    var top = ranked[0];
    var tie = ranked.filter(function (p) { return p.score === top.score; }).length > 1;

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
