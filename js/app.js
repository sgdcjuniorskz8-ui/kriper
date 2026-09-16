/**
 * app.js — Creeper Hub Main Application Logic
 */

import { playHiss, playExplosion, playLightning, playCatMeow } from './audio.js';

/* ═══════════════════════════════════════════════
   1. CHARGED MODE TOGGLE
═══════════════════════════════════════════════ */
const chargedToggle = document.getElementById('charged-toggle');
chargedToggle.addEventListener('click', () => {
  document.body.classList.toggle('charged');
  const isCharged = document.body.classList.contains('charged');
  if (isCharged) playLightning();
  chargedToggle.querySelector('.toggle-label').textContent = isCharged ? '⚡ CHARGED' : '☢ NORMAL';
});

/* ═══════════════════════════════════════════════
   2. SCROLL-IN ANIMATIONS
═══════════════════════════════════════════════ */
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.fade-in-up').forEach(el => observer.observe(el));

/* ═══════════════════════════════════════════════
   3. LIGHTBOX
═══════════════════════════════════════════════ */
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxCaption = document.getElementById('lightbox-caption');

document.querySelectorAll('.gallery-item[data-src]').forEach(item => {
  item.addEventListener('click', () => {
    lightboxImg.src = item.dataset.src;
    lightboxCaption.textContent = item.dataset.caption || '';
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  });
});

document.getElementById('lightbox-close').addEventListener('click', closeLightbox);
lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });

function closeLightbox() {
  lightbox.classList.remove('active');
  document.body.style.overflow = '';
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeLightbox();
});

/* ═══════════════════════════════════════════════
   4. DAMAGE CALCULATOR
═══════════════════════════════════════════════ */
const difficultyMap = {
  easy:   { max: 25,  radius: 3.5, name: 'Easy' },
  normal: { max: 49,  radius: 4.0, name: 'Normal' },
  hard:   { max: 75,  radius: 4.5, name: 'Hard' },
  charged:{ max: 127, radius: 5.5, name: 'Заряженный' }
};

const blastProtMap = { 0: 1.0, 1: 0.84, 2: 0.68, 3: 0.52, 4: 0.36 };

function calcDamage() {
  const diff = document.getElementById('calc-diff').value;
  const dist = parseFloat(document.getElementById('calc-dist').value);
  const bp = parseInt(document.getElementById('calc-bp').value);
  const armor = parseFloat(document.getElementById('calc-armor').value) / 100;

  const d = difficultyMap[diff];
  const distFactor = Math.max(0, 1 - dist / (d.radius * 2));
  let rawDmg = Math.round(d.max * distFactor);
  const afterBp = Math.round(rawDmg * blastProtMap[bp]);
  const afterArmor = Math.round(afterBp * (1 - armor * 0.8));
  const finalDmg = Math.max(0, afterArmor);

  document.getElementById('calc-dist-val').textContent = `${dist.toFixed(1)}m`;
  document.getElementById('calc-result-number').textContent = finalDmg;
  document.getElementById('calc-result-number').style.animation = 'none';
  requestAnimationFrame(() => {
    document.getElementById('calc-result-number').style.animation = 'damagePulse 0.5s ease';
  });

  const maxPossible = 127;
  setBar('bar-raw', rawDmg, maxPossible, '#ff6600');
  setBar('bar-bp', afterBp, maxPossible, '#ff4400');
  setBar('bar-final', finalDmg, maxPossible, '#ff2200');

  document.getElementById('bar-raw-val').textContent = rawDmg + ' HP';
  document.getElementById('bar-bp-val').textContent = afterBp + ' HP';
  document.getElementById('bar-final-val').textContent = finalDmg + ' HP';

  // Survival text
  const survival = finalDmg <= 0 ? '🛡 Вы выживете даже с 1 HP!' :
                   finalDmg < 10 ? '✅ Выживаемость высокая' :
                   finalDmg < 30 ? '⚠️ Выживаемость средняя' :
                   finalDmg < 50 ? '🔶 Критическая зона' :
                   '💀 Почти смертельно';
  document.getElementById('survival-text').textContent = survival;
}

