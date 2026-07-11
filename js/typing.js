/**
 * typing.js - Typing speed test module (Typing Club style)
 * Type directly on the displayed text - no separate input box
 */
const TypingModule = (() => {
  let mode = 'sentence'; // 'sentence' or 'words'
  let sentences = [];
  let currentIdx = 0;
  let allWords = '';
  let timerStart = null;
  let timerInterval = null;
  let finished = false;
  let typedChars = [];
  let targetChars = [];
  let currentPos = 0;

  function render(container) {
    if (!container) container = document.getElementById('mainContent');
    container.innerHTML = '';
    finished = false;
    timerStart = null;
    typedChars = [];
    currentPos = 0;
    if (timerInterval) clearInterval(timerInterval);

    // Remove any existing key handler
    document.onkeydown = null;

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

    targetChars = allWords.split('');
    typedChars = new Array(targetChars.length).fill(null);
    currentPos = 0;

    const wordCount = (bookData.vocabulary || []).length;
    const charCount = allWords.length;

    // Stats bar
    const stats = document.createElement('div');
    stats.style.cssText = 'display:flex;gap:20px;margin-bottom:25px;font-family:var(--font-ui);flex-wrap:wrap;';
    stats.innerHTML = `
      <div style="background:#e3f2fd;padding:12px 24px;border-radius:10px;font-size:1.1em;"><span style="color:#1565c0;font-weight:600;">📚</span> ${wordCount} words</div>
      <div style="background:#e8f5e9;padding:12px 24px;border-radius:10px;font-size:1.1em;"><span style="color:#2e7d32;font-weight:600;">🔤</span> ${charCount} characters</div>
      <div style="background:#fff3e0;padding:12px 24px;border-radius:10px;font-size:1.1em;"><span style="color:#e65100;font-weight:600;">⏱</span> <span id="tTimer">0.0s</span></div>
      <div style="background:#f3e5f5;padding:12px 24px;border-radius:10px;font-size:1.1em;"><span style="color:#6a1b9a;font-weight:600;">🚀</span> <span id="tWpm">0</span> WPM</div>
      <div style="background:#fce4ec;padding:12px 24px;border-radius:10px;font-size:1.1em;"><span style="color:#c62828;font-weight:600;">🎯</span> <span id="tAcc">100%</span></div>
    `;
    container.appendChild(stats);

    // Target display - large font, click to focus
    const targetDisplay = document.createElement('div');
    targetDisplay.id = 'targetDisplay';
    targetDisplay.style.cssText = 'background:white;padding:35px;border-radius:15px;border:3px solid #e0e0e0;font-family:"Courier New",monospace;font-size:2em;line-height:1.8;margin-bottom:25px;min-height:150px;cursor:text;outline:none;';
    targetDisplay.tabIndex = 0;
    updateWordsDisplay(targetDisplay);
    targetDisplay.addEventListener('click', () => targetDisplay.focus());
    container.appendChild(targetDisplay);

    // Instructions
    const instructions = document.createElement('div');
    instructions.style.cssText = 'text-align:center;font-family:var(--font-ui);font-size:1.1em;color:#666;padding:15px;background:#f5f5f5;border-radius:10px;';
    instructions.innerHTML = '👆 Click above and start typing!';
    container.appendChild(instructions);

    // Result area
    const result = document.createElement('div');
    result.id = 'tResult';
    result.style.marginTop = '25px';
    container.appendChild(result);

    finished = false;
    timerStart = null;

    // Setup keyboard handler
    targetDisplay.focus();
    document.onkeydown = (e) => handleWordsKeydown(e, container);
  }

  function updateWordsDisplay(display) {
    let html = '';
    for (let i = 0; i < targetChars.length; i++) {
      const target = targetChars[i];
      const typed = typedChars[i];

      if (i === currentPos && !finished) {
        // Current position - show cursor
        html += `<span style="background:#2196f3;color:white;animation:blink 1s infinite;">${esc(target)}</span>`;
      } else if (typed === null) {
        // Not yet typed - light gray
        html += `<span style="color:#ccc;">${esc(target)}</span>`;
      } else if (typed === target) {
        // Correct - primary color
        html += `<span style="color:var(--primary);font-weight:600;">${esc(target)}</span>`;
      } else {
        // Wrong - red background
        html += `<span style="color:white;background:var(--incorrect-text);border-radius:3px;">${esc(target)}</span>`;
      }
    }
    display.innerHTML = html;
  }

  function handleWordsKeydown(e, container) {
    if (finished) return;
    if (e.key.length !== 1 && e.key !== 'Backspace') return;
    e.preventDefault();

    if (!timerStart) startTimer();

    const display = container.querySelector('#targetDisplay');

    if (e.key === 'Backspace') {
      // Delete previous character
      if (currentPos > 0) {
        currentPos--;
        typedChars[currentPos] = null;
        updateWordsDisplay(display);
        updateStats(container);
      }
      return;
    }

    if (currentPos >= targetChars.length) return;

    typedChars[currentPos] = e.key;
    currentPos++;

    updateWordsDisplay(display);
    updateStats(container);

    // Check if complete
    const correct = typedChars.filter((t, i) => t === targetChars[i] && t !== null).length;
    if (correct >= targetChars.length) {
      finishWords(container);
    }
  }

  function updateStats(container) {
    const correct = typedChars.filter((t, i) => t === targetChars[i] && t !== null).length;
    const errors = typedChars.filter((t, i) => t !== null && t !== targetChars[i]).length;

    const elapsed = timerStart ? (Date.now() - timerStart) / 1000 / 60 : 0;
    const wpm = elapsed > 0 ? Math.round((correct / 5) / elapsed) : 0;
    const acc = (correct + errors) > 0 ? Math.round(correct / (correct + errors) * 100) : 100;

    const wpmEl = container.querySelector('#tWpm');
    const accEl = container.querySelector('#tAcc');
    if (wpmEl) wpmEl.textContent = wpm;
    if (accEl) accEl.textContent = acc + '%';
  }

  function finishWords(container) {
    finished = true;
    if (timerInterval) clearInterval(timerInterval);
    document.onkeydown = null;

    const correct = typedChars.filter((t, i) => t === targetChars[i] && t !== null).length;
    const errors = typedChars.filter((t, i) => t !== null && t !== targetChars[i]).length;
    const elapsed = (Date.now() - timerStart) / 1000;
    const minutes = elapsed / 60;
    const wpm = minutes > 0 ? Math.round((correct / 5) / minutes) : 0;
    const acc = (correct + errors) > 0 ? Math.round(correct / (correct + errors) * 100) : 100;

    const result = container.querySelector('#tResult');
    let grade = '', color = '';
    if (wpm >= 40 && acc >= 95) { grade = '⭐⭐⭐ Excellent!'; color = 'var(--correct-text)'; }
    else if (wpm >= 25 && acc >= 85) { grade = '⭐⭐ Great!'; color = '#f57f17'; }
    else if (acc >= 70) { grade = '⭐ Good effort!'; color = '#666'; }
    else { grade = '💪 Keep practicing!'; color = '#999'; }

    result.innerHTML = `
      <div style="background:white;padding:30px;border-radius:15px;border:3px solid var(--primary);font-family:var(--font-ui);">
        <div style="text-align:center;margin-bottom:25px;font-size:2em;font-weight:bold;color:${color};">${grade}</div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:25px;text-align:center;">
          <div><div style="font-size:2.5em;font-weight:bold;color:var(--primary);">${wpm}</div><div style="font-size:1em;color:#666;">WPM</div></div>
          <div><div style="font-size:2.5em;font-weight:bold;color:var(--primary);">${acc}%</div><div style="font-size:1em;color:#666;">Accuracy</div></div>
          <div><div style="font-size:2.5em;font-weight:bold;color:var(--primary);">${elapsed.toFixed(1)}s</div><div style="font-size:1em;color:#666;">Time</div></div>
          <div><div style="font-size:2.5em;font-weight:bold;color:var(--primary);">${(bookData.vocabulary || []).length}</div><div style="font-size:1em;color:#666;">Words</div></div>
        </div>
        <div style="text-align:center;margin-top:25px;">
          <button class="btn btn-primary" id="tRetry" style="font-size:1.1em;padding:12px 30px;">🔄 Try Again</button>
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
        <div style="text-align:center;padding:50px;background:var(--correct-bg);border-radius:15px;font-family:var(--font-ui);">
          <h3 style="color:var(--correct-text);font-size:1.8em;">🎉 All sentences completed!</h3>
          <p style="margin-top:15px;color:#666;font-size:1.2em;">Great job practicing all the vocabulary sentences!</p>
        </div>
      `;
      return;
    }

    const sentence = sentences[currentIdx];
    targetChars = sentence.text.split('');
    typedChars = new Array(targetChars.length).fill(null);
    currentPos = 0;

    // Progress
    const progress = document.createElement('div');
    progress.style.cssText = 'font-family:var(--font-ui);font-size:1.1em;color:#666;margin-bottom:20px;';
    progress.textContent = `Sentence ${currentIdx + 1} of ${sentences.length}`;
    container.appendChild(progress);

    // Stats
    const stats = document.createElement('div');
    stats.style.cssText = 'display:flex;gap:20px;margin-bottom:20px;font-family:var(--font-ui);flex-wrap:wrap;';
    stats.innerHTML = `
      <div style="background:#e3f2fd;padding:10px 20px;border-radius:10px;font-size:1.1em;"><span style="color:#1565c0;font-weight:600;">⏱</span> <span id="tTimer">0.0s</span></div>
      <div style="background:#e8f5e9;padding:10px 20px;border-radius:10px;font-size:1.1em;"><span style="color:#2e7d32;font-weight:600;">🚀</span> <span id="tWpm">0</span> WPM</div>
      <div style="background:#fce4ec;padding:10px 20px;border-radius:10px;font-size:1.1em;"><span style="color:#c62828;font-weight:600;">🎯</span> <span id="tAcc">100%</span></div>
    `;
    container.appendChild(stats);

    // Target display - large font
    const targetDisplay = document.createElement('div');
    targetDisplay.id = 'targetDisplay';
    targetDisplay.style.cssText = 'background:white;padding:30px;border-radius:15px;border:3px solid #e0e0e0;font-family:"Courier New",monospace;font-size:1.8em;line-height:1.8;margin-bottom:20px;min-height:120px;cursor:text;outline:none;';
    targetDisplay.tabIndex = 0;
    updateSentenceDisplay(targetDisplay, sentence);
    targetDisplay.addEventListener('click', () => targetDisplay.focus());
    container.appendChild(targetDisplay);

    // Instructions
    const instructions = document.createElement('div');
    instructions.style.cssText = 'text-align:center;font-family:var(--font-ui);font-size:1.1em;color:#666;padding:15px;background:#f5f5f5;border-radius:10px;';
    instructions.innerHTML = '👆 Click above and start typing!';
    container.appendChild(instructions);

    // Result area
    const result = document.createElement('div');
    result.id = 'tResult';
    result.style.marginTop = '20px';
    container.appendChild(result);

    finished = false;
    timerStart = null;

    // Setup keyboard handler
    targetDisplay.focus();
    document.onkeydown = (e) => handleSentenceKeydown(e, sentence, container);
  }

  function updateSentenceDisplay(display, sentence) {
    let html = '';
    for (let i = 0; i < targetChars.length; i++) {
      const target = targetChars[i];
      const typed = typedChars[i];

      // Check if this character is part of the vocab word
      const wordLower = sentence.word.toLowerCase();
      const textLower = sentence.text.toLowerCase();
      const wordStart = textLower.indexOf(wordLower);
      const wordEnd = wordStart + sentence.word.length;
      const charInWord = i >= wordStart && i < wordEnd;

      if (i === currentPos && !finished) {
        // Current position - show cursor
        const bgStyle = charInWord ? 'background:#f57f17;' : 'background:#2196f3;';
        html += `<span style="${bgStyle}color:white;animation:blink 1s infinite;">${esc(target)}</span>`;
      } else if (typed === null) {
        // Not yet typed - light gray, but vocab word has hint
        if (charInWord) {
          html += `<span style="color:#ffcc80;background:#fff9c4;">${esc(target)}</span>`;
        } else {
          html += `<span style="color:#ccc;">${esc(target)}</span>`;
        }
      } else if (typed === target) {
        // Correct - primary color
        html += `<span style="color:var(--primary);font-weight:600;">${esc(target)}</span>`;
      } else {
        // Wrong - red background
        html += `<span style="color:white;background:var(--incorrect-text);border-radius:3px;">${esc(target)}</span>`;
      }
    }
    display.innerHTML = html;
  }

  function handleSentenceKeydown(e, sentence, container) {
    if (finished) return;
    if (e.key.length !== 1 && e.key !== 'Backspace') return;
    e.preventDefault();

    if (!timerStart) startTimer();

    const display = container.querySelector('#targetDisplay');

    if (e.key === 'Backspace') {
      // Delete previous character
      if (currentPos > 0) {
        currentPos--;
        typedChars[currentPos] = null;
        updateSentenceDisplay(display, sentence);
        updateStats(container);
      }
      return;
    }

    if (currentPos >= targetChars.length) return;

    typedChars[currentPos] = e.key;
    currentPos++;

    updateSentenceDisplay(display, sentence);
    updateStats(container);

    // Check if complete
    const correct = typedChars.filter((t, i) => t === targetChars[i] && t !== null).length;
    if (correct >= targetChars.length) {
      finishSentence(container);
    }
  }

  function finishSentence(container) {
    finished = true;
    if (timerInterval) clearInterval(timerInterval);
    document.onkeydown = null;

    const correct = typedChars.filter((t, i) => t === targetChars[i] && t !== null).length;
    const errors = typedChars.filter((t, i) => t !== null && t !== targetChars[i]).length;
    const elapsed = (Date.now() - timerStart) / 1000;
    const minutes = elapsed / 60;
    const wpm = minutes > 0 ? Math.round((correct / 5) / minutes) : 0;
    const acc = (correct + errors) > 0 ? Math.round(correct / (correct + errors) * 100) : 100;

    const result = container.querySelector('#tResult');
    let grade = '', color = '';
    if (wpm >= 40 && acc >= 95) { grade = '⭐⭐⭐ Excellent!'; color = 'var(--correct-text)'; }
    else if (wpm >= 25 && acc >= 85) { grade = '⭐⭐ Great!'; color = '#f57f17'; }
    else if (acc >= 70) { grade = '⭐ Good effort!'; color = '#666'; }
    else { grade = '💪 Keep practicing!'; color = '#999'; }

    result.innerHTML = `
      <div style="background:white;padding:25px;border-radius:15px;border:3px solid var(--primary);font-family:var(--font-ui);">
        <div style="text-align:center;margin-bottom:20px;font-size:1.8em;font-weight:bold;color:${color};">${grade}</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;text-align:center;">
          <div><div style="font-size:2.2em;font-weight:bold;color:var(--primary);">${wpm}</div><div style="font-size:0.95em;color:#666;">WPM</div></div>
          <div><div style="font-size:2.2em;font-weight:bold;color:var(--primary);">${acc}%</div><div style="font-size:0.95em;color:#666;">Accuracy</div></div>
          <div><div style="font-size:2.2em;font-weight:bold;color:var(--primary);">${elapsed.toFixed(1)}s</div><div style="font-size:0.95em;color:#666;">Time</div></div>
        </div>
        <div style="text-align:center;margin-top:20px;">
          <button class="btn btn-primary" id="tNext" style="margin-right:15px;font-size:1.1em;padding:12px 30px;">Next →</button>
          <button class="btn btn-secondary" id="tRetry" style="font-size:1.1em;padding:12px 30px;">Retry</button>
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

  function esc(t) {
    const d = document.createElement('div');
    d.textContent = t;
    return d.innerHTML;
  }

  return { render };
})();

// Expose to global scope for dynamic loading
window.TypingModule = TypingModule;

// Add CSS animation for cursor blink
if (!document.getElementById('typing-styles')) {
  const style = document.createElement('style');
  style.id = 'typing-styles';
  style.textContent = `
    @keyframes blink {
      0%, 50% { opacity: 1; }
      51%, 100% { opacity: 0.5; }
    }
  `;
  document.head.appendChild(style);
}
