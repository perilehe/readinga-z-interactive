/**
 * typing.js - Typing speed test module with visual feedback
 */
const TypingModule = (() => {
  let mode = 'sentence'; // 'sentence' or 'words'
  let sentences = [];
  let currentIdx = 0;
  let allWords = '';
  let timerStart = null;
  let timerInterval = null;
  let finished = false;

  function render(container) {
    if (!container) container = document.getElementById('mainContent');
    container.innerHTML = '';
    finished = false;
    timerStart = null;
    if (timerInterval) clearInterval(timerInterval);

    const wrapper = document.createElement('div');
    wrapper.className = 'activity-layout active';
    wrapper.innerHTML = `
      <div class="activity-header"><h2>⌨️ Typing Practice</h2><p>Build speed and learn vocabulary!</p></div>
      <div style="display:flex;gap:10px;margin-bottom:20px;">
        <button class="btn ${mode === 'sentence' ? 'btn-primary' : 'btn-secondary'}" id="modeSentence">📝 Sentence Mode</button>
        <button class="btn ${mode === 'words' ? 'btn-primary' : 'btn-secondary'}" id="modeWords">⭐ All Words Mode</button>
      </div>
      <div id="typingContent"></div>
    `;

    wrapper.querySelector('#modeSentence').onclick = () => { mode = 'sentence'; render(container); };
    wrapper.querySelector('#modeWords').onclick = () => { mode = 'words'; render(container); };

    const content = wrapper.querySelector('#typingContent');
    if (mode === 'sentence') {
      sentences = (bookData.vocabulary || []).map(v => ({ text: v.sentence, word: v.word }));
      currentIdx = 0;
      renderSentence(content);
    } else {
      allWords = (bookData.vocabulary || []).map(v => v.word).join(' ');
      renderWords(content);
    }

    container.appendChild(wrapper);
  }

  // ============ ALL WORDS MODE ============
  function renderWords(container) {
    container.innerHTML = '';

    const wordCount = (bookData.vocabulary || []).length;
    const charCount = allWords.length;

    // Stats bar
    const stats = document.createElement('div');
    stats.style.cssText = 'display:flex;gap:20px;margin-bottom:20px;font-family:var(--font-ui);flex-wrap:wrap;';
    stats.innerHTML = `
      <div style="background:#e3f2fd;padding:10px 20px;border-radius:10px;"><span style="color:#1565c0;font-weight:600;">📚</span> ${wordCount} words</div>
      <div style="background:#e8f5e9;padding:10px 20px;border-radius:10px;"><span style="color:#2e7d32;font-weight:600;">🔤</span> ${charCount} characters</div>
      <div style="background:#fff3e0;padding:10px 20px;border-radius:10px;"><span style="color:#e65100;font-weight:600;">⏱</span> <span id="tTimer">0.0s</span></div>
      <div style="background:#f3e5f5;padding:10px 20px;border-radius:10px;"><span style="color:#6a1b9a;font-weight:600;">🚀</span> <span id="tWpm">0</span> WPM</div>
      <div style="background:#fce4ec;padding:10px 20px;border-radius:10px;"><span style="color:#c62828;font-weight:600;">🎯</span> <span id="tAcc">100%</span></div>
    `;
    container.appendChild(stats);

    // Target display (light text, becomes bright as typed)
    const targetDisplay = document.createElement('div');
    targetDisplay.id = 'targetDisplay';
    targetDisplay.style.cssText = 'background:white;padding:25px;border-radius:12px;border:2px solid #e0e0e0;font-family:var(--font-body);font-size:1.3em;line-height:2.2;margin-bottom:20px;min-height:100px;';
    targetDisplay.innerHTML = allWords.split('').map(c => `<span style="color:#ddd;">${esc(c)}</span>`).join('');
    container.appendChild(targetDisplay);

    // Input
    const input = document.createElement('textarea');
    input.style.cssText = 'width:100%;min-height:120px;padding:18px;border:2px solid #ddd;border-radius:12px;font-family:var(--font-body);font-size:1.2em;line-height:2;resize:vertical;';
    input.placeholder = 'Type all the words here... (space between words)';
    input.addEventListener('input', () => {
      if (!timerStart && !finished && input.value.length > 0) startTimer();
      handleWordsTyping(input, container);
    });
    container.appendChild(input);

    // Result area
    const result = document.createElement('div');
    result.id = 'tResult';
    result.style.marginTop = '20px';
    container.appendChild(result);

    finished = false;
    timerStart = null;
  }

  function handleWordsTyping(input, container) {
    if (finished) return;
    const typed = input.value;
    const target = allWords;
    const display = container.querySelector('#targetDisplay');

    if (typed.length === 0) {
      display.innerHTML = target.split('').map(c => `<span style="color:#ddd;">${esc(c)}</span>`).join('');
      container.querySelector('#tWpm').textContent = '0';
      container.querySelector('#tAcc').textContent = '100%';
      return;
    }

    const comparison = compare(typed, target);
    let correct = 0, errors = 0;
    const displayHtml = [];

    comparison.forEach(item => {
      if (item.correct) {
        correct++;
        displayHtml.push(`<span style="color:var(--primary);font-weight:600;">${esc(item.target)}</span>`);
      } else if (item.typed && item.target) {
        // Wrong character - red
        errors++;
        displayHtml.push(`<span style="color:white;background:var(--incorrect-text);border-radius:3px;padding:0 2px;">${esc(item.target)}</span>`);
      } else if (item.typed && !item.target) {
        // Extra character - red strikethrough
        errors++;
        displayHtml.push(`<span style="color:var(--incorrect-text);text-decoration:line-through;">${esc(item.typed)}</span>`);
      } else if (!item.typed && item.target) {
        // Missing character - yellow
        errors++;
        displayHtml.push(`<span style="color:#f57f17;background:#fff9c4;border-radius:3px;padding:0 2px;">${esc(item.target)}</span>`);
      }
    });

    display.innerHTML = displayHtml.join('');

    const elapsed = timerStart ? (Date.now() - timerStart) / 1000 / 60 : 0;
    const wpm = elapsed > 0 ? Math.round((correct / 5) / elapsed) : 0;
    const acc = (correct + errors) > 0 ? Math.round(correct / (correct + errors) * 100) : 100;
    container.querySelector('#tWpm').textContent = wpm;
    container.querySelector('#tAcc').textContent = acc + '%';

    // Check if complete
    if (correct >= target.length && typed.length >= target.length) {
      finishWords(wpm, acc, (Date.now() - timerStart) / 1000, container);
    }
  }

  function finishWords(wpm, acc, elapsed, container) {
    finished = true;
    if (timerInterval) clearInterval(timerInterval);
    const result = container.querySelector('#tResult');
    let grade = '', color = '';
    if (wpm >= 40 && acc >= 95) { grade = '⭐⭐⭐ Excellent!'; color = 'var(--correct-text)'; }
    else if (wpm >= 25 && acc >= 85) { grade = '⭐⭐ Great!'; color = '#f57f17'; }
    else if (acc >= 70) { grade = '⭐ Good effort!'; color = '#666'; }
    else { grade = '💪 Keep practicing!'; color = '#999'; }

    result.innerHTML = `
      <div style="background:white;padding:25px;border-radius:12px;border:2px solid var(--primary);font-family:var(--font-ui);">
        <div style="text-align:center;margin-bottom:20px;font-size:1.8em;font-weight:bold;color:${color};">${grade}</div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:20px;text-align:center;">
          <div><div style="font-size:2.2em;font-weight:bold;color:var(--primary);">${wpm}</div><div style="font-size:0.9em;color:#666;">WPM</div></div>
          <div><div style="font-size:2.2em;font-weight:bold;color:var(--primary);">${acc}%</div><div style="font-size:0.9em;color:#666;">Accuracy</div></div>
          <div><div style="font-size:2.2em;font-weight:bold;color:var(--primary);">${elapsed.toFixed(1)}s</div><div style="font-size:0.9em;color:#666;">Time</div></div>
          <div><div style="font-size:2.2em;font-weight:bold;color:var(--primary);">${(bookData.vocabulary || []).length}</div><div style="font-size:0.9em;color:#666;">Words</div></div>
        </div>
        <div style="text-align:center;margin-top:20px;">
          <button class="btn btn-primary" id="tRetry">🔄 Try Again</button>
        </div>
      </div>
    `;

    // Earn star for completion
    if (acc >= 70) {
      StarSystem.earn('typing-allwords');
      if (typeof updateAllTabStars === 'function') updateAllTabStars();
    }

    container.querySelector('#tRetry').addEventListener('click', () => {
      const mainContent = document.getElementById('mainContent');
      render(mainContent);
    });
  }

  // ============ SENTENCE MODE ============
  function renderSentence(container) {
    container.innerHTML = '';

    if (currentIdx >= sentences.length) {
      container.innerHTML = `
        <div style="text-align:center;padding:40px;background:var(--correct-bg);border-radius:12px;font-family:var(--font-ui);">
          <h3 style="color:var(--correct-text);font-size:1.5em;">🎉 All sentences completed!</h3>
          <p style="margin-top:10px;color:#666;">Great job practicing all the vocabulary sentences!</p>
        </div>
      `;
      return;
    }

    const sentence = sentences[currentIdx];

    // Progress
    const progress = document.createElement('div');
    progress.style.cssText = 'font-family:var(--font-ui);font-size:0.9em;color:#666;margin-bottom:15px;';
    progress.textContent = `Sentence ${currentIdx + 1} of ${sentences.length}`;
    container.appendChild(progress);

    // Stats
    const stats = document.createElement('div');
    stats.style.cssText = 'display:flex;gap:15px;margin-bottom:15px;font-family:var(--font-ui);flex-wrap:wrap;';
    stats.innerHTML = `
      <div style="background:#e3f2fd;padding:8px 16px;border-radius:8px;"><span style="color:#1565c0;font-weight:600;">⏱</span> <span id="tTimer">0.0s</span></div>
      <div style="background:#e8f5e9;padding:8px 16px;border-radius:8px;"><span style="color:#2e7d32;font-weight:600;">🚀</span> <span id="tWpm">0</span> WPM</div>
      <div style="background:#fce4ec;padding:8px 16px;border-radius:8px;"><span style="color:#c62828;font-weight:600;">🎯</span> <span id="tAcc">100%</span></div>
    `;
    container.appendChild(stats);

    // Target display (light text, becomes bright as typed)
    const targetDisplay = document.createElement('div');
    targetDisplay.id = 'targetDisplay';
    targetDisplay.style.cssText = 'background:white;padding:20px;border-radius:10px;border:2px solid #e0e0e0;font-family:var(--font-body);font-size:1.2em;line-height:2;margin-bottom:15px;';
    // Highlight the vocab word in the target
    let html = sentence.text;
    html = html.replace(new RegExp(`\\b(${sentence.word})\\b`, 'i'), '<span style="background:#fff9c4;padding:2px 6px;border-radius:4px;font-weight:bold;color:#f57f17;">$1</span>');
    // Wrap non-highlighted text in light color
    html = `<span style="color:#ddd;">${html}</span>`;
    targetDisplay.innerHTML = html;
    container.appendChild(targetDisplay);

    // Input
    const input = document.createElement('textarea');
    input.style.cssText = 'width:100%;min-height:100px;padding:16px;border:2px solid #ddd;border-radius:10px;font-family:var(--font-body);font-size:1.1em;line-height:1.8;resize:vertical;';
    input.placeholder = 'Start typing the sentence... (Press Enter to submit)';
    input.addEventListener('input', () => {
      if (!timerStart && !finished && input.value.length > 0) startTimer();
      handleSentenceTyping(input, sentence, container);
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !finished && input.value.length > 0) {
        e.preventDefault();
        const typed = input.value;
        const target = sentence.text;
        const comparison = compare(typed, target);
        let correct = 0, errors = 0;
        comparison.forEach(item => {
          if (item.correct) correct++;
          else errors++;
        });
        const elapsed = (Date.now() - timerStart) / 1000 / 60;
        const wpm = elapsed > 0 ? Math.round((correct / 5) / elapsed) : 0;
        const acc = (correct + errors) > 0 ? Math.round(correct / (correct + errors) * 100) : 100;
        finishSentence(wpm, acc, (Date.now() - timerStart) / 1000, container);
      }
    });
    container.appendChild(input);

    // Result area
    const result = document.createElement('div');
    result.id = 'tResult';
    result.style.marginTop = '15px';
    container.appendChild(result);

    finished = false;
    timerStart = null;
  }

  function handleSentenceTyping(input, sentence, container) {
    if (finished) return;
    const typed = input.value;
    const target = sentence.text;
    const display = container.querySelector('#targetDisplay');

    if (typed.length === 0) {
      // Reset to light gray with highlighted vocab word
      let html = target;
      html = html.replace(new RegExp(`\\b(${sentence.word})\\b`, 'i'), '<span style="background:#fff9c4;padding:2px 6px;border-radius:4px;font-weight:bold;color:#f57f17;">$1</span>');
      // Wrap everything in light color - vocab word keeps its own color
      html = `<span style="color:#ddd;">${html}</span>`;
      display.innerHTML = html;
      container.querySelector('#tWpm').textContent = '0';
      container.querySelector('#tAcc').textContent = '100%';
      return;
    }

    const comparison = compare(typed, target);
    let correct = 0, errors = 0;
    const displayHtml = [];

    comparison.forEach(item => {
      if (item.correct) {
        correct++;
        displayHtml.push(`<span style="color:var(--primary);font-weight:500;">${esc(item.target)}</span>`);
      } else if (item.typed && item.target) {
        // Wrong character - red background
        errors++;
        displayHtml.push(`<span style="color:white;background:var(--incorrect-text);border-radius:3px;padding:0 2px;">${esc(item.target)}</span>`);
      } else if (item.typed && !item.target) {
        // Extra character - red strikethrough
        errors++;
        displayHtml.push(`<span style="color:var(--incorrect-text);text-decoration:line-through;">${esc(item.typed)}</span>`);
      } else if (!item.typed && item.target) {
        // Missing character - yellow
        errors++;
        displayHtml.push(`<span style="color:#f57f17;background:#fff9c4;border-radius:3px;padding:0 2px;">${esc(item.target)}</span>`);
      }
    });

    display.innerHTML = displayHtml.join('');

    const elapsed = timerStart ? (Date.now() - timerStart) / 1000 / 60 : 0;
    const wpm = elapsed > 0 ? Math.round((correct / 5) / elapsed) : 0;
    const acc = (correct + errors) > 0 ? Math.round(correct / (correct + errors) * 100) : 100;
    container.querySelector('#tWpm').textContent = wpm;
    container.querySelector('#tAcc').textContent = acc + '%';

    // Check if complete
    if (correct >= target.length && typed.length >= target.length) {
      finishSentence(wpm, acc, (Date.now() - timerStart) / 1000, container);
    }
  }

  function finishSentence(wpm, acc, elapsed, container) {
    finished = true;
    if (timerInterval) clearInterval(timerInterval);
    const result = container.querySelector('#tResult');
    let grade = '', color = '';
    if (wpm >= 40 && acc >= 95) { grade = '⭐⭐⭐ Excellent!'; color = 'var(--correct-text)'; }
    else if (wpm >= 25 && acc >= 85) { grade = '⭐⭐ Great!'; color = '#f57f17'; }
    else if (acc >= 70) { grade = '⭐ Good effort!'; color = '#666'; }
    else { grade = '💪 Keep practicing!'; color = '#999'; }

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

    // Give star if accuracy >= 70%
    if (acc >= 70) {
      StarSystem.earn(`typing-${currentIdx}`);
      if (typeof updateAllTabStars === 'function') updateAllTabStars();
    }

    container.querySelector('#tNext').addEventListener('click', () => {
      currentIdx++;
      const mainContent = document.getElementById('mainContent');
      const wrapper = mainContent.querySelector('.activity-layout');
      const content = wrapper.querySelector('#typingContent');
      renderSentence(content);
    });
    container.querySelector('#tRetry').addEventListener('click', () => {
      const mainContent = document.getElementById('mainContent');
      const wrapper = mainContent.querySelector('.activity-layout');
      const content = wrapper.querySelector('#typingContent');
      renderSentence(content);
    });
  }

  // ============ UTILITIES ============
  function startTimer() {
    timerStart = Date.now();
    timerInterval = setInterval(() => {
      const el = document.getElementById('tTimer');
      if (el) el.textContent = ((Date.now() - timerStart) / 1000).toFixed(1) + 's';
    }, 100);
  }

  function compare(typed, target) {
    const result = [];
    let t = 0, r = 0;
    const MAX = 3;
    while (t < typed.length || r < target.length) {
      if (t >= typed.length && r >= target.length) break;
      if (t >= typed.length) { result.push({ typed: null, target: target[r], correct: false }); r++; continue; }
      if (r >= target.length) { result.push({ typed: typed[t], target: null, correct: false }); t++; continue; }
      if (typed[t] === target[r]) { result.push({ typed: typed[t], target: target[r], correct: true }); t++; r++; continue; }

      let ins = -1, skip = -1;
      for (let n = 1; n <= MAX; n++) { if (t + n < typed.length && typed[t + n] === target[r]) { ins = n; break; } }
      for (let n = 1; n <= MAX; n++) { if (r + n < target.length && typed[t] === target[r + n]) { skip = n; break; } }

      if (ins > 0 && skip < 0) { for (let n = 0; n < ins; n++) { result.push({ typed: typed[t], target: null, correct: false }); t++; } }
      else if (skip > 0 && ins < 0) { for (let n = 0; n < skip; n++) { result.push({ typed: null, target: target[r], correct: false }); r++; } }
      else if (ins > 0 && skip > 0) {
        if (ins <= skip) { for (let n = 0; n < ins; n++) { result.push({ typed: typed[t], target: null, correct: false }); t++; } }
        else { for (let n = 0; n < skip; n++) { result.push({ typed: null, target: target[r], correct: false }); r++; } }
      }
      else { result.push({ typed: typed[t], target: target[r], correct: false }); t++; r++; }
    }
    return result;
  }

  function esc(t) {
    const d = document.createElement('div');
    d.textContent = t;
    return d.innerHTML;
  }

  return { render };
})();

// Expose to global scope for dynamic loading
window.TypingModule = TypingModule;
