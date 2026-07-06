/* Candy Blast Saga — match-3 game with monetization funnel */
(() => {
  const COLS = 8, ROWS = 8, TYPES = 6;
  const EMOJI = ['🍬', '🍭', '🍫', '🍩', '🧁', '🍪'];
  const COLORS = ['#ff4e83', '#f9d423', '#8e5a3b', '#c86bfa', '#4ecdc4', '#ff9f43'];
  const LIFE_REGEN_MS = 60 * 1000; // 1 min for demo; 30 min in production
  const MAX_LIVES = 5;

  const canvas = document.getElementById('board');
  if (!canvas) { console.error('Missing <canvas id="board"> element'); return; }
  const ctx = canvas.getContext('2d');
  if (!ctx) { console.error('Failed to get 2D rendering context'); return; }
  const CELL = canvas.width / COLS;

  // ---------- persistent state ----------
  const defaults = {
    coins: 50, lives: 5, level: 1,
    boosters: { hammer: 1, bomb: 1, shuffle: 1 },
    lastLifeAt: Date.now(),
  };
  let S = load();
  function load() {
    try {
      const raw = localStorage.getItem('candyblast');
      if (!raw) return { ...defaults };
      const parsed = JSON.parse(raw);
      if (typeof parsed !== 'object' || parsed === null) {
        console.warn('Corrupt save data (not an object) — resetting to defaults');
        return { ...defaults };
      }
      return Object.assign({}, defaults, parsed);
    } catch (err) {
      console.warn('Failed to load save data — resetting to defaults:', err);
      return { ...defaults };
    }
  }
  function save() {
    try {
      localStorage.setItem('candyblast', JSON.stringify(S));
    } catch (err) {
      console.warn('Failed to save game state (storage may be full or unavailable):', err);
    }
  }

  // ---------- level state ----------
  let grid = [], score = 0, moves = 0, target = 0;
  let selected = null, armedBooster = null, busy = false, levelOver = false;

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
      const t = grid[r][c];
      if (t === null || t === undefined) continue;
      const x = c * CELL + CELL / 2, y = r * CELL + CELL / 2;
      const isSel = selected && selected.r === r && selected.c === c;
      const isHl = highlight && highlight.some(p => p.r === r && p.c === c);
      ctx.beginPath();
      ctx.arc(x, y, CELL * (isSel ? 0.46 : 0.4), 0, Math.PI * 2);
      ctx.fillStyle = isHl ? '#fff' : COLORS[t] + '55';
      ctx.fill();
      if (isSel) { ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.stroke(); }
      ctx.font = `${CELL * 0.6}px serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(EMOJI[t], x, y + 2);
    }
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
    try {
      swap(a, b); draw();
      await sleep(120);
      if (findMatches().length === 0) {
        swap(a, b); draw(); return;
      }
      moves--;
      await resolveBoard();
      updateHUD();
      checkEnd();
    } catch (err) {
      console.error('Error during swap:', err);
    } finally {
      busy = false;
    }
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
      openModal('win-modal');
      updateHUD();
    } else if (moves <= 0) {
      levelOver = true;
      document.getElementById('oom-remaining').textContent =
        (target - score).toLocaleString();
      openModal('oom-modal');
    }
  }

  // ---------- input ----------
  function cellFromEvent(e) {
    const rect = canvas.getBoundingClientRect();
    const pt = e.touches && e.touches.length > 0 ? e.touches[0] : e;
    if (!pt || pt.clientX === undefined) return null;
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
    try {
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
    } catch (err) {
      console.error('Error using booster:', err);
    } finally {
      busy = false;
    }
  }
  function shuffleBoard() {
    const flat = grid.flat();
    for (let i = flat.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      [flat[i], flat[j]] = [flat[j], flat[i]];
    }
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) grid[r][c] = flat[r * COLS + c];
    draw();
    resolveBoard()
      .then(() => { updateHUD(); checkEnd(); })
      .catch(err => console.error('Error resolving board after shuffle:', err));
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
    document.querySelectorAll('.shop-tabs .tab').forEach(b =>
      b.classList.toggle('active', b.dataset.tab === tab));
    renderShop(tab);
    openModal('shop-modal');
  }
  function renderShop(tab) {
    const gridEl = document.getElementById('shop-grid');
    if (!gridEl) { console.error('Missing #shop-grid element'); return; }
    gridEl.innerHTML = '';
    const items = SHOP[tab];
    if (!items) { console.warn('Unknown shop tab:', tab); return; }
    items.forEach(item => {
      const el = document.createElement('div');
      el.className = 'shop-item';
      el.innerHTML = `${item.badge ? `<span class="badge">${item.badge}</span>` : ''}
        <div class="item-icon">${item.icon}</div>
        <div class="item-name">${item.name}</div>
        <div style="font-size:12px;color:#888">${item.amount}</div>
        <div class="item-price">${item.price}</div>`;
      el.addEventListener('click', () => buy(item));
      gridEl.appendChild(el);
    });
  }
  function buy(item) {
    try {
      if (item.real) {
        // Production: launch Stripe Checkout / platform IAP here.
        if (item.coins) S.coins += item.coins;
        if (typeof item.effect === 'function') item.effect();
        save(); updateHUD(); refreshBoosterUI();
        toast(`✅ Purchase successful! (${item.price} — simulated)`);
      } else {
        if (S.coins < item.cost) { toast('Not enough coins — grab a coin pack!'); openShop('coins'); return; }
        S.coins -= item.cost;
        if (typeof item.effect === 'function') item.effect();
        save(); updateHUD(); refreshBoosterUI();
        toast(`✅ ${item.name} purchased!`);
      }
    } catch (err) {
      console.error('Purchase failed:', err);
      toast('❌ Something went wrong with your purchase.');
    }
  }

  document.querySelectorAll('.shop-tabs .tab').forEach(btn =>
    btn.addEventListener('click', () => {
      document.querySelectorAll('.shop-tabs .tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
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

  // ---------- sale countdown (FOMO) ----------
  let saleEnd = Date.now() + 10 * 60 * 1000;
  function tickSale() {
    let remain = saleEnd - Date.now();
    if (remain <= 0) { saleEnd = Date.now() + 10 * 60 * 1000; remain = 10 * 60 * 1000; }
    document.getElementById('sale-timer').textContent = fmt(remain);
  }

  // ---------- UI helpers ----------
  function updateHUD() {
    document.getElementById('coins-count').textContent = S.coins.toLocaleString();
    document.getElementById('lives-count').textContent = S.lives;
    document.getElementById('level-num').textContent = S.level;
    document.getElementById('score').textContent = score.toLocaleString();
    document.getElementById('target-score').textContent = target.toLocaleString();
    document.getElementById('moves').textContent = moves;
    document.getElementById('progress-bar').style.width =
      Math.min(100, (score / target) * 100) + '%';
    refreshBoosterUI();
  }
  function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
  function closeModal(id) { document.getElementById(id).classList.add('hidden'); }
  document.querySelectorAll('[data-close]').forEach(b =>
    b.addEventListener('click', () => b.closest('.modal').classList.add('hidden')));
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
  function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }

  // ---------- boot ----------
  setInterval(tickLives, 1000);
  setInterval(tickSale, 1000);
  tickSale();
  if (S.lives <= 0) { startLevel(); showLivesModal(); }
  else startLevel();
})();
