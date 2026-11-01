'use strict';
/* ═══════════════════ xAPI (720) — the minimal ledger (no resume) ═══════════════════
   methodica-science-mass-summary, 2026-10-11. Definition-only, loaded after 25-report.js and
   before 50-loader.js — the slot 40-resume.js takes in the units that have resume.

   ── Why this file exists ──
   20-xapi.js is copied verbatim from methodica-science-mass-weight-01 and depends on five names
   that live in 40-resume.js there (ADDING-REPORTING-AND-RESUME.md §6.7): sendCompletedOnce,
   sendStatementOnce, itemLedgerKey, currentPartSlug and alreadySent. Without them every item close
   and the component 'completed' become no-ops swallowed by their try/catch — silently. This unit
   has no resume (one screen, nothing to restore), so instead of the 700-line resume file it carries
   the fail-open subset those names need, with the three invariants of §8.2:
     1. no restore ever runs here, so nothing is ever suppressed "while restoring";
     2. fail open: the ledger is obeyed only when it positively says "already sent";
     3. the mark is written synchronously, right after the send.

   ── Scope of the dedupe ──
   The ledger is in memory, for one page load. It is what stops a second click on "סיימתי" from
   sending a second component 'completed' (the button is also disabled by xapiEndComponent). A
   reload sends 'completed' again on the next click — accepted for a one-screen unit; the library
   dedupes within a page load and the platform records the first. 'initialized' is deliberately
   never deduped (the platform asks for it on every entry).

   ── What is NOT here, on purpose ──
   No state document, no leave handlers, no boot cover, no hints/picks persistence. dropBootCover()
   is a no-op because 50-loader.js (also copied) calls it on every exit path and this unit has no
   #boot-cover to remove. */

var _ledger = {};   /* ledger name ('done' | 'doneItems' | 'hints' | 'picks') -> { key: true } */

/* Lowercased last path segment before index.html — the part's slug, the key of its component
   'completed'. Lowercase on purpose: a capital letter in a URL must never split one learner's
   marks in two (§4.5). */
function currentPartSlug() {
  var p = window.location.pathname.replace(/\/index\.html.*$/, '').replace(/\/+$/, '');
  return (p.split('/').pop() || '').toLowerCase();
}

/* Per-part namespacing of item marks: '<slug>#<item suffix>'. */
function itemLedgerKey(item) { return currentPartSlug() + '#' + item; }

function alreadySent(ledger, key) {
  return !!(_ledger[ledger] && _ledger[ledger][key]);
}

function markSent(ledger, key) {
  _ledger[ledger] = _ledger[ledger] || {};
  _ledger[ledger][key] = true;
}

/* Any verb, once per key. Returns whether the key is SETTLED — sent just now or already in the
   ledger (the contract xapiRequestedHint in 20-xapi.js relies on). Never returns false here: there
   is no restore window in this unit. */
function sendStatementOnce(ledger, key, verb, objectType, result, opts) {
  if (alreadySent(ledger, key)) return true;
  sendStatement720(verb, objectType, result || null, opts);
  markSent(ledger, key);
  return true;
}

/* Every 'completed' — item ('doneItems') and component ('done') — goes through here. */
function sendCompletedOnce(ledger, key, objectType, result, opts) {
  sendStatementOnce(ledger, key, 'completed', objectType, result, opts);
}

/* No boot cover in this unit (no resume, so nothing to hide while a saved screen is painted).
   Kept as a no-op because the shared loader calls it on every exit path. */
function dropBootCover() {}
