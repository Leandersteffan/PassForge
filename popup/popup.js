// Select the engine: prefer the real one (window.PassForge), otherwise use a tiny fallback.
function getEngine() {
  const p = window.PassForge;
  if (p && typeof p.score === 'function' && typeof p.generate === 'function') {
    return p;
  }

  console.warn('[PassForge] Using fallback engine (implement common/strength.js to replace this).');

  // Minimal fallback so the popup is usable while we build the real engine.
  return {
    score(s) {
      const len = (s || '').length;
      let score = 0, label = 'Very weak';
      if (len >= 6)  { score = 1; label = 'Weak'; }
      if (len >= 10) { score = 2; label = 'Fair'; }
      if (len >= 14) { score = 3; label = 'Strong'; }
      if (len >= 18) { score = 4; label = 'Excellent'; }
      return { score, label, bits: len * 2 }; // placeholder “bits”
    },
    generate(opts = {}) {
      const length = Math.min(Math.max(Number(opts.length) || 16, 8), 64);
      // simple alnum pool (the real engine will honor opts.upper/lower/digits/symbols)
      const pool = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      const rnd = new Uint32Array(length);
      crypto.getRandomValues(rnd);
      let out = '';
      for (let i = 0; i < length; i++)
        out += pool[rnd[i] % pool.length];
      return out;
    }
  };
}

const Engine = getEngine();

// Elements
const pwd   = document.getElementById('pwd');
const bar   = document.getElementById('bar');
const label = document.getElementById('label');

const len   = document.getElementById('len');
const optU  = document.getElementById('opt-upper');
const optL  = document.getElementById('opt-lower');
const optD  = document.getElementById('opt-digits');
const optS  = document.getElementById('opt-symbols');

const out     = document.getElementById('out');
const genBtn  = document.getElementById('gen');
const copyBtn = document.getElementById('copy');
const fillBtn = document.getElementById('fill');

// UI helpers
function updateMeter(value) {
  const { score, label: lab, bits } = Engine.score(value);
  const widths = [10, 25, 50, 75, 100];
  const colors = ['#d9534f', '#f0ad4e', '#ffd66b', '#5cb85c', '#3fa34d'];
  bar.style.width = widths[score] + '%';
  bar.style.background = colors[score];
  label.textContent = `${lab} · ~${bits} bits`;
}

// Events
pwd.addEventListener('input', e => updateMeter(e.target.value));

genBtn.addEventListener('click', () => {
  const pass = Engine.generate({
    length: Number(len.value),
    upper: optU.checked,
    lower: optL.checked,
    digits: optD.checked,
    symbols: optS.checked
  });
  out.value = pass;
  updateMeter(pass);
});

copyBtn.addEventListener('click', async () => {
  if (!out.value) return;
  await navigator.clipboard.writeText(out.value);
  copyBtn.textContent = 'Copied!';
  setTimeout(() => (copyBtn.textContent = 'Copy'), 1200);
});

fillBtn.addEventListener('click', async () => {
  if (!out.value) return;
  await navigator.clipboard.writeText(out.value);
  fillBtn.textContent = 'Copied – paste in field';
  setTimeout(() => (fillBtn.textContent = 'Fill field'), 1500);
});

// Initial
updateMeter('');
