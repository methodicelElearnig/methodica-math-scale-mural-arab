/**
 * main.js — ScreenManager + viewport scaling + dev postMessage bridge + xAPI glue
 *
 * Core functions (per figma-lomda-builder skill):
 *   scaleApp()         — מתאים #app-scaler לגודל החלון
 *   goTo(n)            — ניווט למסך n (מדווח xapiOnScreen)
 *   resetScreenState() — מאפס UI בעת חזרה למסך
 *
 * postMessage bridge — dev only (index_dev.html, never shipped):
 *   index_dev.html שולח { type: 'DEV_GOTO', screen: n }; main.js מאזין ומפעיל goTo(n).
 *
 * xAPI (720, mafmar pattern): the question scripts call the helpers below (xapiReport…);
 * the per-unit configuration read by unit-js/ is the block at the BOTTOM of this file.
 */

'use strict';

/* ═══════════════════ xAPI — call-site helpers ═══════════════════
   The engine's question keys → [catalogue item suffix, question key] of
   metadata/methodica-math-scale-mural-arab-01.json. One 'answered' per check: a wrong first attempt is
   not last; the attempt that closes the question (correct, or the second miss) is 'answered.last'.
   Guarded so the lomda runs unchanged without the layer (off-platform, or a failing CDN). */
const QID_TO_XAPI = {
  q1: ['002', 'q1'], s5b1: ['003', 'q1'], s5b2: ['003', 'q2'], q2: ['004', 'q1'], q3: ['005', 'q1'],
  q4: ['006', 'q1'], q4b: ['006', 'q2'], q4c: ['006', 'q3'], q5: ['007', 'q1'], q6: ['008', 'q1'],
  q7: ['009', 'q1'], q7b: ['009', 'q2']
};

/* Option data-value (1-based) → index in the metadata `answers`. Default: value − 1.
   שאלה 4ב's markup lists its options as ت, ب, أ (data-value 1, 2, 3); the RTL row shows them as
   أ, ب, ت, and each letter IS the catalogue's ("أ. 3/2 = X/16" …) — only the data-values run backwards. */
const XAPI_OPTION_INDEX = { q4b: { 1: 2, 2: 1, 3: 0 } };

function xapiReport(key, correct, isLast, spec) {
  try {
    const m = QID_TO_XAPI[key];
    if (!m || typeof xapiAnswered !== 'function') return;
    xapiAnswered(m[0], m[1], typeof correct === 'number' ? correct : (correct ? 1 : 0), isLast, spec);
  } catch (e) { console.error('[xAPI] report ' + key, e); }
}

/* Choice / multi-select: the verdict and finality are read from the screen the engine just set
   (data-<q>-state = correct | tryagain | incorrect, data-q-done). Options are reported by metadata
   index — the rendered fractions (q4/q4b) have no plain-text form to match. */
function xapiReportChoice(key, screen, values) {
  const map = XAPI_OPTION_INDEX[key];
  const choices = (values || []).filter(function (v) { return v != null; })
    .map(function (v) { return map ? map[v] : v - 1; });
  xapiReport(key, screen.dataset[key + 'State'] === 'correct', screen.dataset.qDone === 'true',
    { type: 'choice', choices: choices });
}

/* Drag-and-drop: drops = {blank#: word}, blank n = metadata answers.source[n-1]. The fraction is the
   engine's own partial credit (correct blanks ÷ blanks — data-q-score ÷ 10). Called right after the
   verdict, before a second miss overwrites the drops with the revealed answer. */
function xapiReportDrops(key, drops, correctMap, lastAttempt) {
  const blanks = Object.keys(correctMap);
  let right = 0;
  const pairs = blanks.map(function (b) {
    if (drops[b] === correctMap[b]) right++;
    return { source: Number(b) - 1, target: drops[b] };
  });
  const frac = blanks.length ? right / blanks.length : 0;
  xapiReport(key, frac, frac >= 1 || lastAttempt, { type: 'matching', pairs: pairs });
}

/* slide5 البند ب — نعم/لا, ungraded in the engine (weight 0); the first choice is final. */
function xapiReportYN(rowId, value) {
  const row = document.querySelector('.s5-yn-row[data-s5-yn="' + rowId + '"]');
  const correct = !!row && row.dataset.s5YnCorrect === value;
  xapiReport('s5' + rowId, correct, true, { type: 'choice', choices: [value === 'yes' ? 'نعم' : 'لا'] });
}

