/* Screen registry — methodica-math-scale-mural-arab-01 (mafmar pattern, 2026-11-01; copied from the Hebrew twin).
   Informational: the engine (js/main.js) navigates by DOM order over the 17 <section class="screen">
   elements, whose ids are the keys of SCREEN_TO_SUBCONTENT (bottom of js/main.js) and the values
   goTo hands to xapiOnScreen. _test/verify-report.js asserts that these ids, the DOM and the screen
   map agree. `item` is the catalogue item the screen belongs to. */
const SCREEN_REGISTRY = [
  { id: 'screen-slide1',  title: 'סרטון פתיחה — סתיו המורה לאומנות',     type: 'VideoScreen',            item: '001' },
  { id: 'screen-slide2',  title: 'ציור קיר בחוף הטרופי',                  type: 'TransitionScreen',       item: '001' },
  { id: 'screen-slide3',  title: 'צבעים חמים וקרים (סרטון + קריינות)',    type: 'VideoScreen',            item: '002' },
  { id: 'screen-q1',      title: 'שאלה 1 — השלמת משפטים בגרירה',          type: 'DragAndDropQuestion',    item: '002' },
  { id: 'screen-slide5',  title: 'יישומון מעבדת חקר צבעים + כן/לא',        type: 'AppletScreen',           item: '003' },
  { id: 'screen-q2',      title: 'שאלה 2 — הוספת כמות זהה',               type: 'SingleChoiceQuestion',   item: '004' },
  { id: 'screen-q3',      title: 'שאלה 3 — יחס חדש לאחר תקלה',            type: 'SingleChoiceQuestion',   item: '005' },
  { id: 'screen-q4',      title: 'שאלה 4א — בחירת משוואות',               type: 'MultipleChoiceQuestion', item: '006' },
  { id: 'screen-q4b',     title: 'שאלה 4ב — דרכי פתרון',                  type: 'MultipleChoiceQuestion', item: '006' },
  { id: 'screen-q4c',     title: 'שאלה 4ג — הקלדת מספר הליטרים',          type: 'ValueInputQuestion',     item: '006' },
  { id: 'screen-slide8',  title: 'מעבר — גוונים נוספים של ירוק',           type: 'TransitionScreen',       item: '007' },
  { id: 'screen-q5',      title: 'שאלה 5 — איזה צהוב מורגש יותר',         type: 'SingleChoiceQuestion',   item: '007' },
  { id: 'screen-slide10', title: 'סרטון — מול הקיר האמיתי',               type: 'VideoScreen',            item: '008' },
  { id: 'screen-q6',      title: 'שאלה 6 — קנה מידה',                     type: 'SingleChoiceQuestion',   item: '008' },
  { id: 'screen-q7',      title: 'שאלה 7א — שיטת המנות (גרירה)',          type: 'DragAndDropQuestion',    item: '009' },
  { id: 'screen-q7b',     title: 'שאלה 7ב — ליטרים מכל צבע (גרירה)',      type: 'DragAndDropQuestion',    item: '009' },
  { id: 'screen-slide18', title: 'סרטון סיום + "סיימתי"',                 type: 'VideoScreen',            item: '009' }
];
