/**
 * particles.js — Animated pixel particle background
 */

const canvas = document.getElementById('particle-canvas');
const ctx = canvas.getContext('2d');

let particles = [];
let W, H;

function resize() {
  W = canvas.width  = window.innerWidth;
  H = canvas.height = window.innerHeight;
}

window.addEventListener('resize', resize);
resize();

function getColor() {
  const charged = document.body.classList.contains('charged');
  if (charged) {
    const variants = [
      'rgba(0,229,255,0.7)', 'rgba(0,200,230,0.5)', 'rgba(100,240,255,0.4)',
      'rgba(0,150,200,0.3)', 'rgba(50,220,255,0.6)'
    ];
    return variants[Math.floor(Math.random() * variants.length)];
  } else {
    const variants = [
      'rgba(0,255,102,0.8)', 'rgba(0,200,80,0.6)', 'rgba(57,255,138,0.5)',
      'rgba(0,150,60,0.4)',  'rgba(0,255,50,0.7)'
    ];
    return variants[Math.floor(Math.random() * variants.length)];
  }
}

function createParticle() {
  const size = Math.random() < 0.3 ? Math.floor(Math.random() * 3 + 2) * 4 : 2;
  return {
    x: Math.random() * W,
    y: Math.random() * H,
    vx: (Math.random() - 0.5) * 0.4,
    vy: -Math.random() * 0.6 - 0.1,
    size,
    life: 1,
    decay: Math.random() * 0.002 + 0.001,
    color: getColor(),
    twinkle: Math.random() * Math.PI * 2,
    twinkleSpeed: Math.random() * 0.04 + 0.01,
  };
}

// Initialize
for (let i = 0; i < 120; i++) {
  const p = createParticle();
  p.y = Math.random() * H; // spread vertically on init
  particles.push(p);
}

function animate() {
  ctx.clearRect(0, 0, W, H);

  particles.forEach((p, i) => {
    p.x += p.vx;
    p.y += p.vy;
    p.life -= p.decay;
    p.twinkle += p.twinkleSpeed;

    const alpha = p.life * (0.6 + 0.4 * Math.sin(p.twinkle));

    ctx.save();
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.fillStyle = p.color;
    // Pixel-art style squares for larger ones
    if (p.size >= 4) {
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
    } else {
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    if (p.life <= 0 || p.y < -20 || p.x < -20 || p.x > W + 20) {
      particles[i] = createParticle();
    }
  });

  requestAnimationFrame(animate);
}

animate();