/* Help opened (never on close) — 'requested', once per question per page load. */
function xapiHint(key) {
  try {
    const m = QID_TO_XAPI[key];
    if (m && typeof xapiRequestedHint === 'function') xapiRequestedHint(m[0], m[1]);
  } catch (e) { console.error('[xAPI] hint ' + key, e); }
}

let currentScreen = 0;

/* ─── Viewport scaling ───────────────────────────────────── */
function scaleApp() {
  const scaler = document.getElementById('app-scaler');
  if (!scaler) return;
  const scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
  const left  = (window.innerWidth  - 1920 * scale) / 2;
  const top   = (window.innerHeight - 1080 * scale) / 2;
  scaler.style.transform = `scale(${scale})`;
  scaler.style.left = left + 'px';
  scaler.style.top  = top  + 'px';
}
window.addEventListener('resize', scaleApp);
scaleApp();
// Initial nav state (runs after DOM is ready since scripts load at end of body)
updateNavButtons();

/* ─── Screen navigation ──────────────────────────────────── */
function goTo(n) {
  const screens = document.querySelectorAll('.screen');
  if (n < 0 || n >= screens.length) return;
  resetScreenState();
  screens[currentScreen].classList.remove('active');
  currentScreen = n;
  screens[currentScreen].classList.add('active');
  onEnterScreen(screens[currentScreen]);
  updateNavButtons();
  try { if (typeof xapiOnScreen === 'function') xapiOnScreen(screens[currentScreen].id); } catch (e) {}   // item initialized / completed
}

/* updateNavButtons — מנהל מצב disabled של חצי הניווט
   RTL: .nav-next = שמאל = קדימה | .nav-prev = ימין = אחורה

   שכבות:
     1. גבולות: PREV disabled במסך 0, NEXT disabled במסך אחרון
     2. וידאו-גייט: NEXT נעול אם data-video-gate מצביע לוידאו שטרם נצפה
     3. שאלה-גייט: NEXT נעול אם data-q-state קיים ו-data-q-done !== 'true'
*/
function updateNavButtons() {
  const screens = document.querySelectorAll('.screen');
  const activeScreen = screens[currentScreen];
  if (!activeScreen) return;
  const prev = activeScreen.querySelector('.nav-prev');
  const next = activeScreen.querySelector('.nav-next');
  if (prev) prev.disabled = (currentScreen <= 0);
  if (next) {
    const atLastScreen = (currentScreen >= screens.length - 1);

    // Video gate
    const videoGateId = activeScreen.dataset.videoGate;
    let   videoLocked = false;
    if (videoGateId) {
      const gateVideo = document.getElementById(videoGateId);
      videoLocked = !gateVideo || gateVideo.dataset.watched !== 'true';
    }

    // Question gate — NEXT נעול עד השלמת שאלה (correct או incorrect)
    const isQuestionScreen = activeScreen.dataset.qState !== undefined;
    const questionLocked   = isQuestionScreen && activeScreen.dataset.qDone !== 'true';

    // Applet gate — NEXT נעול עד פתיחת applet (data-applet-gate על המסך)
    const hasAppletGate  = activeScreen.dataset.appletGate === 'true';
    const appletLocked   = hasAppletGate && activeScreen.dataset.appletOpened !== 'true';

    next.disabled = atLastScreen || videoLocked || questionLocked || appletLocked;
  }
}

/* markVideoWatched — מסמן וידאו כ"נצפה" ומשחרר את נעילת ה-►
   נקרא מ: onended (הפעלה תקינה) + onerror (graceful fallback לקובץ placeholder)
*/
function markVideoWatched(videoId) {
  const video = document.getElementById(videoId);
  if (video) video.dataset.watched = 'true';
  updateNavButtons();
}

