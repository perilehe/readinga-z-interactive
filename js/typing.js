/**
 * typing.js - Typing speed test module (Typing Club style)
 * Uses hidden textarea for mobile keyboard support
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
  let enterCount = 0;  // Track consecutive Enter presses for submission
  let allTyped = false; // Whether all characters have been typed

  function render(container) {
    if (!container) container = document.getElementById('mainContent');
    container.innerHTML = '';
    finished = false;
    allTyped = false;
    enterCount = 0;
    timerStart = null;
    typedChars = [];
    currentPos = 0;
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
      sentences = (bookData.vocabulary || []).map(v => ({ text: stripTags(v.sentence), word: v.word }));
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

    // Display wrapper with hidden textarea overlay
    const displayWrapper = document.createElement('div');
    displayWrapper.style.cssText = 'position:relative;margin-bottom:25px;';

    // Target display - large font
    const targetDisplay = document.createElement('div');
    targetDisplay.id = 'targetDisplay';
    targetDisplay.style.cssText = 'background:white;padding:35px;border-radius:15px;border:3px solid #e0e0e0;font-family:"Courier New",monospace;font-size:2em;line-height:1.8;min-height:150px;cursor:text;';
    updateWordsDisplay(targetDisplay);
    displayWrapper.appendChild(targetDisplay);

    // Hidden textarea for input (mobile keyboard support)
    // Use opacity:0.01 instead of 0 to ensure mobile keyboard appears
    const textarea = document.createElement('textarea');
    textarea.id = 'typingInput';
    textarea.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;opacity:0.01;cursor:text;font-size:16px;resize:none;z-index:10;';
    textarea.autocomplete = 'off';
    textarea.autocorrect = 'off';
    textarea.autocapitalize = 'off';
    textarea.spellcheck = false;
    displayWrapper.appendChild(textarea);

    container.appendChild(displayWrapper);

    // Instructions
    const instructions = document.createElement('div');
    instructions.style.cssText = 'text-align:center;font-family:var(--font-ui);font-size:1.1em;color:#666;padding:15px;background:#f5f5f5;border-radius:10px;';
    instructions.innerHTML = '👆 点击上方区域开始输入！打完所有字后按两次回车提交';
    container.appendChild(instructions);

    // Result area
    const result = document.createElement('div');
    result.id = 'tResult';
    result.style.marginTop = '25px';
    container.appendChild(result);

    finished = false;
    allTyped = false;
    enterCount = 0;
    timerStart = null;

    // Click on display focuses the textarea (brings up mobile keyboard)
    targetDisplay.addEventListener('click', () => textarea.focus());
    displayWrapper.addEventListener('click', () => textarea.focus());
    textarea.addEventListener('click', () => textarea.focus());
    textarea.addEventListener('touchstart', () => textarea.focus());

    // Handle input from textarea
    textarea.addEventListener('input', (e) => handleWordsInput(e, container));
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace(container);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (allTyped) {
          enterCount++;
          if (enterCount >= 2) {
            finishWords(container);
          } else {
            // Show "press Enter again" hint
            const inst = container.querySelector('.activity-layout > div:nth-child(4)');
            if (inst) inst.innerHTML = '⏎ 再按一次回车提交！';
          }
        }
      }
    });

    // Auto-focus
    setTimeout(() => textarea.focus(), 100);
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

  function handleWordsInput(e, container) {
    if (finished) return;

    const textarea = e.target;
    const newValue = textarea.value;

    // Get the last character added
    if (newValue.length === 0) return;

    // Handle new characters
    const lastChar = newValue[newValue.length - 1];

    if (!timerStart) startTimer();

    if (currentPos >= targetChars.length) {
      textarea.value = '';
      return;
    }

    typedChars[currentPos] = lastChar;
    currentPos++;

    // Clear textarea to prevent accumulation
    textarea.value = '';

    const display = container.querySelector('#targetDisplay');
    updateWordsDisplay(display);
    updateStats(container);

    // Check if all characters have been typed (regardless of accuracy)
    if (currentPos >= targetChars.length && !allTyped) {
      allTyped = true;
      enterCount = 0;
      // Show "press Enter twice" hint
      const inst = container.querySelector('.activity-layout > div:nth-child(4)');
      if (inst) inst.innerHTML = '✅ 输入完成！按两次回车提交 ⏎⏎';
    }
  }

  function handleBackspace(container) {
    if (currentPos > 0) {
      currentPos--;
      typedChars[currentPos] = null;
      const display = container.querySelector('#targetDisplay');
      updateWordsDisplay(display);
      updateStats(container);
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

    // Display wrapper with hidden textarea overlay
    const displayWrapper = document.createElement('div');
    displayWrapper.style.cssText = 'position:relative;margin-bottom:20px;';

    // Target display - large font
    const targetDisplay = document.createElement('div');
    targetDisplay.id = 'targetDisplay';
    targetDisplay.style.cssText = 'background:white;padding:30px;border-radius:15px;border:3px solid #e0e0e0;font-family:"Courier New",monospace;font-size:1.8em;line-height:1.8;min-height:120px;cursor:text;';
    updateSentenceDisplay(targetDisplay, sentence);
    displayWrapper.appendChild(targetDisplay);

    // Hidden textarea for input (mobile keyboard support)
    // Use opacity:0.01 instead of 0 to ensure mobile keyboard appears
    const textarea = document.createElement('textarea');
    textarea.id = 'typingInput';
    textarea.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;opacity:0.01;cursor:text;font-size:16px;resize:none;z-index:10;';
    textarea.autocomplete = 'off';
    textarea.autocorrect = 'off';
    textarea.autocapitalize = 'off';
    textarea.spellcheck = false;
    displayWrapper.appendChild(textarea);

    container.appendChild(displayWrapper);

    // Instructions
    const instructions = document.createElement('div');
    instructions.style.cssText = 'text-align:center;font-family:var(--font-ui);font-size:1.1em;color:#666;padding:15px;background:#f5f5f5;border-radius:10px;';
    instructions.innerHTML = '👆 点击上方区域开始输入！打完所有字后按两次回车提交';
    container.appendChild(instructions);

    // Result area
    const result = document.createElement('div');
    result.id = 'tResult';
    result.style.marginTop = '20px';
    container.appendChild(result);

    finished = false;
    allTyped = false;
    enterCount = 0;
    timerStart = null;

    // Click on display focuses the textarea (brings up mobile keyboard)
    targetDisplay.addEventListener('click', () => textarea.focus());
    displayWrapper.addEventListener('click', () => textarea.focus());
    textarea.addEventListener('click', () => textarea.focus());
    textarea.addEventListener('touchstart', () => textarea.focus());

    // Handle input from textarea
    textarea.addEventListener('input', (e) => handleSentenceInput(e, sentence, container));
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace(container);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (allTyped) {
          enterCount++;
          if (enterCount >= 2) {
            finishSentence(container);
          } else {
            const inst = container.querySelector('.activity-layout > div:nth-child(5)');
            if (inst) inst.innerHTML = '⏎ 再按一次回车提交！';
          }
        }
      }
    });

    // Auto-focus
    setTimeout(() => textarea.focus(), 100);
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

  function handleSentenceInput(e, sentence, container) {
    if (finished) return;

    const textarea = e.target;
    const newValue = textarea.value;

    if (newValue.length === 0) return;

    const lastChar = newValue[newValue.length - 1];

    if (!timerStart) startTimer();

    if (currentPos >= targetChars.length) {
      textarea.value = '';
      return;
    }

    typedChars[currentPos] = lastChar;
    currentPos++;

    // Clear textarea to prevent accumulation
    textarea.value = '';

    const display = container.querySelector('#targetDisplay');
    updateSentenceDisplay(display, sentence);
    updateStats(container);

    // Check if all characters have been typed (regardless of accuracy)
    if (currentPos >= targetChars.length && !allTyped) {
      allTyped = true;
      enterCount = 0;
      const inst = container.querySelector('.activity-layout > div:nth-child(5)');
      if (inst) inst.innerHTML = '✅ 输入完成！按两次回车提交 ⏎⏎';
    }
  }

  function finishSentence(container) {
    finished = true;
    if (timerInterval) clearInterval(timerInterval);

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

  function stripTags(html) {
    return html.replace(/<[^>]*>/g, '');
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
