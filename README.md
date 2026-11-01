# methodica-math-scale-mural-arab

لومدة تفاعلية — رياضيات، "رسم جداريّ على الشاطئ الاستوائيّ": نسبة وتناسب ومقياس رسم (الصف الثامن). The
Arabic build of `methodica-math-scale-mural`: the same 17 screens, 7 questions (4 and 7 in several parts), two
attempts per question, four videos and the colour-lab applet, translated.

This is the **second component** of the mafmar unit `methodica-math-scale-mural`, not a unit of its own
(`2026/Documentation/mafmar-reporting/MOODLE-CONVERTED-UNIT.md` §15): component
`methodica-math-scale-mural-arab-01`, `order: 2`, `languages: ["Arabic"]`; the unit record is the Hebrew one,
byte for byte. The Hebrew component is `methodica-math-scale-mural-01` in the repo
`methodicelElearnig/methodica-math-scale-mural`, converted the same day; this repo copies its shared layer,
reporting glue, harness and tooling. What is particular to the Arabic build is in
`docs/05-xapi-reporting-report.md`.

## Layout

```
index.html                              local-browsing redirect into the component — never deployed
methodica-math-scale-mural-arab-01/     ← the ONE deployable folder (= the package = the CDN folder)
  index.html  registry.js
  index_dev.html                        dev screen navigator (never deployed)
  css/style.css  css/style-ar.css       the Arabic overrides; url('../assets/img/…') need this folder
  js/                                   main.js (engine + xAPI helpers; the xAPI config block at its bottom),
                                        one script per question and per slide
  assets/                               img/, audio/, video/ (Video1_AR…Video4_AR), applet/color_lab.html
  metadata/                             the Hebrew unit record + this component's record (9 items)
  unit-js/                              the xAPI layer (10-identity, 20-xapi, 40-ledger, 50-loader, 90-boot)
  _test/                                headless harness + the local library stub (never deployed)
docs-and-tools/                         packaging allowlist/builder/verifier, Kata send/retrieve scripts
docs/                                   the conversion report, the original spec, README_AR.md, the delivered metadata
translation/                            the translation export and its tools — never deployed
.claude/launch.json                     dev server config (never deployed)
```

It deploys to `https://lomdot.education.gov.il/metodica/720/math/mafmar/methodica-math-scale-mural-arab-01/`.
That URL is also the component id; items are `…-arab-01-NNN/`.

## Reporting (xAPI, MOE v2.7)

The same as the Hebrew component (see its README); only the strings are Arabic:
- component `initialized` on load; item `initialized`/`completed` by `SCREEN_TO_SUBCONTENT` (bottom of `js/main.js`);
- `played`/`paused` for the four videos; `requested` once per question when help opens;
- one `answered` per check, `answered.last` on the closing attempt; `result.response` is the Arabic metadata
  text in the xAPI interaction format (choice by metadata index, `matching` `source[.]target`, `numeric`);
  slide5's two `نعم`/`لا` questions are reported on the first choice and weigh 0;
- component `completed` on "اِنْتَهَيْتُ" only, = `calculateScore()` ÷ 100, success from 0.7.

## External dependencies

Google Fonts (Cairo, Open Sans) on the page and in the applet; the applet loads React 18.3.1, ReactDOM 18.3.1
and Babel standalone 7.26.4 from unpkg, pinned.

## Run, test, package

```bash
cd methodica-math-scale-mural-arab-01
NODE_PATH=/tmp/lomda-test/node_modules node _test/verify-report.js        # jsdom outside OneDrive (Windows: %LOCALAPPDATA%\Temp\lomda-test)
```

```powershell
pwsh -File docs-and-tools/build-package.ps1 -DryRun
pwsh -File docs-and-tools/send-metadata.ps1 -DryRun
```

To see the statements locally, serve the repo root and open
`methodica-math-scale-mural-arab-01/index.html?xapiLib=./_test/xapi-720-i.js`, then run `__stmts()` in the console.

## Status / TODO

- [x] Converted (2026-11-01): mafmar structure, reporting, metadata (the delivered `methodica-ar-…` record rewritten as the unit's second component), harness (239 checks, 11 negative mutations caught), tooling. Unused Hebrew media removed.
- [x] Registered in Kata as a **draft** (2026-11-01): preflight (unit EXISTS, component ABSENT) → live send `created=10 updated=1 failed=0` → retrieve (only the 10 expected Hebrew-component warnings; the Arabic component matches) → `-Status` = draft. Logs in `docs-and-tools/` (see `SEND-METADATA.md`).
- [ ] Build the package, upload the component folder to the CDN, verify every file by size and MD5.
- [ ] Publish (`send-metadata.ps1 -Publish`, this component only).
- [ ] Live Kata run with a test learner (`New-KataLaunchLinks.ps1 -ComponentId …`), recorded in `docs-and-tools/LIVE-VERIFICATION-<date>.md`.
