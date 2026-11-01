# Building a deployment package

> **methodica-math-scale-mural-arab (2026-11-01):** copied from the Hebrew twin `methodica-math-scale-mural` and re-pointed: component `methodica-math-scale-mural-arab-01`, the **second component** (`order: 2`, `languages: ["Arabic"]`) of the existing unit `methodica-math-scale-mural` (MOODLE-CONVERTED-UNIT.md §15). So `-Preflight` reports the unit **EXISTS** (expected) and only the component ABSENT; the live send PATCHes the unit with the same Hebrew record and creates the component and its 9 items; `retrieve-metadata.ps1` also sees the Hebrew component; `-Publish` publishes only this component; launch links use `-ComponentId`, not `-UnitKey`. Older notes below apply with the slugs swapped.

> **methodica-math-scale-mural (2026-11-01):** copied from `methodica-math-time-model` and re-pointed: component `methodica-math-scale-mural-01`, same base `/720/math/mafmar`, 9 catalogue items. Older notes below were written for the donor units and apply with the slugs swapped.

> **methodica-math-time-model (2026-10-26):** copied from `methodica-science-8th-initial-mapping` and re-pointed: component `methodica-math-time-model-01`, same base `/720/math/mafmar`, 9 catalogue items. The notes below were written for the 8th/7th-grade and gaming-app units and apply unchanged, with the slugs swapped.

> **methodica-science-8th-initial-mapping (2026-10-14):** copied from the 7th-grade unit (`methodica-science-7th-initial-mapping`) and re-pointed: component `methodica-science-8th-initial-mapping-01`, same base `/720/math/mafmar`.

> **methodica-science-7th-initial-mapping (2026-10-14):** copied from methodica-math-gaming-app and re-pointed (component `methodica-science-7th-initial-mapping-01`, base `/720/math/mafmar`). The gaming-app notes below apply unchanged.

Three scripts, one definition of what ships (PowerShell 7+).

| File | Role |
|---|---|
| `package-allowlist.ps1` | **The only definition** of what a package contains. Not run directly — the other two load it. |
| `build-package.ps1` | Cuts a package into `../../deployments/<yyyy-MM-dd>/` (next to the repo), then verifies its own output. |
| `verify-package.ps1` | Answers one question: is the package on disk **exactly** this tree? |

`build-package.ps1` and `verify-package.ps1` are byte-identical to the mass-summary / mass-measure-03 /
ratio-01 / ratio-02 copies; only the allowlist differs (see its `.NOTES`).

> **mafmar-moodle (2026-10-13):** the package is the **component folder and nothing else** —
> `methodica-science-7th-initial-mapping-01/{index.html, script.js, registry.js, styles.css, assets/**, unit-js/*.js,
> metadata/*.json}`. No root file, no unit-level `metadata/` or `unit-js/`. It is uploaded so that its
> contents land at `https://lomdot.education.gov.il/metodica/720/math/mafmar/methodica-science-7th-initial-mapping-01/`
> (the component id, `unit-js/10-identity.js`). `_test/`, `index_dev.html`, `_moodle-intake/`, the `.mbz`
> and every `*.md` are refused by the allowlist. `MOODLE-CONVERTED-UNIT.md` §10.

## Run

```powershell
pwsh -File docs-and-tools/build-package.ps1 -DryRun   # what would ship, writes nothing
pwsh -File docs-and-tools/build-package.ps1           # cut to ../../deployments/<today>
pwsh -File docs-and-tools/verify-package.ps1          # check the newest package
```

Then cross-check the package with the harness (the gate is still `verify-package.ps1`):

```bash
NODE_PATH=<jsdom outside OneDrive> node _test/verify-report.js ../../deployments/<date>
```

`build-package.ps1` refuses a dirty working tree (`-AllowDirty` overrides) and a non-empty target
(`-Force` overrides and keeps a hand-written `DEPLOY.md`). `deployments/` is outside the repo, so an
overwrite cannot be undone.

## What ships, and what never does

Ships — the component folder only (`package-allowlist.ps1` is the authority): `methodica-math-scale-mural-arab-01/`
`index.html`, `registry.js`, `js/*.js`, `css/*.css` (one level deep), `unit-js/*.js`,
`metadata/*.json`, and `assets/` at any depth (images, audio, video and the colour-lab applet
`assets/applet/color_lab.html`). Nothing at the repo root ships, not even the redirect `index.html`.

Never ships — refused because no rule accepts it: the root `index.html` (local redirect), every
`index_dev.html`, `_test/`, `docs/`, `docs-and-tools/`, `metadata-from/`, every `*.md`, `*.ps1`,
`*.log`, and any key file.

## Why an allowlist

A denylist with one missing entry publishes whatever was forgotten — a new document, a dev page, a
`kata-api-key.txt`. With an allowlist a new file at the root simply does not match and does not ship.

## verify-package's four checks

| Check | Asks |
|---|---|
| FORWARD | every file in the package exists in the tree with the same content (MD5) |
| REVERSE | every file the allowlist ships **is** in the package (a file added after the cut would 404) |
| HYGIENE | no key, `*.ps1`, `*.log`, dev page, `README.md` or `_`-path in the package |
| COMMIT | the commit `DEPLOY.md` names vs HEAD — stale only if a **shipped** file changed |

## Deploy order (ADDING-REPORTING-AND-RESUME.md §11)

1. The library is already on the CDN (`xapi-720-i.js` — this type runs without resume); verify it by
   size and signature, not HTTP 200.
2. Upload the **contents** of the component folder to
   `https://lomdot.education.gov.il/metodica/720/math/mafmar/methodica-math-scale-mural-arab-01/`.
3. Verify every uploaded file by byte size against `DEPLOY.md` — the MOE CDN answers 200 with 0 bytes
   for a missing path.
4. Bump `?v=` identically in every part for any shared file or `main.js` that changed since the last
   upload.
