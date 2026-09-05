/* BattleQuiz - game logic.
 * Two players share one device and take turns. Each player has their own
 * question bank (language + age), and the whole UI switches to the language of
 * whoever is playing. Bomb rounds are shared by both players so the risk is
 * symmetric.
 */
(function () {
  "use strict";

  /* ---------- constants ---------- */
  var BANKS = {
    tr12: { lang: "tr", label: "Türkçe · 12", ageHint: 12 },
    en49: { lang: "en", label: "English · 49", ageHint: 49 }
  };
  var TIME_NORMAL = 20;
  var TIME_BOMB = 25;
  var VALUE = { 1: 100, 2: 200, 3: 300 };   // base points by difficulty
  var DIFF_KEY = { 1: "diffEasy", 2: "diffMedium", 3: "diffHard" };
  var TIME_BONUS_SHARE = 0.5;    // a fast answer is worth up to +50% of the base
  var STREAK_BONUS = 20;
  var MAX_STREAK_BONUS = 100;
  var BOMB_FLOOR = 200;          // payout when a bomb is won from a zero score
  var STEAL_SHARE = 0.3;         // a heist targets 30% of the opponent's score...
  var STEAL_MIN = 100;           // ...but never less than this
  var STEAL_FAIL_SHARE = 0.5;    // a botched heist hands the opponent half of it
  var RING = 2 * Math.PI * 17;   // circumference of the timer circle

  /* ---------- tiny helpers ---------- */
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
  function T(key, vars) { return window.t(state.uiLang, key, vars); }
  function valueOf(q) { return VALUE[q.d] || VALUE[1]; }
  function stealTokensFor(rounds) { return Math.max(1, Math.round(rounds / 10)); }
  function stealAmount(victim) { return Math.max(STEAL_MIN, Math.round(victim.score * STEAL_SHARE)); }
  function opponentOf(i) { return state.players[(i + 1) % 2]; }

  /* ---------- state ---------- */
  var state = {
    uiLang: "en",
    players: [],
    rounds: 10,
    bombRounds: [],   // 1-based round numbers that are bomb rounds (shared)
    turn: 0,          // index into the turn order: 0,1,2,3...
    stealArmed: false,
    pending: null,    // the question currently on screen
    timerId: null,
    timeLeft: 0,
    locked: false
  };

  /* ---------- persistence ---------- */
  var STORE = "battlequiz.setup.v1";
  function saveSetup(cfg) {
    try { localStorage.setItem(STORE, JSON.stringify(cfg)); } catch (e) { /* private mode */ }
  }
  function loadSetup() {
    try { return JSON.parse(localStorage.getItem(STORE) || "null"); } catch (e) { return null; }
  }

  /* ---------- screens ---------- */
  function show(id) {
    qsa(".screen").forEach(function (s) { s.classList.toggle("is-active", s.id === id); });
    window.scrollTo(0, 0);
  }

  /* ---------- localisation of static nodes ---------- */
  function applyStaticI18n() {
    document.documentElement.lang = state.uiLang;
    qsa("[data-i18n]").forEach(function (el) {
      el.textContent = T(el.getAttribute("data-i18n"));
    });
    qsa(".uilang__btn").forEach(function (b) {
      b.classList.toggle("is-on", b.getAttribute("data-uilang") === state.uiLang);
    });
    var snd = $("opt-sound");
    snd.textContent = T(window.SFX.isEnabled() ? "on" : "off");
    refreshBankMeta();
  }

  function refreshBankMeta() {
    [0, 1].forEach(function (i) {
      var key = $("p" + i + "-bank").value;
      var bank = window.QUESTIONS[key] || [];
      $("p" + i + "-meta").textContent = T("questionsLeft", { n: bank.length });
    });
  }

  /* ---------- setup screen ---------- */
  function initSetup() {
    var saved = loadSetup();
    if (saved) {
      try {
        $("p0-name").value = saved.p[0].name;
        $("p0-age").value = saved.p[0].age;
        $("p0-bank").value = saved.p[0].bank;
        $("p1-name").value = saved.p[1].name;
        $("p1-age").value = saved.p[1].age;
        $("p1-bank").value = saved.p[1].bank;
        $("opt-rounds").value = saved.rounds;
        $("opt-bomb").value = saved.bomb;
        state.uiLang = saved.uiLang || "en";
        setSound(saved.sound !== false);
      } catch (e) { /* ignore a malformed save */ }
    }
    setSound(window.SFX.isEnabled());

    qsa(".uilang__btn").forEach(function (b) {
      b.addEventListener("click", function () {
        state.uiLang = b.getAttribute("data-uilang");
        applyStaticI18n();
        window.SFX.click();
      });
    });

    [0, 1].forEach(function (i) {
      $("p" + i + "-bank").addEventListener("change", function () {
        // Keep the age field in step with the bank the player picked.
        var hint = BANKS[$("p" + i + "-bank").value].ageHint;
        $("p" + i + "-age").value = hint;
        refreshBankMeta();
      });
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
  function readPlayer(i) {
    var bankKey = $("p" + i + "-bank").value;
    return {
      name: $("p" + i + "-name").value.trim(),
      age: parseInt($("p" + i + "-age").value, 10) || BANKS[bankKey].ageHint,
      bank: bankKey,
      lang: BANKS[bankKey].lang,
      score: 0,
      correct: 0,
      bombsTaken: 0,
      steals: 0,
      stealsUsed: 0,
      stolen: 0,
      streak: 0,
      bestStreak: 0,
      queue: []
    };
  }

  function bombRoundsFor(rounds, mode) {
    var share = mode === "low" ? 0.1 : mode === "high" ? 0.35 : 0.2;
    var count = Math.max(mode === "high" ? 2 : 1, Math.round(rounds * share));
    // Never on round 1 - players need something to put at stake.
    var pool = [];
    for (var r = 2; r <= rounds; r++) pool.push(r);
    if (!pool.length) return [];
    count = Math.min(count, pool.length);
    return shuffle(pool).slice(0, count).sort(function (a, b) { return a - b; });
  }

  // Both players face the same difficulty shape each round. Without this the
  // player whose bank happens to hold more hard questions earns more for
  // identical play, which would make the age brackets unfair against each other.
  function buildPlan(rounds, bombRounds) {
    var plan = [];
    var mix = [1, 2, 1, 2, 3, 1, 2, 2, 1, 3];   // ~40% easy, ~40% medium, ~20% hard
    var bag = shuffle(mix);
    for (var i = 0; i < rounds; i++) {
      if (!bag.length) bag = shuffle(mix);
      plan.push(bag.pop());
    }
    bombRounds.forEach(function (r) {
      if (r <= rounds) plan[r - 1] = 3;          // the gamble deserves a hard one
    });
    return plan;
  }

  // Draw one question per round from this player's own bank, matching the
  // difficulty the plan calls for and never repeating a question in a match.
  function buildQueue(bank, plan) {
    var byDiff = { 1: [], 2: [], 3: [] };
    shuffle(bank).forEach(function (q) { (byDiff[q.d] || byDiff[1]).push(q); });
    var spare = [];
    var queue = plan.map(function (d) {
      var pick = byDiff[d].pop();
      if (!pick) {                                // bank ran dry at that tier
        pick = byDiff[d === 3 ? 2 : 3].pop() || byDiff[1].pop() || byDiff[2].pop();
      }
      return pick;
    });
    // Guard against a bank too small for the match length.
    [1, 2, 3].forEach(function (d) { spare = spare.concat(byDiff[d]); });
    return queue.map(function (q) { return q || spare.pop() || bank[0]; });
  }

  function startMatch() {
    var p0 = readPlayer(0), p1 = readPlayer(1);
    var err = $("setup-error");
    if (!p0.name || !p1.name) {
      err.textContent = T("invalidName");
      err.hidden = false;
      return;
    }
    err.hidden = true;

    state.rounds = parseInt($("opt-rounds").value, 10);
    state.players = [p0, p1];
    state.bombRounds = bombRoundsFor(state.rounds, $("opt-bomb").value);
    state.turn = 0;

    var plan = buildPlan(state.rounds, state.bombRounds);
    state.players.forEach(function (p) {
      p.queue = buildQueue(window.QUESTIONS[p.bank] || [], plan);
      p.steals = stealTokensFor(state.rounds);
    });

    saveSetup({
      p: [
        { name: p0.name, age: p0.age, bank: p0.bank },
        { name: p1.name, age: p1.age, bank: p1.bank }
      ],
      rounds: state.rounds,
      bomb: $("opt-bomb").value,
      uiLang: state.uiLang,
      sound: window.SFX.isEnabled()
    });

    window.SFX.unlock();
    window.SFX.click();
    nextTurn();
  }

  function currentPlayerIndex() { return state.turn % 2; }
  function currentRound() { return Math.floor(state.turn / 2) + 1; }
  function isBombRound() { return state.bombRounds.indexOf(currentRound()) !== -1; }
  function totalTurns() { return state.rounds * 2; }

  function nextTurn() {
    if (state.turn >= totalTurns()) return showResult();
    var p = state.players[currentPlayerIndex()];
    state.uiLang = p.lang;
    document.documentElement.lang = p.lang;

    $("ho-pass").textContent = T("passDevice", { name: p.name });
    $("ho-name").textContent = T("ready", { name: p.name });
    $("ho-hint").textContent = T("readyHint", {
      lang: window.I18N[p.lang].langName,
      age: p.age
    });
    $("ho-round").textContent = T("round", { n: currentRound(), total: state.rounds })
      + " · " + T("score") + ": " + p.score;
    $("ho-go").textContent = T("go");

    // A steal is only on the table outside bomb rounds, and only when the
    // opponent actually has something worth taking.
    var foe = opponentOf(currentPlayerIndex());
    var canSteal = !isBombRound() && p.steals > 0 && foe.score > 0;
    var stealBtn = $("ho-steal");
    stealBtn.hidden = !canSteal;
    stealBtn.textContent = T("stealUse", { n: p.steals });
    $("ho-steals").textContent = p.steals > 0 ? T("stealsLeft", { n: p.steals }) : "";

    state.stealArmed = false;
    show("screen-handover");
  }

  $("ho-go").addEventListener("click", function () {
    window.SFX.click();
    if (isBombRound()) showBombChoice(); else beginQuestion(false, false);
  });

  $("ho-steal").addEventListener("click", function () {
    window.SFX.click();
    showStealChoice();
  });

  /* ---------- steal ---------- */
  function showStealChoice() {
    var pi = currentPlayerIndex();
    var foe = opponentOf(pi);
    var amount = Math.min(stealAmount(foe), foe.score);
    $("steal-title").textContent = T("stealTitle");
    $("steal-text").innerHTML = T("stealExplain", {
      n: amount,
      half: Math.round(amount * STEAL_FAIL_SHARE),
      name: foe.name
    });
    $("steal-stake").textContent = "✅ " + foe.name + ": " + foe.score + " → " + (foe.score - amount)
      + "   ❌ " + foe.name + ": " + foe.score + " → " + (foe.score + Math.round(amount * STEAL_FAIL_SHARE));
    $("steal-go").textContent = T("steal");
    $("steal-cancel").textContent = T("stealPlain");
    show("screen-steal");
  }

  $("steal-go").addEventListener("click", function () {
    window.SFX.fuse();
    var p = state.players[currentPlayerIndex()];
    p.steals--;
    p.stealsUsed++;
    beginQuestion(false, true);
  });
  $("steal-cancel").addEventListener("click", function () {
    window.SFX.click();
    beginQuestion(false, false);
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
    beginQuestion(true, false);
  });
  $("bomb-safe").addEventListener("click", function () {
    window.SFX.click();
    beginQuestion(false, false);
  });

  /* ---------- question ---------- */
  function beginQuestion(armed, stealing) {
    var pi = currentPlayerIndex();
    var p = state.players[pi];
    var raw = p.queue[currentRound() - 1];

    // Shuffle the options so the correct answer is not always in one slot.
    var opts = raw.a.map(function (text, i) { return { text: text, correct: i === raw.c }; });
    opts = shuffle(opts);

    state.pending = {
      raw: raw,
      opts: opts,
      armed: armed,
      stealing: !!stealing,
      value: valueOf(raw),
      bombRound: isBombRound(),
      answered: false
    };
    state.locked = false;
    state.stealArmed = !!stealing;

    $("q-cat").textContent = raw.cat;
    $("q-diff").textContent = T(DIFF_KEY[raw.d]) + " · " + T("worth", { n: valueOf(raw) });
    $("q-diff").className = "chip chip--d" + raw.d;
    $("q-bomb").hidden = !armed;
    $("q-bomb").textContent = T("bombArmed");
    $("q-steal").hidden = !stealing;
    $("q-steal").textContent = T("stealArmed");
    $("q-text").textContent = raw.q;
    $("hud-round").textContent = T("round", { n: currentRound(), total: state.rounds });
    $("quit-btn").textContent = T("quit");
    document.body.classList.toggle("is-armed", armed);
    document.body.classList.toggle("is-heist", !!stealing);

    var box = $("answers");
    box.innerHTML = "";
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
    $("qwrap").hidden = false;
    renderHud();
    show("screen-quiz");
    startTimer(armed ? TIME_BOMB : TIME_NORMAL);
  }

  function renderHud() {
    [0, 1].forEach(function (i) {
      var p = state.players[i];
      var el = $("hud-p" + i);
      el.classList.toggle("is-active", i === currentPlayerIndex());
      el.innerHTML = "";
      var n = document.createElement("div");
      n.className = "hud__name";
      n.textContent = p.name;
      var s = document.createElement("div");
      s.className = "hud__score";
      s.textContent = p.score;
      el.appendChild(n);
      el.appendChild(s);
      var tags = [];
      if (p.streak > 1) tags.push("🔥 " + p.streak);
      if (p.steals > 0) tags.push("💰 " + p.steals);
      if (tags.length) {
        var st = document.createElement("div");
        st.className = "hud__streak";
        st.textContent = tags.join("  ");
        el.appendChild(st);
      }
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
      if (state.timeLeft <= 0) {
        stopTimer();
        answer(-1);
      }
    }, 1000);
  }
  function stopTimer() {
    if (state.timerId) { clearInterval(state.timerId); state.timerId = null; }
  }
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
        // Harder question, bigger base; answering fast and on a streak adds more.
        var timeBonus = Math.round(q.value * TIME_BONUS_SHARE * (state.timeLeft / state.timeTotal));
        var streakBonus = Math.min(MAX_STREAK_BONUS, Math.max(0, p.streak - 1) * STREAK_BONUS);
        var gain = q.value + timeBonus + streakBonus;
        p.score += gain;
        if (q.stealing) {
          var foe = opponentOf(pi);
          var taken = Math.min(stealAmount(foe), foe.score);
          foe.score -= taken;
          p.score += taken;
          p.stolen += taken;
          delta = T("stolen", { gain: gain, n: taken, name: foe.name });
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
      } else if (q.stealing) {
        var victim = opponentOf(pi);
        var penalty = Math.round(Math.min(stealAmount(victim), victim.score) * STEAL_FAIL_SHARE);
        victim.score += penalty;
        delta = T("stealFailed", { name: victim.name, n: penalty });
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
      + (q.armed ? (right ? " is-boom" : " is-wiped") : "")
      + (q.stealing ? (right ? " is-boom" : " is-wiped") : "");

    var last = state.turn === totalTurns() - 1;
    var nextName = state.players[(pi + 1) % 2].name;
    $("fb-next").textContent = last ? T("finish") : T("nextPlayer", { name: nextName });
    $("feedback").hidden = false;
    renderHud();
    document.body.classList.remove("is-armed", "is-heist");
  }

  $("fb-next").addEventListener("click", function () {
    window.SFX.click();
    state.turn++;
    state.pending = null;
    nextTurn();
  });

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
    var a = state.players[0], b = state.players[1];
    // The result screen belongs to both players, so show it in the winner's
    // language (or player 1's on a draw).
    state.uiLang = a.score === b.score ? a.lang : (a.score > b.score ? a.lang : b.lang);
    document.documentElement.lang = state.uiLang;

    $("res-title").textContent = T("results");
    if (a.score === b.score) {
      $("res-crown").textContent = "🤝";
      $("res-winner").textContent = T("draw");
    } else {
      var w = a.score > b.score ? a : b;
      $("res-crown").textContent = "🏆";
      $("res-winner").textContent = T("winner", { name: w.name });
      window.SFX.fanfare();
    }

    var grid = $("res-grid");
    grid.innerHTML = "";
    state.players.forEach(function (p) {
      var won = (p === a ? a.score > b.score : b.score > a.score);
      var card = document.createElement("div");
      card.className = "rescard" + (won ? " is-winner" : "");
      var stats = [
        T("correctCount", { n: p.correct }) + " / " + state.rounds,
        T("bombsTaken", { n: p.bombsTaken }),
        T("stealsUsed", { n: p.stealsUsed }) + (p.stolen ? " · " + T("stolenTotal", { n: p.stolen }) : ""),
        T("best", { n: p.bestStreak })
      ];
      card.innerHTML =
        '<div class="rescard__name"></div>' +
        '<div class="rescard__score"></div>' +
        '<ul class="rescard__stats"></ul>';
      card.querySelector(".rescard__name").textContent = p.name + " · " + window.I18N[p.lang].langName + " · " + p.age;
      card.querySelector(".rescard__score").textContent = p.score;
      var ul = card.querySelector(".rescard__stats");
      stats.forEach(function (s) {
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

  $("res-again").addEventListener("click", function () {
    window.SFX.click();
    startMatch();
  });
  $("res-setup").addEventListener("click", function () {
    window.SFX.click();
    show("screen-setup");
    applyStaticI18n();
  });

  /* ---------- keyboard ---------- */
  document.addEventListener("keydown", function (ev) {
    var quizOpen = $("screen-quiz").classList.contains("is-active");
    if (quizOpen && !$("feedback").hidden && (ev.key === "Enter" || ev.key === " ")) {
      ev.preventDefault();
      $("fb-next").click();
      return;
    }
    if (quizOpen && $("feedback").hidden && /^[1-4]$/.test(ev.key)) {
      var idx = parseInt(ev.key, 10) - 1;
      var btns = qsa(".answer");
      if (btns[idx]) btns[idx].click();
    }
    if ($("screen-handover").classList.contains("is-active") && (ev.key === "Enter" || ev.key === " ")) {
      ev.preventDefault();
      $("ho-go").click();
    }
  });

  /* ---------- boot ---------- */
  initSetup();
})();
