/* Structural + runtime verification for methodica-math-scale-mural-arab-01 — the xAPI reporting layer
   of the ARABIC second component of the mafmar unit methodica-math-scale-mural (no resume, no issue report).
   Copied 2026-11-01 from the Hebrew twin's _test/verify-report.js; adapted for the second-component rule
   (MOODLE-CONVERTED-UNIT.md §15: unit = the Hebrew record, component order 2, languages Arabic), the
   Arabic texts, and the translation tool's attribute order in index.html.

   WHAT THIS COVERS, AND WHY
   Every assertion corresponds to a failure that is SILENT at runtime: the lomda keeps working, the
   learner notices nothing, and the data is wrong or missing. Loud, screen-level behaviour is checked
   in a browser instead. Type rules: 2026/Documentation/mafmar-reporting/MOODLE-CONVERTED-UNIT.md;
   family guide: 2026/Documentation/reporting-and-resume/ADDING-REPORTING-AND-RESUME.md.

   THIS UNIT, compared with time-model:
     - the engine is js/main.js plus one script per question / slide in js/ (global functions);
       the package ships js/ and css/ one level deep, the media and the colour-lab applet under assets/;
     - 17 screens <section class="screen" data-screen="0…16" id="screen-…">; every screen belongs to an item;
     - nine catalogue items: 001 is the opening story (no question); 003 is the colour-lab applet with
       two כן/לא `choice` questions that are reported but weigh 0; 006 holds שאלה 4א/ב/ג; 009 holds 7א/ב;
     - answers go through xapiReportChoice / xapiReportDrops / xapiReportYN / xapiReport (js/main.js):
       choice options by metadata index (the rendered fractions have no plain-text form), drag-and-drop
       pairs as 'S[.]T' with the engine's partial credit (correct blanks ÷ blanks);
     - weights = calculateScore() in js/slide18.js (10 per question, Σ 100), pass at 0.7; the finish
       button is #slide18-done-btn (openScorePopup).

   RUN (jsdom must live OUTSIDE this OneDrive tree):
     mkdir -p /tmp/lomda-test && cd /tmp/lomda-test && npm install jsdom
     cd <repo>/methodica-math-scale-mural-01
     NODE_PATH=/tmp/lomda-test/node_modules node _test/verify-report.js      (Windows: the AppData\Local\Temp path)
   Without jsdom the static groups still run and the runtime group reports SKIPPED.
   Optional argument: a built package's COMPONENT folder to check instead of the repo. */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const REPO_COMP = path.join(__dirname, '..');
const BASE = process.argv[2] ? path.resolve(process.argv[2]) : REPO_COMP;
const IS_PACKAGE = path.resolve(BASE) !== path.resolve(REPO_COMP);
const REPO_ROOT = path.join(REPO_COMP, '..');

const UNIT_SLUG = 'methodica-math-scale-mural';
const COMP = UNIT_SLUG + '-arab-01';
const PREFIX = 'https://lomdot.education.gov.il/metodica/720/math/mafmar/';
const ITEMS = ['001', '002', '003', '004', '005', '006', '007', '008', '009'];
const EVAL_ITEMS = ITEMS.slice(1);
const SCREENS = ['screen-slide1', 'screen-slide2', 'screen-slide3', 'screen-q1', 'screen-slide5', 'screen-q2', 'screen-q3', 'screen-q4', 'screen-q4b',
                 'screen-q4c', 'screen-slide8', 'screen-q5', 'screen-slide10', 'screen-q6', 'screen-q7', 'screen-q7b', 'screen-slide18'];
const WANT_MAP = {
  'screen-slide1': '001', 'screen-slide2': '001', 'screen-slide3': '002', 'screen-q1': '002', 'screen-slide5': '003', 'screen-q2': '004',
  'screen-q3': '005', 'screen-q4': '006', 'screen-q4b': '006', 'screen-q4c': '006', 'screen-slide8': '007', 'screen-q5': '007',
  'screen-slide10': '008', 'screen-q6': '008', 'screen-q7': '009', 'screen-q7b': '009', 'screen-slide18': '009'
};
const WANT_QID_TO_XAPI = {
  q1: ['002', 'q1'], s5b1: ['003', 'q1'], s5b2: ['003', 'q2'], q2: ['004', 'q1'], q3: ['005', 'q1'],
  q4: ['006', 'q1'], q4b: ['006', 'q2'], q4c: ['006', 'q3'], q5: ['007', 'q1'], q6: ['008', 'q1'],
  q7: ['009', 'q1'], q7b: ['009', 'q2']
};
const ALL_Q = Object.values(WANT_QID_TO_XAPI).map((v) => v[0] + '/' + v[1]);
const WEIGHTS = { '002': 10, '003': 0, '004': 10, '005': 10, '006': 30, '007': 10, '008': 10, '009': 20 };
const PASS = 0.7;
const END_BTN = 'slide18-done-btn';
const VIDEO_ITEMS = { 'screen-slide1': '001', 'screen-slide3': '002', 'screen-slide10': '008', 'screen-slide18': '009' };
const HE_REPO = path.join(__dirname, '..', '..', '..', '..', '..', 'methodica-math-scale-mural', 'git-repo', 'methodica-math-scale-mural');
const N_SCREENS = 17;
/* choice options: screen, option class, engine correct constant, data-value → metadata index */
const CHOICE = {
  q2: { scr: 'screen-q2', opt: 'q2-option', konst: 'Q2_CORRECT', file: 'radio.js' },
  q3: { scr: 'screen-q3', opt: 'q2-option', konst: 'Q3_CORRECT', file: 'radio3.js' },
  q4: { scr: 'screen-q4', opt: 'q4-option', konst: 'Q4A_CORRECT', file: 'radio4.js' },
  q4b: { scr: 'screen-q4b', opt: 'q4b-option', konst: 'Q4B_CORRECT', file: 'radio4b.js', index: { 1: 2, 2: 1, 3: 0 } },
  q5: { scr: 'screen-q5', opt: 'q5-option', konst: 'Q5_CORRECT', file: 'radio5.js' },
  q6: { scr: 'screen-q6', opt: 'q6-option', konst: 'Q6_CORRECT', file: 'radio6.js' }
};
const DRAG = { q1: { konst: 'Q1_CORRECT_ANSWERS', file: 'dragdrop.js' }, q7: { konst: 'Q7_CORRECT', file: 'dragdrop7.js' }, q7b: { konst: 'Q7B_CORRECT', file: 'dragdrop7b.js' } };

