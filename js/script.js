/* ============================================================
   NovaCalc — script.js
   Futuristic Scientific Calculator
   ============================================================ */

'use strict';

/* ── State ──────────────────────────────────────────────── */
const state = {
  expr:      '',          // current display expression
  result:    '0',         // current result display
  operator:  null,
  prevValue: null,
  waitingForOperand: false,
  angleMode: 'RAD',       // 'RAD' | 'DEG'
  history:   [],
  soundOn:   false,
  theme:     'nebula',
  activated: false,
};

/* ── DOM refs ───────────────────────────────────────────── */
const $ = id => document.getElementById(id);
const calcWrapper = $('calc-wrapper');
const calc        = $('calc');
const displayMain = $('display-main');
const displayExpr = $('display-expr');
const calcMode    = $('calc-mode');
const histPanel   = $('history-panel');
const histList    = $('history-list');
const histEmpty   = $('history-empty');
const soundToggle = $('sound-toggle');
const histToggle  = $('history-toggle');
const clearHist   = $('clear-history');

/* ── Audio Context (Web Audio API) ─────────────────────── */
let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playClick() {
  if (!state.soundOn) return;
  try {
    const ctx  = getAudioCtx();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(900, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.06);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.start();
    osc.stop(ctx.currentTime + 0.09);
  } catch {}
}

function playActivate() {
  if (!state.soundOn) return;
  try {
    const ctx  = getAudioCtx();
    [600, 900, 1200].forEach((freq, i) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      const t = ctx.currentTime + i * 0.09;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.06, t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.start(t);
      osc.stop(t + 0.22);
    });
  } catch {}
}

