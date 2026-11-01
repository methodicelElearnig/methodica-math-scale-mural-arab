'use strict';
/* ═══════════════════ xAPI (720) — identity ═══════════════════
   methodica-math-scale-mural — one component (methodica-math-scale-mural-01), mafmar pattern.
   (Also the identity of methodica-math-scale-mural-arab-01, the Arabic second component of the same unit:
   copied 2026-11-01 unchanged — the unit id stays the Hebrew slug, MOODLE-CONVERTED-UNIT.md §15.)
   Copied 2026-11-01 from methodica-math-time-model-01/unit-js/10-identity.js; only the unit id
   changed. Loaded first. Procedure for the type:
   2026/Documentation/mafmar-reporting/MOODLE-CONVERTED-UNIT.md (built on
   2026/Documentation/reporting-and-resume/ADDING-REPORTING-AND-RESUME.md).

   Every id the lomda reports is built from these values and must match metadata/*.json byte for
   byte — including the trailing slash, which this unit's catalogue carries on the component and
   item ids (not on question ids, and not on the unit id, which is a bare slug — see below).
   50-loader.js compares XAPI_COMP_ID with window.METADATA.id on every load and shouts on a
   mismatch; _test/verify-report.js asserts it against metadata/.

   ⚠️ The prefix is the CONTENT base (/metodica/720/…), not the family's /metodica/720active/…
   identifier base. Decision 2026-10-13 for the mafmar type, applied to this unit 2026-11-01 (the
   delivered catalogue used the family 720active/math/scale-mural/01 form and was rewritten —
   docs/05-xapi-reporting-report.md): a mafmar unit has one component
   that sits directly under …/720/<subject>/mafmar/<component>/ on the CDN, with no unit folder, so
   the component id and its launch URL share one base — hostedContentRef = id + 'index.html'.
   The 720active/720 split of ADDING-REPORTING-AND-RESUME.md §4.6 therefore does not apply here.

   Lowercase everywhere (ids, folder names): Kata derives a uniqueKey from the last id segment, and
   currentPartSlug() (40-ledger.js) derives the ledger key from location.pathname. */
var XAPI_ID_PREFIX = 'https://lomdot.education.gov.il/metodica/720/math/mafmar/';

/* The unit id — a bare SLUG, not an IRI, equal to metadata/methodica-math-scale-mural_unit.json `id`
   and to `learningUnitId` in the component JSON. MOE v2.5 §2.7 dropped the IRI requirement for the
   content unit only; the component and its items remain IRIs (hence XAPI_ID_PREFIX above).
   ⚠️ Never replace it with the prefix alone: Kata would take the last prefix segment ("mafmar") as
   the uniqueKey and collide with every mafmar unit of the subject. */
window.XAPI_UNIT_ID = 'methodica-math-scale-mural';

/* The last segment of a canonical id — the short slug (kept for the issue-report layer, which this
   type does not carry yet). */
function shortId(u) { return String(u || '').replace(/\/+$/, '').split('/').pop(); }

/* Resume (Kata xAPI State API) — OFF here, as in the mafmar reference unit (this lomda never had
   any persistence; there is no 40-resume.js here). unit-js/40-ledger.js provides the in-memory ledger
   the reporting layer still needs (ADDING-REPORTING-AND-RESUME.md §6.7).
   ⚠️ This flag also selects the library: with it false, 50-loader.js loads xapi-720-i.js (reporting
   per 720 guidelines v2.4, no State layer) instead of xapi-720-k.js. */
var RESUME_ENABLED = false;

/* ── Navigation between parts: not applicable (one component) — kept so 50-loader.js and 20-xapi.js
   read the same seam they read in every other unit. The platform (Kata) launches the component with
   its own ?registration; DEV_NAV is true only for a local walk (?dev=1 and NO ?registration). */
var DEV_NAV = false;
try {
  var _devQ = new URLSearchParams(location.search);
  DEV_NAV = _devQ.get('dev') === '1' && !_devQ.has('registration');
} catch (e) {}