function resetScreenState() {
  // Pause all videos when leaving any screen
  document.querySelectorAll('video').forEach(function(v) {
    v.pause();
  });

  // Stop slide3 audio when leaving
  ['slide3-audio-stav','slide3-audio-yellow','slide3-audio-blue'].forEach(function(id) {
    var a = document.getElementById(id);
    if (a) { a.pause(); a.currentTime = 0; a.onended = null; }
  });
  // ...and cancel slide3's own pending timers (video-start delay + phase
  // reveals) — otherwise a quick visit to slide3 (leaving before the 2s
  // video-start timer, or a later phase timer, fires) leaves them armed,
  // and video.play() later starts the video's narration audio audibly
  // on whatever screen the learner has since moved to (slide5 immediately
  // follows slide3→q1, so that's where it was heard). Same class of bug
  // as the Q4 audio timer above.
  if (typeof _s3Timers !== 'undefined' && _s3Timers.length) {
    _s3Timers.forEach(clearTimeout);
    _s3Timers = [];
  }

  // Stop Q4 audio when leaving
  var q4audio = document.getElementById('q4-audio');
  if (q4audio) { q4audio.pause(); q4audio.currentTime = 0; q4audio.onended = null; }
  // ...and cancel its pending start-delay timer too — otherwise a quick
  // visit to Q4 (entering, then leaving before the 800ms delay in
  // startQ4AudioSequence elapses) leaves the timer armed, and it fires
  // audio.play() later on whatever screen the learner has since moved to.
  if (typeof _q4AudioTimer !== 'undefined' && _q4AudioTimer) {
    clearTimeout(_q4AudioTimer);
    _q4AudioTimer = null;
  }

  // Called before navigating AWAY from currentScreen.
  // Answered questions (qDone=true) → preserve state (lומד רואה מצב אחרון).
  // Unanswered questions → reset to initial state.
  const screens = document.querySelectorAll('.screen');
  const leavingScreen = screens[currentScreen];
  if (!leavingScreen) return;

  // QUES1
  if (leavingScreen.id === 'screen-q1' && leavingScreen.dataset.qDone !== 'true') {
    initQ1();
  }
  // SLIDE5 — סגור applet ויזואלית בעת יציאה מהמסך
  if (leavingScreen.id === 'screen-slide5') {
    leavingScreen.dataset.s5State = 'closed';
  }
  // QUES2
  if (leavingScreen.id === 'screen-q2' && leavingScreen.dataset.qDone !== 'true') {
    initQ2();
  }
  // QUES3
  if (leavingScreen.id === 'screen-q3' && leavingScreen.dataset.qDone !== 'true') {
    initQ3();
  }
  // QUES4A
  if (leavingScreen.id === 'screen-q4' && leavingScreen.dataset.qDone !== 'true') {
    initQ4();
  }
  // QUES4B
  if (leavingScreen.id === 'screen-q4b' && leavingScreen.dataset.qDone !== 'true') {
    initQ4b();
  }
  // QUES4C
  if (leavingScreen.id === 'screen-q4c' && leavingScreen.dataset.qDone !== 'true') {
    initQ4c();
  }
  // QUES5
  if (leavingScreen.id === 'screen-q5' && leavingScreen.dataset.qDone !== 'true') {
    initQ5();
  }
  // QUES6
  if (leavingScreen.id === 'screen-q6' && leavingScreen.dataset.qDone !== 'true') {
    initQ6();
  }
  // QUES7
  if (leavingScreen.id === 'screen-q7' && leavingScreen.dataset.qDone !== 'true') {
    initQ7();
  }
  // QUES7B
  if (leavingScreen.id === 'screen-q7b' && leavingScreen.dataset.qDone !== 'true') {
    initQ7b();
  }
}

/* onEnterScreen — נקרא בכניסה למסך חדש (אחרי goTo)
   מאפשר לכל מסך לאתחל את מצבו מחדש / לשחזר sessionStorage */
function onEnterScreen(screenEl) {
  if (!screenEl) return;
  // QUES1 — sync JS state with DOM state on every entry
  if (screenEl.id === 'screen-q1') {
    if (screenEl.dataset.qDone === 'true') {
      // Restore done flag to JS state so DnD remains locked on completed question
      q1State.done = true;
    } else {
      initQ1();
    }
  }
  if (screenEl.id === 'screen-slide2') {
    var s2next = screenEl.querySelector('.nav-next');
    if (s2next) {
      setTimeout(function() {
        s2next.disabled = true;
        setTimeout(function() { s2next.disabled = false; }, 4000);
      }, 0);
    }
  }
  if (screenEl.id === 'screen-slide3') { initSlide3(); }
  if (screenEl.id === 'screen-slide5') { initS5(); }
  if (screenEl.id === 'screen-q2') { initQ2(); }
  if (screenEl.id === 'screen-q3') { initQ3(); }
  if (screenEl.id === 'screen-q4')  { initQ4(); startQ4AudioSequence(); }
  if (screenEl.id === 'screen-q4b') { initQ4b(); }
  if (screenEl.id === 'screen-q4c') { initQ4c(); }
  if (screenEl.id === 'screen-q5')  { initQ5();  }
  if (screenEl.id === 'screen-q6')  { initQ6();  }
  if (screenEl.id === 'screen-q7')  { initQ7();  }
  if (screenEl.id === 'screen-q7b')    { initQ7b(); }
  if (screenEl.id === 'screen-slide1')  { initSlide1();  }
  if (screenEl.id === 'screen-slide10') { initSlide10(); }
  if (screenEl.id === 'screen-slide18') { initSlide18(); }
}

