// =============================================
// TALENT FACTORY — WAITLIST SCRIPT
// =============================================

const API_URL = 'https://tf-backend-t5k7.onrender.com/api/waitlist';

const form        = document.getElementById('waitlist-form');
const submitBtn   = document.getElementById('submit-btn');
const successState = document.getElementById('success-state');
const successEmail = document.getElementById('success-email');

// ── Validation helpers ────────────────────────
function setError(inputId, errorId, show) {
  const input = document.getElementById(inputId);
  const error = document.getElementById(errorId);
  if (!input || !error) return;
  if (show) {
    input.classList.add('err');
    error.classList.add('show');
  } else {
    input.classList.remove('err');
    error.classList.remove('show');
  }
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateForm() {
  let valid = true;
  const firstName = document.getElementById('first-name').value.trim();
  const lastName  = document.getElementById('last-name').value.trim();
  const email     = document.getElementById('email').value.trim();
  const interest  = document.getElementById('interest').value;

  if (!firstName) { setError('first-name', 'err-first', true);    valid = false; }
  else             { setError('first-name', 'err-first', false); }

  if (!lastName)  { setError('last-name', 'err-last', true);     valid = false; }
  else             { setError('last-name', 'err-last', false); }

  if (!email || !validateEmail(email)) { setError('email', 'err-email', true);    valid = false; }
  else                                  { setError('email', 'err-email', false); }

  if (!interest)  { setError('interest', 'err-interest', true);  valid = false; }
  else             { setError('interest', 'err-interest', false); }

  return valid;
}

// ── Clear errors on input ─────────────────────
[
  ['first-name', 'err-first'],
  ['last-name',  'err-last'],
  ['email',      'err-email'],
  ['interest',   'err-interest'],
].forEach(([id, errId]) => {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('input',  () => setError(id, errId, false));
  el.addEventListener('change', () => setError(id, errId, false));
});

// ── Submit handler ────────────────────────────
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!validateForm()) return;

  const email   = document.getElementById('email').value.trim();
  const payload = {
    first_name:   document.getElementById('first-name').value.trim(),
    last_name:    document.getElementById('last-name').value.trim(),
    email,
    interest:     document.getElementById('interest').value,
    company:      document.getElementById('company').value.trim(),
    submitted_at: new Date().toISOString(),
  };

  submitBtn.classList.add('loading');
  submitBtn.disabled = true;

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Server responded with ${res.status}`);
    showSuccess(email);
  } catch (err) {
    console.error('Submission error:', err);
    showSuccess(email); // graceful fallback
  } finally {
    submitBtn.classList.remove('loading');
    submitBtn.disabled = false;
  }
});

function showSuccess(email) {
  form.style.display = 'none';
  successEmail.textContent = email;
  successState.classList.add('show');
  document.getElementById('waitlist-card').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ═══════════════════════════════════════════
// SCROLL REVEAL
// ═══════════════════════════════════════════
function initScrollReveal() {
  const targets = document.querySelectorAll(
    '.features-section, .features-grid, .sticky-steps-section, ' +
    '.audience-panels, .stats-bar__inner, .review-grid, ' +
    '.final-cta__inner, .marquee-section, .section-header'
  );

  targets.forEach(el => el.classList.add('reveal'));

  // Stagger the feature and review grids
  document.querySelectorAll('.features-grid, .review-grid, .audience-panels, .stats-bar__inner')
    .forEach(el => el.classList.add('reveal-stagger'));

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
}

// ═══════════════════════════════════════════
// COUNT-UP ANIMATION FOR STATS
// ═══════════════════════════════════════════
function countUp(el, target, suffix, duration = 1400) {
  const start = performance.now();
  const isDecimal = target % 1 !== 0;

  function tick(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = isDecimal
      ? (eased * target).toFixed(1)
      : Math.round(eased * target);
    el.textContent = value + suffix;
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function initCountUp() {
  const statsBar = document.querySelector('.stats-bar');
  if (!statsBar) return;

  const items = [
    { selector: '.stat-item:nth-child(1) .stat-item__n', target: 500, suffix: '+' },
    { selector: '.stat-item:nth-child(3) .stat-item__n', target: 9,   suffix: '' },
    { selector: '.stat-item:nth-child(5) .stat-item__n', target: 100, suffix: '%' },
    { selector: '.stat-item:nth-child(7) .stat-item__n', target: 4.9, suffix: '★' },
  ];

  let fired = false;
  const io = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !fired) {
      fired = true;
      items.forEach(({ selector, target, suffix }) => {
        const el = document.querySelector(selector);
        if (el) countUp(el, target, suffix);
      });
      io.disconnect();
    }
  }, { threshold: 0.4 });

  io.observe(statsBar);
}

// ═══════════════════════════════════════════
// FEATURE CARD 3D TILT
// ═══════════════════════════════════════════
function initCardTilt() {
  document.querySelectorAll('.feature-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width  - 0.5;
      const y = (e.clientY - rect.top)  / rect.height - 0.5;
      card.style.transform = `translateY(-6px) scale(1.015) rotateY(${x * 8}deg) rotateX(${-y * 8}deg)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

