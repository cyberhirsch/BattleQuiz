# BattleQuiz 💣

A turn-based bilingual quiz duel for **two to four players**. Pure static
HTML/CSS/JS — no build step, no dependencies, no backend. Drop it on GitHub
Pages and it runs.

Everyone plays the same match on one device. **Language is how you read it,
age is how hard it is** — so a 12-year-old and a 49-year-old can compete on
level terms.

## How it plays

Each player picks a **language** (Turkish or English) and gives their **age**.
Every question exists in both languages, so language is purely presentation;
the age decides which difficulty band you draw from.

### Difficulty: 8 levels, banded by age

| Age | Levels |
| --- | --- |
| up to 6 | 1–2 |
| 7–8 | 1–3 |
| 9–10 | 2–4 |
| 11–12 | 3–5 |
| 13–15 | 4–6 |
| 16–17 | 5–7 |
| 18 and over | 6–8 |

Each round the match picks one **tier** — easy, medium or hard — and everyone
gets that tier *within their own band*. So on a "hard" round a 12-year-old sees
a level 5 question and an adult sees a level 8, and both are worth the same
300 points. Nobody earns more for being older.

Base points are 100 / 200 / 300 by tier, plus a speed bonus (up to +50% of the
base, by how much time is left) and a streak bonus (+20 per consecutive correct
answer, capped at +100). The timer is 20 seconds, 25 on an armed bomb; running
out counts as wrong.

### 🎯 Topic control

There are ten topics: Science, Animals & Nature, Geography, History, Formula 1,
Music & Art, Film & TV, Books & Words, Technology, Everyday Life.

Formula 1 is deliberately the gentlest topic: its questions stay approachable
all the way up to level 8, so picking it for an opponent is not a punishment.

**Answer correctly and you choose the topic the next player has to face.** Get
it wrong and their topic is drawn at random. The hand-over screen always says
which topic is coming and who picked it.

### 💣 Bomb round

A few rounds per match are bomb rounds — the same rounds for everyone, always at
the hardest tier. When one comes up you choose:

- **Risk it** — answer correctly and your total score *doubles*; answer wrong
  and it drops to *zero*.
- **Play it safe** — normal scoring, no gamble.

### 💰 Steal

Each player gets a steal token for every four rounds. Spend one before a
question and choose which opponent to rob: the target is 30% of their score
(minimum 100 points), shown before you commit. Answer correctly and those points
move from their pile to yours, on top of your normal winnings. Answer wrong and
they pocket half the amount instead.

Steals aren't offered on bomb rounds, or when nobody has points worth taking —
if the button is missing, that's why, not a bug.

## Question bank

Questions live in `assets/js/questions/`, one file per topic. Each entry carries
both languages:

```js
{ id:"sci05", t:"science", d:3, c:0,
  en:{ q:"What is the chemical formula for water?", a:["H₂O","CO₂","O₂","NaCl"] },
  tr:{ q:"Suyun kimyasal formülü nedir?",           a:["H₂O","CO₂","O₂","NaCl"] } }
```

- `id` — unique, used to avoid repeats within a match
- `t` — topic key
- `d` — difficulty level, 1–8
- `c` — index of the correct option, the same in **both** language arrays

Options are shuffled at runtime, so the correct answer never sits in a
predictable slot. A question is spent for the whole match once anyone has been
asked it — on a shared device everybody hears it.

### Adding questions

Append to the relevant topic file with a fresh `id`. Keep the correct answer at
the same index in `en.a` and `tr.a`. To add a topic, create the file, add a
`<script>` tag in `index.html`, add the key to `TOPICS` and `TOPIC_KEY` in
`assets/js/game.js`, and add a `topicX` label to both locales in
`assets/js/i18n.js`.

## Running it

Open `index.html` in a browser. That's the whole thing — it works from the file
system, no server needed.

### Hosting on GitHub Pages

Repository **Settings → Pages → Build and deployment**, source **Deploy from a
branch**, pick the branch and the `/ (root)` folder. `.nojekyll` is included so
Jekyll doesn't touch the files.

## Layout

```
index.html                    markup for all seven screens
assets/css/style.css          the whole theme
assets/js/i18n.js             UI strings, English + Turkish
assets/js/questions/*.js      the bilingual question bank, one file per topic
assets/js/audio.js            synthesised sound effects (no audio files)
assets/js/game.js             turn order, scoring, topics, bomb, steal, timer
```

## Notes

- Keyboard: `1`–`4` pick an answer, `Enter` or `Space` advances.
- Player names, ages, languages, match length and sound are remembered in
  `localStorage`.
- A player sitting on zero points takes a bomb gamble for free — there is
  nothing to lose. That is deliberate: it gives whoever is behind a way back in.
- Sound is synthesised with the Web Audio API, so there are no media files.
- Respects `prefers-reduced-motion`.