/* ─── Dev mode: postMessage bridge ──────────────────────── */
window.addEventListener('message', (e) => {
  if (!e.data || e.data.type !== 'DEV_GOTO') return;
  const n = parseInt(e.data.screen, 10);
  if (!isNaN(n)) goTo(n);
});

// Notify index_dev.html of actual screen count (DOM-based, auto-updates)
if (window.parent !== window) {
  const screenCount = document.querySelectorAll('.screen').length;
  window.parent.postMessage({ type: 'DEV_READY', total: screenCount }, '*');
}

/* ═══════════════════ xAPI (720) — the part's configuration ═══════════════════
   Data and pure helpers only, read by the shared layer (unit-js/) at CALL time — appended at the
   bottom of main.js (global scope; main.js is not an IIFE).
   Pattern: mafmar (2026/Documentation/mafmar-reporting/MOODLE-CONVERTED-UNIT.md §7), as in
   methodica-math-scale-mural-01, its Hebrew twin (copied 2026-11-01; only the component slug and the
   metadata file changed). This is the Arabic second component of the Hebrew unit. It has:
     - two attempts per question → isLast = correct || second attempt; choice and numeric questions
       score 1 or 0 (correct on either attempt), the drag-and-drop questions carry the engine's
       partial credit (correct blanks ÷ blanks) — exactly calculateScore() in js/slide18.js;
     - the catalogue has 9 items: 001 is the opening story (no question); 003 is the colour-lab
       applet, whose two כן/לא questions are reported but weigh 0 (the engine never scored them);
       006 holds שאלה 4א/ב/ג, 009 holds שאלה 7א/ב;
     - result.response is the metadata text in the xAPI interaction format (choice 'A[,]B' in answers
       order, numeric '24', matching 'S[.]T[,]…') — see unit-js/20-xapi.js.

   ── Screen → catalogue item ──
   Keyed by the section element id — the value goTo hands to xapiOnScreen. Values: [item suffix,
   page within the item (documentation only)]. Every screen belongs to an item (contiguous ranges,
   per the catalogue's informationToBot). The four videos report played/paused against their item
   (data-xapi-report on the <video>). */
var SCREEN_TO_SUBCONTENT = {
  'screen-slide1':  ['001', 1],   /* opening video */
  'screen-slide2':  ['001', 2],   /* the tropical-beach mural */
  'screen-slide3':  ['002', 1],   /* hot/cold colours video + narration */
  'screen-q1':      ['002', 2],   /* שאלה 1 — drag-and-drop (matching) */
  'screen-slide5':  ['003', 1],   /* colour-lab applet + סעיף ב כן/לא (weight 0) */
  'screen-q2':      ['004', 1],   /* שאלה 2 (choice) */
  'screen-q3':      ['005', 1],   /* שאלה 3 (choice) */
  'screen-q4':      ['006', 1],   /* שאלה 4א (multi-select) */
  'screen-q4b':     ['006', 2],   /* שאלה 4ב (multi-select) */
  'screen-q4c':     ['006', 3],   /* שאלה 4ג (numeric) */
  'screen-slide8':  ['007', 1],   /* transition: more shades of green */
  'screen-q5':      ['007', 2],   /* שאלה 5 (choice) */
  'screen-slide10': ['008', 1],   /* video: in front of the real wall */
  'screen-q6':      ['008', 2],   /* שאלה 6 (choice) */
  'screen-q7':      ['009', 1],   /* שאלה 7א — drag-and-drop (matching) */
  'screen-q7b':     ['009', 2],   /* שאלה 7ב — drag-and-drop (matching) */
  'screen-slide18': ['009', 3]    /* closing video + "סיימתי" */
};

var XAPI_COMP_SLUG = 'methodica-math-scale-mural-arab-01';
var XAPI_COMP_ID   = XAPI_ID_PREFIX + XAPI_COMP_SLUG + '/';   /* ⚠️ must end with '/' */

