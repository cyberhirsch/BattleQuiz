/* BattleQuiz - tiny WebAudio beeper.
 * No audio files: every sound is synthesised, so the site stays a handful of
 * text files. The context is created lazily on the first user gesture because
 * browsers block audio before one.
 */
window.SFX = (function () {
  var ctx = null;
  var enabled = true;

  function ac() {
    if (!ctx) {
      var C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      ctx = new C();
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function tone(freq, start, dur, type, vol) {
    var c = ac();
    if (!c) return;
    var osc = c.createOscillator();
    var gain = c.createGain();
    osc.type = type || "sine";
    osc.frequency.setValueAtTime(freq, c.currentTime + start);
    gain.gain.setValueAtTime(0.0001, c.currentTime + start);
    gain.gain.exponentialRampToValueAtTime(vol || 0.12, c.currentTime + start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
    osc.connect(gain).connect(c.destination);
    osc.start(c.currentTime + start);
    osc.stop(c.currentTime + start + dur + 0.02);
  }

  function noise(start, dur, vol) {
    var c = ac();
    if (!c) return;
    var len = Math.floor(c.sampleRate * dur);
    var buf = c.createBuffer(1, len, c.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    var src = c.createBufferSource();
    var gain = c.createGain();
    gain.gain.value = vol || 0.25;
    src.buffer = buf;
    src.connect(gain).connect(c.destination);
    src.start(c.currentTime + start);
  }

  var api = {
    setEnabled: function (v) { enabled = !!v; },
    isEnabled: function () { return enabled; },
    unlock: function () { if (enabled) ac(); },
    click: function () { if (enabled) tone(440, 0, 0.05, "square", 0.05); },
    correct: function () { if (!enabled) return; tone(660, 0, 0.10, "sine", 0.12); tone(880, 0.09, 0.16, "sine", 0.12); },
    wrong: function () { if (!enabled) return; tone(200, 0, 0.16, "sawtooth", 0.10); tone(150, 0.14, 0.24, "sawtooth", 0.10); },
    tick: function () { if (enabled) tone(1200, 0, 0.03, "square", 0.03); },
    bomb: function () { if (!enabled) return; tone(120, 0, 0.5, "sawtooth", 0.14); noise(0.02, 0.6, 0.3); },
    fuse: function () { if (!enabled) return; tone(300, 0, 0.06, "triangle", 0.06); tone(340, 0.08, 0.06, "triangle", 0.06); },
    doubled: function () { if (!enabled) return; [523, 659, 784, 1047].forEach(function (f, i) { tone(f, i * 0.09, 0.18, "sine", 0.12); }); },
    fanfare: function () { if (!enabled) return; [523, 659, 784, 1047, 1319].forEach(function (f, i) { tone(f, i * 0.12, 0.3, "triangle", 0.11); }); }
  };
  return api;
})();
