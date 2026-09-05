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

There are ten topics: Science, Animals & Nature, Geography, History, Sports,
Music & Art, Film & TV, Books & Words, Technology, Everyday Life.

Sports is Formula 1 only, and deliberately the gentlest topic: its questions
stay approachable all the way up to level 8, so picking it for an opponent is
not a punishment.

**Answer correctly and you choose the topic the next player has to face.** Get
it wrong and their topic is drawn at random. The hand-over screen always says
which topic is coming and who picked it.

### 💣 Bomb round

A few rounds per match are bomb rounds — the same rounds for everyone, always at
the hardest tier. When one comes up you choose:

- **Risk it** — answer correctly and your total score *doubles*, up to a cap of
  +1500; answer wrong and it drops to *zero*, and you lose a steal token too.
- **Play it safe** — normal scoring, no gamble.

The cap matters. Uncapped doubling compounds: four wins in a row is sixteen
times your score, and in testing that put one player on 17,000 while everything
else the game does — topics, steals, streaks — became rounding error. The same
match now peaks around 1,200.

A player with no points *and* no steal tokens is not offered the gamble at all.
With nothing to lose it was free, so it was not a decision.

### 💰 Steal

Each player gets a steal token for every four rounds. Spend one before a
question and choose which opponent to rob. The amount is fixed at 1.5× the
round's value — not a share of their score, which made robbing the leader always
correct and turned the target screen into a choice with one right answer. Now
you pick who you actually want to hurt. Answer correctly and those points move
from their pile to yours, on top of your normal winnings. Answer wrong and they
pocket half instead.

Steals aren't offered on bomb rounds, or when nobody has points worth taking —
if the button is missing, that's why, not a bug.

## Question bank

The bank holds **1,365 questions** — 964 multiple-choice and 401 true-or-false
(201 true, 200 false) — spread across ten topics and all eight difficulty
levels, between 120 and 176 per topic. The 883 questions at levels 1-5 also
carry a bilingual explanation, shown after you answer. Questions live in
`assets/js/questions/`, one file per topic. Each entry carries both languages:

```js
{ id:"sci039", t:"science", d:3, c:0,
  en:{ q:"Which planet is known as the Red Planet?", a:["Mars","Venus","Mercury","Jupiter"] },
  tr:{ q:"Hangi gezegen Kızıl Gezegen olarak bilinir?", a:["Mars","Venüs","Merkür","Jüpiter"] } }
```

- `id` — unique, used to avoid repeats within a match
- `t` — topic key
- `d` — difficulty level, 1–8
- `c` — index of the correct option, the same in **both** language arrays

Options are shuffled at runtime, so the correct answer never sits in a
predictable slot. A question is spent for the whole match once anyone has been
asked it — on a shared device everybody hears it.

A true-or-false entry (`k:"tf"`) carries no options at all — the two buttons
come from the UI strings, so they always read in the player's own language.
`v` says whether the statement is true:

```js
{ id:"sci037", t:"science", d:3, k:"tf", v:true,
  en:{ q:"Sound travels faster through water than through air." },
  tr:{ q:"Ses suda havadakinden daha hızlı yayılır." } }
```

### Explanations

Every question at levels 1–5 — 883 of them — also carries an `ex` field: a
one-line bilingual explanation shown under the answer once you've responded,
whether you got it right or not:

```js
ex:{ en:"Mars looks red because its surface is covered in iron oxide, the same rust you see on old metal.",
     tr:"Mars kırmızı görünür çünkü yüzeyi, eski metallerde gördüğün pas gibi demir oksitle kaplıdır." }
```

Levels 6–8 have none, on purpose: that range is where adult players land, and
the line was written to raise a child's chance of learning something from a
wrong answer, not to annotate specialist trivia. `ex` is entirely optional —
a question without it simply shows no explanation line.

### How the bank was built

Most of it was written by a fan-out of agents: one writer per topic-and-level
cell, each batch then read by two independent checkers — one on facts, one on
Turkish fidelity and difficulty fit. A question shipped only if both kept it,
and roughly one in six was rejected.

The checkers policed both ends of the difficulty band, not just correctness. A
level 7 question on tomatoes being nightshades was thrown out as too easy; a
level 1 question asking which country the Eiffel Tower is in was thrown out as
too hard for a five-year-old. Turkish that read as machine translation was
rejected even where the fact was sound.

Merging then dropped anything that duplicated an existing question, comparing
normalised text with Turkish case-folding plus a token-overlap threshold.

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

### Sudden death

A drawn match does not just stop. Everyone level on the top score answers one
hard question in turn; whoever is the only one right takes it. If several are
right they go again against each other, if none are the same field repeats, and
after five rounds the draw stands.

## Notes

- Keyboard: `1`–`4` pick an answer, `Enter` or `Space` advances.
- Player names, ages, languages, match length and sound are remembered in
  `localStorage`.
- A match survives a refresh. Progress is written to `localStorage` after every
  turn, and the setup screen offers to resume it.
- Questions asked in recent matches are remembered (the last 400) and avoided,
  so playing twice in a row does not serve the same ones again.
- Screen changes move keyboard focus to the new screen's landing point, and the
  question and feedback panels are `aria-live` regions.
- Sound is synthesised with the Web Audio API, so there are no media files.
- Respects `prefers-reduced-motion`.
