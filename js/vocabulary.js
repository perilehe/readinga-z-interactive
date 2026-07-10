/**
 * vocabulary.js - Vocabulary module (self-rendering)
 */
const VocabularyModule = (() => {
  function render(container) {
    const words = bookData.vocabulary || [];
    container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'activity-layout active';
    wrapper.innerHTML = `
      <div class="activity-header"><h2>📚 Vocabulary</h2><p>Learn and practice the key words from this book!</p></div>
      <div class="vocab-tabs">
        <button class="vocab-tab active" data-vtab="wordwall">Word Wall</button>
        <button class="vocab-tab" data-vtab="matching">Matching</button>
        <button class="vocab-tab" data-vtab="context">Fill in the Blank</button>
      </div>
      <div class="vocab-subpanel active" id="vwPanel"></div>
      <div class="vocab-subpanel" id="vmPanel"></div>
      <div class="vocab-subpanel" id="vcPanel"></div>
    `;

    // Tab switching
    wrapper.querySelectorAll('.vocab-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        wrapper.querySelectorAll('.vocab-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        wrapper.querySelectorAll('.vocab-subpanel').forEach(p => p.classList.remove('active'));
        wrapper.querySelector(`#${tab.id.replace('tab-btn', 'Panel')}`)?.classList.add('active');
        // Fix: map data-vtab to panel id
        const vtab = tab.dataset.vtab;
        wrapper.querySelectorAll('.vocab-subpanel').forEach(p => p.classList.remove('active'));
        if (vtab === 'wordwall') wrapper.querySelector('#vwPanel').classList.add('active');
        if (vtab === 'matching') wrapper.querySelector('#vmPanel').classList.add('active');
        if (vtab === 'context') wrapper.querySelector('#vcPanel').classList.add('active');
      });
    });

    renderWordWall(wrapper.querySelector('#vwPanel'), words);
    renderMatching(wrapper.querySelector('#vmPanel'), words);
    renderContext(wrapper.querySelector('#vcPanel'), words);

    container.appendChild(wrapper);
  }

  function renderWordWall(panel, words) {
    panel.innerHTML = '';
    const wall = document.createElement('div');
    wall.className = 'word-wall';
    words.forEach(v => {
      const mastered = StarSystem.earned(`vocab-match-${v.word}`) && StarSystem.earned(`vocab-ctx-${v.word}`);
      const card = document.createElement('div');
      card.className = 'word-card';
      card.innerHTML = `
        <div><span class="word">${v.word}</span><span class="pos">${v.pos}</span></div>
        <div class="definition">${v.definition}</div>
        <div class="example">"${v.sentence}"</div>
        ${mastered ? '<span class="mastered-badge">✓ Mastered</span>' : ''}
      `;
      wall.appendChild(card);
    });
    panel.appendChild(wall);
  }

  function renderMatching(panel, words) {
    panel.innerHTML = '';
    const wrapperDiv = document.createElement('div');
    wrapperDiv.style.cssText = 'position:relative;padding:10px 0;';

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:5;';
    wrapperDiv.appendChild(svg);

    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:0 120px;align-items:start;position:relative;z-index:1;';

    const wordsCol = document.createElement('div');
    wordsCol.innerHTML = '<h4 style="font-family:var(--font-ui);color:#555;margin-bottom:10px;text-align:center;">Words</h4>';
    const defsCol = document.createElement('div');
    defsCol.innerHTML = '<h4 style="font-family:var(--font-ui);color:#555;margin-bottom:10px;text-align:center;">Definitions</h4>';

    const shuffledW = [...words].sort(() => Math.random() - 0.5);
    const shuffledD = [...words].sort(() => Math.random() - 0.5);
    let selectedWordEl = null;
    let pairs = [];

    function drawLine(wEl, dEl, color, dash) {
      const r = wrapperDiv.getBoundingClientRect();
      const wr = wEl.getBoundingClientRect();
      const dr = dEl.getBoundingClientRect();
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', wr.right - r.left);
      line.setAttribute('y1', wr.top + wr.height/2 - r.top);
      line.setAttribute('x2', dr.left - r.left);
      line.setAttribute('y2', dr.top + dr.height/2 - r.top);
      line.setAttribute('stroke', color);
      line.setAttribute('stroke-width', '2.5');
      if (dash) line.setAttribute('stroke-dasharray', '6,4');
      svg.appendChild(line);
      return line;
    }

    function redrawAll() {
      svg.innerHTML = '';
      pairs.forEach(p => { p.line = drawLine(p.wEl, p.dEl, p.locked ? '#4caf50' : '#2196f3', !p.locked); });
    }

    shuffledW.forEach(v => {
      const el = document.createElement('div');
      el.className = 'match-word';
      el.textContent = v.word;
      el.dataset.word = v.word;
      el.addEventListener('click', () => {
        if (el.classList.contains('locked')) return;
        const existing = pairs.find(p => p.wEl === el);
        if (existing) { existing.line.remove(); el.classList.remove('paired','selected'); existing.dEl.classList.remove('paired','selected'); pairs = pairs.filter(p => p !== existing); selectedWordEl = null; return; }
        wordsCol.querySelectorAll('.match-word').forEach(w => { if (!w.classList.contains('locked') && !w.classList.contains('paired')) w.classList.remove('selected'); });
        el.classList.add('selected');
        selectedWordEl = el;
      });
      wordsCol.appendChild(el);
    });

    shuffledD.forEach(v => {
      const el = document.createElement('div');
      el.className = 'match-definition';
      el.textContent = v.definition;
      el.dataset.word = v.word;
      el.addEventListener('click', () => {
        if (el.classList.contains('locked') || !selectedWordEl) return;
        const existing = pairs.find(p => p.dEl === el);
        if (existing) { existing.line.remove(); existing.wEl.classList.remove('paired','selected'); el.classList.remove('paired','selected'); pairs = pairs.filter(p => p !== existing); return; }
        const line = drawLine(selectedWordEl, el, '#2196f3', true);
        selectedWordEl.classList.remove('selected');
        selectedWordEl.classList.add('paired');
        el.classList.add('paired');
        pairs.push({ wEl: selectedWordEl, dEl: el, word: selectedWordEl.dataset.word, line, locked: false });
        selectedWordEl = null;
      });
      defsCol.appendChild(el);
    });

    grid.appendChild(wordsCol);
    grid.appendChild(defsCol);
    wrapperDiv.appendChild(grid);

    const submitBtn = document.createElement('button');
    submitBtn.className = 'btn btn-primary';
    submitBtn.textContent = 'Submit All Pairs';
    submitBtn.style.cssText = 'display:block;margin:20px auto;position:relative;z-index:2;';
    wrapperDiv.appendChild(submitBtn);

    const fb = document.createElement('div');
    fb.className = 'explanation-box';
    fb.style.cssText = 'margin-top:10px;position:relative;z-index:2;';
    wrapperDiv.appendChild(fb);

    panel.appendChild(wrapperDiv);
    panel.innerHTML += '<p style="font-family:var(--font-ui);font-size:0.85em;color:#666;margin-top:10px;text-align:center;">① Click a word ② Click its definition → blue line ③ Click paired item to unpair ④ Submit when all paired</p>';

    submitBtn.addEventListener('click', () => {
      if (pairs.length < words.length) { fb.className = 'explanation-box incorrect'; fb.textContent = `Pair all ${words.length} words first! (${pairs.length}/${words.length})`; return; }
      let correct = 0;
      pairs.forEach(p => {
        if (p.word === p.dEl.dataset.word) {
          p.locked = true;
          p.wEl.classList.remove('paired'); p.wEl.classList.add('locked','correct-match');
          p.dEl.classList.remove('paired'); p.dEl.classList.add('locked','correct-match');
          p.line.remove(); p.line = drawLine(p.wEl, p.dEl, '#4caf50', false);
          correct++;
          StarSystem.earn(`vocab-match-${p.word}`);
        } else {
          p.line.remove();
          p.wEl.classList.remove('paired'); p.wEl.classList.add('wrong-match');
          p.dEl.classList.remove('paired'); p.dEl.classList.add('wrong-match');
          setTimeout(() => { p.wEl.classList.remove('wrong-match'); p.dEl.classList.remove('wrong-match'); }, 1500);
        }
      });
      pairs = pairs.filter(p => p.locked);
      if (typeof updateAllTabStars === 'function') updateAllTabStars();
      // Re-render word wall
      renderWordWall(document.getElementById('vwPanel') || panel.closest('.activity-layout').querySelector('#vwPanel'), words);
      if (correct === words.length) { fb.className = 'explanation-box correct'; fb.textContent = `🎉 All ${words.length} matched!`; submitBtn.disabled = true; submitBtn.textContent = 'All Done!'; }
      else { fb.className = 'explanation-box incorrect'; fb.textContent = `${correct}/${words.length} correct. Retry the rest!`; }
    });

    let resizeTimer;
    window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(redrawAll, 100); });
  }

  function renderContext(panel, words) {
    panel.innerHTML = '';
    const sentences = words.map(v => ({ word: v.word, sentence: v.sentence.replace(new RegExp(`\\b${v.word}\\b`, 'i'), '______') }));
    shuffleArray(sentences);
    let idx = 0;

    function show() {
      panel.innerHTML = '';
      if (idx >= sentences.length) { panel.innerHTML = '<div style="text-align:center;padding:20px;background:var(--correct-bg);border-radius:8px;font-family:var(--font-ui);color:var(--correct-text);font-weight:600;">🎉 All complete!</div>'; return; }
      const item = sentences[idx];
      const vocab = words.find(v => v.word === item.word);
      panel.innerHTML = `
        <div style="font-family:var(--font-ui);font-size:0.85em;color:#999;margin-bottom:15px;">Question ${idx+1} of ${sentences.length}</div>
        <div class="context-sentence">${item.sentence.replace('______', '<span class="context-blank" id="ctxBlank">______</span>')}</div>
        <div class="word-bank" id="ctxBank"></div>
        <div style="margin-top:15px;padding:10px;background:#f5f5f5;border-radius:6px;font-family:var(--font-ui);font-size:0.85em;color:#666;">💡 <strong>Hint:</strong> ${vocab.definition}</div>
      `;
      const bankWords = [item.word, ...words.filter(w => w.word !== item.word).sort(() => Math.random()-0.5).slice(0,3).map(w => w.word)];
      shuffleArray(bankWords);
      const bank = panel.querySelector('#ctxBank');
      bankWords.forEach(w => {
        const el = document.createElement('span');
        el.className = 'word-bank-item';
        el.textContent = w;
        el.addEventListener('click', () => {
          if (el.classList.contains('used')) return;
          const blank = panel.querySelector('#ctxBlank');
          blank.textContent = w;
          blank.classList.add('filled');
          if (w === item.word) {
            blank.classList.add('correct-fill');
            el.classList.add('used');
            StarSystem.earn(`vocab-ctx-${item.word}`);
            if (typeof updateAllTabStars === 'function') updateAllTabStars();
            setTimeout(() => { idx++; show(); }, 1200);
          } else {
            blank.classList.add('wrong-fill');
            setTimeout(() => { blank.textContent = '______'; blank.classList.remove('filled','wrong-fill'); }, 1000);
          }
        });
        bank.appendChild(el);
      });
    }
    show();
  }

  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; }
  }

  return { render };
})();

// Expose to global scope for dynamic loading
window.VocabularyModule = VocabularyModule;