function playResult() {
  if (!state.soundOn) return;
  try {
    const ctx  = getAudioCtx();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(523, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  } catch {}
}

/* ── Particle Canvas ────────────────────────────────────── */
(function initParticles() {
  const canvas = $('particle-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles = [];

  const PARTICLE_COUNT = 60;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function rand(a, b) { return a + Math.random() * (b - a); }

  function makeParticle() {
    return {
      x:    rand(0, W),
      y:    rand(0, H),
      r:    rand(0.5, 2.5),
      vx:   rand(-0.15, 0.15),
      vy:   rand(-0.3, -0.05),
      a:    rand(0.1, 0.7),
      da:   rand(-0.002, 0.002),
    };
  }

  function getGlowColor() {
    const theme = document.body.dataset.theme;
    const map = {
      nebula: '77,159,255',
      matrix: '0,255,136',
      solar:  '255,149,0',
      arctic: '168,230,255',
    };
    return map[theme] || '77,159,255';
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const rgb = getGlowColor();

    particles.forEach(p => {
      p.x  += p.vx;
      p.y  += p.vy;
      p.a  += p.da;
      if (p.a < 0.05 || p.a > 0.8) p.da *= -1;
      if (p.y < -10) { p.y = H + 5; p.x = rand(0, W); }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${rgb},${p.a.toFixed(2)})`;
      ctx.fill();
    });

    requestAnimationFrame(draw);
  }

  resize();
  for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(makeParticle());
  draw();
  window.addEventListener('resize', resize);
})();

/* ── Floating Math Symbols ──────────────────────────────── */
(function initSymbols() {
  const container = $('math-symbols');
  if (!container) return;
  const syms = ['π','∞','∑','√','Δ','θ','∫','∂','α','β','λ','φ','ψ','Ω','≈','≠','±'];

  function spawn() {
    const el = document.createElement('span');
    el.className = 'math-sym';
    el.textContent = syms[Math.floor(Math.random() * syms.length)];
    el.style.left = Math.random() * 95 + 'vw';
    const dur = 18 + Math.random() * 20;
    el.style.animationDuration = dur + 's';
    el.style.animationDelay = (Math.random() * -dur) + 's';
    container.appendChild(el);
    setTimeout(() => el.remove(), (dur + 2) * 1000);
  }

  for (let i = 0; i < 18; i++) spawn();
  setInterval(spawn, 2500);
})();

/* ── Theme ──────────────────────────────────────────────── */
function setTheme(theme) {
  state.theme = theme;
  document.body.dataset.theme = theme;
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === theme);
  });
  localStorage.setItem('novacalc-theme', theme);
}

document.querySelectorAll('.theme-btn').forEach(btn => {
  btn.addEventListener('click', () => setTheme(btn.dataset.theme));
});

/* ── Sound Toggle ───────────────────────────────────────── */
soundToggle.addEventListener('click', () => {
  state.soundOn = !state.soundOn;
  soundToggle.classList.toggle('active', state.soundOn);
  const waves = soundToggle.querySelectorAll('.sound-wave-1, .sound-wave-2');
  waves.forEach(w => {
    w.style.opacity = state.soundOn ? '1' : '0.2';
  });
  localStorage.setItem('novacalc-sound', state.soundOn ? '1' : '0');
  if (state.soundOn) playActivate();
});

/* ── Activation ─────────────────────────────────────────── */
function activate() {
  if (state.activated) return;
  state.activated = true;
  calcWrapper.classList.add('activate-anim');
  playActivate();
  setTimeout(() => {
    calcWrapper.classList.remove('activate-anim');
    calcWrapper.classList.add('active');
  }, 450);
}

calc.addEventListener('click', () => {
  if (!state.activated) activate();
});

/* ── Calculator Logic ───────────────────────────────────── */
function toRad(deg) { return deg * Math.PI / 180; }
function toDeg(rad) { return rad * 180 / Math.PI; }

function applyAngle(val) {
  return state.angleMode === 'DEG' ? toRad(val) : val;
}

function factorial(n) {
  if (n < 0 || !Number.isInteger(n)) return NaN;
  if (n === 0 || n === 1) return 1;
  if (n > 170) return Infinity;
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

function formatResult(n) {
  if (!isFinite(n)) return n > 0 ? '∞' : n < 0 ? '-∞' : 'Error';
  if (isNaN(n)) return 'Error';
  // Use toPrecision for large/small numbers
  if (Math.abs(n) >= 1e12 || (Math.abs(n) < 1e-9 && n !== 0)) {
    return n.toExponential(6).replace(/\.?0+e/, 'e');
  }
  // Trim floating point noise
  const s = parseFloat(n.toPrecision(12)).toString();
  return s;
}

/* Safe eval using Function (sandboxed expression parser) */
function safeEval(expr) {
  // Replace display operators and inject Math
  let e = expr
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/π/g, `(${Math.PI})`)
    .replace(/e(?![a-z])/g, `(${Math.E})`);

  // Only allow safe characters
  if (/[^0-9+\-*/^().,% ]/.test(e)) throw new Error('Invalid expression');

  // eslint-disable-next-line no-new-func
  const result = Function(`"use strict"; return (${e})`)();
  return result;
}

function evaluate() {
  if (!state.expr && state.result !== '0') return;
  const raw = state.expr || state.result;
  let val;
  try {
    val = safeEval(raw);
    if (isNaN(val)) throw new Error();
  } catch {
    displayMain.textContent = 'Error';
    displayMain.classList.add('error');
    setTimeout(() => {
      displayMain.classList.remove('error');
      displayMain.textContent = state.result || '0';
    }, 1200);
    return;
  }

  const resultStr = formatResult(val);

  // History
  addToHistory(raw, resultStr);

  // Update display
  displayExpr.textContent = raw + ' =';
  displayMain.textContent = resultStr;
  displayMain.classList.add('result-flash');
  setTimeout(() => displayMain.classList.remove('result-flash'), 500);

  // Equals pulse
  const eqBtn = document.querySelector('[data-action="="]');
  if (eqBtn) {
    eqBtn.classList.add('pulse');
    setTimeout(() => eqBtn.classList.remove('pulse'), 500);
  }

  playResult();

  state.result = resultStr;
  state.expr   = resultStr;
  state.waitingForOperand = true;
}

function appendToExpr(ch) {
  if (state.waitingForOperand) {
    // If char is an operator, continue with result
    if ('+-*/'.includes(ch)) {
      state.expr = state.result + ch;
    } else {
      state.expr = ch;
    }
    state.waitingForOperand = false;
  } else {
    state.expr += ch;
  }
  displayExpr.textContent = '';
  displayMain.textContent = state.expr || '0';
  state.result = state.expr;
}

function applyScientific(action) {
  const cur = parseFloat(state.result);
  let out;

  switch (action) {
    case 'sin':   out = Math.sin(applyAngle(cur)); break;
    case 'cos':   out = Math.cos(applyAngle(cur)); break;
    case 'tan':   out = Math.tan(applyAngle(cur)); break;
    case 'asin':  out = state.angleMode === 'DEG'
                        ? toDeg(Math.asin(cur)) : Math.asin(cur); break;
    case 'acos':  out = state.angleMode === 'DEG'
                        ? toDeg(Math.acos(cur)) : Math.acos(cur); break;
    case 'atan':  out = state.angleMode === 'DEG'
                        ? toDeg(Math.atan(cur)) : Math.atan(cur); break;
    case 'sqrt':  out = Math.sqrt(cur); break;
    case 'sq':    out = cur * cur; break;
    case 'cube':  out = cur * cur * cur; break;
    case 'log':   out = Math.log10(cur); break;
    case 'ln':    out = Math.log(cur); break;
    case 'inv':   out = 1 / cur; break;
    case 'abs':   out = Math.abs(cur); break;
    case 'fact':  out = factorial(Math.round(cur)); break;
    case 'pi':
      appendToExpr(Math.PI.toString());
      return;
    case 'e':
      appendToExpr(Math.E.toString());
      return;
    case 'pow':
      appendToExpr(state.result + '**');
      return;
    case 'mod':
      appendToExpr(state.result + '%');
      return;
    case '(':
      appendToExpr('(');
      return;
    case ')':
      appendToExpr(')');
      return;
    default: return;
  }

  const resultStr = formatResult(out);
  const exprStr   = `${action}(${cur})`;
  addToHistory(exprStr, resultStr);
  displayExpr.textContent = exprStr + ' =';
  displayMain.textContent = resultStr;
  displayMain.classList.add('result-flash');
  setTimeout(() => displayMain.classList.remove('result-flash'), 500);
  playResult();
  state.result = resultStr;
  state.expr   = resultStr;
  state.waitingForOperand = true;
}

function handleButton(action) {
  if (!state.activated) activate();
  playClick();

  // Scientific functions
  const sciActions = ['sin','cos','tan','asin','acos','atan','sqrt','sq','cube',
    'log','ln','inv','abs','fact','pi','e','pow','mod','(', ')'];
  if (sciActions.includes(action)) {
    applyScientific(action);
    return;
  }

  switch (action) {
    case 'AC':
      state.expr   = '';
      state.result = '0';
      state.waitingForOperand = false;
      displayMain.textContent = '0';
      displayExpr.textContent = '';
      break;
    case 'DEL':
      if (state.waitingForOperand) break;
      state.expr = state.expr.slice(0, -1);
      if (!state.expr) state.expr = '0';
      displayMain.textContent = state.expr;
      state.result = state.expr;
      break;
    case '%':
      if (state.result !== '') {
        const v = parseFloat(state.result) / 100;
        const vs = formatResult(v);
        if (state.expr.match(/[+\-*/]$/)) {
          appendToExpr(vs);
        } else {
          state.expr   = vs;
          state.result = vs;
          displayMain.textContent = vs;
        }
      }
      break;
    case '=':
      evaluate();
      break;
    default:
      appendToExpr(action);
  }
}

/* ── Button Events ──────────────────────────────────────── */
document.querySelectorAll('.btn').forEach(btn => {
  const action = btn.dataset.action;
  if (!action) return;

  btn.addEventListener('click', () => {
    btn.classList.add('pressed');
    setTimeout(() => btn.classList.remove('pressed'), 100);
    handleButton(action);
  });

  // Ripple mouse tracking for glow effect
  btn.addEventListener('mousemove', e => {
    const r = btn.getBoundingClientRect();
    btn.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
    btn.style.setProperty('--my', ((e.clientY - r.top)  / r.height * 100) + '%');
  });
});

/* ── Keyboard Support ───────────────────────────────────── */
const keyMap = {
  'Enter':       '=',
  '=':           '=',
  'Escape':      'AC',
  'Backspace':   'DEL',
  'Delete':      'DEL',
  '+':           '+',
  '-':           '-',
  '*':           '*',
  '/':           '/',
  '.':           '.',
  '%':           '%',
  '(':           '(',
  ')':           ')',
  '0':'0','1':'1','2':'2','3':'3','4':'4',
  '5':'5','6':'6','7':'7','8':'8','9':'9',
};

document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') return;
  const action = keyMap[e.key];
  if (action) {
    e.preventDefault();
    handleButton(action);
    // Visual feedback on matching button
    const btn = document.querySelector(`.btn[data-action="${action}"]`);
    if (btn) {
      btn.classList.add('pressed');
      setTimeout(() => btn.classList.remove('pressed'), 120);
    }
  }
});

/* ── History ────────────────────────────────────────────── */
function addToHistory(expr, result) {
  state.history.unshift({ expr, result, id: Date.now() });
  if (state.history.length > 50) state.history.pop();
  saveHistory();
  renderHistory();
}

function renderHistory() {
  histList.innerHTML = '';
  const items = state.history;
  histEmpty.style.display = items.length ? 'none' : 'block';

  items.forEach(item => {
    const li = document.createElement('li');
    li.className = 'history-item';
    li.setAttribute('role', 'listitem');
    li.innerHTML = `
      <div class="hist-expr">${escapeHTML(item.expr)}</div>
      <div class="hist-result">${escapeHTML(item.result)}</div>
    `;
    // Click to reuse result
    li.addEventListener('click', () => {
      state.expr   = item.result;
      state.result = item.result;
      state.waitingForOperand = false;
      displayMain.textContent = item.result;
      displayExpr.textContent = item.expr + ' =';
    });
    histList.appendChild(li);
  });
}

function escapeHTML(str) {
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;');
}

function saveHistory() {
  try {
    localStorage.setItem('novacalc-history', JSON.stringify(state.history));
  } catch {}
}

function loadHistory() {
  try {
    const raw = localStorage.getItem('novacalc-history');
    if (raw) state.history = JSON.parse(raw);
    renderHistory();
  } catch {}
}

clearHist.addEventListener('click', () => {
  state.history = [];
  saveHistory();
  renderHistory();
});

/* ── History Toggle ─────────────────────────────────────── */
histToggle.addEventListener('click', () => {
  const hidden = histPanel.getAttribute('aria-hidden') === 'true';
  histPanel.setAttribute('aria-hidden', hidden ? 'false' : 'true');
  histToggle.classList.toggle('active', hidden);
});

/* ── Angle Mode ─────────────────────────────────────────── */
document.querySelectorAll('.angle-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    state.angleMode = btn.dataset.angle;
    calcMode.textContent = state.angleMode;
    document.querySelectorAll('.angle-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.angle === state.angleMode));
    localStorage.setItem('novacalc-angle', state.angleMode);
  });
});

/* ── Persist & Load Preferences ────────────────────────── */
(function loadPrefs() {
  const theme = localStorage.getItem('novacalc-theme') || 'nebula';
  setTheme(theme);

  const sound = localStorage.getItem('novacalc-sound');
  if (sound === '1') {
    state.soundOn = true;
    soundToggle.classList.add('active');
    soundToggle.querySelectorAll('.sound-wave-1, .sound-wave-2')
      .forEach(w => w.style.opacity = '1');
  }

  const angle = localStorage.getItem('novacalc-angle') || 'RAD';
  state.angleMode = angle;
  calcMode.textContent = angle;
  document.querySelectorAll('.angle-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.angle === angle));

  loadHistory();
})();
