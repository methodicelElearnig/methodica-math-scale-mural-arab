'use strict';
/* ═══════════════════ BOOT ═══════════════════
   The only file in unit-js/ with top-level side effects, and the LAST script tag on the page —
   after the part's script.js, so every per-part seam it reads already exists.

   methodica-science-7th-initial-mapping (2026-10-14): copied verbatim from methodica-math-gaming-app-01
   (2026-10-13, type mafmar-moodle), which was copied from
   methodica-science-mass-summary/unit-js/90-boot.js and reduced to the one call this type needs.
   Gone: initReportModal (no issue reporting in the type yet — no 25-report.js), and before that
   initResumeResetHatch / initResumeLeaveHandlers (no resume) and hideCrossPartBack (one component).

   ── Why a separate file, and not a few lines at the bottom of script.js ──
   The first attempt in the family appended these calls to the part script's init block. A
   top-level throw in that script (video.play().catch on an environment where play() is not
   implemented) killed the REST of the same script — the reporting was never initialised, with no
   visible error. A separate script tag runs in its own context: a throw in script.js cannot reach
   it. (ADDING-REPORTING-AND-RESUME.md §3.2.)

   bootXAPI() loads the wrapper and the library from the CDN and reports the component
   'initialized', then the item of the landing screen. It wraps itself inside.

   No DOMContentLoaded: this tag sits right before </body>, so the DOM is complete. */

(function boot() {
  bootXAPI();
})();
