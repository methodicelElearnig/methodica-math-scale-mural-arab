'use strict';
/* ============================================================
   wordbank-dnd.js — the word-bank questions (q1, q7, q7b) on the pointer drag of
   unit-js/30-pointer-dnd.js (mouse + touch).

   Until 18.11.26 the chips used native HTML5 drag (draggable / ondragstart / ondrop) plus an
   onclick that placed the chip in the first empty blank. One press could fire both, so a single
   gesture filled two blanks (MOE Monday 13504392333, Aya's recording on q1), the browser
   selected the chip text, and touch did not drag at all. Now a press that moves less than
   DDQ_TAP_SLOP px is a tap (first empty blank, as the click did) and anything longer is a drag
   (the blank it is released over). A blank is still emptied by clicking it (qNDropZoneClick).

   wireWordBankDnd(cfg) — once per question, from its initQN():
     screenId      'screen-q1'
     chipClass     'q1-chip'          chips carry data-word
     placedClass   'q1-chip-placed'   a placed chip is hidden and cannot be picked
     draggingClass 'q1-chip-dragging' on the source while its ghost is out
     dropPrefix    'q1-drop-'         blanks are #q1-drop-1 … #q1-drop-<dropCount>
     dropCount     3
     isDone()      true once the question is answered (no more moves)
     place(word, n)  the question's own qNPlaceWord
     findEmpty()     the question's own qNFindFirstEmpty
   Returns the createPointerDnd handle.
   ============================================================ */

function wireWordBankDnd(cfg) {
  var screen = document.getElementById(cfg.screenId);
  if (!screen) return null;
  function chipOf(word) {
    return screen.querySelector('.' + cfg.chipClass + '[data-word="' + word + '"]');
  }
  function clearDragging(word) {
    var c = chipOf(word);
    if (c) c.classList.remove(cfg.draggingClass);
  }
  var dnd = createPointerDnd({
    canDrag: function (word, el) {
      return !cfg.isDone() && !el.classList.contains(cfg.placedClass);
    },
    onPick: function (word, el) { el.classList.add(cfg.draggingClass); },
    onTap: function (word) {
      if (cfg.isDone()) return;
      var n = cfg.findEmpty();
      if (n !== null) cfg.place(word, n);
    },
    onDrop: function (word, target) {
      clearDragging(word);
      if (!cfg.isDone()) cfg.place(word, Number(target));
    },
    onCancel: function (word) { clearDragging(word); }
  });
  screen.querySelectorAll('.' + cfg.chipClass).forEach(function (c) {
    dnd.attachSource(c, c.dataset.word);
  });
  for (var n = 1; n <= cfg.dropCount; n++) {
    dnd.attachTarget(document.getElementById(cfg.dropPrefix + n), String(n));
  }
  return dnd;
}
