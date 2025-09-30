// content/content.js
(() => {
  // Require the real engine that manifest loads before this file.
  const Engine = window.PassForge;
  if (!Engine || typeof Engine.score !== 'function' || typeof Engine.generate !== 'function') {
    console.error('[PassForge] Engine missing. Did common/strength.js fail to load?');
    return;
  }

  // Create the floating badge DOM once per attached input
  function createBadge() {
    const wrap = document.createElement('div');
    wrap.className = 'pf-badge pf-hidden';

    const meter = document.createElement('div');
    meter.className = 'pf-meter';
    const bar = document.createElement('div');
    meter.appendChild(bar);

    const label = document.createElement('span');
    label.className = 'pf-label';
    label.textContent = 'Strength';

    const btn = document.createElement('button');
    btn.className = 'pf-gen';
    btn.type = 'button';
    btn.textContent = 'Generate';

    wrap.appendChild(meter);
    wrap.appendChild(label);
    wrap.appendChild(btn);

    // Attach late so styles are applied even if <head> changes
    document.documentElement.appendChild(wrap);
    return { wrap, bar, label, btn };
  }

  // Position badge above the input (left-aligned)
  function placeBadge(badgeEl, input) {
    const rect = input.getBoundingClientRect();
    const top = window.scrollY + rect.top - 8; // 8px gap above
    const left = window.scrollX + rect.left;
    badgeEl.style.top = `${top}px`;
    badgeEl.style.left = `${left}px`;
  }

  // Update meter visuals from Engine.score
  function updateMeter(barEl, labelEl, value) {
    const { score, label, bits } = Engine.score(value);
    const widths = [10, 25, 50, 75, 100];
    const colors = ['#d9534f', '#f0ad4e', '#ffd66b', '#5cb85c', '#3fa34d'];
    barEl.style.width = widths[score] + '%';
    barEl.style.background = colors[score];
    labelEl.textContent = `${label} · ~${bits} bits`;
  }

  // Use native value setter so frameworks detect programmatic changes
  const nativeValueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;

  // Attach badge behavior to a single password input
  function attachTo(input) {
    if (!input || input.dataset.pfBound === '1') return; // prevent double-binding
    input.dataset.pfBound = '1';

    const { wrap, bar, label, btn } = createBadge();

    const isVisible = () => !wrap.classList.contains('pf-hidden');

    function show() {
      wrap.classList.remove('pf-hidden');
      placeBadge(wrap, input);
      updateMeter(bar, label, input.value || '');
    }

    // Hide only if focus is outside both the input and the badge
    function hideIfOutsideFocus() {
      setTimeout(() => {
        const ae = document.activeElement;
        if (ae === input) return;
        if (wrap.contains(ae)) return;
        wrap.classList.add('pf-hidden');
      }, 0);
    }

    // Keep badge aligned on scroll/resize (throttled via rAF)
    const throttledReposition = (() => {
      let rAF = null;
      return () => {
        if (rAF) return;
        rAF = requestAnimationFrame(() => {
          rAF = null;
          if (isVisible()) placeBadge(wrap, input);
        });
      };
    })();

    window.addEventListener('scroll', throttledReposition, { passive: true });
    window.addEventListener('resize', throttledReposition);

    // Show on focus; consider hiding on blur if not interacting with badge
    input.addEventListener('focus', show);
    input.addEventListener('blur', hideIfOutsideFocus);

    // Update as the user types
    input.addEventListener('input', () => updateMeter(bar, label, input.value || ''));

    // Keep the badge visible while clicking/tapping inside it (prevents blur race)
    wrap.addEventListener('mousedown', show, { capture: true });
    wrap.addEventListener('pointerdown', show, { capture: true });

    // Generate and fill directly into the field
    btn.addEventListener('click', () => {
      const pass = Engine.generate({ length: 16, symbols: true, upper: true, lower: true, digits: true });

      if (nativeValueSetter) {
        nativeValueSetter.call(input, pass);
      } else {
        input.value = pass;
      }

      // Notify site listeners (React/Vue/etc.)
      input.dispatchEvent(new Event('input',  { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));

      updateMeter(bar, label, pass);
      placeBadge(wrap, input); // re-align in case layout shifted
      setTimeout(hideIfOutsideFocus, 150);
    });
  }

  // Initial scan
  function scan() {
    document.querySelectorAll('input[type="password"]').forEach(attachTo);
  }

  // Observe dynamically added password fields
  const mo = new MutationObserver((muts) => {
    for (const m of muts) {
      m.addedNodes && m.addedNodes.forEach(node => {
        if (node.nodeType !== 1) return;
        if (node.matches && node.matches('input[type="password"]')) attachTo(node);
        if (node.querySelectorAll) node.querySelectorAll('input[type="password"]').forEach(attachTo);
      });
    }
  });

  // Boot
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scan);
  } else {
    scan();
  }
  mo.observe(document.documentElement, { childList: true, subtree: true });
})();
