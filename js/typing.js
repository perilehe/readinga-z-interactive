/**
 * typing.js - Typing speed test module (self-rendering)
 */
const TypingModule = (() => {
  let sentences = [];
  let currentIdx = 0;
  let timerStart = null;
  let timerInterval = null;
  let finished = false;

  function render(container) {
    sentences = (bookData.vocabulary || []).map(v => ({ text: v.sentence, word: v.word }));
    currentIdx = 0;
    finished = false;
    timerStart = null;
    if (timerInterval) clearInterval(timerInterval);
    renderSentence(container);
  }

  function renderSentence(container) {
    if (!container) container = document.getElementById('mainContent');
    container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'activity-layout active';
    wrapper.innerHTML = `<div class="activity-header"><h2>⌨️ Typing Practice</h2><p>Type the sentences below. Build speed and learn vocabulary!</p></div>`;

    if (currentIdx >= sentences.length) {
      wrapper.innerHTML += `<div style="text-align:center;padding:30px;background:var(--correct-bg);border-radius:12px;font-family:var(--font-ui);"><h3 style="color:var(--correct-text);">🎉 All sentences completed!</h3></div>`;
      container.appendChild(wrapper);
      return;
    }

    const sentence = sentences[currentIdx];

    // Progress
    const progress = document.createElement('div');
    progress.style.cssText = 'font-family:var(--font-ui);font-size:0.9em;color:#666;margin-bottom:15px;';
    progress.textContent = `Sentence ${currentIdx+1} of ${sentences.length}`;
    wrapper.appendChild(progress);

    // Target
    const target = document.createElement('div');
    target.style.cssText = 'background:white;padding:20px;border-radius:10px;border:2px solid #e0e0e0;font-size:1.15em;line-height:2;margin-bottom:15px;';
    let html = sentence.text;
    html = html.replace(new RegExp(`\\b(${sentence.word})\\b`, 'i'), '<mark style="background:#fff9c4;padding:2px 4px;border-radius:3px;font-weight:bold;">$1</mark>');
    target.innerHTML = html;
    wrapper.appendChild(target);

    // Stats
    const stats = document.createElement('div');
    stats.style.cssText = 'display:flex;gap:20px;margin-bottom:15px;font-family:var(--font-ui);';
    stats.innerHTML = `
      <div style="background:#e3f2fd;padding:8px 16px;border-radius:8px;"><span style="color:#1565c0;font-weight:600;">⏱</span> <span id="tTimer">0.0s</span></div>
      <div style="background:#e8f5e9;padding:8px 16px;border-radius:8px;"><span style="color:#2e7d32;font-weight:600;">🚀</span> <span id="tWpm">0</span> WPM</div>
      <div style="background:#fce4ec;padding:8px 16px;border-radius:8px;"><span style="color:#c62828;font-weight:600;">🎯</span> <span id="tAcc">100%</span></div>
    `;
    wrapper.appendChild(stats);

    // Input
    const input = document.createElement('textarea');
    input.style.cssText = 'width:100%;min-height:80px;padding:14px;border:2px solid #ddd;border-radius:10px;font-family:var(--font-body);font-size:1.05em;line-height:1.8;resize:vertical;';
    input.placeholder = 'Start typing...';
    input.addEventListener('input', () => {
      if (!timerStart && !finished && input.value.length > 0) startTimer();
      handleTyping(input, sentence, wrapper);
    });
    wrapper.appendChild(input);

    // Feedback
    const fb = document.createElement('div');
    fb.id = 'tFeedback';
    fb.style.cssText = 'margin-top:10px;font-family:"Courier New",monospace;font-size:1.1em;line-height:2;background:#fafafa;padding:12px;border-radius:8px;border:1px solid #e0e0e0;white-space:pre-wrap;word-break:break-all;';
    // Show target as dim guide
    fb.innerHTML = sentence.text.split('').map(c => `<span style="color:#ccc;">${esc(c)}</span>`).join('');
    wrapper.appendChild(fb);

    // Result
    const result = document.createElement('div');
    result.id = 'tResult';
    result.style.marginTop = '15px';
    wrapper.appendChild(result);

    container.appendChild(wrapper);
    finished = false;
    timerStart = null;
  }

  function startTimer() {
    timerStart = Date.now();
    timerInterval = setInterval(() => {
      const el = document.getElementById('tTimer');
      if (el) el.textContent = ((Date.now()-timerStart)/1000).toFixed(1) + 's';
    }, 100);
  }

  function handleTyping(input, sentence, wrapper) {
    if (finished) return;
    const typed = input.value;
    const target = sentence.text;
    const fb = wrapper.querySelector('#tFeedback');

    if (typed.length === 0) {
      fb.innerHTML = target.split('').map(c => `<span style="color:#ccc;">${esc(c)}</span>`).join('');
      wrapper.querySelector('#tWpm').textContent = '0';
      wrapper.querySelector('#tAcc').textContent = '100%';
      return;
    }

    const comparison = compare(typed, target);
    let correct = 0, errors = 0;
    const display = [];

    comparison.forEach(item => {
      if (item.correct) { correct++; display.push(`<span style="color:var(--correct-text);font-weight:bold;">${esc(item.typed)}</span>`); }
      else if (item.typed && item.target) { errors++; display.push(`<span style="color:white;background:var(--incorrect-text);border-radius:2px;padding:0 1px;">${esc(item.typed)}</span>`); }
      else if (item.typed) { errors++; display.push(`<span style="color:white;background:#ff9800;border-radius:2px;text-decoration:line-through;">${esc(item.typed)}</span>`); }
      else if (item.target) { errors++; display.push(`<span style="color:#ef9a9a;text-decoration:underline;">${esc(item.target)}</span>`); }
    });

    fb.innerHTML = display.join('');

    const elapsed = (Date.now()-timerStart)/1000/60;
    const wpm = elapsed > 0 ? Math.round((correct/5)/elapsed) : 0;
    const acc = (correct+errors) > 0 ? Math.round(correct/(correct+errors)*100) : 100;
    wrapper.querySelector('#tWpm').textContent = wpm;
    wrapper.querySelector('#tAcc').textContent = acc + '%';

    if (correct >= target.length) {
      finish(wpm, acc, (Date.now()-timerStart)/1000, wrapper);
    }
  }

  function compare(typed, target) {
    const result = [];
    let t = 0, r = 0;
    const MAX = 3;
    while (t < typed.length || r < target.length) {
      if (t >= typed.length && r >= target.length) break;
      if (t >= typed.length) { result.push({typed:null,target:target[r],correct:false}); r++; continue; }
      if (r >= target.length) { result.push({typed:typed[t],target:null,correct:false}); t++; continue; }
      if (typed[t] === target[r]) { result.push({typed:typed[t],target:target[r],correct:true}); t++; r++; continue; }

      let ins = -1, skip = -1;
      for (let n=1;n<=MAX;n++) { if (t+n<typed.length && typed[t+n]===target[r]) { ins=n; break; } }
      for (let n=1;n<=MAX;n++) { if (r+n<target.length && typed[t]===target[r+n]) { skip=n; break; } }

      if (ins>0 && skip<0) { for(let n=0;n<ins;n++){result.push({typed:typed[t],target:null,correct:false});t++;} }
      else if (skip>0 && ins<0) { for(let n=0;n<skip;n++){result.push({typed:null,target:target[r],correct:false});r++;} }
      else if (ins>0 && skip>0) { if(ins<=skip){for(let n=0;n<ins;n++){result.push({typed:typed[t],target:null,correct:false});t++;}}else{for(let n=0;n<skip;n++){result.push({typed:null,target:target[r],correct:false});r++;}} }
      else { result.push({typed:typed[t],target:target[r],correct:false}); t++; r++; }
    }
    return result;
  }

  function finish(wpm, acc, elapsed, wrapper) {
    finished = true;
    if (timerInterval) clearInterval(timerInterval);
    const result = wrapper.querySelector('#tResult');
    let grade='', color='';
    if (wpm>=40&&acc>=95){grade='⭐⭐⭐ Excellent!';color='var(--correct-text)';}
    else if(wpm>=25&&acc>=85){grade='⭐⭐ Great!';color='#f57f17';}
    else{grade='⭐ Good effort!';color='#666';}

    result.innerHTML = `
      <div style="background:white;padding:20px;border-radius:10px;border:2px solid var(--primary);font-family:var(--font-ui);">
        <div style="text-align:center;margin-bottom:15px;font-size:1.5em;font-weight:bold;color:${color};">${grade}</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:15px;text-align:center;">
          <div><div style="font-size:2em;font-weight:bold;color:var(--primary);">${wpm}</div><div style="font-size:0.85em;color:#666;">WPM</div></div>
          <div><div style="font-size:2em;font-weight:bold;color:var(--primary);">${acc}%</div><div style="font-size:0.85em;color:#666;">Accuracy</div></div>
          <div><div style="font-size:2em;font-weight:bold;color:var(--primary);">${elapsed.toFixed(1)}s</div><div style="font-size:0.85em;color:#666;">Time</div></div>
        </div>
        <div style="text-align:center;margin-top:15px;">
          <button class="btn btn-primary" id="tNext" style="margin-right:10px;">Next →</button>
          <button class="btn btn-secondary" id="tRetry">Retry</button>
        </div>
      </div>
    `;
    if (wpm>=20&&acc>=80) { StarSystem.earn(`typing-${currentIdx}`); if(typeof updateAllTabStars==='function') updateAllTabStars(); }
    wrapper.querySelector('#tNext').addEventListener('click', () => { currentIdx++; renderSentence(wrapper.closest('.activity-layout').parentElement || document.getElementById('mainContent')); });
    wrapper.querySelector('#tRetry').addEventListener('click', () => renderSentence(wrapper.closest('.activity-layout').parentElement || document.getElementById('mainContent')));
  }

  function esc(t) { const d=document.createElement('div'); d.textContent=t; return d.innerHTML; }

  return { render };
})();

// Expose to global scope for dynamic loading
window.TypingModule = TypingModule;