/* Items that carry a question the code reports — the ones whose 'completed' needs an 'answered'
   first. 001 (the opening story) has no question and closes with no result. */
var XAPI_EVAL_ITEMS = { '002': 1, '003': 1, '004': 1, '005': 1, '006': 1, '007': 1, '008': 1, '009': 1 };

/* Same folder as the page: metadata/ sits inside the component. */
var XAPI_METADATA_FILE = 'metadata/methodica-math-scale-mural-arab-01.json';

/* The part's last button — "סיימתי" on slide18 (openScorePopup). */
var XAPI_END_BTN = 'slide18-done-btn';

/* The component 'completed' verdict: the engine's own pass mark (score ≥ 70 of 100). */
var XAPI_PASS_THRESHOLD = 0.7;

/* ── Weights: exactly calculateScore() — 10 points per scored question, 100 in all; 006 holds three
   questions (30), 009 two (20). 003 weighs 0: its כן/לא answers are reported, never scored.
   XAPI_Q_WEIGHT (1 per catalogue question) splits 006 and 009 evenly. Σ XAPI_ITEM_WEIGHT = 100. */
var XAPI_ITEM_WEIGHT = { '002': 10, '003': 0, '004': 10, '005': 10, '006': 30, '007': 10, '008': 10, '009': 20 };
var XAPI_Q_WEIGHT = {
  '002/q1': 1, '003/q1': 1, '003/q2': 1, '004/q1': 1, '005/q1': 1, '006/q1': 1, '006/q2': 1, '006/q3': 1,
  '007/q1': 1, '008/q1': 1, '009/q1': 1, '009/q2': 1
};

/* The SCREEN_TO_SUBCONTENT key of the screen active at boot (50-loader.js opens its item). */
function xapiLandingScreen() {
  var a = document.querySelector('.screen.active');
  return a ? a.id : null;
}

/* An item's fraction in [0,1]: weighted mean of its answered questions' fractions
   (XAPI_Q_SCALED, written by xapiAnswered); an unanswered question counts 0. With two attempts
   the map holds the latest answer — the final one once the question is done. */
function xapiItemScaled(item) {
  var earned = 0, weight = 0;
  Object.keys(XAPI_Q_WEIGHT).forEach(function (k) {
    if (k.indexOf(item + '/') !== 0) return;
    weight += XAPI_Q_WEIGHT[k];
    var s = (typeof XAPI_Q_SCALED !== 'undefined') ? XAPI_Q_SCALED[k] : undefined;
    if (typeof s === 'number') earned += s * XAPI_Q_WEIGHT[k];
  });
  return weight ? earned / weight : 0;
}

/* Explicit result for each evaluated item's 'completed' (the library's own aggregation is an AND
   of "all answers correct", which would report success:false on every partial score). */
function xapiItemResultFor(item) {
  return function () {
    var s = xapiItemScaled(item);
    return { success: s >= 1, score: { scaled: s } };
  };
}
var XAPI_ITEM_RESULT = {};
Object.keys(XAPI_ITEM_WEIGHT).forEach(function (item) { XAPI_ITEM_RESULT[item] = xapiItemResultFor(item); });

/* The component result: Σ item weight × item fraction ÷ Σ item weights (= calculateScore() ÷ 100
   before its rounding), success at XAPI_PASS_THRESHOLD. Computed on the last click; unanswered counts 0. */
function partResult() {
  var earned = 0, total = 0;
  Object.keys(XAPI_ITEM_WEIGHT).forEach(function (item) {
    total  += XAPI_ITEM_WEIGHT[item];
    earned += XAPI_ITEM_WEIGHT[item] * xapiItemScaled(item);
  });
  var scaled = total ? earned / total : 0;
  return { success: scaled >= XAPI_PASS_THRESHOLD, score: { scaled: scaled } };
}

/* "סיימתי" — the learner's LAST click: closes the open item, sends the component 'completed'
   through the ledger (once), and disables the button. Nothing else (rule 2026-10-14). */
function finishComponent(btn) {
  try {
    if (typeof xapiEndComponent === 'function') { xapiEndComponent(partResult(), btn); return; }
  } catch (e) { console.error('[xAPI] finish', e); }
  /* Off-platform (no shared layer): still disable, so the click has a visible effect. */
  if (btn) { btn.disabled = true; btn.setAttribute('aria-disabled', 'true'); }
}
