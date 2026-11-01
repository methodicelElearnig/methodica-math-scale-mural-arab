'use strict';
/* ═══════════════════ xAPI — loader / init ═══════════════════
   Definition-only. bootXAPI() is called last, from 90-boot.js.

   methodica-science-7th-initial-mapping (2026-10-14): copied verbatim from methodica-math-gaming-app-01
   (2026-10-13, type mafmar-moodle), which was copied from
   methodica-science-mass-summary/unit-js/50-loader.js (itself mass-weight-01's loader trimmed of
   the three resume-only blocks — no resume in this type either: RESUME_ENABLED is false in
   10-identity.js, and 40-ledger.js replaces 40-resume.js). One line differs from mass-summary: the
   landing-screen item 'initialized' asks the part for its screen KEY (xapiLandingScreen) — see the
   comment at that call. Everything else is the donor's, including the dropBootCover() calls on
   every exit path (a no-op here — 40-ledger.js) so the control flow stays byte-comparable with the
   family.

   The per-part seams (read at call time, from the part's script.js):
     XAPI_METADATA_FILE   required — 'metadata/<component>.json' (same folder as the page: in the
                          mafmar-moodle type metadata/ lives INSIDE the component folder)
     xapiLandingScreen()  optional — returns the SCREEN_TO_SUBCONTENT key of the screen that is
                          active at boot. This type keys the map by element id ('SC01'…), the same
                          value registry.js passes to xapiOnScreen on every navigation.
     onXapiReady()        optional — runs after the component 'initialized' and after the landing
                          screen's item 'initialized'. Unused in this unit.

   The sequence (ADDING-REPORTING-AND-RESUME.md §6.7):
     wrapper → library → getXAPIParameters → poll for metadata → changeConfig → ID-mismatch check →
     component 'initialized' → xapiWireVideos() → landing-screen item 'initialized' → onXapiReady() */