function setBar(id, val, max, color) {
  const fill = document.getElementById(id);
  const pct = Math.min(100, (val / max) * 100);
  fill.style.width = pct + '%';
}

['calc-diff','calc-dist','calc-bp','calc-armor'].forEach(id => {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('input', calcDamage);
  el.addEventListener('change', calcDamage);
});

calcDamage();

/* ═══════════════════════════════════════════════
   5. FUSE SIMULATOR
═══════════════════════════════════════════════ */
let fuseInterval = null;
let fuseRunning = false;

document.getElementById('fuse-btn').addEventListener('click', () => {
  if (fuseRunning) return;
  fuseRunning = true;
  const btn = document.getElementById('fuse-btn');
  const display = document.getElementById('countdown-display');
  const status = document.getElementById('fuse-status');
  btn.disabled = true;
  btn.textContent = '🔥 ГОРИТ...';

  let count = 3;
  display.textContent = count;
  status.textContent = 'Шипение активировано...';
  playHiss(3);

  fuseInterval = setInterval(() => {
    count--;
    if (count > 0) {
      display.textContent = count;
      display.style.color = count === 2 ? '#ff8800' : '#ff2200';
    } else {
      clearInterval(fuseInterval);
      display.textContent = '💥';
      status.textContent = 'БА-БАХ! Удар молнии зафиксирован';
      playExplosion();

      // Screen shake
      document.querySelector('.site-wrapper').classList.add('shake');
      setTimeout(() => document.querySelector('.site-wrapper').classList.remove('shake'), 700);

      // Flash
      const flash = document.getElementById('explosion-flash');
      flash.style.opacity = '1';
      setTimeout(() => { flash.style.opacity = '0'; }, 200);
      setTimeout(() => { flash.style.opacity = '0.5'; }, 350);
      setTimeout(() => { flash.style.opacity = '0'; }, 500);

      setTimeout(() => {
        display.textContent = '—';
        display.style.color = '';
        btn.disabled = false;
        btn.textContent = '☢ ПОДЖЕЧЬ КРИПЕРА';
        status.textContent = 'Ожидание активации...';
        fuseRunning = false;
      }, 3000);
    }
  }, 1000);
});

/* ═══════════════════════════════════════════════
   6. CAT SOUND BUTTON
═══════════════════════════════════════════════ */
const catBtn = document.getElementById('cat-btn');
if (catBtn) {
  catBtn.addEventListener('click', () => {
    playCatMeow();
    catBtn.textContent = '🐱 МЯЯЯУ!';
    catBtn.style.color = '#ff69b4';
    setTimeout(() => {
      catBtn.textContent = '🐱 Испугать крипера котом';
      catBtn.style.color = '';
    }, 1500);
  });
}

