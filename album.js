/* Visualizador de fotografias do álbum: ecrã inteiro, setas, teclado e deslize. */
(function () {
  var EN = (document.documentElement.lang || '').toLowerCase().indexOf('en') === 0;
  var L = EN ? { frame: 'FRAME ', fs: 'fullscreen', close: 'close ×', closeA: 'Close', prev: 'Previous photo', next: 'Next photo', dlg: 'Album photographs', ph: 'add photo here' }
             : { frame: 'FOTOGRAMA ', fs: 'ecrã inteiro', close: 'fechar ×', closeA: 'Fechar', prev: 'Fotografia anterior', next: 'Fotografia seguinte', dlg: 'Fotografias do álbum', ph: 'colocar fotografia aqui' };
  var shots = [].slice.call(document.querySelectorAll('.shot'));
  if (!shots.length) return;
  var cur = 0, box, stage, count, closeBtn, fsBtn, lastFocus, startX = null;

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function srcOf(s) {
    var im = s.querySelector('img');
    return s.getAttribute('data-full') || (im && im.getAttribute('src')) || '';
  }
  function altOf(s) { var im = s.querySelector('img'); return (im && im.getAttribute('alt')) || ''; }

  function build() {
    box = document.createElement('div');
    box.className = 'lb';
    box.hidden = true;
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', L.dlg);
    box.innerHTML =
      '<div class="lb-bar"><span class="lb-count" aria-live="polite"></span>' +
      '<span><button type="button" class="lb-fs">' + L.fs + '</button>' +
      '<button type="button" class="lb-x" aria-label="' + L.closeA + '">' + L.close + '</button></span></div>' +
      '<button type="button" class="lb-prev" aria-label="' + L.prev + '">‹</button>' +
      '<div class="lb-stage"></div>' +
      '<button type="button" class="lb-next" aria-label="' + L.next + '">›</button>';
    document.body.appendChild(box);
    stage = box.querySelector('.lb-stage');
    count = box.querySelector('.lb-count');
    closeBtn = box.querySelector('.lb-x');
    fsBtn = box.querySelector('.lb-fs');
    if (!box.requestFullscreen) fsBtn.hidden = true;
    if (shots.length < 2) { box.querySelector('.lb-prev').hidden = true; box.querySelector('.lb-next').hidden = true; }

    closeBtn.addEventListener('click', close);
    fsBtn.addEventListener('click', toggleFs);
    box.querySelector('.lb-prev').addEventListener('click', function () { show(cur - 1); });
    box.querySelector('.lb-next').addEventListener('click', function () { show(cur + 1); });
    box.addEventListener('click', function (e) { if (e.target === box || e.target === stage) close(); });
    box.addEventListener('touchstart', function (e) { startX = e.changedTouches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX; startX = null;
      if (Math.abs(dx) > 50) show(cur + (dx < 0 ? 1 : -1));
    }, { passive: true });
    document.addEventListener('keydown', onKey);
  }

  function show(i) {
    cur = (i + shots.length) % shots.length;
    var s = srcOf(shots[cur]);
    stage.textContent = '';
    if (s) {
      var img = document.createElement('img');
      img.src = s; img.alt = altOf(shots[cur]);
      stage.appendChild(img);
    } else {
      var ph = document.createElement('div');
      ph.className = 'ph lb-ph';
      ph.innerHTML = '<span>' + L.ph + '</span>';
      stage.appendChild(ph);
    }
    count.textContent = L.frame + pad(cur + 1) + ' / ' + pad(shots.length);
    [cur - 1, cur + 1].forEach(function (j) {
      var u = srcOf(shots[(j + shots.length) % shots.length]);
      if (u) (new Image()).src = u;
    });
  }

  function open(i) {
    if (!box) build();
    lastFocus = document.activeElement;
    show(i);
    box.hidden = false;
    document.body.classList.add('lb-open');
    closeBtn.focus();
  }
  function close() {
    if (!box || box.hidden) return;
    if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen();
    box.hidden = true;
    document.body.classList.remove('lb-open');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function toggleFs() {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (box.requestFullscreen) box.requestFullscreen();
  }
  function onKey(e) {
    if (!box || box.hidden) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') show(cur - 1);
    else if (e.key === 'ArrowRight') show(cur + 1);
    else if (e.key === 'f' || e.key === 'F') toggleFs();
    else if (e.key === 'Tab') {
      var f = [].slice.call(box.querySelectorAll('button')).filter(function (b) { return !b.hidden; });
      var i = f.indexOf(document.activeElement);
      e.preventDefault();
      f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
    }
  }

  shots.forEach(function (s, i) { s.addEventListener('click', function () { open(i); }); });
})();
