/* =========================================================
   script.js — Birthday Website Logic
   ========================================================= */

// ─────────────────────────────────────────────
// GIF URLS
// ─────────────────────────────────────────────
const GIF_URLS = {
  1: 'https://media1.tenor.com/m/oY5s6WHsGgwAAAAC/birthday-mochi-mochi-peach-cat-gif.gif',
  2: 'https://media1.tenor.com/m/r7PKNiF--nUAAAAC/mochi-cry.gif',
  3: 'https://media1.tenor.com/m/YE5iCstDdVIAAAAC/cat-farsi-hug.gif'
};

// ─────────────────────────────────────────────
// BEAT HEARTS — timer-based, always works
// ─────────────────────────────────────────────
const BEAT_HEARTS = {
  1: ['💖', '🎉', '✨', '🎂', '💛', '🌸', '🎈'],
  2: ['💔', '😔', '💧', '🙏', '🌹', '💙', '😢'],
  3: ['💖', '💗', '💓', '💞', '💝', '🌹', '✨']
};

const heartTimers = {}; // pageNum -> intervalId

function startEqualizer(pageNum) {
  stopEqualizer(pageNum); // clear any existing
  heartTimers[pageNum] = setInterval(() => {
    launchBeatHeart(pageNum);
  }, 850 + Math.random() * 400);
}

function stopEqualizer(pageNum) {
  clearInterval(heartTimers[pageNum]);
  heartTimers[pageNum] = null;
}

function launchBeatHeart(pageNum) {
  const container = document.getElementById(`beatHearts${pageNum}`);
  if (!container) return;

  const emojis = BEAT_HEARTS[pageNum];
  const emoji = emojis[Math.floor(Math.random() * emojis.length)];
  const x = 5 + Math.random() * 88;          // % from left
  const rise = 200 + Math.random() * 250;        // px upward
  const rot1 = (Math.random() - 0.5) * 30;
  const rot2 = rot1 + (Math.random() - 0.5) * 20;
  const dur = 2 + Math.random() * 1;
  const size = 1.6 + Math.random() * 0.8;

  const heart = document.createElement('span');
  heart.className = 'beat-heart';
  heart.textContent = emoji;
  heart.style.cssText = `
    left: ${x}%;
    --rot: ${rot1}deg;
    --rot2: ${rot2}deg;
    --rise: -${rise}px;
    --dur: ${dur}s;
    font-size: ${size}rem;
  `;
  container.appendChild(heart);
  setTimeout(() => heart.remove(), dur * 1000 + 200);
}


// ─────────────────────────────────────────────
// FLOATING GIF SPRITES (canvas-driven)
// ─────────────────────────────────────────────
const gifSprites = {}; // pageNum -> { img, floaters[], animId, trailCtx }
const TRAIL_ALPHA = 0.06; // lower = longer trail

class GifFloater {
  constructor(cw, ch, img, index, total) {
    this.img = img;
    this.cw = cw;
    this.ch = ch;
    this.size = 90 + Math.random() * 60;
    // Spread them across the screen
    const angle = (index / total) * Math.PI * 2 + Math.random() * 0.8;
    const r = 0.25 + Math.random() * 0.2;
    this.x = cw * 0.5 + Math.cos(angle) * cw * r;
    this.y = ch * 0.5 + Math.sin(angle) * ch * r;
    // Velocity — slow, dreamy
    this.vx = (Math.random() - 0.5) * 1.2;
    this.vy = (Math.random() - 0.5) * 1.2;
    this.angle = Math.random() * Math.PI * 2;
    this.angVel = (Math.random() - 0.5) * 0.02;
    this.opacity = 0.7 + Math.random() * 0.3;
    this.scaleTarget = 1;
    this.scale = 0.4;
    // shadow color per page
    this.shadow = index % 2 === 0 ? '#ff85c2' : '#ffe066';
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.angle += this.angVel;
    this.scale += (this.scaleTarget - this.scale) * 0.04;

    // Soft boundary bounce
    const pad = this.size * 0.5;
    if (this.x < pad) { this.vx = Math.abs(this.vx); }
    if (this.x > this.cw - pad) { this.vx = -Math.abs(this.vx); }
    if (this.y < pad) { this.vy = Math.abs(this.vy); }
    if (this.y > this.ch - pad) { this.vy = -Math.abs(this.vy); }

    // Gentle speed variation
    this.vx += (Math.random() - 0.5) * 0.04;
    this.vy += (Math.random() - 0.5) * 0.04;
    // Clamp speed
    const spd = Math.hypot(this.vx, this.vy);
    if (spd > 1.6) { this.vx *= 0.95; this.vy *= 0.95; }
    if (spd < 0.3) { this.vx *= 1.1; this.vy *= 1.1; }
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);

