/* Candy Blast Saga — match-3 game with monetization funnel */
(() => {
  const COLS = 8, ROWS = 8, TYPES = 6;
  const EMOJI = ['🍬', '🍭', '🍫', '🍩', '🧁', '🍪'];
  const COLORS = ['#ff4e83', '#f9d423', '#8e5a3b', '#c86bfa', '#4ecdc4', '#ff9f43'];
  const LIFE_REGEN_MS = 60 * 1000; // 1 min for demo; 30 min in production
  const MAX_LIVES = 5;

  const NAMES = ['candy', 'lollipop', 'chocolate', 'donut', 'cupcake', 'cookie'];

  const canvas = document.getElementById('board');
  const ctx = canvas.getContext('2d');
  const CELL = canvas.width / COLS;
  const srLive = document.getElementById('sr-live');
  function announce(msg) { if (srLive) { srLive.textContent = ''; srLive.textContent = msg; } }

  // ---------- accessibility preferences ----------
  const prefsDefaults = {
    reduceMotion: !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches),
    highContrast: false,
  };
  function loadPrefs() {
    try {
      const raw = localStorage.getItem('candyblast_prefs');
      if (!raw) return { ...prefsDefaults };
      const p = JSON.parse(raw);
      return { reduceMotion: !!p.reduceMotion, highContrast: !!p.highContrast };
    } catch { return { ...prefsDefaults }; }
  }
  let prefs = loadPrefs();
  function savePrefs() { try { localStorage.setItem('candyblast_prefs', JSON.stringify(prefs)); } catch {} }
  function applyPrefs() {
    document.body.classList.toggle('reduce-motion', prefs.reduceMotion);
    document.body.classList.toggle('high-contrast', prefs.highContrast);
  }
  applyPrefs();

  // ---------- persistent state ----------
  const defaults = {
    coins: 50, lives: 5, level: 1,
    boosters: { hammer: 1, bomb: 1, shuffle: 1 },
    lastLifeAt: Date.now(),
  };
  let S = load();
  function sanitizeState(s) {
    s.coins  = Number.isFinite(s.coins)  ? Math.max(0, Math.floor(s.coins))  : defaults.coins;
    s.lives  = Number.isFinite(s.lives)  ? Math.max(0, Math.min(MAX_LIVES, Math.floor(s.lives)))  : defaults.lives;
    s.level  = Number.isFinite(s.level)  && s.level >= 1 ? Math.floor(s.level) : defaults.level;
    s.lastLifeAt = Number.isFinite(s.lastLifeAt) ? s.lastLifeAt : Date.now();
    if (!s.boosters || typeof s.boosters !== 'object') s.boosters = { ...defaults.boosters };
    for (const k of ['hammer', 'bomb', 'shuffle']) {
      s.boosters[k] = Number.isFinite(s.boosters[k]) ? Math.max(0, Math.floor(s.boosters[k])) : defaults.boosters[k];
    }
    return s;
  }
  function load() {
    try {
      const raw = localStorage.getItem('candyblast');
      if (!raw) return { ...defaults, boosters: { ...defaults.boosters } };
      return sanitizeState(Object.assign({}, defaults, JSON.parse(raw)));
    } catch { return { ...defaults, boosters: { ...defaults.boosters } }; }
  }
  function save() {
    try {
      localStorage.setItem('candyblast', JSON.stringify(S));
    } catch (e) {
      // Storage blocked or full (private mode / quota): keep playing in-memory.
    }
  }

  // ---------- level state ----------
  let grid = [], score = 0, moves = 0, target = 0;
  let selected = null, armedBooster = null, busy = false, levelOver = false;
  let cursor = { r: 0, c: 0 }, boardFocused = false;

  function levelConfig(n) {
    return { target: 800 + n * 400, moves: Math.max(12, 24 - Math.floor(n / 3)) };
  }

  function startLevel() {
    const cfg = levelConfig(S.level);
    target = cfg.target; moves = cfg.moves; score = 0;
    selected = null; armedBooster = null; levelOver = false;
    grid = [];
    for (let r = 0; r < ROWS; r++) {
      grid.push([]);
      for (let c = 0; c < COLS; c++) grid[r].push(randNoMatch(r, c));
    }
    updateHUD(); draw();
  }
  function randNoMatch(r, c) {
    let t;
    do { t = (Math.random() * TYPES) | 0; }
    while (
      (c >= 2 && grid[r][c - 1] === t && grid[r][c - 2] === t) ||
      (r >= 2 && grid[r - 1][c] === t && grid[r - 2][c] === t)
    );
    return t;
  }

  // ---------- rendering ----------
  function draw(highlight) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      if ((r + c) % 2 === 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.fillRect(c * CELL, r * CELL, CELL, CELL);
      }
      const isCur = boardFocused && cursor.r === r && cursor.c === c;
      const t = grid[r][c];
      if (t === null || t === undefined) { if (isCur) drawCursor(r, c); continue; }
      const x = c * CELL + CELL / 2, y = r * CELL + CELL / 2;
      const isSel = selected && selected.r === r && selected.c === c;
      const isHl = highlight && highlight.some(p => p.r === r && p.c === c);
      ctx.beginPath();
      ctx.arc(x, y, CELL * (isSel ? 0.46 : 0.4), 0, Math.PI * 2);
      ctx.fillStyle = isHl ? '#fff' : COLORS[t] + (prefs.highContrast ? 'ff' : '55');
      ctx.fill();
      if (prefs.highContrast) { ctx.lineWidth = 2; ctx.strokeStyle = '#fff'; ctx.stroke(); }
      if (isSel) { ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.stroke(); }
      ctx.font = `${CELL * 0.6}px serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(EMOJI[t], x, y + 2);
      if (isCur) drawCursor(r, c);
    }
  }
  function drawCursor(r, c) {
    ctx.save();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(c * CELL + 3, r * CELL + 3, CELL - 6, CELL - 6);
    ctx.restore();
  }

  // ---------- match logic ----------
  function findMatches() {
    const hit = new Set();
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS - 2; c++) {
      const t = grid[r][c];
      if (t !== null && t === grid[r][c + 1] && t === grid[r][c + 2]) {
        let e = c + 2;
        while (e + 1 < COLS && grid[r][e + 1] === t) e++;
        for (let i = c; i <= e; i++) hit.add(r + ',' + i);
      }
    }
    for (let c = 0; c < COLS; c++) for (let r = 0; r < ROWS - 2; r++) {
      const t = grid[r][c];
      if (t !== null && t === grid[r + 1][c] && t === grid[r + 2][c]) {
        let e = r + 2;
        while (e + 1 < ROWS && grid[e + 1][c] === t) e++;
        for (let i = r; i <= e; i++) hit.add(i + ',' + c);
      }
    }
    return [...hit].map(s => { const [r, c] = s.split(',').map(Number); return { r, c }; });
  }

  async function resolveBoard(chain = 1) {
    const matches = findMatches();
    if (matches.length === 0) return chain > 1;
    score += matches.length * 20 * chain;
    draw(matches);
    await sleep(180);
    matches.forEach(p => { grid[p.r][p.c] = null; });
    draw();
    await sleep(120);
    // gravity
    for (let c = 0; c < COLS; c++) {
      let write = ROWS - 1;
      for (let r = ROWS - 1; r >= 0; r--) {
        if (grid[r][c] !== null) { grid[write][c] = grid[r][c]; write--; }
      }
      for (let r = write; r >= 0; r--) grid[r][c] = (Math.random() * TYPES) | 0;
    }
    draw();
    updateHUD();
    await sleep(140);
    return resolveBoard(chain + 1);
  }

  async function trySwap(a, b) {
    busy = true;
    swap(a, b); draw();
    await sleep(120);
    if (findMatches().length === 0) {
      swap(a, b); draw(); busy = false; announce('No match. Try again.'); return;
    }
    moves--;
    await resolveBoard();
    updateHUD();
    checkEnd();
    if (!levelOver) announce(`Matched! Score ${score}. ${moves} moves left.`);
    busy = false;
  }
  function swap(a, b) {
    const t = grid[a.r][a.c];
    grid[a.r][a.c] = grid[b.r][b.c];
    grid[b.r][b.c] = t;
  }

  function checkEnd() {
    if (levelOver) return;
    if (score >= target) {
      levelOver = true;
      const stars = score >= target * 1.5 ? 3 : score >= target * 1.2 ? 2 : 1;
      document.getElementById('win-stars').textContent = '⭐'.repeat(stars);
      const coinsEarned = 20 + stars * 10;
      S.coins += coinsEarned; save();
      document.getElementById('win-text').textContent =
        `Score: ${score.toLocaleString()} — you earned 🪙 ${coinsEarned}!`;
      announce(`Level complete! ${stars} star${stars > 1 ? 's' : ''}. You earned ${coinsEarned} coins.`);
      openModal('win-modal');
      updateHUD();
    } else if (moves <= 0) {
      levelOver = true;
      document.getElementById('oom-remaining').textContent =
        (target - score).toLocaleString();
      announce(`Out of moves. You needed ${(target - score).toLocaleString()} more points.`);
      openModal('oom-modal');
    }
  }

  // ---------- input ----------
  function cellFromEvent(e) {
    const rect = canvas.getBoundingClientRect();
    const pt = e.touches ? e.touches[0] : e;
    const c = Math.floor((pt.clientX - rect.left) / rect.width * COLS);
    const r = Math.floor((pt.clientY - rect.top) / rect.height * ROWS);
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return null;
    return { r, c };
  }
  let dragStart = null;
  canvas.addEventListener('pointerdown', e => {
    if (busy || levelOver) return;
    const cell = cellFromEvent(e);
    if (!cell) return;
    if (armedBooster) { useArmedBooster(cell); return; }
    dragStart = cell;
    if (selected && isAdjacent(selected, cell)) {
      const a = selected; selected = null;
      trySwap(a, cell);
    } else {
      selected = cell; draw();
    }
  });
  canvas.addEventListener('pointerup', e => {
    if (busy || levelOver || !dragStart) return;
    const cell = cellFromEvent(e);
    if (cell && isAdjacent(dragStart, cell)) {
      selected = null;
      trySwap(dragStart, cell);
    }
    dragStart = null;
  });
  function isAdjacent(a, b) {
    return Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1;
  }

  // ---------- keyboard play (accessibility) ----------
  canvas.addEventListener('focus', () => { boardFocused = true; announceCursor(); draw(); });
  canvas.addEventListener('blur', () => { boardFocused = false; draw(); });
  function announceCursor() {
    const t = grid[cursor.r] && grid[cursor.r][cursor.c];
    const label = (t === null || t === undefined) ? 'empty' : NAMES[t];
    announce(`${label}, row ${cursor.r + 1}, column ${cursor.c + 1}`);
  }
  canvas.addEventListener('keydown', e => {
    const moveKeys = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
    if (moveKeys[e.key]) {
      e.preventDefault();
      if (busy || levelOver) return;
      const [dr, dc] = moveKeys[e.key];
      cursor = {
        r: Math.max(0, Math.min(ROWS - 1, cursor.r + dr)),
        c: Math.max(0, Math.min(COLS - 1, cursor.c + dc)),
      };
      draw();
      announceCursor();
      return;
    }
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (busy || levelOver) return;
      const cell = { r: cursor.r, c: cursor.c };
      if (armedBooster) { useArmedBooster(cell); return; }
      if (!selected) {
        selected = cell;
        announce(`Selected ${NAMES[grid[cell.r][cell.c]]}. Move to an adjacent candy and press Space to swap.`);
        draw();
      } else if (selected.r === cell.r && selected.c === cell.c) {
        selected = null; announce('Deselected'); draw();
      } else if (isAdjacent(selected, cell)) {
        const a = selected; selected = null;
        trySwap(a, cell);
      } else {
        selected = cell; announce(`Selected ${NAMES[grid[cell.r][cell.c]]}`); draw();
      }
      return;
    }
    if (e.key === 'Escape' && selected) { e.preventDefault(); selected = null; announce('Deselected'); draw(); }
  });

  // ---------- boosters ----------
  const boosterBtns = { hammer: 'booster-hammer', bomb: 'booster-bomb', shuffle: 'booster-shuffle' };
  Object.entries(boosterBtns).forEach(([name, id]) => {
    document.getElementById(id).addEventListener('click', () => {
      if (busy || levelOver) return;
      if (S.boosters[name] <= 0) { openShop('boosters'); return; }
      if (name === 'shuffle') {
        S.boosters.shuffle--; save();
        shuffleBoard(); updateHUD();
        return;
      }
      armedBooster = armedBooster === name ? null : name;
      refreshBoosterUI();
    });
  });
  function refreshBoosterUI() {
    Object.entries(boosterBtns).forEach(([name, id]) => {
      document.getElementById(id).classList.toggle('armed', armedBooster === name);
    });
    document.getElementById('hammer-count').textContent = S.boosters.hammer;
    document.getElementById('bomb-count').textContent = S.boosters.bomb;
    document.getElementById('shuffle-count').textContent = S.boosters.shuffle;
  }
  async function useArmedBooster(cell) {
    const name = armedBooster;
    armedBooster = null;
    S.boosters[name]--; save();
    refreshBoosterUI();
    busy = true;
    if (name === 'hammer') {
      grid[cell.r][cell.c] = null; score += 40;
    } else if (name === 'bomb') {
      for (let r = cell.r - 1; r <= cell.r + 1; r++)
        for (let c = cell.c - 1; c <= cell.c + 1; c++)
          if (r >= 0 && r < ROWS && c >= 0 && c < COLS) { grid[r][c] = null; score += 40; }
    }
    draw();
    await sleep(150);
    for (let c = 0; c < COLS; c++) {
      let write = ROWS - 1;
      for (let r = ROWS - 1; r >= 0; r--)
        if (grid[r][c] !== null) { grid[write][c] = grid[r][c]; write--; }
      for (let r = write; r >= 0; r--) grid[r][c] = (Math.random() * TYPES) | 0;
    }
    draw();
    await resolveBoard();
    updateHUD();
    checkEnd();
    busy = false;
  }
  function shuffleBoard() {
    const flat = grid.flat();
    for (let i = flat.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      [flat[i], flat[j]] = [flat[j], flat[i]];
    }
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) grid[r][c] = flat[r * COLS + c];
    draw();
    resolveBoard().then(() => { updateHUD(); checkEnd(); });
  }

  // ---------- economy / shop ----------
  const SHOP = {
    coins: [
      { icon: '🪙', name: 'Handful of Coins', amount: '300 coins', price: '$1.99', real: true, coins: 300 },
      { icon: '💰', name: 'Bag of Coins', amount: '1,000 coins', price: '$4.99', real: true, coins: 1000, badge: 'POPULAR' },
      { icon: '🎒', name: 'Chest of Coins', amount: '2,500 coins', price: '$9.99', real: true, coins: 2500 },
      { icon: '🏆', name: 'Vault of Coins', amount: '7,000 coins', price: '$19.99', real: true, coins: 7000, badge: 'BEST VALUE' },
    ],
    lives: [
      { icon: '❤️', name: 'Refill Lives', amount: 'Full 5 lives', price: '🪙 150', cost: 150, effect: () => { S.lives = MAX_LIVES; } },
      { icon: '💖', name: 'Refill + Bonus', amount: '5 lives + 200 coins', price: '$2.99', real: true, coins: 200, effect: () => { S.lives = MAX_LIVES; }, badge: 'DEAL' },
    ],
    boosters: [
      { icon: '🔨', name: 'Hammer x3', amount: 'Smash any candy', price: '🪙 120', cost: 120, effect: () => { S.boosters.hammer += 3; } },
      { icon: '💣', name: 'Bomb x3', amount: '3x3 blast', price: '🪙 180', cost: 180, effect: () => { S.boosters.bomb += 3; } },
      { icon: '🔀', name: 'Shuffle x3', amount: 'Reshuffle board', price: '🪙 90', cost: 90, effect: () => { S.boosters.shuffle += 3; } },
      { icon: '🎁', name: 'Starter Pack', amount: '3 of each + 500 coins', price: '$3.99', real: true, coins: 500, badge: 'HOT',
        effect: () => { S.boosters.hammer += 3; S.boosters.bomb += 3; S.boosters.shuffle += 3; } },
    ],
  };

  function openShop(tab) {
    document.querySelectorAll('.shop-tabs .tab').forEach(b => {
      const on = b.dataset.tab === tab;
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    renderShop(tab);
    openModal('shop-modal');
  }
  function renderShop(tab) {
    const gridEl = document.getElementById('shop-grid');
    gridEl.innerHTML = '';
    SHOP[tab].forEach(item => {
      const el = document.createElement('div');
      el.className = 'shop-item';

      if (item.badge) {
        const badge = document.createElement('span');
        badge.className = 'badge';
        badge.textContent = item.badge;
        el.appendChild(badge);
      }
      const icon = document.createElement('div');
      icon.className = 'item-icon';
      icon.textContent = item.icon;
      el.appendChild(icon);

      const name = document.createElement('div');
      name.className = 'item-name';
      name.textContent = item.name;
      el.appendChild(name);

      const desc = document.createElement('div');
      desc.style.cssText = 'font-size:12px;color:#888';
      desc.textContent = item.amount;
      el.appendChild(desc);

      const price = document.createElement('div');
      price.className = 'item-price';
      price.textContent = item.price;
      el.appendChild(price);

      el.addEventListener('click', () => buy(item));
      gridEl.appendChild(el);
    });
  }
  function buy(item) {
    if (item.real) {
      // Production: launch Stripe Checkout / platform IAP here.
      if (item.coins) S.coins += item.coins;
      if (item.effect) item.effect();
      save(); updateHUD(); refreshBoosterUI();
      toast(`✅ Purchase successful! (${item.price} — simulated)`);
    } else {
      if (S.coins < item.cost) { toast('Not enough coins — grab a coin pack!'); openShop('coins'); return; }
      S.coins -= item.cost;
      item.effect();
      save(); updateHUD(); refreshBoosterUI();
      toast(`✅ ${item.name} purchased!`);
    }
  }

  document.querySelectorAll('.shop-tabs .tab').forEach(btn =>
    btn.addEventListener('click', () => {
      document.querySelectorAll('.shop-tabs .tab').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      renderShop(btn.dataset.tab);
    }));

  // out-of-moves conversion point
  document.getElementById('buy-moves-btn').addEventListener('click', () => {
    if (S.coins < 100) { closeModal('oom-modal'); openShop('coins'); return; }
    S.coins -= 100; save();
    moves += 5; levelOver = false;
    closeModal('oom-modal');
    updateHUD();
    toast('➕ 5 extra moves!');
  });
  document.getElementById('give-up-btn').addEventListener('click', () => {
    loseLife();
    closeModal('oom-modal');
    if (S.lives <= 0) showLivesModal();
    else startLevel();
  });
  document.getElementById('next-level-btn').addEventListener('click', () => {
    S.level++; save();
    closeModal('win-modal');
    startLevel();
  });

  // ---------- lives ----------
  function loseLife() { S.lives = Math.max(0, S.lives - 1); if (S.lives < MAX_LIVES) S.lastLifeAt = Date.now(); save(); updateHUD(); }
  function tickLives() {
    if (S.lives < MAX_LIVES && Date.now() - S.lastLifeAt >= LIFE_REGEN_MS) {
      S.lives++; S.lastLifeAt = Date.now(); save();
      if (!document.getElementById('lives-modal').classList.contains('hidden') && S.lives > 0) {
        closeModal('lives-modal'); startLevel();
      }
    }
    const el = document.getElementById('life-timer');
    if (S.lives < MAX_LIVES) {
      const remain = Math.max(0, LIFE_REGEN_MS - (Date.now() - S.lastLifeAt));
      el.textContent = fmt(remain);
      const modalTimer = document.getElementById('lives-modal-timer');
      if (modalTimer) modalTimer.textContent = fmt(remain);
    } else el.textContent = '';
    updateHUD();
  }
  function showLivesModal() { openModal('lives-modal'); }

  // ---------- UI helpers ----------
  function updateHUD() {
    document.getElementById('coins-count').textContent = S.coins.toLocaleString();
    document.getElementById('lives-count').textContent = S.lives;
    document.getElementById('level-num').textContent = S.level;
    document.getElementById('score').textContent = score.toLocaleString();
    document.getElementById('target-score').textContent = target.toLocaleString();
    document.getElementById('moves').textContent = moves;
    const pct = target > 0 ? Math.min(100, (score / target) * 100) : 0;
    document.getElementById('progress-bar').style.width = pct + '%';
    const pw = document.getElementById('progress-wrap');
    if (pw) pw.setAttribute('aria-valuenow', String(Math.round(pct)));
    refreshBoosterUI();
  }

  // ---------- modal focus management (accessibility) ----------
  let modalReturnFocus = null;
  function focusables(container) {
    return [...container.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])')]
      .filter(el => el.offsetParent !== null);
  }
  function openModal(id) {
    const m = document.getElementById(id);
    if (!m.classList.contains('hidden')) return;
    modalReturnFocus = document.activeElement;
    m.classList.remove('hidden');
    const f = focusables(m.querySelector('.modal-card') || m);
    if (f.length) f[0].focus();
  }
  function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
    if (modalReturnFocus && typeof modalReturnFocus.focus === 'function') {
      modalReturnFocus.focus();
      modalReturnFocus = null;
    }
  }
  document.addEventListener('keydown', e => {
    const open = [...document.querySelectorAll('.modal:not(.hidden)')].pop();
    if (!open) return;
    if (e.key === 'Escape' && open.querySelector('[data-close]')) {
      e.preventDefault(); closeModal(open.id); return;
    }
    if (e.key === 'Tab') {
      const f = focusables(open.querySelector('.modal-card') || open);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  document.querySelectorAll('[data-close]').forEach(b =>
    b.addEventListener('click', () => closeModal(b.closest('.modal').id)));
  document.querySelectorAll('[data-open="shop"]').forEach(b =>
    b.addEventListener('click', () => {
      b.closest('.modal')?.classList.add('hidden');
      openShop(b.dataset.tab || 'coins');
    }));
  let toastTimer;
  function toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg; t.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.add('hidden'), 2200);
  }
  function fmt(ms) {
    const s = Math.ceil(ms / 1000);
    return `${String((s / 60) | 0).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  }
  function sleep(ms) { return new Promise(res => setTimeout(res, prefs.reduceMotion ? 0 : ms)); }

  // ---------- settings ----------
  function openSettings() {
    document.getElementById('reduce-motion-toggle').checked = prefs.reduceMotion;
    document.getElementById('high-contrast-toggle').checked = prefs.highContrast;
    openModal('settings-modal');
  }
  document.getElementById('settings-btn').addEventListener('click', openSettings);
  document.getElementById('settings-link').addEventListener('click', openSettings);
  document.getElementById('reduce-motion-toggle').addEventListener('change', e => {
    prefs.reduceMotion = e.target.checked; savePrefs(); applyPrefs();
  });
  document.getElementById('high-contrast-toggle').addEventListener('change', e => {
    prefs.highContrast = e.target.checked; savePrefs(); applyPrefs(); draw();
  });
  document.getElementById('reset-data-btn').addEventListener('click', () => {
    if (!window.confirm('Reset all game data? This cannot be undone.')) return;
    try { localStorage.removeItem('candyblast'); } catch {}
    S = { ...defaults, boosters: { ...defaults.boosters }, lastLifeAt: Date.now() };
    save(); closeModal('settings-modal'); startLevel(); updateHUD();
    toast('🗑️ Game data reset'); announce('Game data reset.');
  });

  // ---------- first-run welcome / disclosures ----------
  const WELCOME_KEY = 'candyblast_welcomed';
  document.getElementById('welcome-accept').addEventListener('click', () => {
    try { localStorage.setItem(WELCOME_KEY, '1'); } catch {}
    closeModal('welcome-modal');
    canvas.focus();
  });
  function maybeShowWelcome() {
    let seen = false;
    try { seen = localStorage.getItem(WELCOME_KEY) === '1'; } catch {}
    if (!seen) openModal('welcome-modal');
  }

  // ---------- boot ----------
  setInterval(tickLives, 1000);
  if (S.lives <= 0) { startLevel(); showLivesModal(); }
  else startLevel();
  maybeShowWelcome();
})();