const compDir = BASE;
const read = (p) => fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
const readJson = (p) => JSON.parse(read(p).replace(/^\uFEFF/, ''));
const exists = (p) => fs.existsSync(p);
const stripComments = (src) => String(src || '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"])\/\/.*$/gm, '$1');
function resolveExact(p) {
  const parts = path.resolve(p).split(path.sep);
  let cur = parts[0] + path.sep;
  for (let i = 1; i < parts.length; i++) {
    if (!parts[i]) continue;
    let names;
    try { names = fs.readdirSync(cur); } catch (e) { return false; }
    if (!names.includes(parts[i])) return false;
    cur = path.join(cur, parts[i]);
  }
  return true;
}

let pass = 0, skipped = 0;
const failures = [];
function ok(group, name, cond, detail) {
  if (cond) { pass++; return; }
  failures.push('[' + group + '] ' + name + (detail ? '\n         ' + String(detail) : ''));
}

/* ───────────────────────── inputs ───────────────────────── */
const html = read(path.join(compDir, 'index.html'));
const jsDir = path.join(compDir, 'js');
const jsFiles = fs.readdirSync(jsDir).filter((f) => f.endsWith('.js'));
const js = {};
for (const f of jsFiles) js[f] = read(path.join(jsDir, f));
const mainJs = js['main.js'];
const partJs = jsFiles.map((f) => js[f]).join('\n');
const registryJs = read(path.join(compDir, 'registry.js'));
const unitJsDir = path.join(compDir, 'unit-js');
const unitFiles = ['10-identity.js', '20-xapi.js', '40-ledger.js', '50-loader.js', '90-boot.js'];
const unitJs = {};
for (const f of unitFiles) unitJs[f] = exists(path.join(unitJsDir, f)) ? read(path.join(unitJsDir, f)) : null;
const unitMeta = readJson(path.join(compDir, 'metadata', UNIT_SLUG + '_unit.json'));
const compMeta = readJson(path.join(compDir, 'metadata', COMP + '.json'));

const idSandbox = { window: {}, URLSearchParams, location: { search: '' }, console };
vm.createContext(idSandbox);
try { vm.runInContext(unitJs['10-identity.js'] || '', idSandbox); } catch (e) { failures.push('[identity] 10-identity.js does not evaluate: ' + e.message); }
const XAPI_ID_PREFIX = idSandbox.XAPI_ID_PREFIX;
const XAPI_UNIT_ID = idSandbox.window.XAPI_UNIT_ID;
const RESUME_ENABLED = idSandbox.RESUME_ENABLED;

function cfg(name) { const m = new RegExp('^(?:var|const|let) ' + name + '\\s*=\\s*\'([^\']*)\';', 'm').exec(mainJs); return m ? m[1] : undefined; }
function cfgNum(name) { const m = new RegExp('^(?:var|const|let) ' + name + '\\s*=\\s*([\\d.]+);', 'm').exec(mainJs); return m ? Number(m[1]) : undefined; }
function cfgObj(name, src) {
  const m = new RegExp('^(?:var|const|let) ' + name + '\\s*=\\s*(\\{[\\s\\S]*?\\n?\\});', 'm').exec(src || mainJs);
  if (!m) return undefined;
  try { return vm.runInNewContext('(' + m[1].replace(/\/\*[\s\S]*?\*\//g, '') + ')'); } catch (e) { return undefined; }
}
function constVal(src, name) {
  const m = new RegExp('^(?:var|const|let) ' + name + '\\s*=\\s*([^;]+);', 'm').exec(src);
  if (!m) return undefined;
  try { return vm.runInNewContext('(' + m[1] + ')'); } catch (e) { return undefined; }
}
const XAPI_COMP_SLUG = cfg('XAPI_COMP_SLUG');
const XAPI_METADATA_FILE = cfg('XAPI_METADATA_FILE');
const XAPI_END_BTN = cfg('XAPI_END_BTN');
const XAPI_PASS_THRESHOLD = cfgNum('XAPI_PASS_THRESHOLD');
const mapMatch = /^var SCREEN_TO_SUBCONTENT = \{([\s\S]*?)\n\};/m.exec(mainJs);
let screenMap = null;
if (mapMatch) {
  const body = mapMatch[1].replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  screenMap = {};
  for (const m of body.matchAll(/'([A-Za-z0-9-]+)'\s*:\s*(null|\[\s*'(\d{3})'\s*,\s*(\d+)\s*\])/g)) {
    screenMap[m[1]] = m[2] === 'null' ? null : [m[3], Number(m[4])];
  }
}
const evalItems = cfgObj('XAPI_EVAL_ITEMS');
const itemWeight = cfgObj('XAPI_ITEM_WEIGHT');
const qWeight = cfgObj('XAPI_Q_WEIGHT');
const qidMap = cfgObj('QID_TO_XAPI');
const optIndex = cfgObj('XAPI_OPTION_INDEX');
const registryIds = [...registryJs.matchAll(/\{ id: '([\w-]+)',/g)].map((m) => m[1]);
/* The translation tool rewrote index.html with attributes in alphabetical order, so tags are read by attribute. */
const attr = (tag, name) => { const m = new RegExp('\\s' + name + '="([^"]*)"').exec(tag || ''); return m ? m[1] : null; };
const screenTags = [...html.matchAll(/<section\b[^>]*\bclass="screen[^"]*"[^>]*>/g)].map((m) => m[0]);
const domIds = screenTags.map((t) => attr(t, 'id'));
const sections = {};
for (const sec of html.split(/(?=<section\b[^>]*\bclass="screen)/)) { const t = /^<section\b[^>]*>/.exec(sec); if (t && attr(t[0], 'id')) sections[attr(t[0], 'id')] = sec.split(/<\/section>/)[0]; }

const catQ = [], qByKey = {};
for (const s of compMeta.subContent || []) {
  const it = s.id.replace(/\/$/, '').split('-').pop();
  for (const q of s.questions || []) {
    const k = it + '/' + q.questionId.split('/').pop();
    catQ.push(k);
    qByKey[k] = q;
  }
}
const SEP_RE = /\[,\]|\[\.\]|\[:\]/;
const norm = (x) => String(x).replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim().normalize('NFC');   /* NFC, as the reporting layer compares (_xapiNorm): the screen may order Arabic marks differently */

/* ═══════════════════ 1. Identity ═══════════════════ */
{
  const g = 'identity';
  ok(g, 'unit JSON id is the bare slug ' + UNIT_SLUG, unitMeta.id === UNIT_SLUG, unitMeta.id);
  ok(g, 'XAPI_ID_PREFIX is ' + PREFIX, XAPI_ID_PREFIX === PREFIX, XAPI_ID_PREFIX);
  ok(g, 'component JSON id = prefix + slug + "/"', compMeta.id === PREFIX + COMP + '/', compMeta.id);
  ok(g, 'component learningUnitId = unit id', compMeta.learningUnitId === unitMeta.id, compMeta.learningUnitId);
  ok(g, 'second component of the Hebrew unit: order 2, languages ["Arabic"]', compMeta.order === 2 && JSON.stringify(compMeta.languages) === '["Arabic"]', compMeta.order + ' ' + JSON.stringify(compMeta.languages));
  {
    const heUnit = path.join(HE_REPO, 'methodica-math-scale-mural-01', 'metadata', UNIT_SLUG + '_unit.json');
    ok(g, 'unit JSON is the Hebrew unit record, byte for byte (never an Arabic unit record)', !exists(heUnit) || read(heUnit) === read(path.join(compDir, 'metadata', UNIT_SLUG + '_unit.json')));
    const heComp = path.join(HE_REPO, 'methodica-math-scale-mural-01', 'metadata', 'methodica-math-scale-mural-01.json');
    if (exists(heComp)) {
      const he = readJson(heComp);
      const same = Object.keys(he).filter((k) => !['id', 'title', 'order', 'languages', 'subContent', 'createdAt', 'updatedAt'].includes(k)).every((k) => JSON.stringify(he[k]) === JSON.stringify(compMeta[k]));
      ok(g, 'component fields = the Hebrew component except id / title / order / languages', same);
      ok(g, 'same items and question types as the Hebrew component', JSON.stringify(he.subContent.map((s) => (s.questions || []).map((q) => q.questionType))) === JSON.stringify(compMeta.subContent.map((s) => (s.questions || []).map((q) => q.questionType))));
    }
  }
  const arabic = (x) => /[\u0600-\u06FF]/.test(String(x));
  ok(g, 'Arabic component title, item titles and question texts', arabic(compMeta.title) && compMeta.subContent.every((s) => arabic(s.title) && (s.questions || []).every((q) => arabic(q.questionText))));
  ok(g, 'exactly ' + ITEMS.length + ' catalogue items', (compMeta.subContent || []).length === ITEMS.length, String((compMeta.subContent || []).length));
  const got = (compMeta.subContent || []).map((s) => s.id);
  for (const it of ITEMS) ok(g, 'item ' + it + ' id = <component id><slug>-' + it + '/', got.includes(compMeta.id + COMP + '-' + it + '/'), got.join(', '));
  for (const s of compMeta.subContent || []) {
    for (const q of s.questions || []) ok(g, 'question ' + q.questionId.split('/').slice(-2).join('/') + ' is nested under its item', q.questionId.startsWith(s.id) && /\/q\d+$/.test(q.questionId), q.questionId);
  }
  ok(g, 'catalogue questions = the twelve engine-mapped questions', catQ.slice().sort().join(',') === ALL_Q.slice().sort().join(','), catQ.join(','));
  ok(g, 'item 001 (opening story) carries no question', (compMeta.subContent[0].questions || []).length === 0);
  const metaText = JSON.stringify(unitMeta) + JSON.stringify(compMeta);
  for (const it of compMeta.subContent || []) {
    for (const q of it.questions || []) {
      const key = q.questionId.split('/').slice(-2).join('/');
      ok(g, 'questionType in the Kata / xAPI enum, never true-false with כן/לא: ' + key,
         ['fill-in', 'choice', 'numeric', 'sequencing', 'matching', 'performance', 'other'].includes(q.questionType), q.questionType);
      if (q.questionType === 'choice') {
        for (const a of q.answers) ok(g, 'answer text clean (no [,] [.] [:], trimmed, single spaces): ' + a, typeof a === 'string' && !SEP_RE.test(a) && a === a.trim() && !/\s{2}/.test(a));
        for (const ca of q.correctAnswers || []) ok(g, 'correctAnswer ∈ answers: ' + ca, q.answers.includes(ca));
      }
      if (q.questionType === 'matching') {
        const src = q.answers.source, tgt = q.answers.target;
        ok(g, 'matching: clean source/target strings: ' + key, [...src, ...tgt].every((a) => typeof a === 'string' && !SEP_RE.test(a) && a === a.trim()));
        ok(g, 'matching: every correctAnswers pair is in source × target: ' + key, (q.correctAnswers || []).every((c) => src.includes(c.source) && tgt.includes(c.target)) && q.correctAnswers.length === src.length);
      }
      if (q.questionType === 'numeric') ok(g, 'numeric: answers [] and one numeric correctAnswer: ' + key, Array.isArray(q.answers) && q.answers.length === 0 && Array.isArray(q.correctAnswers) && q.correctAnswers.length === 1 && typeof q.correctAnswers[0] === 'number');
    }
  }
  ok(g, 'no 720active / 720/ar / methodica-ar- / index.html / ?q= id form survives in metadata', !/720active|\/720\/ar\/|methodica-ar-|index\.html|\?q=|scale-mural\/01\/|scale-mural-01-01/.test(metaText));
  ok(g, 'no PLACEHOLDER / TODO / "weight" / "steps" in metadata', !/PLACEHOLDER|TODO|_placeholder|"weight"|"steps"/.test(metaText));
  ok(g, 'item 009 no longer states the 20/14/2-1 scoring the code never had', !/מקסימלי 20|מעבר ב-14/.test(metaText));
  ok(g, 'unit JSON: v2.5+ field names, MOE.* codes', Array.isArray(unitMeta.targetSectors) && typeof unitMeta.targetAudience === 'string' && unitMeta.manufacturer === '310' && unitMeta.subTopic === 'MOE.MATH.G8.NUM.RATIO-PROP-SCL.SCALE' && unitMeta.learningObjective === 'MOE.MATH.G8.NUM.RATIO-PROP-SCL.SCALE.MURAL' && typeof unitMeta.createdAt === 'string');
  ok(g, 'component: cognitiveLevels[], valid componentPurpose (not assessment), boolean isAssessment, masteryLevel null',
     Array.isArray(compMeta.cognitiveLevels) && ['instruction', 'practice', 'both'].includes(compMeta.componentPurpose) && typeof compMeta.isAssessment === 'boolean' && compMeta.masteryLevel === null);
  ok(g, 'code: XAPI_UNIT_ID = unit JSON id', XAPI_UNIT_ID === unitMeta.id, XAPI_UNIT_ID);
  ok(g, 'code: XAPI_COMP_SLUG = ' + COMP, XAPI_COMP_SLUG === COMP, XAPI_COMP_SLUG);
  ok(g, 'code: XAPI_COMP_ID = XAPI_ID_PREFIX + XAPI_COMP_SLUG + "/"', /^var XAPI_COMP_ID\s*=\s*XAPI_ID_PREFIX \+ XAPI_COMP_SLUG \+ '\/';/m.test(mainJs));
  ok(g, 'code: XAPI_METADATA_FILE = metadata/<slug>.json and resolves (exact case)', XAPI_METADATA_FILE === 'metadata/' + COMP + '.json' && resolveExact(path.join(compDir, XAPI_METADATA_FILE)), XAPI_METADATA_FILE);
  ok(g, 'no placeholder / old reporting / SCORM in code (comments excluded)',
     ![partJs, registryJs, ...Object.values(unitJs)].some((t) => t && /PLACEHOLDER|xapiCompleteUnit|XAPI_WEIGHTS|SCORM|suspend_data|LMSInitialize/.test(stripComments(t))));
}

/* ═══════════════════ 2. Wiring ═══════════════════ */
{
  const g = 'wiring';
  const scripts = [...html.matchAll(/<script\b[^>]*?\bsrc="([^"]+)"/g)].map((m) => m[1]).filter((s) => !/^https?:/.test(s));
  const bare = scripts.map((s) => s.replace(/\?.*$/, ''));
  const head = ['unit-js/10-identity.js', 'unit-js/20-xapi.js', 'unit-js/40-ledger.js', 'unit-js/50-loader.js', 'registry.js'];
  const tail = ['js/main.js', 'unit-js/90-boot.js'];
  ok(g, 'local script tags: shared layer + registry first, main.js then 90-boot last', bare.slice(0, 5).join('|') === head.join('|') && bare.slice(-2).join('|') === tail.join('|'), bare.join(' | '));
  ok(g, 'every js/*.js is loaded exactly once (no stray, no missing)', jsFiles.every((f) => bare.filter((s) => s === 'js/' + f).length === 1) && bare.filter((s) => s.startsWith('js/')).length === jsFiles.length, bare.join(', '));
  ok(g, 'no ../ in any local reference in index.html', !/(?:src|href)="\.\.\//.test(html));
  ok(g, '?v= on every local script src, the same on every shared file', scripts.every((s) => /\?v=\d+$/.test(s)) && new Set(scripts.filter((s) => s.startsWith('unit-js/')).map((s) => s.replace(/^.*\?v=/, ''))).size === 1, scripts.join(', '));
  const local = [...html.matchAll(/<link\b[^>]*href="([^"]+)"[^>]*>/g)].filter((m) => /stylesheet/.test(m[0])).map((m) => m[1]).filter((l) => !/^https?:/.test(l));
  ok(g, '?v= on the two local stylesheets (css/style.css, css/style-ar.css)', local.length === 2 && local[0] === 'css/style.css?v=1' && local[1] === 'css/style-ar.css?v=1', local.join(', '));
  ok(g, 'lang="ar" dir="rtl"', /<html\b(?=[^>]*\blang="ar")(?=[^>]*\bdir="rtl")[^>]*>/.test(html));
  const media = [...html.replace(/<!--[\s\S]*?-->/g, '').matchAll(/(?:src|href|poster)="([^"]+)"/g)].map((m) => m[1]).filter((u) => !/^(https?:|data:|#|javascript:)/.test(u)).map((u) => decodeURI(u.replace(/[?#].*$/, '')));
  const missing = media.filter((u) => !resolveExact(path.join(compDir, u)));
  ok(g, 'every local reference in index.html exists (exact case): ' + media.length, missing.length === 0, missing.join(', '));
  ok(g, 'every media / applet reference lives under assets/', media.filter((u) => /\.(png|jpe?g|svg|gif|mp3|mp4|webm)$|applet/i.test(u)).every((u) => u.startsWith('assets/')));
  const cssMissing = [];
  for (const f of ['style.css', 'style-ar.css']) for (const m of read(path.join(compDir, 'css', f)).matchAll(/url\(\s*['"]?([^'")?#]+)/g)) { const u = m[1]; if (/^(https?:|data:)/.test(u)) continue; if (!resolveExact(path.join(compDir, 'css', u))) cssMissing.push(f + ' → ' + u); }
  ok(g, 'every url() in css/*.css resolves relative to css/ (../assets/img/…)', cssMissing.length === 0, cssMissing.slice(0, 5).join(', '));
  ok(g, 'the four videos are the Arabic _AR files; no Hebrew media left in assets/', fs.readdirSync(path.join(compDir, 'assets', 'video')).sort().join(',') === 'Video1_AR.mp4,Video2_AR.mp4,Video3_AR.mp4,Video4_AR.mp4' && !exists(path.join(compDir, 'assets', 'audio', 'Q4_audio.mp3')));
  const ext = [...html.matchAll(/<(?:script|link)[^>]+(?:src|href)="(https?:[^"]+)"/g)].map((m) => m[1]);
  ok(g, 'the only external reference in the page is Google Fonts', ext.every((u) => /^https:\/\/fonts\.(googleapis|gstatic)\.com\//.test(u)), ext.join(', '));
  const applet = read(path.join(compDir, 'assets', 'applet', 'color_lab.html'));
  const appletExt = [...applet.matchAll(/<script[^>]+src="(https?:[^"]+)"/g)].map((m) => m[1]);
  ok(g, 'the applet\'s CDN scripts are pinned to exact versions', appletExt.length === 3 && appletExt.every((u) => /@\d+\.\d+\.\d+\//.test(u)), appletExt.join(', '));
  const vidMap = {}; for (const id of Object.keys(sections)) { const v = /<video[^>]*data-xapi-report="(\d{3})"/.exec(sections[id]); if (v) vidMap[id] = v[1]; }
  ok(g, 'every <video> carries data-xapi-report = its screen\'s item', JSON.stringify(vidMap) === JSON.stringify(VIDEO_ITEMS) && (html.replace(/<!--[\s\S]*?-->/g, '').match(/<video\b/g) || []).length === 4, JSON.stringify(vidMap));
  ok(g, 'no `loop` video is reported', !/<video[^>]*data-xapi-report[^>]*\bloop\b/.test(html));
  { const b = (/<button\b[^>]*\bid="slide18-done-btn"[^>]*>/.exec(sections['screen-slide18'] || '') || [''])[0];
    ok(g, '#' + END_BTN + ' is the finish button on slide18 and calls openScorePopup()', attr(b, 'class') === 'slide18-done-btn' && attr(b, 'onclick') === 'openScorePopup()', b); }
  ok(g, 'the ' + N_SCREENS + ' sections are in the agreed order, data-screen 0…16, slide1 the one active',
     domIds.join(',') === SCREENS.join(',') && /\bactive\b/.test(attr(screenTags[0], 'class')) && screenTags.filter((t) => /\bactive\b/.test(attr(t, 'class'))).length === 1 &&
     screenTags.every((t, i) => Number(attr(t, 'data-screen')) === i), domIds.join(','));
  ok(g, 'the dev "Help Popup Adjuster" is gone', !/popup-adjuster|paOpen/.test(html));
  if (IS_PACKAGE) {
    ok(g, 'package has no index_dev.html / _test / *.md', !exists(path.join(compDir, 'index_dev.html')) && !exists(path.join(compDir, '_test')) && !fs.readdirSync(compDir).some((f) => /\.md$/i.test(f)));
  } else {
    const r = exists(path.join(REPO_ROOT, 'index.html')) ? read(path.join(REPO_ROOT, 'index.html')) : '';
    ok(g, 'root index.html (repo only) names the component FILE and carries the query', r.includes("'./" + COMP + "/index.html' + window.location.search"));
    ok(g, 'no metadata/ / unit-js/ / js/ / css/ / img/ / audio/ / video/ / applet/ / config.js left at the repo root',
       ['metadata', 'unit-js', 'js', 'css', 'assets', 'img', 'audio', 'video', 'applet', 'config.js', 'index_dev.html'].every((f) => !exists(path.join(REPO_ROOT, f))));
    ok(g, 'index_dev.html (dev only) iframes the component page beside it', /src="index\.html"/.test(read(path.join(compDir, 'index_dev.html'))));
  }
}

/* ═══════════════════ 3. The shared layer ═══════════════════ */
{
  const g = 'layer';
  for (const f of unitFiles) ok(g, 'unit-js/' + f + ' exists', !!unitJs[f]);
  ok(g, 'RESUME_ENABLED is false', RESUME_ENABLED === false, String(RESUME_ENABLED));
  const loader = unitJs['50-loader.js'] || '';
  ok(g, 'loader: the no-resume build is -i, inside the XAPI_USING_G regex class', /: 'xapi-720-i\.js'\);/.test(loader) && /xapi-720-\[[a-z]*i[a-z]*\]/.test(loader));
  ok(g, 'loader: ID-mismatch check + xapiWireVideos + landing item via xapiLandingScreen()', /_metaId !== XAPI_COMP_ID/.test(loader) && /xapiWireVideos\(\)/.test(loader) && loader.includes("xapiOnScreen(typeof xapiLandingScreen === 'function' ? xapiLandingScreen() : currentScreen)"));
  const xapi = unitJs['20-xapi.js'] || '';
  ok(g, '20-xapi.js: xapiAnswered takes a fraction and records XAPI_Q_SCALED before the try', /XAPI_Q_SCALED\[item \+ '\/' \+ qKey\] = s;\s*\n\s*if \(!window\.XAPI_USING_G/.test(xapi));
  ok(g, '20-xapi.js: matching emits only the placed pairs, ranked by correctAnswers (MOE QA 2026-10-25)', /Only the pairs the learner PLACED are\s*\n\s*emitted/.test(xapi) && /p\.rank = j/.test(xapi));
  ok(g, '20-xapi.js is time-model\'s file, byte for byte', (() => {
    const v = path.join(REPO_ROOT, '..', '..', '..', 'methodica-math-time-model', 'git-repo', 'methodica-math-time-model', 'methodica-math-time-model-01', 'unit-js', '20-xapi.js');
    return !exists(v) || read(v) === xapi;
  })());
  ok(g, '90-boot.js: bootXAPI() only', /\(function boot\(\) \{\s*\n\s*bootXAPI\(\);\s*\n\}\)\(\);/.test(unitJs['90-boot.js'] || ''));
  const decl = (src) => new Set([...src.matchAll(/^(?:function\s+([\w$]+)|(?:var|let|const)\s+([\w$]+))/gm)].map((m) => m[1] || m[2]));
  const partNames = new Set([...decl(partJs), ...decl(registryJs)]);
  for (const f of unitFiles) {
    const both = [...decl(unitJs[f] || '')].filter((n) => partNames.has(n));
    ok(g, 'no top-level name declared in both the part and ' + f, both.length === 0, both.join(', '));
  }
  ok(g, 'main.js: goTo calls xapiOnScreen(<section id>) after the screen is activated and its hooks ran',
     /screens\[currentScreen\]\.classList\.add\('active'\);\s*\n\s*onEnterScreen\(screens\[currentScreen\]\);\s*\n\s*updateNavButtons\(\);\s*\n\s*try \{ if \(typeof xapiOnScreen === 'function'\) xapiOnScreen\(screens\[currentScreen\]\.id\); \} catch \(e\) \{\}/.test(mainJs));
}

/* ═══════════════════ 4. Config and call sites ═══════════════════ */
{
  const g = 'config';
  const code = stripComments(partJs);
  ok(g, 'SCREEN_TO_SUBCONTENT parses', !!screenMap);
  if (screenMap) {
    const gotMap = {};
    for (const k of Object.keys(screenMap)) gotMap[k] = screenMap[k] ? screenMap[k][0] : null;
    ok(g, 'SCREEN_TO_SUBCONTENT = the agreed screen → item map (every screen in an item)', JSON.stringify(gotMap) === JSON.stringify(WANT_MAP), JSON.stringify(gotMap));
    ok(g, 'registry ids = the DOM section ids = the screen-map keys', registryIds.join(',') === domIds.join(',') && Object.keys(screenMap).join(',') === domIds.join(','), registryIds.join(','));
    const regItems = [...registryJs.matchAll(/\{ id: '([\w-]+)',[^}]*item: '(\d{3})'/g)].every((m) => WANT_MAP[m[1]] === m[2]);
    ok(g, 'registry items = the screen map', regItems);
  }
  ok(g, 'QID_TO_XAPI = the twelve engine questions → catalogue keys', JSON.stringify(qidMap) === JSON.stringify(WANT_QID_TO_XAPI), JSON.stringify(qidMap));
  ok(g, 'XAPI_EVAL_ITEMS = items 002–009 (001 carries no question)', !!evalItems && Object.keys(evalItems).join(',') === EVAL_ITEMS.join(','));
  ok(g, 'XAPI_ITEM_WEIGHT = calculateScore\'s 10 per question (003 = 0, Σ 100)', JSON.stringify(itemWeight) === JSON.stringify(WEIGHTS) && Object.values(itemWeight).reduce((a, b) => a + b, 0) === 100, JSON.stringify(itemWeight));
  ok(g, 'XAPI_Q_WEIGHT keys = the catalogue questions, 1 each', !!qWeight && Object.keys(qWeight).sort().join(',') === ALL_Q.slice().sort().join(',') && Object.values(qWeight).every((v) => v === 1));
  ok(g, 'XAPI_PASS_THRESHOLD = ' + PASS + ' = the engine\'s pass mark (score >= 70), XAPI_END_BTN = ' + END_BTN, XAPI_PASS_THRESHOLD === PASS && XAPI_END_BTN === END_BTN);
  ok(g, 'calculateScore still gives 10 per choice/numeric question and the drag-drop data-q-score',
     /if \(el\.dataset\[q\.attr\] === 'correct'\) score \+= 10;/.test(js['slide18.js']) && /score \+= parseFloat\(el\.dataset\.qScore\) \|\| 0;/.test(js['slide18.js']));
  /* the call sites, one per check */
  for (const q of Object.keys(CHOICE)) {
    const want = (CHOICE[q].opt === 'q4-option' || q === 'q4b') ? q + 'State.selected' : '\\[' + q + 'State.selected\\]';
    ok(g, 'one xapiReportChoice site for ' + q + ' at the end of submit' + q.toUpperCase().replace('Q', 'Q'),
       (code.match(new RegExp("xapiReportChoice\\('" + q + "'", 'g')) || []).length === 1 &&
       new RegExp("xapiReportChoice\\('" + q + "', screen, " + want + '\\);\\s*\\n\\s*updateNavButtons\\(\\);\\s*\\n\\}').test(stripComments(js[CHOICE[q].file])));
  }
  for (const q of Object.keys(DRAG)) {
    ok(g, 'one xapiReportDrops site for ' + q + ', right after the verdict (before the reveal overwrites the drops)',
       (code.match(new RegExp("xapiReportDrops\\('" + q + "'", 'g')) || []).length === 1 &&
       new RegExp('var isCorrect = [\\s\\S]{0,200}?\\);\\s*\\n\\s*xapiReportDrops\\(\'' + q + '\', ' + q + 'State\\.drops, ' + DRAG[q].konst + ', ' + q + 'State\\.attempts >= 2\\);').test(js[DRAG[q].file]));
  }
  ok(g, 'one numeric site for q4c with the typed text captured before tryagain clears it',
     /var q4cRaw = input\.value\.trim\(\);/.test(js['numeric4c.js']) && /xapiReport\('q4c', screen\.dataset\.q4cState === 'correct', screen\.dataset\.qDone === 'true', \{ type: 'numeric', value: q4cRaw \}\);/.test(js['numeric4c.js']));
  ok(g, 'slide5 כן/לא: reported on the first choice only', /if \(!row\.dataset\.s5YnAnswer\) xapiReportYN\(rowId, value\);/.test(js['slide5.js']));
  ok(g, 'a hint (requested) on each of the ten help toggles, only in the opening branch', (code.match(/xapiHint\('/g) || []).length === 10 + 0 &&
     ['q1', 'q2', 'q3', 'q4', 'q4b', 'q4c', 'q5', 'q6', 'q7', 'q7b'].every((q) => new RegExp("=== '(true|open)'\\) xapiHint\\('" + q + "'\\);").test(code)));
  ok(g, 'only xapiReport calls xapiAnswered', (code.match(/xapiAnswered\(/g) || []).length === 1);
  ok(g, 'exactly one xapiEndComponent call, inside finishComponent, with partResult()', (code.match(/xapiEndComponent\(/g) || []).length === 1 && /function finishComponent\(btn\) \{[\s\S]*?xapiEndComponent\(partResult\(\), btn\)/.test(mainJs));
  ok(g, 'openScorePopup shows the score and calls finishComponent(#' + END_BTN + ') once; nowhere else',
     (code.match(/finishComponent\(/g) || []).length === 2 && /overlay\.style\.display = 'flex';\s*\n\s*finishComponent\(document\.getElementById\('slide18-done-btn'\)\);\s*\n\}/.test(stripComments(js['slide18.js'])));
  ok(g, 'no SCORE postMessage, window.close / window.open / CLOSE_LEARNING_MODULE / alert anywhere (rule 2026-10-14)',
     ![code, stripComments(registryJs), ...Object.values(unitJs).map(stripComments)].some((t) => /type:\s*'SCORE'|window\.close\(|window\.open\(|CLOSE_LEARNING_MODULE|\balert\(|top\.close|parent\.close/.test(t)));

  /* On-screen = reported (MOE tester 2026-10-19): the options the learner can pick, mapped by data-value through
     XAPI_OPTION_INDEX, are the catalogue answers; the engine's correct values are the catalogue correctAnswers. */
  for (const q of Object.keys(CHOICE)) {
    const c = CHOICE[q], key = WANT_QID_TO_XAPI[q].join('/'), meta = qByKey[key], sec = sections[c.scr] || '';
    const vals = [...sec.matchAll(new RegExp('<div\\b[^>]*\\bclass="' + c.opt + '"[^>]*>', 'g'))].map((m) => Number(attr(m[0], 'data-value')));
    const idx = (v) => (optIndex && optIndex[q]) ? optIndex[q][v] : v - 1;
    ok(g, q + ': ' + vals.length + ' options on screen, each mapping to a distinct metadata answer', vals.length === meta.answers.length && new Set(vals.map(idx)).size === vals.length && vals.every((v) => meta.answers[idx(v)] != null), JSON.stringify(vals));
    if (c.index) ok(g, q + ': XAPI_OPTION_INDEX = the agreed data-value → answers map', JSON.stringify(optIndex[q]) === JSON.stringify(c.index), JSON.stringify(optIndex && optIndex[q]));
    const k = constVal(js[c.file], c.konst);
    const right = (Array.isArray(k) ? k : [k]).map((v) => meta.answers[idx(v)]);
    ok(g, 'the engine\'s ' + c.konst + ' = the catalogue correctAnswers of ' + key, right.slice().sort().join('|') === meta.correctAnswers.slice().sort().join('|'), JSON.stringify(right));
    if (q !== 'q4' && q !== 'q4b') {
      const texts = vals.map((v) => norm(((new RegExp('<div\\b[^>]*\\bclass="' + c.opt + '"[^>]*\\bdata-value="' + v + '"[^>]*>[\\s\\S]*?<span\\b[^>]*\\bclass="[\\w-]+(?:text|label)"[^>]*>([\\s\\S]*?)</span>')).exec(sec) || [])[1] || '').replace(/ ?: ?/g, ':'));
      ok(g, q + ': visible option texts = the metadata answers (up to the spacing around ":")', texts.every((t, i) => t === meta.answers[idx(vals[i])].normalize('NFC').replace(/ ?: ?/g, ':')), JSON.stringify(texts));
    }
  }
  {
    const lbl = [...(sections['screen-q4b'] || '').matchAll(/<div\b[^>]*\bclass="q4b-option"[^>]*\bdata-value="(\d)"[^>]*>[\s\S]*?<span class="q4b-opt-label">(.)<\/span>/g)].map((m) => [Number(m[1]), m[2]]);
    ok(g, 'q4b: each on-screen letter is the letter of the metadata answer it reports', lbl.length === 3 && lbl.every(([v, l]) => qByKey['006/q2'].answers[optIndex.q4b[v]].startsWith(l + '.')), JSON.stringify(lbl));
  }
  for (const q of Object.keys(DRAG)) {
    const key = WANT_QID_TO_XAPI[q].join('/'), meta = qByKey[key];
    const k = constVal(js[DRAG[q].file], DRAG[q].konst) || {};
    ok(g, 'the engine\'s ' + DRAG[q].konst + ' (blank n → word) = correctAnswers (source n → target) of ' + key,
       Object.keys(k).length === meta.answers.source.length && Object.keys(k).every((b) => meta.correctAnswers.some((c) => c.source === meta.answers.source[Number(b) - 1] && c.target === k[b])), JSON.stringify(k));
    const pre = q === 'q1' ? 'q1' : q;
    const words = [...(sections['screen-' + q] || '').matchAll(new RegExp('class="' + pre + '-chip"[^>]*data-word="([^"]+)"', 'g'))].map((m) => m[1]);
    ok(g, 'the word bank of ' + q + ' = the metadata targets', words.slice().sort().join('|') === meta.answers.target.slice().sort().join('|'), JSON.stringify(words));
  }
  ok(g, 'the engine\'s Q4C_CORRECT = the catalogue correctAnswer of 006/q3', constVal(js['numeric4c.js'], 'Q4C_CORRECT') === qByKey['006/q3'].correctAnswers[0]);
  {
    const rows = [...(sections['screen-slide5'] || '').matchAll(/data-s5-yn="(b\d)" data-s5-yn-correct="(yes|no)"/g)].map((m) => [m[1], m[2] === 'yes' ? 'نعم' : 'لا']);
    ok(g, 'slide5 data-s5-yn-correct = the catalogue correctAnswers of 003/q1, 003/q2 (answers نعم / لا)', JSON.stringify(qByKey['003/q1'].answers) === '["نعم","لا"]' && rows.length === 2 && rows[0][0] === 'b1' && rows[0][1] === qByKey['003/q1'].correctAnswers[0] && rows[1][1] === qByKey['003/q2'].correctAnswers[0], JSON.stringify(rows));
  }
}

/* ═══════════════════ 5. Runtime — jsdom ═══════════════════ */
(async function runtimeAndSummary() {
  let JSDOM = null, VirtualConsole = null;
  try { ({ JSDOM, VirtualConsole } = require('jsdom')); } catch (e) { /* reported below */ }
  const g = 'runtime';
  if (!JSDOM) {
    skipped++;
    console.log('  runtime: SKIPPED - jsdom not resolvable (see the header for NODE_PATH).');
  } else {
    const pageErrors = [];
    const vc = new VirtualConsole();
    if (process.env.VERBOSE) vc.sendTo(console, { omitJSDOMErrors: true });
    vc.on('jsdomError', (e) => pageErrors.push(e.message || String(e)));
    let dom;
    try {
      dom = new JSDOM(html.replace(/<script\b[^>]*\bsrc="(?!https?:)[^"]*"[^>]*><\/script>/g, ''), {
        url: 'http://localhost:5555/' + COMP + '/index.html', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
        beforeParse(w) {
          w.fetch = () => new Promise(() => {});
          w.requestAnimationFrame = (cb) => { cb(0); return 0; };
          w.cancelAnimationFrame = () => {};
          w.scrollTo = () => {};
          w.Element.prototype.scrollIntoView = () => {};
          w.HTMLMediaElement.prototype.play = function () { return Promise.resolve(); };
          w.HTMLMediaElement.prototype.pause = function () {};
          w.HTMLMediaElement.prototype.load = function () {};
          w.Audio = function () { return { play: () => Promise.resolve(), pause: () => {} }; };
          w.__closed = 0; w.__alerts = 0; w.__posts = [];
          w.alert = () => { w.__alerts++; };
          w.open = () => null;
          w.close = () => { w.__closed++; };
          w.addEventListener('error', (e) => pageErrors.push(e.message || String(e.error)));
        },
      });
    } catch (e) { ok(g, 'index.html parses in jsdom', false, e.message); }

    if (dom) try {
      const w = dom.window;
      const srcs = [...html.matchAll(/<script\b[^>]*?\bsrc="([^"]+)"/g)].map((m) => m[1]).filter((s) => !/^https?:/.test(s)).map((s) => s.replace(/\?.*$/, ''));
      const before = pageErrors.length;
      const inject = (code) => { const el = w.document.createElement('script'); el.textContent = code; w.document.body.appendChild(el); };
      for (const s of srcs) inject(read(path.join(compDir, s)));
      const loadErrors = pageErrors.splice(before).filter((m) => !/Not implemented/.test(m));
      ok(g, 'every local script executes without throwing', loadErrors.length === 0, loadErrors.join(' | '));
      const run = (expr) => { inject('window.__V = ' + expr + ';'); return w.__V; };
      const logOf = () => JSON.parse(run('JSON.stringify(window.__log)'));
      const since = (n0) => logOf().slice(n0);
      const goTo = (n) => run('(function(){ goTo(' + n + '); return document.querySelector(".screen.active").id; })()');
      const call = (src) => run('(function(){ ' + src + '; return 1; })()');

      ok(g, 'one .active screen (slide1), xapiLandingScreen() === "screen-slide1", 17 screens', w.document.querySelectorAll('.screen.active').length === 1 && run('xapiLandingScreen()') === 'screen-slide1' && w.document.querySelectorAll('.screen').length === N_SCREENS);

      /* Regression gate: off-platform no library loads — nothing sent, nothing thrown. */
      ok(g, 'sendStatement720 is absent off-platform', run('typeof sendStatement720') === 'undefined');
      ok(g, 'a sweep over every screen throws nothing without the library',
         run('(function(){ try { for (var i = 1; i < ' + N_SCREENS + '; i++) goTo(i); goTo(0); return "ok"; } catch (e) { return e.message; } })()') === 'ok');
      ok(g, 'xapiAnswered without the library still records the fraction', run("(function(){ xapiAnswered('004','q1',1,true,'x'); return XAPI_Q_SCALED['004/q1'] + '/' + XAPI_Q_RESULTS['004/q1']; })()") === '1/true');
      call("delete XAPI_Q_SCALED['004/q1']; delete XAPI_Q_RESULTS['004/q1']");

      /* Statement flow with an inline recorder in place of the library. */
      call('window.__log = []; window.XAPI_USING_G = true; window.METADATA = ' + JSON.stringify(compMeta) + ';' +
          ' window.xapiItemAnswered = {}; _ledger = {}; xapiCurrentItem = null;' +
          ' window.sendStatement720 = function (v, t, r, o) {' +
          '   var st = String(v).split(".")[0];' +
          '   if (st === "answered" && o && o.parentId) window.xapiItemAnswered[o.parentId] = true;' +
          '   if (st === "completed" && o && o.expectsAnswer && !window.xapiItemAnswered[o.objectId]) return;' +
          '   window.__log.push({ v: v, t: t, id: (o && (o.objectId || o.questionId)) || null, parent: (o && o.parentId) || null, r: r || null, o: o || null }); }');
      call('window.__warns = []; var _w = console.warn; console.warn = function () { window.__warns.push(Array.prototype.slice.call(arguments).join(" ")); _w.apply(console, arguments); }');
      call('var _pm = window.parent.postMessage; window.parent.postMessage = function (m) { window.__posts.push(m); }');
      const itemId = (n) => compMeta.id + COMP + '-' + n + '/';
      const qId = (k) => itemId(k.slice(0, 3)) + k.slice(4);
      const A = (k, i) => qByKey[k].answers[i];
      const S = (k, i) => qByKey[k].answers.source[i];
      const near = (a, b) => Math.abs(a - b) < 1e-9;
      let n0, t;

      run('xapiOnScreen(xapiLandingScreen())');
      t = logOf();
      ok(g, 'landing: initialized 001 (not an evaluation item)', t.length === 1 && t[0].v === 'initialized' && t[0].id === itemId('001') && t[0].o.isEvaluationItem === false, JSON.stringify(t));

      /* slide1 video: play → played {001, time}; pause at readyState 0 → nothing. */
      n0 = logOf().length;
      run('xapiWireVideos()');
      call('var v = document.getElementById("slide1-video"); v.dispatchEvent(new Event("play")); v.dispatchEvent(new Event("pause"))');
      t = since(n0);
      ok(g, 'slide1 video: one played {objectId 001, time}, no paused at readyState 0', t.length === 1 && t[0].v === 'played' && t[0].id === itemId('001') && typeof t[0].o.time === 'number', JSON.stringify(t));

      /* שאלה 1 (q1, 002/q1 matching): third blank wrong → answered 2/3; then all right → answered.last 1. Help opened twice → one requested. */
      n0 = logOf().length;
      goTo(1); goTo(2); goTo(3);
      call("toggleQ1Help(); toggleQ1Help(); toggleQ1Help()");
      call("q1PlaceWord('5',1); q1PlaceWord('الأزرق',2); q1PlaceWord('الدافئ والفاتح',3); submitQ1()");
      call("resetQ1ForRetry(); q1PlaceWord('5',1); q1PlaceWord('الأزرق',2); q1PlaceWord('البارد والغامق',3); submitQ1()");
      t = since(n0);
      const k1 = '002/q1';
      ok(g, 'שאלה 1: completed 001 (no result), init 002, one requested, answered 2/3 (wrong pair last), answered.last 1 = the canonical pairs',
         t.length === 5 && t[0].v === 'completed' && t[0].id === itemId('001') && t[0].r === null && t[1].v === 'initialized' && t[1].id === itemId('002') && t[1].o.isEvaluationItem === true &&
         t[2].v === 'requested.1' && t[2].id === qId(k1) &&
         t[3].v === 'answered' && t[3].id === qId(k1) && t[3].parent === itemId('002') && near(t[3].r.score.scaled, 2 / 3) && t[3].r.success === false &&
         t[3].r.response === S(k1, 0) + '[.]5[,]' + S(k1, 1) + '[.]الأزرق[,]' + S(k1, 2) + '[.]الدافئ والفاتح' &&
         t[4].v === 'answered.last' && t[4].r.score.scaled === 1 && t[4].r.response === qByKey[k1].correctAnswers.map((c) => c.source + '[.]' + c.target).join('[,]'), JSON.stringify(t));

      /* slide5 (003): b1 "כן" (right) then "לא" (not reported), b2 "כן" (wrong). */
      n0 = logOf().length;
      goTo(4); call("selectS5YN('b1','yes'); selectS5YN('b1','no'); selectS5YN('b2','yes')");
      t = since(n0);
      ok(g, 'slide5: completed 002 {1}, init 003, answered.last 1 "نعم" (003/q1) once, answered.last 0 "نعم" (003/q2)',
         t.length === 4 && t[0].id === itemId('002') && t[0].r.score.scaled === 1 && t[1].id === itemId('003') && t[2].v === 'answered.last' && t[2].id === qId('003/q1') && t[2].r.score.scaled === 1 && t[2].r.response === 'نعم' &&
         t[3].v === 'answered.last' && t[3].id === qId('003/q2') && t[3].r.score.scaled === 0 && t[3].r.response === 'نعم', JSON.stringify(t));

      /* שאלה 2 (004): option 1 wrong, retry, option 3 right. */
      n0 = logOf().length;
      goTo(5); call('selectQ2Option(1); submitQ2(); retryQ2(); selectQ2Option(3); submitQ2()');
      t = since(n0);
      ok(g, 'שאלה 2: completed 003 {0.5}, init 004, answered 0 = answers[0], answered.last 1 = answers[2]',
         t.length === 4 && t[0].id === itemId('003') && near(t[0].r.score.scaled, 0.5) && t[1].id === itemId('004') && t[2].v === 'answered' && t[2].r.score.scaled === 0 && t[2].r.response === A('004/q1', 0) &&
         t[3].v === 'answered.last' && t[3].r.score.scaled === 1 && t[3].r.response === A('004/q1', 2), JSON.stringify(t));

      /* שאלה 3 (005): option 4 right first. */
      n0 = logOf().length;
      goTo(6); call('selectQ3Option(4); submitQ3()');
      t = since(n0);
      ok(g, 'שאלה 3: completed 004 {1}, init 005, answered.last 1 "1:1"', t.length === 3 && t[0].id === itemId('004') && t[0].r.score.scaled === 1 && t[1].id === itemId('005') && t[2].v === 'answered.last' && t[2].r.response === '1:1', JSON.stringify(t));

      /* שאלה 4א (006/q1): 4 then 2 → right first; שאלה 4ב (006/q2): data-value 1+2 (ג, ב) wrong, then 2+3 (ב, א); שאלה 4ג: 20 then 24. */
      n0 = logOf().length;
      goTo(7); call('selectQ4Option(4); selectQ4Option(2); submitQ4()');
      goTo(8); call('selectQ4bOption(1); selectQ4bOption(2); submitQ4b(); retryQ4b(); selectQ4bOption(3); selectQ4bOption(2); submitQ4b()');
      goTo(9); call('var i = document.querySelector("#screen-q4c .q4c-input"); i.value = "20"; submitQ4c(); retryQ4c(); i.value = "24"; submitQ4c()');
      t = since(n0);
      const q4b = qByKey['006/q2'];
      ok(g, 'שאלה 4א/ב/ג: completed 005 {1}, init 006, 4א answered.last 1 = correctAnswers in answers order, 4ב answered 0 "ב[,]ג" then answered.last 1 "א[,]ב", 4ג answered 0 "20", answered.last 1 "24"',
         t.length === 7 && t[0].id === itemId('005') && t[0].r.score.scaled === 1 && t[1].id === itemId('006') &&
         t[2].v === 'answered.last' && t[2].id === qId('006/q1') && t[2].r.response === qByKey['006/q1'].correctAnswers.join('[,]') &&
         t[3].v === 'answered' && t[3].id === qId('006/q2') && t[3].r.response === q4b.answers[1] + '[,]' + q4b.answers[2] &&
         t[4].v === 'answered.last' && t[4].r.score.scaled === 1 && t[4].r.response === q4b.correctAnswers.join('[,]') &&
         t[5].v === 'answered' && t[5].id === qId('006/q3') && t[5].r.response === '20' && t[6].v === 'answered.last' && t[6].r.response === '24', JSON.stringify(t));

      /* שאלה 5 (007) wrong twice: 1 then 3. */
      n0 = logOf().length;
      goTo(10); goTo(11); call('selectQ5Option(1); submitQ5(); retryQ5(); selectQ5Option(3); submitQ5()');
      t = since(n0);
      ok(g, 'שאלה 5 wrong twice: completed 006 {1}, init 007, answered 0, answered.last 0 (success false) = answers[2]',
         t.length === 4 && t[0].id === itemId('006') && t[0].r.score.scaled === 1 && t[1].id === itemId('007') && t[2].v === 'answered' && t[3].v === 'answered.last' && t[3].r.score.scaled === 0 && t[3].r.success === false && t[3].r.response === A('007/q1', 2), JSON.stringify(t));

      /* שאלה 6 (008): 3 right first. */
      n0 = logOf().length;
      goTo(12); goTo(13); call('selectQ6Option(3); submitQ6()');
      t = since(n0);
      ok(g, 'שאלה 6: completed 007 {0}, init 008, answered.last 1 = answers[2] ("3 أمتار")', t.length === 3 && t[0].id === itemId('007') && t[0].r.score.scaled === 0 && t[1].id === itemId('008') && t[2].v === 'answered.last' && t[2].r.response === A('008/q1', 2), JSON.stringify(t));

      /* שאלה 7א (009/q1): 5/30 (one right), retry, 28/6 (one right) → answered.last 0.5; שאלה 7ב right first. */
      n0 = logOf().length;
      goTo(14); call("q7PlaceWord('5',1); q7PlaceWord('30',2); submitQ7(); resetQ7ForRetry(); q7PlaceWord('28',1); q7PlaceWord('6',2); submitQ7()");
      goTo(15); call("q7bPlaceWord('18',1); q7bPlaceWord('12',2); submitQ7b()");
      t = since(n0);
      const k7 = '009/q1';
      ok(g, 'שאלה 7א/ב: completed 008 {1}, init 009, answered 0.5, answered.last 0.5 with the right pair first, 7ב answered.last 1 = canonical',
         t.length === 5 && t[0].id === itemId('008') && t[1].id === itemId('009') &&
         t[2].v === 'answered' && near(t[2].r.score.scaled, 0.5) && t[2].r.response === S(k7, 0) + '[.]5[,]' + S(k7, 1) + '[.]30' &&
         t[3].v === 'answered.last' && near(t[3].r.score.scaled, 0.5) && t[3].r.success === false && t[3].r.response === S(k7, 1) + '[.]6[,]' + S(k7, 0) + '[.]28' &&
         t[4].v === 'answered.last' && t[4].id === qId('009/q2') && t[4].r.response === qByKey['009/q2'].correctAnswers.map((c) => c.source + '[.]' + c.target).join('[,]'), JSON.stringify(t));
      ok(g, 'nothing completed the component before "סיימתי"', !logOf().some((s) => s.t === 'onlinelesson'));

      /* "סיימתי" (slide18): 009 closes, then exactly one component completed = calculateScore() / 100 = 0.85. */
      n0 = logOf().length;
      goTo(16);
      call('document.getElementById("' + END_BTN + '").click()');
      const log = logOf();
      t = log.slice(n0);
      const shown = run('document.getElementById("score-popup-value").textContent');
      ok(g, 'finish: completed 009 {0.75} then exactly one component completed, scaled 0.85 = the score shown (85), success true',
         t.length === 2 && t[0].v === 'completed' && t[0].id === itemId('009') && near(t[0].r.score.scaled, 0.75) && t[1].t === 'onlinelesson' && !t[1].o &&
         near(t[1].r.score.scaled, 0.85) && t[1].r.success === true && shown === '85' && run('calculateScore()') === 85, JSON.stringify(t) + ' shown ' + shown);
      ok(g, 'finish: the popup is shown, the button disabled + aria-disabled; no close, no alert, no postMessage',
         run('document.getElementById("score-popup-overlay").style.display') === 'flex' && run('document.getElementById("' + END_BTN + '").disabled') === true &&
         run('document.getElementById("' + END_BTN + '").getAttribute("aria-disabled")') === 'true' && w.__closed === 0 && w.__alerts === 0 && w.__posts.length === 0, JSON.stringify(w.__posts));
      call('closeScorePopup()');
      ok(g, 'closeScorePopup hides the popup and sends nothing', run('document.getElementById("score-popup-overlay").style.display') === 'none' && logOf().length === log.length);
      goTo(15); goTo(16);
      call('openScorePopup()');
      ok(g, 'a second finish sends nothing (ledger) and the button stays disabled', logOf().filter((s) => s.t === 'onlinelesson').length === 1 && run('document.getElementById("' + END_BTN + '").disabled') === true);
      ok(g, 'one completed per item, each item opened at least once', ITEMS.every((n) => logOf().filter((s) => s.v === 'completed' && s.id === itemId(n)).length === 1 && logOf().some((s) => s.v === 'initialized' && s.id === itemId(n))));
      ok(g, 'no unit-level statement; every answered names a catalogue questionId and its item as parent',
         !logOf().some((s) => (s.o && s.o.scope) || s.id === XAPI_UNIT_ID) &&
         logOf().filter((s) => s.v.startsWith('answered')).every((s) => compMeta.subContent.some((it) => it.id === s.parent && (it.questions || []).some((q) => q.questionId === s.id))));

      const answered = logOf().filter((s) => s.v.startsWith('answered'));
      ok(g, 'every answered (18: 12 closing + 6 non-final) carries a non-empty string response and no " | "',
         answered.length === 18 && answered.every((s) => typeof s.r.response === 'string' && s.r.response !== '' && !/\s\|\s/.test(s.r.response)), String(answered.length));
      ok(g, 'every answered keeps the readable student_answer fallback', answered.every((s) => s.r.extensions && Array.isArray(s.r.extensions.student_answer) && typeof s.r.extensions.student_answer[0] === 'string'));
      ok(g, 'exactly one answered.last per catalogue question (12)', ALL_Q.every((k) => answered.filter((s) => s.v === 'answered.last' && s.id === qId(k)).length === 1));
      const warns = JSON.parse(run('JSON.stringify(window.__warns)'));
      ok(g, 'the response layer never warned during the walk (every reported value is a metadata string)', !warns.some((m) => /\[xAPI\]/.test(m)), warns.filter((m) => /\[xAPI\]/.test(m)).slice(0, 3).join(' | '));

      /* Round trip through the real builders for every catalogue question. */
      for (const it of compMeta.subContent || []) {
        const suf = it.id.replace(/\/$/, '').slice(-3);
        for (const q of it.questions || []) {
          const k = q.questionId.split('/').pop();
          const m = JSON.parse(run('JSON.stringify(xapiQMeta("' + suf + '","' + k + '"))'));
          ok(g, 'xapiQMeta resolves ' + suf + '/' + k, m.questionId === q.questionId && m.parentId === it.id && m.questionType === q.questionType, JSON.stringify(m));
          if (q.questionType === 'choice') {
            const resp = run('xapiResponse("' + suf + '","' + k + '", { choices: ' + JSON.stringify(q.correctAnswers.slice().reverse()) + ' }).response');
            ok(g, 'choice canonical (answers order, any click order) ' + suf + '/' + k, resp === q.answers.filter((a) => q.correctAnswers.includes(a)).join('[,]'), resp);
          } else if (q.questionType === 'numeric') {
            const resp = run('xapiResponse("' + suf + '","' + k + '", { value: ' + JSON.stringify(String(q.correctAnswers[0])) + ' }).response');
            ok(g, 'numeric canonical ' + suf + '/' + k, resp === String(q.correctAnswers[0]), resp);
          } else if (q.questionType === 'matching') {
            const resp = run('xapiResponse("' + suf + '","' + k + '", { pairs: ' + JSON.stringify(q.correctAnswers.slice().reverse()) + ' }).response');
            ok(g, 'matching canonical (correctAnswers order, any placing order) ' + suf + '/' + k, resp === q.correctAnswers.map((c) => c.source + '[.]' + c.target).join('[,]'), resp);
          }
        }
      }
      const nW = warns.length;
      run('xapiResponse("005","q1", { choices: ["לא קיים"] })');
      ok(g, 'an unresolvable UI text warns "not in metadata"', JSON.parse(run('JSON.stringify(window.__warns)')).slice(nW).some((m) => m.includes('not in metadata')));

      /* ── B-2 (lane K, 2026-11-13; monday 13454123722): Back never closes an item ──
         After the walk: a fresh recorder state, then for E = the first evaluated item whose first screen
         follows a screen P of another item (and, where the part has one, the first such E whose P belongs
         to no item): forward into E, a wrong answer, Back to P → no 'completed' for E; forward into E
         again, the right answer, forward out of E → exactly one 'completed' for E, success:true.
         The answers are recorded as the layer records them (XAPI_Q_RESULTS / XAPI_Q_SCALED + the
         library's answered map); the navigation is the page's own (goTo(index) in js/main.js). */
      {
        const NAV = 'function (id) { goTo(Array.prototype.indexOf.call(document.querySelectorAll(".screen"), document.getElementById(id))); }';
        run('(function(){ window.__b2nav = ' + NAV + '; return 1; })()');
        const b2walk = JSON.parse(run('JSON.stringify(Array.prototype.map.call(document.querySelectorAll(".screen"), function (e) { return e.id; }))'));
        const b2map = JSON.parse(run('JSON.stringify(SCREEN_TO_SUBCONTENT)'));
        const b2eval = JSON.parse(run('JSON.stringify(XAPI_EVAL_ITEMS)'));
        ok(g, 'B-2: _xapiScreenRank and _xapiIsBackward are defined', run('typeof _xapiScreenRank + typeof _xapiIsBackward') === 'functionfunction');
        const b2rank = JSON.parse(run('JSON.stringify(' + JSON.stringify(b2walk.concat(Object.keys(b2map))) + '.map(function (s) { return typeof _xapiScreenRank === "function" ? _xapiScreenRank(s) : null; }))'));
        const wr = b2rank.slice(0, b2walk.length);
        ok(g, 'B-2 rank: every screen and every map key has a rank', b2rank.every((r) => r !== null), JSON.stringify(b2rank));
        ok(g, 'B-2 rank: the screens rank in walk order', wr.every((r, i) => i === 0 || r > wr[i - 1]), JSON.stringify(wr));
        ok(g, 'B-2: no hub screens in this linear unit', run('typeof XAPI_HUB_SCREENS') === 'undefined');
        const itemOf = (id) => (b2map[id] ? b2map[id][0] : null);
        const cands = [];
        for (const wantNull of [false, true]) {
          for (let i = 1; i < b2walk.length; i++) {
            const it = itemOf(b2walk[i]);
            if (!it || !b2eval[it] || itemOf(b2walk[i - 1]) === it) continue;
            if ((itemOf(b2walk[i - 1]) === null) !== wantNull) continue;
            let j = i; while (j + 1 < b2walk.length && itemOf(b2walk[j + 1]) === it) j++;
            if (j + 1 >= b2walk.length) continue;
            cands.push({ E: it, P: b2walk[i - 1], IN: b2walk[i], OUT: b2walk[j + 1] }); break;
          }
        }
        ok(g, 'B-2: a Back case exists (an evaluated item after another screen)', cands.length > 0);
        for (const c of cands) {
          const qs = ((compMeta.subContent || []).find((s) => s.id === itemId(c.E)) || {}).questions || [];
          const keys = qs.map((q) => c.E + '/' + q.questionId.split('/').pop());
          const answer = (right) => run('(function(){ window.xapiItemAnswered[' + JSON.stringify(itemId(c.E)) + '] = true; ' +
            JSON.stringify(keys) + '.forEach(function (k) { XAPI_Q_RESULTS[k] = ' + right + '; XAPI_Q_SCALED[k] = ' + (right ? 1 : 0) + '; }); return 1; })()');
          run('(function(){ window.__log = []; _ledger = {}; xapiCurrentItem = null; window.xapiItemAnswered = {};' +
              ' Object.keys(XAPI_Q_RESULTS).forEach(function (k) { delete XAPI_Q_RESULTS[k]; });' +
              ' Object.keys(XAPI_Q_SCALED).forEach(function (k) { delete XAPI_Q_SCALED[k]; }); return 1; })()');
          const nav = (id) => run('(function(){ window.__b2nav(' + JSON.stringify(id) + '); return 1; })()');
          const doneE = (t) => t.filter((s) => String(s.v).split('.')[0] === 'completed' && s.id === itemId(c.E));
          nav(c.P); nav(c.IN); answer(false);
          let n1 = logOf().length;
          nav(c.P);
          const tb = logOf().slice(n1);
          ok(g, 'B-2 ' + c.E + ': wrong answer, Back ' + c.IN + ' → ' + c.P + ' sends no completed for ' + c.E, keys.length > 0 && doneE(tb).length === 0, JSON.stringify(tb));
          nav(c.IN); answer(true); nav(c.OUT);
          const all = doneE(logOf());
          ok(g, 'B-2 ' + c.E + ': back in, right answer, forward → ' + c.OUT + ': exactly one completed for ' + c.E + ', success:true',
             all.length === 1 && all[0].r && all[0].r.success === true, JSON.stringify(all));
        }
      }

      await new Promise((r) => setTimeout(r, 50));
      const errs = pageErrors.filter((m) => !/Not implemented/.test(m));
      ok(g, 'no uncaught page error', errs.length === 0, errs.slice(0, 3).join(' | '));
      w.close();
    } catch (e) {
      ok(g, 'the runtime walk completed without a harness exception', false, (e && e.stack || String(e)).split('\n').slice(0, 3).join(' | '));
    }
  }

  if (failures.length) {
    console.log('\n' + failures.map((f) => '  FAIL ' + f).join('\n'));
    console.log('\n' + failures.length + ' FAILED, ' + pass + ' passed, ' + skipped + ' group(s) skipped\n');
    process.exit(1);
  }
  console.log('All ' + pass + ' checks passed' + (skipped ? ' (' + skipped + ' group(s) skipped)' : '') + '.');
})();
