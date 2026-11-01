# Live Kata verification — `methodica-math-scale-mural-arab-01`, 2026-11-01

First live run of the Arabic component against Kata (production LRS), the same day it was converted
(`docs/05-xapi-reporting-report.md`), registered as the second component (`order: 2`) of the Hebrew unit
`methodica-math-scale-mural`, uploaded to the CDN and published. The upload was verified first: all 103
files identical by status, size and MD5; the served page loads its metadata with no ID mismatch
(`deployments/2026-11-01/DEPLOY.md`, "Done 2026-11-01").

Purpose: confirm on production that the whole statement set reaches Kata and is accepted, with the Arabic
`response` strings — item `initialized`/`completed`, every `answered` in the xAPI interaction format for the
three types this unit uses (choice, numeric, matching), the slide5 نعم/لا questions at weight 0, one
`requested` per question, `played`/`paused` for the native videos, and exactly one component `completed`
from "اِنْتَهَيْتُ". Procedure: the walk of the Hebrew twin's live run (`VADIM-SCALEMURAL-TEST-2` in that
repo's `docs-and-tools/LIVE-VERIFICATION-2026-11-01.md`) with the Arabic words, so the expected final score
is 85, as there.

## Launch

- Component published first: `send-metadata.ps1 -Publish` → `PUBLISHED methodica-math-scale-mural-arab-01 (HTTP 200)`,
  read back as `published` (`docs-and-tools/publish-metadata-2026-11-01*.log`).
- Link minted with `2026/Tools/full-kata-link/New-KataLaunchLinks.ps1 -ComponentId https://lomdot.education.gov.il/metodica/720/math/mafmar/methodica-math-scale-mural-arab-01/ -StudentId VADIM-SCALEMURAL-AR-TEST-1 -ResetState`
  (a new pseudonymous learner; the CSV went to a scratch folder, not the repo). Kata returned one
  `launchUrl` with `registration=f24e8496-…`.
- Opened in the Claude desktop built-in browser: `lang="ar"`, `XAPI_DISABLED === false`, library
  `xapi-720-i.js`, `ADL.XAPIWrapper.xapiVersion === "1.0.3"`, endpoint `https://kata.cet.ac.il/api/v1/xapi/`,
  `METADATA.id === XAPI_COMP_ID` (`order 2`), landing screen slide1 open.

## Walk (`VADIM-SCALEMURAL-AR-TEST-1`)

