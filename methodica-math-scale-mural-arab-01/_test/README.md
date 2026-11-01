# `_test/`: headless regression oracle for the xAPI reporting layer

This folder is a development tool and is **never deployed**. The package allowlist excludes every path that starts with `_`. Copied on 2026-11-01 from the Hebrew twin `methodica-math-scale-mural-01/_test/` and adapted for this Arabic second component: the identity group also checks `order 2`, `languages ["Arabic"]`, the unit JSON = the Hebrew record byte for byte, the component fields = the Hebrew component's, Arabic titles and question texts, and no `720/ar` / `methodica-ar-` / `?q=` ids; the wiring group checks `lang="ar"`, both stylesheets and the `_AR` videos; tags are read by attribute (the translation tool sorted them); text comparisons are NFC, as in the reporting layer; the runtime walk uses the Arabic words. Rules: `2026/Documentation/mafmar-reporting/MOODLE-CONVERTED-UNIT.md`.

## Run

```bash
mkdir -p /tmp/lomda-test && cd /tmp/lomda-test && npm install jsdom   # outside OneDrive (Windows: %LOCALAPPDATA%\Temp\lomda-test)
cd <repo>/methodica-math-scale-mural-arab-01
NODE_PATH=/tmp/lomda-test/node_modules node _test/verify-report.js
```

Pass a built package's component folder as the argument to check it instead of the repo. Set `VERBOSE=1` to forward the page's console output. `xapi-720-i.js` is the local stand-in for the CDN library (copied verbatim from time-model): serve the repo root, open `methodica-math-scale-mural-arab-01/index.html?xapiLib=./_test/xapi-720-i.js` on localhost, then use `__stmts()` / `__reset()` / `__dupes()` in the console.

## What this unit adds to the time-model pattern

| Topic | This unit |
|---|---|
| Engine | `js/main.js` (navigation, xAPI helpers, config block) plus one script per question and per slide, all global functions; `goTo(n)` is 0-based over 17 sections `screen-…` with `data-screen` 0–16. |
| Items | Nine catalogue items, every screen in an item. `003` (colour lab) holds two כן/לא `choice` questions with weight 0; `006` holds שאלה 4א/ב/ג; `009` holds שאלה 7א/ב. |
| Report sites | `xapiReportChoice` at the end of `submitQ2/Q3/Q4/Q4b/Q5/Q6`; `xapiReportDrops` right after the verdict in `submitQ1/Q7/Q7b` (before a second miss overwrites the drops with the revealed answer); `xapiReport('q4c', …numeric)` with the typed text captured before tryagain clears it; `xapiReportYN` on the first כן/לא choice; `xapiHint` in the opening branch of the ten help toggles. |
| `result.response` | `choice` by metadata index (`XAPI_OPTION_INDEX` maps שאלה 4ב's backwards data-values — markup order ג/ב/א — to the catalogue's א/ב/ג); `numeric` = the typed number; `matching` = `source[.]target` for the placed pairs, right pairs first. |
| Videos | Four native `<video data-xapi-report>` (slide1 → 001, slide3 → 002, slide10 → 008, slide18 → 009). In jsdom media have `readyState 0`, so only `played` is asserted here; `paused` is checked in the browser walk. |
| Score | `XAPI_ITEM_WEIGHT` 10 per question (003 = 0, 006 = 30, 009 = 20, Σ 100) = `calculateScore()` in `js/slide18.js`; drag-and-drop partial credit = correct blanks ÷ blanks; pass at 0.7. |
| Finish | `#slide18-done-btn` ("סיימתי") → `openScorePopup()` → score popup + `finishComponent`. Repeats send nothing (ledger). `closeScorePopup()` only hides the popup. |

## What `verify-report.js` checks (239 checks; the table describes the Hebrew harness this one extends)

| Group | Checks |
|---|---|
| 1. Identity | Metadata ids (bare unit slug, component, nine items, question nesting, the twelve engine-mapped questions, `001` without questions); every `questionType` in the enum and never `true-false`; clean `choice` / `matching` strings, correct ⊆ answers; `numeric` shape; no `720active` / old `-01-01` ids, placeholder or the stale 20/14 scoring text; MOE codes; code ids against metadata. |
| 2. Wiring | Shared layer + registry first, `main.js` then `90-boot.js` last, every `js/*.js` loaded once, `?v=` everywhere; every local reference exists with exact case and media live under `assets/`; every `url()` in `css/style.css` resolves; Google Fonts is the only external page reference and the applet's CDN scripts are version-pinned; four `<video>` bound to their items, no `loop`; the finish button; the 17 sections in order; the dev popup adjuster is gone; the repo root holds only the redirect. |
| 3. Layer | The five `unit-js` files, `RESUME_ENABLED` false, library `-i`; loader checks; placed-pairs matching; `20-xapi.js` byte-identical to time-model's; `90-boot.js` only boots; no name declared twice; `goTo` calls `xapiOnScreen` after the screen's hooks. |
| 4. Config | Screen map = DOM = registry; `QID_TO_XAPI`, `XAPI_EVAL_ITEMS`, weights (003 = 0), pass 0.7, end button; one report site per question at the right place; ten hint sites; one `xapiEndComponent`; `openScorePopup` → `finishComponent` once; no `SCORE` postMessage / close / alert.<br>**On-screen = reported:** option count and the index map per choice question; the engine's correct constants = the catalogue `correctAnswers`; visible option texts = the answers; שאלה 4ב's letters = the letters of the answers they report; drag-drop correct maps = `correctAnswers` and the word banks = the targets; `Q4C_CORRECT` = 24; slide5's `data-s5-yn-correct` = the כן/לא correctAnswers. |
| 5. Runtime (jsdom) | Boot on slide1 with 17 screens; a sweep without the library throws nothing. Statement flow with a recorder: landing `001`; slide1 `played {001}`; שאלה 1 one `requested` for three toggles, wrong third blank (2/3) then right; slide5 b1 reported once, b2 wrong; שאלה 2 wrong/right; 3 right; 4א right; 4ב wrong/right; 4ג wrong/right; 5 wrong twice; 6 right; 7א half right twice (right pair first); 7ב right; "סיימתי" → `completed 009 {0.75}` + exactly one component `completed` {0.85, success} = the popup's 85; button disabled, no close / alert / postMessage; a second finish sends nothing; one `completed` per item; 18 `answered` with clean responses; one `answered.last` per question; no layer warning; round trips through the real builders (choice, numeric, matching). |

## Negative tests (guide §10.4), 2026-11-01

Each mutation was applied, the harness was run, and the file was restored byte for byte.

| Mutation | Result |
|---|---|
| שאלה 4ב mapped in DOM order (`XAPI_OPTION_INDEX` 1→0, 3→2) | 4 FAILED |
| the `xapiReportDrops('q7', …)` site removed | 5 FAILED |
| `XAPI_PASS_THRESHOLD` 0.6 | 1 FAILED |
| the `SCORE` postMessage put back in `openScorePopup` | 3 FAILED |
| نعم/لا reported on every click | 5 FAILED |
| שאלה 1 reported after the reveal instead of after the verdict | 7 FAILED |
| item `003` weighted 10 | 2 FAILED |
| the שאלה 4א hint site removed | 1 FAILED |
| the Hebrew כן/לא strings put back in `xapiReportYN` | 2 FAILED |
| a Q1 correct target changed in the metadata (`البارد والغامق` → `البارد`) | 3 FAILED |
| metadata `003/q1` back to `true-false` | 4 FAILED |

All mutations were caught. The restored tree passes all 239 checks.