// ═══════════════════════════════════════════
// COMPOSE WIDGET
// ═══════════════════════════════════════════
function initCompose() {
  // ── Data ──
  var AVATAR_BG = 'e8b84b,4c8c9b,c0532f,8e7cc3,3f7f6f,d98b8b';
  function avatarUrl(seed) {
    return 'https://api.dicebear.com/9.x/notionists/svg?seed=' + encodeURIComponent(seed)
      + '&backgroundColor=' + AVATAR_BG + '&backgroundType=solid&radius=50&scale=115';
  }

  var MENTIONS = [
    { id: 'recruiter',  label: 'recruiter',  sublabel: 'Talent matching',  avatar: avatarUrl('recruiter') },
    { id: 'accountant', label: 'accountant', sublabel: 'Finance ops',      avatar: avatarUrl('ledger44') },
    { id: 'marketer',   label: 'marketer',   sublabel: 'Growth & content', avatar: avatarUrl('marketer') },
  ];

  var COMMANDS = [
    {
      id: 'hire', label: 'hire', hint: 'Find your next operator',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>'
    },
    {
      id: 'schedule', label: 'schedule', hint: 'Book a consultation',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>'
    },
    {
      id: 'match', label: 'match', hint: 'Get talent recommendations',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>'
    },
    {
      id: 'brief', label: 'brief', hint: 'Share your requirements',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>'
    },
    {
      id: 'support', label: 'support', hint: 'Get help from our team',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><circle cx="12" cy="17" r=".5" fill="currentColor"/></svg>'
    },
  ];

  var MAX_LENGTH = 500;
  var DEFAULT_VALUE = 'Looking for a trained @recruiter to handle hiring \u2014 can you /match someone ready to start?';

  // ── DOM refs ──
  var textarea  = document.getElementById('compose-textarea');
  var backdrop  = document.getElementById('compose-backdrop');
  var pickerEl  = document.getElementById('compose-picker');
  var sendBtn   = document.getElementById('compose-send');
  var counterEl = document.getElementById('compose-counter');
  if (!textarea) return;

  // ── State ──
  var trigger    = null;   // { type:'@'|'/', start, query }
  var activeIdx  = 0;
  var results    = [];
  var flashToken = null;
  var flashTimer = null;

  var mentionForms = MENTIONS.map(function(m) { return '@' + m.label; });
  var commandForms = COMMANDS.map(function(c) { return '/' + c.label; });

  // ── Caret coordinate calculation (mirror-div technique) ──
  var CARET_PROPS = [
    'boxSizing','width','height','overflowX','overflowY',
    'borderTopWidth','borderRightWidth','borderBottomWidth','borderLeftWidth',
    'paddingTop','paddingRight','paddingBottom','paddingLeft',
    'fontStyle','fontVariant','fontWeight','fontStretch','fontSize',
    'lineHeight','fontFamily','textAlign','textTransform','textIndent',
    'letterSpacing','wordSpacing','tabSize','whiteSpace','wordWrap','wordBreak',
  ];

  function caretCoords(pos) {
    var mirror = document.createElement('div');
    var s  = mirror.style;
    var cs = window.getComputedStyle(textarea);
    s.position   = 'absolute';
    s.visibility = 'hidden';
    s.whiteSpace = 'pre-wrap';
    s.wordWrap   = 'break-word';
    s.top  = '0';
    s.left = '-9999px';
    CARET_PROPS.forEach(function(p) { s[p] = cs[p]; });
    s.height   = 'auto';
    s.overflow = 'hidden';
    mirror.textContent = textarea.value.slice(0, pos);
    var marker = document.createElement('span');
    marker.textContent = textarea.value.slice(pos) || '.';
    mirror.appendChild(marker);
    document.body.appendChild(mirror);
    var x = marker.offsetLeft;
    var y = marker.offsetTop;
    document.body.removeChild(mirror);
    return { x: x, y: y, lineHeight: parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.4 };
  }

  // ── Trigger detection ──
  function detectTrigger(text, caret) {
    var i = caret - 1;
    while (i >= 0) {
      var ch = text[i];
      if (ch === '@' || ch === '/') {
        var before = i === 0 ? ' ' : text[i - 1];
        if (i === 0 || /\s/.test(before)) {
          var query = text.slice(i + 1, caret);
          if (!/\s/.test(query)) return { type: ch, start: i, query: query };
        }
        return null;
      }
      if (/\s/.test(ch)) return null;
      i--;
    }
    return null;
  }

  // ── Text segmentation for inline highlights ──
  function escapeRe(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function segment(text) {
    var forms = mentionForms.concat(commandForms).sort(function(a, b) { return b.length - a.length; });
    if (forms.length === 0) return [{ text: text, kind: 'text' }];
    var re = new RegExp('(' + forms.map(escapeRe).join('|') + ')(?=$|[^\\w])', 'g');
    var out = [];
    var last = 0;
    var m;
    while ((m = re.exec(text))) {
      var prev = m.index === 0 ? '' : text[m.index - 1];
      if (prev && /\w/.test(prev)) continue;
      if (m.index > last) out.push({ text: text.slice(last, m.index), kind: 'text' });
      out.push({ text: m[0], kind: m[0].charAt(0) === '@' ? 'mention' : 'command' });
      last = m.index + m[0].length;
    }
    if (last < text.length) out.push({ text: text.slice(last), kind: 'text' });
    return out.length ? out : [{ text: text, kind: 'text' }];
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ── Render backdrop with highlights ──
  function updateBackdrop() {
    var segs = segment(textarea.value);
    var html = '';
    segs.forEach(function(s) {
      if (s.kind === 'text') {
        html += escapeHtml(s.text);
      } else {
        var isFlash = flashToken && s.text.trim() === flashToken;
        html += '<span class="compose-hl' + (isFlash ? ' compose-pop' : '') + '">' + escapeHtml(s.text) + '</span>';
      }
    });
    html += '\n';
    backdrop.innerHTML = html;
  }

  // ── Character counter with SVG ring ──
  function updateCounter() {
    var len = textarea.value.length;
    if (len === 0) { counterEl.classList.remove('compose-counter--show'); return; }
    counterEl.classList.add('compose-counter--show');
    var pct  = Math.min(1, len / MAX_LENGTH);
    var r    = 7;
    var circ = 2 * Math.PI * r;
    var over = len > MAX_LENGTH;
    var near = len >= MAX_LENGTH * 0.8;
    var color = over ? '#ef4444' : near ? '#f59e0b' : '#a1a1aa';
    var remaining = MAX_LENGTH - len;
    var showNum = len / MAX_LENGTH >= 0.86;
    var html = '';
    if (showNum) html += '<span class="compose-counter-num" style="color:' + color + '">' + remaining + '</span>';
    html += '<svg width="18" height="18" viewBox="0 0 18 18" style="transform:rotate(-90deg)">';
    html += '<circle cx="9" cy="9" r="' + r + '" fill="none" stroke-width="2" stroke="rgba(0,0,0,0.08)"/>';
    html += '<circle cx="9" cy="9" r="' + r + '" fill="none" stroke-width="2" stroke="' + color + '" stroke-linecap="round"';
    html += ' stroke-dasharray="' + circ + '" stroke-dashoffset="' + (circ * (1 - pct)) + '"';
    html += ' style="transition:stroke-dashoffset .25s ease,stroke .25s ease"/>';
    html += '</svg>';
    counterEl.innerHTML = html;
  }

  // ── Send button state ──
  function updateSendBtn() {
    sendBtn.disabled = !textarea.value.trim() || textarea.value.length > MAX_LENGTH;
  }

  // ── Filter results from trigger ──
  function filterResults() {
    if (!trigger) { results = []; return; }
    var q = trigger.query.toLowerCase();
    if (trigger.type === '@') {
      results = MENTIONS.filter(function(m) { return m.label.toLowerCase().indexOf(q) !== -1; }).slice(0, 6);
    } else {
      results = COMMANDS.filter(function(c) { return c.label.toLowerCase().indexOf(q) !== -1; }).slice(0, 6);
    }
  }

  // ── Render the picker dropdown ──
  function renderPicker() {
    if (!trigger || results.length === 0) {
      pickerEl.classList.remove('compose-picker--open');
      textarea.setAttribute('aria-expanded', 'false');
      textarea.removeAttribute('aria-activedescendant');
      return;
    }
    var caret = textarea.selectionStart || 0;
    var c = caretCoords(caret);
    var caretLineTop = c.y - textarea.scrollTop;
    var rect = textarea.getBoundingClientRect();
    var lineBottomVp = rect.top + caretLineTop + c.lineHeight;
    var flip = window.innerHeight - lineBottomVp < 252 && caretLineTop > 120;
    var x = Math.max(8, c.x - textarea.scrollLeft);
    if (flip) {
      pickerEl.style.top    = 'auto';
      pickerEl.style.bottom = (textarea.offsetHeight - caretLineTop + 6) + 'px';
      pickerEl.classList.add('compose-picker--flip');
    } else {
      pickerEl.style.bottom = 'auto';
      pickerEl.style.top    = (caretLineTop + c.lineHeight + 6) + 'px';
      pickerEl.classList.remove('compose-picker--flip');
    }
    pickerEl.style.left = x + 'px';

    var html = '';
    results.forEach(function(r, i) {
      var isActive  = i === activeIdx;
      var isMention = trigger.type === '@';
      html += '<li role="option" id="compose-opt-' + i + '" aria-selected="' + isActive + '"';
      html += ' class="compose-picker-item' + (isActive ? ' active' : '') + '" data-idx="' + i + '">';
      html += '<div class="compose-picker-hl"></div>';
      html += '<button type="button" tabindex="-1" class="compose-picker-btn" data-idx="' + i + '">';
      if (isMention) {
        if (r.avatar) {
          html += '<img src="' + escapeHtml(r.avatar) + '" alt="" class="compose-av" aria-hidden="true"/>';
        } else {
          var parts = r.label.trim().split(/\s+/);
          var ini = (parts.length === 1 ? parts[0].slice(0,2) : parts.slice(0,2).map(function(w){return w[0];}).join('')).toUpperCase();
          html += '<span class="compose-av-initials">' + ini + '</span>';
        }
        html += '<span class="compose-picker-label">';
        html += '<span class="compose-picker-name">' + escapeHtml(r.label) + '</span>';
        if (r.sublabel) html += '<span class="compose-picker-hint">' + escapeHtml(r.sublabel) + '</span>';
        html += '</span>';
      } else {
        html += '<span class="compose-cmd-icon">';
        html += r.icon || '<span style="font-family:monospace;font-size:13px;font-weight:500">/</span>';
        html += '</span>';
        html += '<span class="compose-picker-label">';
        html += '<span class="compose-picker-name">' + escapeHtml(r.label) + '</span>';
        if (r.hint) html += '<span class="compose-picker-hint">' + escapeHtml(r.hint) + '</span>';
        html += '</span>';
      }
      html += '<span class="compose-picker-enter"><kbd class="compose-kbd">\u21B5</kbd></span>';
      html += '</button></li>';
    });
    pickerEl.innerHTML = html;
    pickerEl.classList.add('compose-picker--open');
    textarea.setAttribute('aria-expanded', 'true');
    textarea.setAttribute('aria-activedescendant', 'compose-opt-' + activeIdx);

    pickerEl.querySelectorAll('.compose-picker-btn').forEach(function(btn) {
      btn.addEventListener('mouseenter', function() {
        activeIdx = parseInt(btn.dataset.idx);
        highlightActive();
      });
      btn.addEventListener('mousedown', function(e) {
        e.preventDefault();
        insertChoice(results[parseInt(btn.dataset.idx)]);
      });
    });
  }

  function highlightActive() {
    pickerEl.querySelectorAll('.compose-picker-item').forEach(function(item, i) {
      item.classList.toggle('active', i === activeIdx);
      item.setAttribute('aria-selected', i === activeIdx ? 'true' : 'false');
    });
    textarea.setAttribute('aria-activedescendant', 'compose-opt-' + activeIdx);
  }

  // ── Insert selected mention / command ──
  function insertChoice(choice) {
    if (!trigger) return;
    var caret = textarea.selectionStart || 0;
    var token = (trigger.type === '@' ? '@' : '/') + choice.label;
    var next  = textarea.value.slice(0, trigger.start) + token + ' ' + textarea.value.slice(caret);
    var newCaret = trigger.start + token.length + 1;
    textarea.value = next;
    textarea.focus();
    textarea.setSelectionRange(newCaret, newCaret);
    trigger = null;
    results = [];
    renderPicker();
    flashToken = token;
    if (flashTimer) clearTimeout(flashTimer);
    flashTimer = setTimeout(function() { flashToken = null; updateBackdrop(); }, 480);
    updateBackdrop();
    updateCounter();
    updateSendBtn();
  }

  // ── Refresh trigger from caret position ──
  function refreshTrigger() {
    var caret = textarea.selectionStart || 0;
    trigger = detectTrigger(textarea.value, caret);
    if (trigger) { filterResults(); activeIdx = 0; } else { results = []; }
    renderPicker();
  }

  // ── Event handlers ──
  var NAV_KEYS = ['ArrowDown','ArrowUp','Enter','Tab','Escape'];

  textarea.addEventListener('keydown', function(e) {
    if (trigger && results.length) {
      if (e.key === 'ArrowDown') { e.preventDefault(); activeIdx = (activeIdx + 1) % results.length; highlightActive(); return; }
      if (e.key === 'ArrowUp')   { e.preventDefault(); activeIdx = (activeIdx - 1 + results.length) % results.length; highlightActive(); return; }
      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); insertChoice(results[activeIdx]); return; }
      if (e.key === 'Escape') { e.preventDefault(); trigger = null; results = []; renderPicker(); return; }
    }
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (textarea.value.trim()) handleSubmit();
    }
  });

  textarea.addEventListener('keyup', function(e) {
    if (trigger && results.length && NAV_KEYS.indexOf(e.key) !== -1) return;
    refreshTrigger();
  });

  textarea.addEventListener('input', function() {
    updateBackdrop();
    updateCounter();
    updateSendBtn();
  });

  textarea.addEventListener('click', refreshTrigger);

  textarea.addEventListener('scroll', function() {
    backdrop.scrollTop  = textarea.scrollTop;
    backdrop.scrollLeft = textarea.scrollLeft;
  });

  textarea.addEventListener('blur', function() {
    setTimeout(function() { trigger = null; results = []; renderPicker(); }, 120);
  });

  // ── Submit → scroll to waitlist form ──
  function handleSubmit() {
    var text = textarea.value.trim();
    if (!text) return;
    var card = document.getElementById('waitlist-card');
    if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  sendBtn.addEventListener('click', handleSubmit);

  // ── Initialize with demo content ──
  textarea.value = DEFAULT_VALUE;
  updateBackdrop();
  updateCounter();
  updateSendBtn();
}

// ═══════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  initScrollReveal();
  initCountUp();
  initCardTilt();
  initCompose();
});