function bootXAPI() {
  var CDN = 'https://lomdot.education.gov.il/metodica/720active/common/';

  /* ── שער 1: התפר הפר-סיני חייב להיות מוגדר ──
     בלי XAPI_METADATA_FILE, getXAPIParameters מקבל undefined, לא מצליח להביא
     מטא-דאטה, ו-jsXAPI_MetadataReady לעולם לא נדלק — כלומר pollMetadataReady
     היה נכנס ללופ טיימרים אין-סופי בלי שום שגיאה גלויה. סין שלא הגדיר את
     התפר מקבל הודעה רועשת ויציאה נקייה במקום.
     זה גם מה שמאפשר לבלוק האתחול לקרוא ל-bootXAPI() בכל הסינים לפני
     שהוגדרה הקונפיגורציה הפר-סינית — הלומדה פשוט רצה בלי דיווחיות. */
  if (typeof XAPI_METADATA_FILE === 'undefined' || !XAPI_METADATA_FILE) {
    console.warn('[xAPI] XAPI_METADATA_FILE לא מוגדר בסין הזה — הדיווחיות כבויה. ' +
      'זה המצב הצפוי עד להשלמת הקונפיגורציה הפר-סינית (REPORT-XAPI.md §2).');
    dropBootCover();
    return;
  }

  function loadScript(src, cb) {
    var s = document.createElement('script');
    s.src = src;
    s.onload = cb;
    s.onerror = function () { console.error('[xAPI] failed to load', src); cb(); };
    document.head.appendChild(s);
  }

  /* ── שער 2: הפולינג חסום בזמן ──
     המקור במתמטיקה מפולל לנצח. אם קובץ המטא-דאטה חסר או מחזיר 404 —
     תרחיש דפלוימנט אמיתי לגמרי — זה לופ טיימרים שקט לכל אורך הסשן.
     50 נסיונות × 200ms = 10 שניות, ואז שגיאה שמסבירה מה לבדוק. */
  var METADATA_POLL_MAX = 50;
  function pollMetadataReady(cb, tries) {
    tries = tries || 0;
    if (window.jsXAPI_MetadataReady) { cb(); return; }
    if (tries >= METADATA_POLL_MAX) {
      console.error('[xAPI] מטא-דאטה לא נטענה תוך ' + (METADATA_POLL_MAX * 200 / 1000) + 's — ' +
        'הדיווחיות כבויה בסין הזה. לבדוק שהקובץ קיים ונגיש: ' + XAPI_METADATA_FILE);
      dropBootCover();
      return;
    }
    setTimeout(function () { pollMetadataReady(cb, tries + 1); }, 200);
  }

  /* -i הוא בילד הייצור כשה-resume כבוי (הנחיות 720 v2.4); -k הוא -i + שכבת ה-State API
     + אבחון. ביחידה הזאת RESUME_ENABLED=false ולכן נטען -i (ADDING-REPORTING-AND-RESUME.md §4.4).

     ב-localhost בלבד, ?xapiLib=<נתיב same-origin> יכול לעקוף לבדיקת בילד מקומי
     — כך נבדק הדיווח מול _test/xapi-720-i.js בלי LRS אמיתי.

     ⚠️ שם הקובץ של ה-stub חייב להסתיים באות ספרייה שה-regex למטה מכיר
     (xapi-720-i.js): ה-regex הוא מה שקובע את XAPI_USING_G, ושם שלא תואם משתיק
     את כל ה-statements ברמת הפריט בלי שום שגיאה.

     ⚠️ window.XAPI_USING_G אומר לסינים אם statements ברמת פריט זמינים בכלל.
     ה-regex חייב למנות כל אות ספרייה שתומכת בהם — **אות חדשה שלא תתווסף כאן
     משתיקה את xapiOnScreen ואת דיווח הווידאו בלי שום שגיאה.** לכן שינוי
     ה-LIB720 ושינוי ה-regex חייבים לקרות באותו commit; זה הכשל השקט של המעבר
     בין אותיות. */
  var LIB720 = CDN + (RESUME_ENABLED ? 'xapi-720-k.js' : 'xapi-720-i.js');
  try {
    if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {
      var _ovr = new URLSearchParams(location.search).get('xapiLib');
      if (_ovr && /^(\.\.?\/|\/)[^:]*$/.test(_ovr)) LIB720 = _ovr;   // same-origin יחסי בלבד
    }
  } catch (e) {}
  window.XAPI_USING_G = /xapi-720-[ghijk]\.js/.test(LIB720);

  loadScript(CDN + 'xapiwrapper.min.js', function () {
    loadScript(LIB720, function () {
      try {
        getXAPIParameters(XAPI_METADATA_FILE);

        /* אין resume ביחידה הזאת: אין מסמך לקרוא ואין מסך לשחזר, ולכן אין
           כיסוי להחזיק. (ביחידות עם resume כאן יושב "שלב א'" — קריאת המסמך.) */
        dropBootCover();

        pollMetadataReady(function () {
          try {
            try { ADL.XAPIWrapper.changeConfig({ endpoint: window.slxapi.endpoint, auth: window.slxapi.auth }); } catch (e) {}

            /* ── שער האימות של המזהים ──
               XAPI_ID_PREFIX הוא הערך היחיד בשכבה המשותפת שנקבע בהשערה
               (ראו 10-identity.js). כאן הוא נבדק מול מקור האמת בכל טעינה של
               כל סין: window.METADATA.id הוא ה-id של הרכיב הזה כפי שהוא
               כתוב ב-metadata/, ו-XAPI_COMP_ID הוא מה שהקוד ישלח בפועל.
               אי-התאמה כאן — כולל הבדל של trailing slash אחד או של אות
               רישית אחת — פירושה שכל statement שהרכיב ישלח מצביע על object
               שלא קיים בקטלוג. זה כשל שקט לחלוטין בלי הבדיקה הזאת: הספרייה
               תשלח בשמחה מזהה שגוי ו-Kata תקבל אותו.
               אזהרה, לא זריקה: דיווח שגוי עדיף על לומדה שנופלת. */
            try {
              var _metaId = window.METADATA && window.METADATA.id;
              if (_metaId && typeof XAPI_COMP_ID !== 'undefined' && _metaId !== XAPI_COMP_ID) {
                console.error('[xAPI] ID MISMATCH — הקוד ישלח מזהה שלא קיים בקטלוג.\n' +
                  '  metadata/ אומר: ' + _metaId + '\n' +
                  '  הקוד שולח:      ' + XAPI_COMP_ID + '\n' +
                  '  תקנו את XAPI_ID_PREFIX ב-unit-js/10-identity.js או את XAPI_COMP_SLUG בסין הזה.');
              }
            } catch (e) {}

            /* (ביחידות עם resume כאן יושב "שלב ב'" — פתיחת הכתיבות והשחזור עצמו,
               אחרי changeConfig ולפני ה-initialized של הרכיב. אין כאן.) */

            dropBootCover();

            try { sendStatement720('initialized', 'onlinelesson'); } catch (e) {}
            try { xapiWireVideos(); } catch (e) {}
            /* init ברמת הפריט עבור מסך הנחיתה. המסך הראשון לא עובר דרך goToScreen() בכלל —
               ה-.active מקובע ב-HTML — ולכן זו הקריאה היחידה שפותחת את הפריט שלו.
               mafmar-moodle: המפה ממופתחת לפי id של האלמנט ('SC01'…), לא לפי אינדקס —
               ולכן המפתח מגיע מ-xapiLandingScreen() של הסין; בלעדיו, currentScreen כמו במשפחה. */
            try { xapiOnScreen(typeof xapiLandingScreen === 'function' ? xapiLandingScreen() : currentScreen); } catch (e) {}
            if (typeof onXapiReady === 'function') {
              try { onXapiReady(); } catch (e) { console.error('[xAPI] ready hook', e); }
            }
          } catch (e) { console.error('[xAPI] init', e); dropBootCover(); }
        });
      } catch (e) { console.error('[xAPI] load', e); dropBootCover(); }
    });
  });
}