    const s = this.size;
    // Glow shadow
    ctx.shadowColor = this.shadow;
    ctx.shadowBlur = 28;

    try {
      ctx.drawImage(this.img, -s / 2, -s / 2, s, s);
    } catch (e) { }

    ctx.restore();
  }
}

function initGifFloaters(pageNum) {
  const canvas = document.getElementById(`gifCanvas${pageNum}`);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // Cancel old animation if re-entering
  if (gifSprites[pageNum]?.animId) cancelAnimationFrame(gifSprites[pageNum].animId);

  const sprite = gifSprites[pageNum] || {};

  // Load image once
  if (!sprite.img) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = GIF_URLS[pageNum];
    sprite.img = img;
    sprite.ready = false;
    img.onload = () => { sprite.ready = true; };
  }

  const count = pageNum === 1 ? 5 : pageNum === 2 ? 4 : 4;
  sprite.floaters = Array.from({ length: count }, (_, i) =>
    new GifFloater(canvas.width, canvas.height, sprite.img, i, count)
  );

  gifSprites[pageNum] = sprite;

  function loop() {
    // Trail effect: fill with semi-transparent overlay
    ctx.fillStyle = `rgba(0,0,0,${TRAIL_ALPHA})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (sprite.ready) {
      sprite.floaters.forEach(f => { f.update(); f.draw(ctx); });
    }
    sprite.animId = requestAnimationFrame(loop);
  }

  // Clear canvas on start
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  loop();
}

function stopGifFloaters(pageNum) {
  const s = gifSprites[pageNum];
  if (s?.animId) {
    cancelAnimationFrame(s.animId);
    s.animId = null;
  }
  const canvas = document.getElementById(`gifCanvas${pageNum}`);
  if (canvas) canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
}

// ─────────────────────────────────────────────
// PAGE TRANSITIONS
// ─────────────────────────────────────────────
let currentPage = 1;
let isTransitioning = false;

function goToPage(n) {
  if (isTransitioning || n === currentPage) return;
  isTransitioning = true;

  const overlay = document.getElementById('transitionOverlay');
  const fromPage = document.getElementById(`page${currentPage}`);
  const toPage = document.getElementById(`page${n}`);

  // 1. Flash overlay in
  overlay.classList.add('flash');

  // Pause audio & stop GIF + EQ for departing page
  const curAud = document.getElementById(`audio${currentPage}`);
  if (curAud) curAud.pause();
  stopGifFloaters(currentPage);
  stopEqualizer(currentPage);
  closeAllBars();

  setTimeout(() => {
    // 2. Swap pages while overlay is opaque
    fromPage.classList.remove('active');
    fromPage.classList.add('exit');
    setTimeout(() => fromPage.classList.remove('exit'), 600);

    toPage.classList.add('active');
    currentPage = n;
    onPageEnter(n);

    // 3. Flash overlay out
    overlay.classList.remove('flash');
    setTimeout(() => { isTransitioning = false; }, 600);
  }, 350);
}

function onPageEnter(n) {
  // Show correct FAB + secret btn
  for (let i = 1; i <= 3; i++) {
    const f = document.getElementById(`fab${i}`);
    if (f) f.style.display = i === n ? 'flex' : 'none';
  }
  const secretBtn = document.getElementById('secretBtn');
  if (secretBtn) secretBtn.style.display = n === 3 ? 'flex' : 'none';

  // Start page-specific animations
  if (n === 1) startBalloons();
  if (n === 2) startRain();
  if (n === 3) startHearts();

  // Start floating GIFs
  initGifFloaters(n);

  // Resume audio then start EQ
  const aud = document.getElementById(`audio${n}`);
  const fab = document.getElementById(`fab${n}`);
  const playBtn = document.getElementById(`playBtn${n}`);
  const nameEl = document.getElementById(`name${n}`);

  if (aud && aud.src) {
    if (playBtn) playBtn.disabled = false;
    if (nameEl && nameEl.textContent === 'No song chosen') {
      try {
        const srcName = decodeURIComponent(aud.src.split('/').pop().replace(/\.[^.]+$/, ''));
        if (srcName) nameEl.textContent = srcName;
      } catch (e) { }
    }
    aud.play().then(() => {
      updatePlayBtn(n, true);
      if (fab) fab.classList.add('active');
      startEqualizer(n);
    }).catch(() => { updatePlayBtn(n, false); });
  }
}

// ─────────────────────────────────────────────
// MUSIC BAR
// ─────────────────────────────────────────────
function toggleBar(n) {
  const bar = document.getElementById(`bar${n}`);
  if (!bar) return;
  const isOpen = bar.classList.contains('open');
  closeAllBars();
  if (!isOpen) {
    bar.style.display = 'flex';
    bar.offsetHeight;
    bar.classList.add('open');
  }
}
function closeAllBars() {
  for (let i = 1; i <= 3; i++) {
    const bar = document.getElementById(`bar${i}`);
    if (bar) {
      bar.classList.remove('open');
      bar.addEventListener('transitionend', () => {
        if (!bar.classList.contains('open')) bar.style.display = 'none';
      }, { once: true });
    }
  }
}
document.addEventListener('click', (e) => {
  for (let i = 1; i <= 3; i++) {
    const bar = document.getElementById(`bar${i}`);
    const fab = document.getElementById(`fab${i}`);
    if (bar?.classList.contains('open') && !bar.contains(e.target) && e.target !== fab) {
      bar.classList.remove('open');
      bar.addEventListener('transitionend', () => {
        if (!bar.classList.contains('open')) bar.style.display = 'none';
      }, { once: true });
    }
  }
});

// ─────────────────────────────────────────────
// LOAD MUSIC
// ─────────────────────────────────────────────
function loadMusic(n, input) {
  const file = input.files[0];
  if (!file) return;
  const aud = document.getElementById(`audio${n}`);
  const nameEl = document.getElementById(`name${n}`);
  const playBtn = document.getElementById(`playBtn${n}`);
  const fab = document.getElementById(`fab${n}`);
  if (aud._objectUrl) URL.revokeObjectURL(aud._objectUrl);
  const url = URL.createObjectURL(file);
  aud._objectUrl = url;
  aud.src = url;
  aud.load();
  aud.volume = parseFloat(document.getElementById(`vol${n}`).value);
  nameEl.textContent = file.name.replace(/\.[^.]+$/, '');
  playBtn.disabled = false;
  aud.play().then(() => {
    updatePlayBtn(n, true);
    if (fab) fab.classList.add('active');
  }).catch(() => { });
}

function toggleMusic(n) {
  const aud = document.getElementById(`audio${n}`);
  const fab = document.getElementById(`fab${n}`);
  if (!aud || !aud.src || aud.src === window.location.href) return;
  if (aud.paused) {
    aud.play().then(() => {
      updatePlayBtn(n, true);
      fab?.classList.add('active');
      startEqualizer(n);
    });
  } else {
    aud.pause();
    updatePlayBtn(n, false);
    fab?.classList.remove('active');
    stopEqualizer(n);
  }
}

function updatePlayBtn(n, playing) {
  const btn = document.getElementById(`playBtn${n}`);
  if (btn) btn.textContent = playing ? '⏸' : '▶';
}

function setVol(n, val) {
  const aud = document.getElementById(`audio${n}`);
  if (aud) aud.volume = parseFloat(val);
}

// ─────────────────────────────────────────────
// COUNTDOWN
// ─────────────────────────────────────────────
function updateCountdown() {
  const el = document.getElementById('countdown');
  if (!el) return;
  const now = new Date();
  const year = now.getFullYear();
  let bday = new Date(year, 3, 29);
  if (now > bday) bday = new Date(year + 1, 3, 29);
  const diff = Math.ceil((bday - now) / (1000 * 60 * 60 * 24));
  el.textContent = diff === 0 ? '🎉 TODAY! 🎉' : `${diff} days`;
}
updateCountdown();
setInterval(updateCountdown, 60000);

// ─────────────────────────────────────────────
// BALLOONS
// ─────────────────────────────────────────────
const BALLOON_COLORS = ['#ff6eb4', '#ff9a3c', '#ffe066', '#98ff98', '#87ceeb', '#da70d6', '#ff7f7f', '#7fffd4', '#ffb3de', '#b0e0e6'];
let balloons = [], balloonAnim;

class Balloon {
  constructor(canvas) { this.canvas = canvas; this.reset(true); }
  reset(init) {
    this.x = Math.random() * this.canvas.width;
    this.y = init ? Math.random() * this.canvas.height : this.canvas.height + 80;
    this.r = 22 + Math.random() * 22;
    this.color = BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)];
    this.speed = 0.6 + Math.random() * 1.2;
    this.drift = (Math.random() - 0.5) * 0.6;
    this.sway = 0;
    this.swayDir = Math.random() > 0.5 ? 1 : -1;
    this.opacity = 0.82 + Math.random() * 0.18;
  }
  update() {
    this.y -= this.speed;
    this.sway += 0.02;
    this.x += Math.sin(this.sway) * 0.7 * this.swayDir + this.drift;
    if (this.y < -this.r * 2 - 60) this.reset(false);
  }
  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.beginPath();
    ctx.ellipse(this.x, this.y, this.r, this.r * 1.2, 0, 0, Math.PI * 2);
    const g = ctx.createRadialGradient(this.x - this.r * .3, this.y - this.r * .3, this.r * .1, this.x, this.y, this.r * 1.3);
    g.addColorStop(0, '#fff');
    g.addColorStop(0.3, this.color);
    g.addColorStop(1, this.color + '99');
    ctx.fillStyle = g; ctx.fill();
    ctx.beginPath();
    ctx.ellipse(this.x - this.r * .28, this.y - this.r * .32, this.r * .22, this.r * .13, -0.4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fill();
    ctx.beginPath();
    ctx.moveTo(this.x, this.y + this.r * 1.2);
    ctx.lineTo(this.x - 3, this.y + this.r * 1.2 + 6);
    ctx.lineTo(this.x + 3, this.y + this.r * 1.2 + 6);
    ctx.closePath(); ctx.fillStyle = this.color; ctx.fill();
    const sl = 55 + Math.random() * 20;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y + this.r * 1.2 + 6);
    ctx.bezierCurveTo(this.x + 12, this.y + this.r * 1.2 + sl / 2, this.x - 12, this.y + this.r * 1.2 + sl / 2, this.x + (Math.random() - .5) * 20, this.y + this.r * 1.2 + sl);
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.restore();
  }
}

function startBalloons() {
  const canvas = document.getElementById('balloonCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth; canvas.height = window.innerHeight;
  balloons = Array.from({ length: 28 }, () => new Balloon(canvas));
  cancelAnimationFrame(balloonAnim);
  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    balloons.forEach(b => { b.update(); b.draw(ctx); });
    balloonAnim = requestAnimationFrame(loop);
  }
  loop();
}

// ─────────────────────────────────────────────
// RAIN
// ─────────────────────────────────────────────
function startRain() {
  const c = document.getElementById('rainContainer');
  if (!c) return;
  c.innerHTML = '';
  const w = window.innerWidth;
  for (let i = 0; i < 60; i++) {
    const d = document.createElement('div');
    d.className = 'raindrop';
    d.style.cssText = `left:${Math.random() * w}px;height:${60 + Math.random() * 80}px;animation-duration:${0.9 + Math.random() * 1.4}s;animation-delay:${Math.random() * 3}s;opacity:${0.3 + Math.random() * 0.4};`;
    c.appendChild(d);
  }
}

// ─────────────────────────────────────────────
// HEARTS
// ─────────────────────────────────────────────
const HEART_COLORS = ['#ff6b8a', '#ff85a1', '#ffb3c6', '#c77dff', '#e0aaff', '#f7c59f', '#ff6eb4', '#da70d6', '#ff9a3c', '#ffcad4'];
let hearts = [], heartAnim;

class FloatingHeart {
  constructor(canvas) { this.canvas = canvas; this.reset(true); }
  reset(init) {
    this.x = Math.random() * this.canvas.width;
    this.y = init ? Math.random() * this.canvas.height : this.canvas.height + 60;
    this.size = 14 + Math.random() * 26;
    this.color = HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)];
    this.speed = 0.5 + Math.random() * 1.2;
    this.drift = (Math.random() - 0.5) * 0.8;
    this.sway = Math.random() * Math.PI * 2;
    this.opacity = 0.55 + Math.random() * 0.45;
    this.rotation = (Math.random() - 0.5) * 0.8;
    this.rotSpeed = (Math.random() - 0.5) * 0.03;
  }
  update() {
    this.y -= this.speed; this.sway += 0.025;
    this.x += Math.sin(this.sway) * 0.9 + this.drift;
    this.rotation += this.rotSpeed;
    if (this.y < -this.size * 2) this.reset(false);
  }
  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    const s = this.size;
    ctx.beginPath();
    ctx.moveTo(0, s * .3);
    ctx.bezierCurveTo(-s * .6, -s * .3, -s, s * .1, 0, s);
    ctx.bezierCurveTo(s, s * .1, s * .6, -s * .3, 0, s * .3);
    ctx.closePath();
    const gr = ctx.createRadialGradient(0, s * .2, s * .05, 0, s * .4, s * .9);
    gr.addColorStop(0, '#fff8'); gr.addColorStop(0.4, this.color); gr.addColorStop(1, this.color + '55');
    ctx.fillStyle = gr; ctx.fill();
    ctx.restore();
  }
}

function startHearts() {
  const canvas = document.getElementById('heartCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth; canvas.height = window.innerHeight;
  hearts = Array.from({ length: 35 }, () => new FloatingHeart(canvas));
  cancelAnimationFrame(heartAnim);
  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hearts.forEach(h => { h.update(); h.draw(ctx); });
    heartAnim = requestAnimationFrame(loop);
  }
  loop();
}

// ─────────────────────────────────────────────
// RESIZE
// ─────────────────────────────────────────────
window.addEventListener('resize', () => {
  ['balloonCanvas', 'heartCanvas', 'gifCanvas1', 'gifCanvas2', 'gifCanvas3'].forEach(id => {
    const c = document.getElementById(id);
    if (c) { c.width = window.innerWidth; c.height = window.innerHeight; }
  });
});

// ─────────────────────────────────────────────
// SECRET BUTTON — surprise reveal
// ─────────────────────────────────────────────
function revealSurprise() {
  const overlay = document.getElementById('surpriseOverlay');
  const btn = document.getElementById('secretBtn');
  if (!overlay) return;

  // Unlock the lock icon
  if (btn) btn.textContent = '🔓';

  overlay.classList.add('open');
  // mini confetti burst
  launchConfetti(60);
}

function closeSurprise(e) {
  // close only if clicking backdrop or close button, not the card itself
  if (e && e.target === document.getElementById('surpriseCard')) return;
  if (e && document.getElementById('surpriseCard')?.contains(e.target) &&
    !e.target.classList.contains('surprise-close')) return;
  const overlay = document.getElementById('surpriseOverlay');
  if (overlay) overlay.classList.remove('open');
}

// ─────────────────────────────────────────────
// CONFETTI BURST
// ─────────────────────────────────────────────
function launchConfetti(count = 110) {
  const box = document.getElementById('confettiBox');
  if (!box) return;
  const colors = ['#ff6eb4', '#ffe066', '#ff9a3c', '#98ff98', '#87ceeb', '#da70d6', '#ff7f7f', '#fff', '#c77dff', '#ffb3de'];
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'confetti-piece';
    const col = colors[Math.floor(Math.random() * colors.length)];
    const size = 7 + Math.random() * 10;
    const dur = 2.5 + Math.random() * 2.5;
    const dly = Math.random() * 1.8;
    const isCircle = Math.random() > 0.55;
    p.style.cssText = `
      left:${Math.random() * 100}%;
      width:${size}px; height:${size * (isCircle ? 1 : 0.4 + Math.random() * 0.8)}px;
      background:${col};
      border-radius:${isCircle ? '50%' : '2px'};
      --dur:${dur}s; --delay:${dly}s;
    `;
    box.appendChild(p);
    setTimeout(() => p.remove(), (dur + dly) * 1000 + 300);
  }
}

// ─────────────────────────────────────────────
// CURSOR HEART TRAIL
// ─────────────────────────────────────────────
const trailEmojis = ['💕', '✨', '💖', '⭐', '🌸', '💫', '🎀'];
let lastTrailTime = 0;
document.addEventListener('mousemove', (e) => {
  const now = Date.now();
  if (now - lastTrailTime < 90) return; // throttle
  lastTrailTime = now;
  const t = document.createElement('span');
  t.className = 'cursor-trail';
  t.textContent = trailEmojis[Math.floor(Math.random() * trailEmojis.length)];
  t.style.left = e.clientX + 'px';
  t.style.top = e.clientY + 'px';
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 900);
});

// ─────────────────────────────────────────────
// BIRTHDAY CANDLES
// ─────────────────────────────────────────────
let candlesBlown = 0;
const CANDLE_WISHES = [
  'One wish made... ✨',
  'Two wishes! Almost there... 🕯️',
  '🎂 Happy Birthday Month, Shubhi! 🎂'
];

function blowCandle(el, num) {
  if (el.classList.contains('out')) return;
  el.classList.add('out');
  candlesBlown++;

  // Add smoke puff
  const smoke = document.createElement('span');
  smoke.className = 'smoke';
  smoke.textContent = '💨';
  el.appendChild(smoke);
  setTimeout(() => smoke.remove(), 800);

  // Update wish text
  const wishEl = document.getElementById('wishText');
  if (wishEl) {
    wishEl.textContent = CANDLE_WISHES[candlesBlown - 1];
    wishEl.classList.remove('show');
    void wishEl.offsetWidth; // reflow to restart animation
    wishEl.classList.add('show');
  }

  // All blown — big confetti!
  if (candlesBlown >= 3) {
    setTimeout(() => launchConfetti(160), 400);
  }
}

// Reset candles when returning to page 1
function resetCandles() {
  candlesBlown = 0;
  [1, 2, 3].forEach(n => {
    const c = document.getElementById(`c${n}`);
    if (c) {
      c.classList.remove('out');
      // Restore flame
      if (!c.querySelector('.flame')) {
        const f = document.createElement('div');
        f.className = 'flame';
        f.innerHTML = '<div class="flame-core"></div>';
        c.insertBefore(f, c.querySelector('.wick'));
      }
    }
  });
  const w = document.getElementById('wishText');
  if (w) { w.textContent = ''; w.classList.remove('show'); }
}

// ─────────────────────────────────────────────
// SPARKLES on click
// ─────────────────────────────────────────────
document.addEventListener('click', (e) => {
  if (e.target.closest('button,input,.music-bar,.candle,.flip-card')) return;
  const palettes = {
    1: ['#ff6eb4', '#ffe066', '#ff9a3c', '#fff'],
    2: ['#f0a8b0', '#4fc3f7', '#80cbc4', '#fff'],
    3: ['#f7c59f', '#c77dff', '#ff6b8a', '#fff']
  };
  const colors = palettes[currentPage];
  for (let i = 0; i < 14; i++) {
    const spark = document.createElement('div');
    spark.className = 'sparkle';
    const angle = (i / 14) * Math.PI * 2;
    const dist = 20 + Math.random() * 45;
    spark.style.cssText = `left:${e.clientX - 3}px;top:${e.clientY - 3}px;background:${colors[Math.floor(Math.random() * colors.length)]};transform:translate(${Math.cos(angle) * dist}px,${Math.sin(angle) * dist}px);width:${4 + Math.random() * 7}px;height:${4 + Math.random() * 7}px;`;
    document.body.appendChild(spark);
    setTimeout(() => spark.remove(), 1600);
  }
});

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  const fab1 = document.getElementById('fab1');
  if (fab1) fab1.style.display = 'flex';
  startBalloons();
  initGifFloaters(1);

  // Confetti burst on load (after short delay)
  setTimeout(() => launchConfetti(110), 600);

  // Reset candles when coming back to page 1
  const origGoToPage = window.goToPage;

  // Try auto-play on first tap
  document.addEventListener('click', () => {
    const aud = document.getElementById(`audio${currentPage}`);
    const fab = document.getElementById(`fab${currentPage}`);
    if (aud && aud.paused && aud.src !== window.location.href) {
      aud.play().then(() => {
        updatePlayBtn(currentPage, true);
        fab?.classList.add('active');
        startEqualizer(currentPage);
      }).catch(() => { });
    }
  }, { once: true });
});