/* ═══════════════════════════════════════════════
   7. ANATOMY HOTSPOTS
═══════════════════════════════════════════════ */
document.querySelectorAll('.anatomy-hotspot').forEach(hs => {
  hs.addEventListener('click', () => {
    const target = hs.dataset.target;
    document.querySelectorAll('.anatomy-point').forEach(p => p.classList.remove('active'));
    const point = document.getElementById(target);
    if (point) {
      point.classList.add('active');
      point.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });
});

document.querySelectorAll('.anatomy-point').forEach(pt => {
  pt.addEventListener('click', () => {
    document.querySelectorAll('.anatomy-point').forEach(p => p.classList.remove('active'));
    pt.classList.add('active');
  });
});

/* ═══════════════════════════════════════════════
   8. PIXEL SKIN BUILDER
═══════════════════════════════════════════════ */
const skinCanvas = document.getElementById('creeper-canvas');
if (skinCanvas) {
  const sCtx = skinCanvas.getContext('2d');
  const PIXEL = 20;
  const COLS = 8, ROWS = 12;
  skinCanvas.width  = COLS * PIXEL;
  skinCanvas.height = ROWS * PIXEL;

  // Default creeper face palette data (8x12 grid)
  // 0=bg, 1=skin, 2=dark, 3=darker, 4=eye, 5=mouth
  const DEFAULT_FACE = [
    [0,0,0,0,0,0,0,0],
    [0,1,1,1,1,1,1,0],
    [0,1,1,1,1,1,1,0],
    [0,1,4,1,1,4,1,0],
    [0,1,4,1,1,4,1,0],
    [0,1,1,1,1,1,1,0],
    [0,1,1,5,5,1,1,0],
    [0,1,5,5,5,5,1,0],
    [0,1,5,1,1,5,1,0],
    [0,1,1,5,5,1,1,0],
    [0,1,1,1,1,1,1,0],
    [0,0,0,0,0,0,0,0],
  ];

  let colorMap = {
    0: '#020905',
    1: '#4a7a44',
    2: '#3a5c36',
    3: '#2a4028',
    4: '#1a2a18',
    5: '#1a2a18'
  };

  let grid = DEFAULT_FACE.map(row => [...row]);
  let selectedColor = 1;
  let painting = false;

  function drawGrid() {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        sCtx.fillStyle = colorMap[grid[r][c]] || '#020905';
        sCtx.fillRect(c * PIXEL, r * PIXEL, PIXEL, PIXEL);
        // Pixel border
        sCtx.strokeStyle = 'rgba(0,0,0,0.4)';
        sCtx.lineWidth = 0.5;
        sCtx.strokeRect(c * PIXEL, r * PIXEL, PIXEL, PIXEL);
      }
    }
  }

  function getCell(e) {
    const rect = skinCanvas.getBoundingClientRect();
    const scaleX = skinCanvas.width / rect.width;
    const scaleY = skinCanvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    return { c: Math.floor(x / PIXEL), r: Math.floor(y / PIXEL) };
  }

  function paint(e) {
    const { c, r } = getCell(e);
    if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
      grid[r][c] = selectedColor;
      drawGrid();
    }
  }

  skinCanvas.addEventListener('mousedown', (e) => { painting = true; paint(e); });
  skinCanvas.addEventListener('mousemove', (e) => { if (painting) paint(e); });
  window.addEventListener('mouseup', () => { painting = false; });

  // Palette buttons
  const skinColors = ['#4a7a44','#3a5c36','#2a4028','#1a2a18','#7ab36a',
                      '#ff6600','#ff0000','#ffcc00','#00aaff','#aa00ff',
                      '#ffffff','#888888','#333333','#020905','#ff66aa'];

  const palette = document.getElementById('skin-palette');
  if (palette) {
    skinColors.forEach((color, i) => {
      const btn = document.createElement('button');
      btn.className = 'palette-color' + (i === 0 ? ' selected' : '');
      btn.style.background = color;
      btn.title = color;
      btn.addEventListener('click', () => {
        document.querySelectorAll('.palette-color').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        // Map palette index to a grid color key (custom)
        colorMap[99] = color; // use key 99 for custom
        // Reassign selectedColor to key matching this color or use 99
        let found = Object.entries(colorMap).find(([k,v]) => v === color);
        selectedColor = found ? parseInt(found[0]) : (() => {
          const newKey = Object.keys(colorMap).length + 10;
          colorMap[newKey] = color;
          return newKey;
        })();
      });
      palette.appendChild(btn);
    });
  }

  // Reset button
  document.getElementById('skin-reset')?.addEventListener('click', () => {
    colorMap = { 0:'#020905',1:'#4a7a44',2:'#3a5c36',3:'#2a4028',4:'#1a2a18',5:'#1a2a18' };
    grid = DEFAULT_FACE.map(row => [...row]);
    drawGrid();
  });

  // Download button
  document.getElementById('skin-download')?.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'my-creeper.png';
    link.href = skinCanvas.toDataURL('image/png');
    link.click();
  });

  drawGrid();
}

/* ═══════════════════════════════════════════════
   9. SMOOTH SCROLL for NAV LINKS
═══════════════════════════════════════════════ */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    const target = document.querySelector(a.getAttribute('href'));
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  });
});

/* ═══════════════════════════════════════════════
   10. NAV ACTIVE STATE on SCROLL
═══════════════════════════════════════════════ */
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a');

window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(sec => {
    if (window.scrollY >= sec.offsetTop - 120) current = sec.id;
  });
  navLinks.forEach(a => {
    a.style.color = a.getAttribute('href') === '#' + current
      ? 'var(--neon-green)' : '';
  });
}, { passive: true });
