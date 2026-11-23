/* leitor de vídeo próprio para os recaps (sem ecrã inteiro) */
(function () {
  var en = (document.documentElement.lang || '').indexOf('en') === 0;
  var T = en
    ? { play: 'Play', pause: 'Pause', mute: 'Mute', unmute: 'Unmute', seek: 'Video progress', on: 'sound', off: 'muted' }
    : { play: 'Reproduzir', pause: 'Pausa', mute: 'Tirar o som', unmute: 'Pôr o som', seek: 'Progresso do vídeo', on: 'som', off: 'sem som' };

  function fmt(s) {
    if (!isFinite(s) || s < 0) s = 0;
    s = Math.floor(s);
    return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2);
  }

  var all = [];

  document.querySelectorAll('.pv-vid video').forEach(function (v) {
    var fig = v.parentNode;
    v.removeAttribute('controls');
    v.setAttribute('playsinline', '');
    v.setAttribute('webkit-playsinline', '');
    fig.classList.add('vp');
    all.push(v);

    var big = document.createElement('button');
    big.type = 'button';
    big.className = 'vp-big';
    big.setAttribute('aria-label', T.play);
    big.innerHTML = '<span aria-hidden="true">▶</span>';

    var bar = document.createElement('div');
    bar.className = 'vp-bar';
    bar.innerHTML =
      '<button type="button" class="vp-btn vp-play" aria-label="' + T.play + '"><span aria-hidden="true">▶</span></button>' +
      '<div class="vp-track" role="slider" tabindex="0" aria-label="' + T.seek + '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div class="vp-fill"></div></div>' +
      '<span class="vp-time">0:00</span>' +
      '<button type="button" class="vp-btn vp-mute" aria-label="' + T.mute + '">' + T.on + '</button>';

    fig.appendChild(big);
    fig.appendChild(bar);

    var playBtn = bar.querySelector('.vp-play');
    var track = bar.querySelector('.vp-track');
    var fill = bar.querySelector('.vp-fill');
    var time = bar.querySelector('.vp-time');
    var muteBtn = bar.querySelector('.vp-mute');

    function toggle() {
      if (v.paused || v.ended) v.play(); else v.pause();
    }

    function sync() {
      var playing = !v.paused && !v.ended;
      fig.classList.toggle('is-playing', playing);
      playBtn.innerHTML = '<span aria-hidden="true">' + (playing ? '❚❚' : '▶') + '</span>';
      playBtn.setAttribute('aria-label', playing ? T.pause : T.play);
    }

    function progress() {
      var d = v.duration || 0;
      var p = d ? (v.currentTime / d) * 100 : 0;
      fill.style.width = p + '%';
      track.setAttribute('aria-valuenow', Math.round(p));
      time.textContent = fmt(v.currentTime) + ' / ' + fmt(d);
    }

    big.addEventListener('click', toggle);
    playBtn.addEventListener('click', toggle);
    v.addEventListener('click', toggle);
    v.addEventListener('dblclick', function (e) { e.preventDefault(); });

    v.addEventListener('play', function () {
      all.forEach(function (o) { if (o !== v && !o.paused) o.pause(); });
      sync();
    });
    v.addEventListener('pause', sync);
    v.addEventListener('ended', function () { sync(); fig.classList.add('is-ended'); });
    v.addEventListener('playing', function () { fig.classList.add('is-started'); fig.classList.remove('is-ended'); });
    v.addEventListener('timeupdate', progress);
    v.addEventListener('loadedmetadata', progress);

    muteBtn.addEventListener('click', function () {
      v.muted = !v.muted;
      muteBtn.textContent = v.muted ? T.off : T.on;
      muteBtn.setAttribute('aria-label', v.muted ? T.unmute : T.mute);
      fig.classList.toggle('is-muted', v.muted);
    });

    function seekTo(clientX) {
      var r = track.getBoundingClientRect();
      var x = Math.min(Math.max((clientX - r.left) / r.width, 0), 1);
      if (v.duration) { v.currentTime = x * v.duration; progress(); }
      else {
        v.addEventListener('loadedmetadata', function once() {
          v.removeEventListener('loadedmetadata', once);
          v.currentTime = x * v.duration; progress();
        });
        v.preload = 'metadata'; v.load();
      }
    }

    var dragging = false;
    track.addEventListener('pointerdown', function (e) {
      dragging = true; track.setPointerCapture(e.pointerId); seekTo(e.clientX);
    });
    track.addEventListener('pointermove', function (e) { if (dragging) seekTo(e.clientX); });
    track.addEventListener('pointerup', function () { dragging = false; });
    track.addEventListener('pointercancel', function () { dragging = false; });
    track.addEventListener('keydown', function (e) {
      if (!v.duration) return;
      if (e.key === 'ArrowRight') { v.currentTime = Math.min(v.duration, v.currentTime + 5); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { v.currentTime = Math.max(0, v.currentTime - 5); e.preventDefault(); }
    });

    var dur = v.getAttribute('data-duration');
    if (dur) time.textContent = '0:00 / ' + dur;
  });
})();
