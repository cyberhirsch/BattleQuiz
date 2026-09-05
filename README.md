# BattleQuiz 💣

A two-player, turn-based, bilingual quiz duel. Pure static HTML/CSS/JS — no build
step, no dependencies, no backend. Drop it on GitHub Pages and it runs.

Built for an asymmetric match: a 12-year-old Turkish player against a
49-year-old English player, on the same device, each answering in their own
language at their own level.

## How it plays

Players alternate turns on one device. On each turn the whole interface —
buttons, labels, feedback — switches to the language of whoever is playing, and
their question is drawn from their own bank.

**Scoring scales with difficulty.** Every question is tagged easy / medium /
hard, worth 100 / 200 / 300 base points, shown on the card before you answer.
On top of the base you get a speed bonus (up to +50% of the base, by how much
time is left) and a streak bonus (+20 per consecutive correct answer, capped at
+100).

**💣 Bomb round.** A few rounds per match are bomb rounds, the same rounds for
both players, and always a hard question. When one comes up you choose:

- **Risk it** — answer correctly and your total score *doubles*; answer wrong
  and it drops to *zero*.
- **Play it safe** — normal scoring, no gamble.

**💰 Steal.** Each player gets one steal token per 10 rounds. Spend one before a
question to attempt a heist on the opponent: the target is 30% of their score
(minimum 100 points), shown before you commit. Answer correctly and those points
move from their pile to yours, on top of your normal winnings. Answer wrong and
they pocket half the amount instead. Steals aren't available on bomb rounds, or
when the opponent has nothing to take.

Timer is 20 seconds per question, 25 on an armed bomb. Running out counts as
wrong.

### Fairness between the two banks

Both players face the same difficulty *shape* every round — the match draws one
shared plan of difficulties, and each player's question is pulled from their own
bank at that difficulty. Without this the player whose bank happens to hold more
hard questions would out-earn the other for identical play, which would make the
age brackets unfair against each other.

## Question banks

| Bank | Language | Level | Questions |
| --- | --- | --- | --- |
| `tr12` | Turkish | ~12 years old, middle-school | 100 |
| `en49` | English | adult general knowledge | 100 |

Each entry is one object:

```js
{ q: "Question text?", a: ["right", "wrong", "wrong", "wrong"], c: 0, cat: "Science", d: 2 }
```

`c` is the index of the correct option and `d` is the difficulty (1 easy,
2 medium, 3 hard). Options are shuffled at runtime, so the correct answer never
sits in a predictable slot.

### Adding a bank

1. Create `assets/js/questions.<key>.js` following the format above, assigning
   `window.QUESTIONS.<key>`.
2. Add a `<script>` tag for it in `index.html`.
3. Register it in the `BANKS` map at the top of `assets/js/game.js` with its
   language and a default age.
4. Add an `<option>` to both language `<select>` elements in `index.html`.

A bank needs at least a few hard questions, since bomb rounds draw from that
tier.

## Running it

Open `index.html` in a browser. That's the whole thing — it works from the file
system, no server needed.

### Hosting on GitHub Pages

Repository **Settings → Pages → Build and deployment**, source **Deploy from a
branch**, pick the branch and the `/ (root)` folder. The site appears at
`https://<user>.github.io/<repo>/` a minute or so later. `.nojekyll` is included
so Jekyll doesn't touch the files.

## Layout

```
index.html                     markup for all five screens
assets/css/style.css           the whole theme
assets/js/i18n.js              UI strings, English + Turkish
assets/js/questions.tr12.js    100 Turkish questions
assets/js/questions.en49.js    100 English questions
assets/js/audio.js             synthesised sound effects (no audio files)
assets/js/game.js              turn order, scoring, bomb, steal, timer
```

## Notes

- Keyboard: `1`–`4` pick an answer, `Enter` or `Space` advances.
- Player names, ages, banks, match length and sound preference are remembered in
  `localStorage`.
- A player sitting on zero points takes a bomb gamble for free — there is
  nothing to lose. That is deliberate: it gives whoever is behind a way back in.
- Sound is synthesised with the Web Audio API, so there are no media files to
  download.
- Respects `prefers-reduced-motion`.