**Nothing on the page was stubbed.** After the boot, `ADL.XAPIWrapper.sendStatement` was wrapped
transparently (the lesson of the Hebrew run's discarded TEST-1): the library's synchronous call stays
synchronous, and the wrapper only records each statement body, its LRS status and its round-trip time;
every call was synchronous. `window.close` and `alert` were wrapped with counters. The two boot statements
(component `initialized`, item 001 `initialized`) were sent before the recorder and are counted from the
network log.

**Videos:** slide1 and slide10 played (muted) for about 1.2 s and were paused — real `<video>` events.
**Answers** (the engine's own functions — `q1PlaceWord`, `selectQ*Option`, `selectS5YN`, the real input with
`onQ4cInput` — and the real submit / retry functions): help on السؤال 1 opened twice (four toggles) · السؤال 1
third blank wrong (`الدافئ والفاتح`), retry, right (`البارد والغامق`) · slide5 b1 نعم, then لا (not reported),
b2 نعم (wrong) · السؤال 2 option 1, retry, option 3 · السؤال 3 option 4 · السؤال 4أ options 4 and 2 · السؤال 4ب
data-values 1+2 (ت, ب), retry, 3+2 (أ, ب) · السؤال 4ج 20, retry, 24 · السؤال 5 options 1 then 3 (wrong twice, on
purpose) · السؤال 6 option 3 · السؤال 7أ 5/30, retry, 28/6 (half right twice) · السؤال 7ب 18/12 · "اِنْتَهَيْتُ"
clicked once, then a forced second click with the button re-enabled, a direct `openScorePopup()` and
`closeScorePopup()`.

## Statements: 43 sent, 43 accepted

- The page made **43** POSTs to `https://kata.cet.ac.il/api/v1/xapi/statements`: the 2 boot statements plus
  the 41 captured. Every captured statement got **HTTP 200** (35–104 ms), carries the launch registration,
  `actor.account.name = VADIM-SCALEMURAL-AR-TEST-1`, and an object id under
  `…/mafmar/methodica-math-scale-mural-arab-01/`. Every `answered` carries its item as
  `context.contextActivities.parent`; every evaluated item's `initialized` carries the `evaluation-item`
  category. No console error.

| # | verb | object | `result` |
|---|---|---|---|
| 1–2 | initialized | component; item 001 | — (boot) |
| 3–4 | played, paused | 001 (slide1 video) | `https://w3id.org/xapi/video/extensions/time` 0 / 1.15 |
| 5 | completed | 001 | — (no question) |
| 6 | initialized | 002 | — |
| 7 | requested | 002/q1 | — (**once**, for two openings) |
| 8–9 | answered, answered | 002/q1 (matching) | 0.6667 `…أكواب[.]5[,]…هو __[.]الأزرق[,]…إلى اللون __[.]الدافئ والفاتح`, then 1 with `البارد والغامق` (= Kata's `correctXapiResponsesPattern`) |
| 10 | completed | 002 | → 1 |
| 11–14 | initialized, answered, answered, completed | 003 | 003/q1: 1 `نعم`; 003/q2: 0 `نعم` → 0.5 (weight 0 in the component score) |
| 15–18 | initialized, answered, answered, completed | 004 | 0 `وسام على صواب. …`, then 1 `وسام مُخطئ، يَجِب إضافة 8 أكواب فقط …` → 1 |
| 19–21 | initialized, answered, completed | 005 | 1 `1:1` → 1 |
| 22–28 | initialized, answered ×5, completed | 006 | 006/q1: 1 `2/3 = 16/X[,]3/2 = X/16`; 006/q2: 0 `ب. 3/2 = (3 · 8)/(2 · 8)[,]ت. 3/2 = (3 + 14)/(2 + 14)`, then 1 `أ. 3/2 = X/16[,]ب. 3/2 = (3 · 8)/(2 · 8)`; 006/q3: 0 `20`, then 1 `24` → 1 |
| 29–32 | initialized, answered, answered, completed | 007 | 0 `في الخليط "ب"، …`, 0 `لا يُمكن المعرفة. …` → 0 |
| 33–35 | initialized, played, paused | 008 (slide10 video) | time 0 / 1.21 |
| 36–37 | answered, completed | 008 | 1 `3 أمتار` → 1 |
| 38–41 | initialized, answered, answered, answered | 009 | 009/q1: 0.5 `…لترات[.]5[,]…30 لترًا[.]30`, then 0.5 `…30 لترًا[.]6[,]…لترات[.]28` (right pair first); 009/q2: 1 `…الأزرق: 6 وجبات كاملة = __ لترًا[.]18[,]…الأصفر: 6 وجبات كاملة = __ لترًا[.]12` |
| 42 | completed | 009 | → 0.75 |
| 43 | **completed** | **component** | **success true, scaled 0.85** (the popup showed 85; HTTP 200) |

The sequence, scores and statement count are identical to the Hebrew live run; only the `response` strings
are Arabic. Every correct-answer `response` equals the `correctXapiResponsesPattern` Kata returned on
registration (`retrieve-metadata-2026-11-01-component-draft.log`), and every choice response is the
metadata text, not the on-screen order (q4b's backwards data-values give `أ`, `ب`, `ت` correctly).

**The finish:** the click on "اِنْتَهَيْتُ" showed the score popup (85), sent item 009's `completed` and the
one component `completed`, and nothing else. `window.close` and `alert` were each called **0** times, the
tab stayed on the same URL, the button is `disabled` + `aria-disabled`. The forced second click, the direct
`openScorePopup()` and `closeScorePopup()` sent nothing. After the walk the unit's ledger held 9 item marks,
1 hint and 1 component mark.

**What was not sent:** no unit-level statement, no second `requested`, no `answered` for the second
نعم/لا click, no `student_answer` on the wire.

## Not observed (limits)

- Kata's own reading of the results (its comparison of `response` to `correctXapiResponsesPattern`, and
  how it treats item 003's weight-0 answers) was not inspected; the reporting token cannot read statements
  back.
- The engine was driven through its own functions, not by mouse drag-and-drop; the drag handlers end in the
  same `q*PlaceWord` calls.
- slide3 and slide18's videos were not played; they use the same `data-xapi-report` wiring that the slide1
  and slide10 videos proved here. The Arabic build's pause/resume buttons on those videos were not clicked.
- A reload or return visit was not exercised (no resume in this type).
