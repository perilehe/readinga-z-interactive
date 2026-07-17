/**
 * grammar.js - Grammar instruction & exercises module
 * Renders grammar explanation + interactive exercises as a tab.
 * Also provides in-text grammar highlighting with click-to-explain tooltips.
 */
const GrammarModule = (() => {

  function grammarEmoji(target) {
    const map = {
      'adverbs': '🔵',
      'adjectives': '🟢',
      'prepositions': '📍',
      'prepositional-phrases': '📍',
      'commas-in-a-series': '📝',
      'compound-sentences': '🔗',
      'linking-verbs': '🔗',
      'multiple-meaning': '💡',
      'root-words': '🌱',
      'suffix': '🔧',
      'synonyms-antonyms': '🔄'
    };
    return map[target] || '🎨';
  }

  function render(container) {
    const grammar = bookData.grammar;
    if (!grammar) {
      container.innerHTML = '<div style="padding:40px;text-align:center;font-family:var(--font-ui);color:#999;">No grammar exercises configured for this book.</div>';
      return;
    }

    container.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'grammar-container';

    // Header
    const header = document.createElement('div');
    header.className = 'grammar-header';
    header.innerHTML = `
      <h2>${grammarEmoji(grammar.target)} ${grammar.title}</h2>
      <p class="grammar-explanation">${grammar.explanation}</p>
    `;
    wrap.appendChild(header);

    // Rules section
    if (grammar.rules && grammar.rules.length > 0) {
      const rules = document.createElement('div');
      rules.className = 'grammar-rules';
      rules.innerHTML = `<h3>📐 Key Rules</h3>`;
      const ul = document.createElement('ul');
      grammar.rules.forEach(r => {
        const li = document.createElement('li');
        li.textContent = r;
        ul.appendChild(li);
      });
      rules.appendChild(ul);
      wrap.appendChild(rules);
    }

    // Word Building section (if applicable)
    if (grammar.wordBuilding && grammar.wordBuilding.length > 0) {
      const wb = document.createElement('div');
      wb.className = 'grammar-section grammar-wordbuilding';
      wb.innerHTML = `<h3>🔨 Word Building</h3><p class="section-desc">Add the suffix to transform each base word:</p>`;
      const grid = document.createElement('div');
      grid.className = 'wb-grid';

      grammar.wordBuilding.forEach((item, idx) => {
        const card = document.createElement('div');
        card.className = 'wb-card';
        card.innerHTML = `
          <span class="wb-base">${item.base}</span>
          <span class="wb-arrow">→</span>
          <input type="text" class="wb-input" data-answer="${item.answer}" data-idx="${idx}" placeholder="..." autocomplete="off" />
          <span class="wb-feedback" id="wb-fb-${idx}"></span>
        `;
        grid.appendChild(card);
      });
      wb.appendChild(grid);

      const checkBtn = document.createElement('button');
      checkBtn.className = 'btn btn-primary wb-check';
      checkBtn.textContent = '✓ Check Answers';
      checkBtn.addEventListener('click', () => checkWordBuilding(grid, grammar));
      wb.appendChild(checkBtn);
      wrap.appendChild(wb);
    }

    // Homophones section (if applicable)
    if (grammar.homophones && grammar.homophones.length > 0) {
      const hp = document.createElement('div');
      hp.className = 'grammar-section grammar-homophones';
      hp.innerHTML = `<h3>🔊 Homophones</h3><p class="section-desc">Choose the correct word that sounds the same:</p>`;

      grammar.homophones.forEach((item, idx) => {
        const card = document.createElement('div');
        card.className = 'hp-card';
        const pairLabel = item.pair.join(' / ');
        card.innerHTML = `
          <div class="hp-pair">${pairLabel}</div>
          <p class="hp-sentence">${item.sentence.replace('_____', '<span class="hp-blank" id="hp-blank-' + idx + '">_____</span>')}</p>
          <div class="hp-options" id="hp-opts-${idx}">
            ${item.pair.map((w, i) => `<button class="hp-btn" data-answer="${item.answer}" data-chosen="${w}" data-idx="${idx}">${w}</button>`).join('')}
          </div>
          <div class="hp-feedback" id="hp-fb-${idx}"></div>
        `;
        hp.appendChild(card);
      });

      // Add click handlers for homophone buttons
      wrap.appendChild(hp);

      // Defer event binding until DOM is ready
      setTimeout(() => {
        hp.querySelectorAll('.hp-btn').forEach(btn => {
          btn.addEventListener('click', function() {
            const idx = this.dataset.idx;
            const answer = this.dataset.answer;
            const chosen = this.dataset.chosen;
            const blank = document.getElementById(`hp-blank-${idx}`);
            const fb = document.getElementById(`hp-fb-${idx}`);

            // Disable all buttons in this group
            this.parentElement.querySelectorAll('.hp-btn').forEach(b => b.disabled = true);

            if (chosen === answer) {
              this.classList.add('correct');
              blank.textContent = answer;
              blank.classList.add('correct');
              fb.textContent = '✓ Correct!';
              fb.className = 'hp-feedback correct';
              earnGrammarStar(`hp-${idx}`);
            } else {
              this.classList.add('incorrect');
              fb.textContent = `✗ Not quite. The answer is "${answer}".`;
              fb.className = 'hp-feedback incorrect';
              // Highlight correct
              this.parentElement.querySelectorAll('.hp-btn').forEach(b => {
                if (b.dataset.chosen === answer) b.classList.add('correct');
              });
              blank.textContent = answer;
              blank.classList.add('incorrect');
            }
          });
        });
      }, 0);
    }

    // Exercises section
    if (grammar.exercises && grammar.exercises.length > 0) {
      const exSection = document.createElement('div');
      exSection.className = 'grammar-section grammar-exercises';
      exSection.innerHTML = `<h3>✏️ Exercises</h3>`;

      grammar.exercises.forEach((ex, idx) => {
        const card = document.createElement('div');
        card.className = 'ex-card';
        card.id = `ex-${idx}`;

        if (ex.type === 'identify') {
          card.innerHTML = renderIdentifyExercise(ex, idx);
        } else if (ex.type === 'multipleChoice') {
          card.innerHTML = renderMCExercise(ex, idx);
        } else if (ex.type === 'fillBlank') {
          card.innerHTML = renderFillExercise(ex, idx);
        } else if (ex.type === 'homophone') {
          card.innerHTML = renderHomophoneExercise(ex, idx);
        } else if (ex.type === 'compoundSentence') {
          card.innerHTML = renderCompoundSentenceExercise(ex, idx);
        } else if (ex.type === 'multipleMeaning') {
          card.innerHTML = renderMultipleMeaningExercise(ex, idx);
        } else if (ex.type === 'rootWord') {
          card.innerHTML = renderRootWordExercise(ex, idx);
        } else if (ex.type === 'linkingVerb') {
          card.innerHTML = renderLinkingVerbExercise(ex, idx);
        } else if (ex.type === 'suffix') {
          card.innerHTML = renderSuffixExercise(ex, idx);
        }

        exSection.appendChild(card);
      });

      wrap.appendChild(exSection);

      // Defer event binding
      setTimeout(() => bindExerciseEvents(grammar), 0);
    }

    container.appendChild(wrap);
  }

  // ===================== Exercise Renderers =====================

  function renderIdentifyExercise(ex, idx) {
    const words = ex.sentence.split(/(\s+)/);
    let sentenceHtml = words.map(w => {
      const clean = w.replace(/[^a-zA-Z'-]/g, '');
      if (ex.answers.includes(clean)) {
        return `<span class="ex-word" data-answer="true" data-idx="${idx}">${w}</span>`;
      }
      return `<span class="ex-word" data-answer="false" data-idx="${idx}">${w}</span>`;
    }).join('');

    return `
      <div class="ex-type-badge">🔍 Find the ${bookData.grammar?.target || 'word'}</div>
      <p class="ex-sentence">${sentenceHtml}</p>
      ${ex.hint ? `<p class="ex-hint">💡 ${ex.hint}</p>` : ''}
      <div class="ex-feedback" id="ex-fb-${idx}"></div>
    `;
  }

  function renderMCExercise(ex, idx) {
    return `
      <div class="ex-type-badge">📝 Multiple Choice</div>
      <p class="ex-question">${ex.question}</p>
      <p class="ex-sentence">"${ex.sentence}"</p>
      <div class="ex-options" id="ex-opts-${idx}">
        ${ex.options.map((opt, i) => `<button class="ex-opt-btn" data-correct="${i === ex.answer}" data-idx="${idx}">${String.fromCharCode(65 + i)}. ${opt}</button>`).join('')}
      </div>
      <div class="ex-feedback" id="ex-fb-${idx}"></div>
    `;
  }

  function renderFillExercise(ex, idx) {
    return `
      <div class="ex-type-badge">📝 Fill in the Blank</div>
      <p class="ex-sentence">${ex.sentence}</p>
      <div class="ex-fill-row">
        <input type="text" class="ex-fill-input" id="ex-input-${idx}" data-answer="${ex.answer}" data-idx="${idx}" placeholder="Type your answer..." autocomplete="off" />
        <button class="btn btn-primary ex-check-btn" data-idx="${idx}">Check</button>
      </div>
      <div class="ex-feedback" id="ex-fb-${idx}"></div>
    `;
  }

  function renderHomophoneExercise(ex, idx) {
    return `
      <div class="ex-type-badge">🔊 Homophone</div>
      <p class="ex-sentence">${ex.sentence}</p>
      <div class="ex-options" id="ex-opts-${idx}">
        ${ex.options.map((opt, i) => `<button class="ex-opt-btn" data-correct="${i === ex.answer}" data-idx="${idx}">${opt}</button>`).join('')}
      </div>
      <div class="ex-feedback" id="ex-fb-${idx}">
        ${ex.explanation ? `<div class="ex-explanation" style="display:none;">${ex.explanation}</div>` : ''}
      </div>
    `;
  }

  // ===== NEW EXERCISE TYPE: Compound Sentence (C/NC + conjunction) =====
  function renderCompoundSentenceExercise(ex, idx) {
    const conjOptions = ['and', 'but', 'for', 'or', 'nor', 'so', 'yet'];
    return `
      <div class="ex-type-badge">🔗 Compound Sentence</div>
      <p class="ex-sentence">"${ex.sentence}"</p>
      <p class="ex-question">Is this a compound sentence?</p>
      <div class="ex-options ex-cs-yn" id="ex-cs-yn-${idx}">
        <button class="ex-opt-btn ex-cs-btn" data-answer="C" data-idx="${idx}">C — Compound</button>
        <button class="ex-opt-btn ex-cs-btn" data-answer="NC" data-idx="${idx}">NC — Not Compound</button>
      </div>
      <div class="ex-cs-conj" id="ex-cs-conj-${idx}" style="display:none;">
        <p class="ex-question">Circle the conjunction that joins the two parts:</p>
        <div class="ex-options" id="ex-cs-opts-${idx}">
          ${conjOptions.map(c => `<button class="ex-opt-btn ex-conj-btn" data-conj="${c}" data-idx="${idx}">${c}</button>`).join('')}
        </div>
      </div>
      <div class="ex-feedback" id="ex-fb-${idx}">
        ${ex.explanation ? `<div class="ex-explanation" style="display:none;">${ex.explanation}</div>` : ''}
      </div>
    `;
  }

  // ===== NEW EXERCISE TYPE: Multiple-Meaning Word =====
  function renderMultipleMeaningExercise(ex, idx) {
    let sentencesHtml = ex.sentences.map((s, si) => `
      <div class="ex-mm-sentence" id="ex-mm-s-${idx}-${si}">
        <p class="ex-sentence">"${s.sentence}"</p>
        <p class="ex-question">What does "<strong>${ex.word}</strong>" mean in this sentence?</p>
        <div class="ex-options">
          ${s.options.map((opt, oi) => `<button class="ex-opt-btn ex-mm-btn" data-correct="${oi === s.correctIdx}" data-idx="${idx}" data-sidx="${si}">${opt}</button>`).join('')}
        </div>
        <div class="ex-feedback ex-mm-fb" id="ex-mm-fb-${idx}-${si}"></div>
      </div>
    `).join('');
    return `
      <div class="ex-type-badge">💡 Multiple-Meaning Word: "${ex.word}"</div>
      <p class="ex-question">Each sentence uses "<strong>${ex.word}</strong>" with a different meaning. Pick the correct meaning for each.</p>
      ${sentencesHtml}
    `;
  }

  // ===== NEW EXERCISE TYPE: Root Word =====
  function renderRootWordExercise(ex, idx) {
    return `
      <div class="ex-type-badge">🌱 Root Word</div>
      <p class="ex-question">What is the root word of "<strong>${ex.word}</strong>"?</p>
      <div class="ex-options" id="ex-opts-${idx}">
        ${ex.options.map((opt, i) => `<button class="ex-opt-btn" data-correct="${opt === ex.root}" data-idx="${idx}">${opt}</button>`).join('')}
      </div>
      <div class="ex-feedback" id="ex-fb-${idx}">
        ${ex.explanation ? `<div class="ex-explanation" style="display:none;">${ex.explanation}</div>` : ''}
      </div>
    `;
  }

  // ===== NEW EXERCISE TYPE: Linking Verb (choose verb + mark subject S/P) =====
  function renderLinkingVerbExercise(ex, idx) {
    const displaySentence = ex.sentence.replace(/\([^)]+\)/, '<span class="ex-lv-blank" id="ex-lv-blank-' + idx + '">______</span>');
    return `
      <div class="ex-type-badge">🔗 Linking Verb</div>
      <p class="ex-sentence">${displaySentence}</p>
      <p class="ex-question">Choose the correct linking verb:</p>
      <div class="ex-options" id="ex-opts-${idx}">
        ${ex.options.map((opt, i) => `<button class="ex-opt-btn ex-lv-btn" data-correct="${opt === ex.correctVerb}" data-verb="${opt}" data-idx="${idx}">${opt}</button>`).join('')}
      </div>
      <div class="ex-lv-subject" id="ex-lv-subj-${idx}" style="display:none;">
        <p class="ex-question">Is the subject "<em>${ex.subject}</em>" singular (S) or plural (P)?</p>
        <div class="ex-options">
          <button class="ex-opt-btn ex-sp-btn" data-correct="${ex.number === 'singular'}" data-idx="${idx}">S — Singular</button>
          <button class="ex-opt-btn ex-sp-btn" data-correct="${ex.number === 'plural'}" data-idx="${idx}">P — Plural</button>
        </div>
      </div>
      <div class="ex-feedback" id="ex-fb-${idx}">
        ${ex.explanation ? `<div class="ex-explanation" style="display:none;">${ex.explanation}</div>` : ''}
      </div>
    `;
  }

  // ===== NEW EXERCISE TYPE: Suffix (add suffix to root word) =====
  function renderSuffixExercise(ex, idx) {
    return `
      <div class="ex-type-badge">🔧 Add the Suffix</div>
      <p class="ex-question">Add the suffix <strong>${ex.suffix}</strong> to the root word "<strong>${ex.root}</strong>" to make a new word.</p>
      ${ex.hint ? `<p class="ex-hint">💡 ${ex.hint}</p>` : ''}
      <div class="ex-fill-row">
        <input type="text" class="ex-fill-input" id="ex-input-${idx}" data-answer="${ex.answer}" data-idx="${idx}" placeholder="Type the new word..." autocomplete="off" />
        <button class="btn btn-primary ex-check-btn" data-idx="${idx}">Check</button>
      </div>
      <div class="ex-feedback" id="ex-fb-${idx}"></div>
    `;
  }

  // ===================== Event Binding =====================

  function bindExerciseEvents(grammar) {
    // Identify exercises: click words
    document.querySelectorAll('.ex-word').forEach(word => {
      word.addEventListener('click', function() {
        const idx = this.dataset.idx;
        const ex = grammar.exercises[idx];
        if (!ex) return;

        // Toggle selection
        this.classList.toggle('selected');

        // Check if all correct answers are selected
        const card = document.getElementById(`ex-${idx}`);
        const selected = card.querySelectorAll('.ex-word.selected');
        const selectedWords = Array.from(selected).map(w => w.textContent.replace(/[^a-zA-Z'-]/g, ''));
        const fb = document.getElementById(`ex-fb-${idx}`);

        // Compare
        const correctSet = new Set(ex.answers);
        const selectedSet = new Set(selectedWords);

        if (correctSet.size === selectedSet.size && [...correctSet].every(w => selectedSet.has(w))) {
          // All correct
          card.querySelectorAll('.ex-word').forEach(w => {
            w.classList.remove('selected');
            const clean = w.textContent.replace(/[^a-zA-Z'-]/g, '');
            if (ex.answers.includes(clean)) {
              w.classList.add('correct');
            }
            w.style.pointerEvents = 'none';
          });
          fb.textContent = '✓ Correct!';
          fb.className = 'ex-feedback correct show';
          earnGrammarStar(`ex-${idx}`);
        }
      });
    });

    // Add a "Check" button behavior for identify exercises
    document.querySelectorAll('.ex-card').forEach(card => {
      const badge = card.querySelector('.ex-type-badge');
      if (badge && badge.textContent.includes('Find')) {
        const idx = card.id.replace('ex-', '');
        const ex = grammar.exercises[parseInt(idx)];
        if (!ex || ex.type !== 'identify') return;

        const checkBtn = document.createElement('button');
        checkBtn.className = 'btn btn-primary ex-check-identify';
        checkBtn.textContent = '✓ Check';
        checkBtn.dataset.idx = idx;
        checkBtn.addEventListener('click', function() {
          const exIdx = this.dataset.idx;
          const exercise = grammar.exercises[parseInt(exIdx)];
          const cardEl = document.getElementById(`ex-${exIdx}`);
          const selected = cardEl.querySelectorAll('.ex-word.selected');
          const selectedWords = Array.from(selected).map(w => w.textContent.replace(/[^a-zA-Z'-]/g, ''));
          const fb = document.getElementById(`ex-fb-${exIdx}`);

          const correctSet = new Set(exercise.answers);
          const selectedSet = new Set(selectedWords);

          if (exercise.answers.length === 0 && selectedWords.length === 0) {
            fb.textContent = '✓ Correct! There are no adverbs in this sentence.';
            fb.className = 'ex-feedback correct show';
            earnGrammarStar(`ex-${exIdx}`);
            cardEl.querySelectorAll('.ex-word').forEach(w => w.style.pointerEvents = 'none');
            return;
          }

          if (correctSet.size === selectedSet.size && [...correctSet].every(w => selectedSet.has(w))) {
            cardEl.querySelectorAll('.ex-word').forEach(w => {
              w.classList.remove('selected');
              const clean = w.textContent.replace(/[^a-zA-Z'-]/g, '');
              if (exercise.answers.includes(clean)) w.classList.add('correct');
              w.style.pointerEvents = 'none';
            });
            fb.textContent = '✓ Correct!';
            fb.className = 'ex-feedback correct show';
            earnGrammarStar(`ex-${exIdx}`);
          } else {
            // Show which are wrong
            cardEl.querySelectorAll('.ex-word.selected').forEach(w => {
              const clean = w.textContent.replace(/[^a-zA-Z'-]/g, '');
              if (!exercise.answers.includes(clean)) {
                w.classList.add('incorrect');
              }
            });
            // Show missed
            cardEl.querySelectorAll('.ex-word').forEach(w => {
              const clean = w.textContent.replace(/[^a-zA-Z'-]/g, '');
              if (exercise.answers.includes(clean) && !w.classList.contains('selected')) {
                w.classList.add('missed');
              }
            });
            fb.textContent = '✗ Not quite. Green = correct, Red = wrong, Yellow = missed.';
            fb.className = 'ex-feedback incorrect show';
          }
        });

        const feedback = card.querySelector('.ex-feedback');
        if (feedback) card.insertBefore(checkBtn, feedback);
      }
    });

    // MC exercises
    document.querySelectorAll('.ex-opt-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const idx = this.dataset.idx;
        const isCorrect = this.dataset.correct === 'true';
        const fb = document.getElementById(`ex-fb-${idx}`);
        const exercise = grammar.exercises[parseInt(idx)];

        // Disable all buttons
        this.parentElement.querySelectorAll('.ex-opt-btn').forEach(b => {
          b.disabled = true;
          if (b.dataset.correct === 'true') b.classList.add('correct');
        });

        if (isCorrect) {
          this.classList.add('correct');
          fb.textContent = '✓ Correct!';
          fb.className = 'ex-feedback correct show';
          earnGrammarStar(`ex-${idx}`);
        } else {
          this.classList.add('incorrect');
          fb.innerHTML = `✗ Not quite. ${exercise?.explanation || 'The correct answer is highlighted.'}`;
          fb.className = 'ex-feedback incorrect show';
        }

        // Show explanation if exists
        const explEl = fb.querySelector('.ex-explanation');
        if (explEl) explEl.style.display = 'block';
      });
    });

    // Fill exercises
    document.querySelectorAll('.ex-check-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const idx = this.dataset.idx;
        const input = document.getElementById(`ex-input-${idx}`);
        const exercise = grammar.exercises[parseInt(idx)];
        const fb = document.getElementById(`ex-fb-${idx}`);
        const userAnswer = input.value.trim().toLowerCase();
        const correctAnswer = exercise.answer.toLowerCase();

        if (userAnswer === correctAnswer) {
          input.classList.add('correct');
          input.disabled = true;
          this.disabled = true;
          fb.textContent = '✓ Correct! ' + (exercise.explanation || '');
          fb.className = 'ex-feedback correct show';
          earnGrammarStar(`ex-${idx}`);
        } else {
          input.classList.add('incorrect');
          fb.innerHTML = `✗ The answer is: <strong>${exercise.answer}</strong>. ${exercise.explanation || ''}`;
          fb.className = 'ex-feedback incorrect show';
        }
      });
    });

    // Allow Enter key in fill inputs
    document.querySelectorAll('.ex-fill-input').forEach(input => {
      input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          const idx = this.dataset.idx;
          document.querySelector(`.ex-check-btn[data-idx="${idx}"]`)?.click();
        }
      });
    });

    // ===== Compound Sentence: C/NC → then conjunction =====
    document.querySelectorAll('.ex-cs-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const idx = this.dataset.idx;
        const chosen = this.dataset.answer;
        const exercise = grammar.exercises[parseInt(idx)];
        const conjSection = document.getElementById(`ex-cs-conj-${idx}`);
        const fb = document.getElementById(`ex-fb-${idx}`);

        // Disable Y/N buttons
        this.parentElement.querySelectorAll('.ex-cs-btn').forEach(b => b.disabled = true);

        const correctYNDict = { true: 'C', false: 'NC' };
        const correctYN = correctYNDict[exercise.isCompound];

        if (chosen === correctYN) {
          this.classList.add('correct');
          if (exercise.isCompound) {
            // Show conjunction selector
            conjSection.style.display = 'block';
          } else {
            fb.innerHTML = `✓ Correct! This is NOT a compound sentence. ${exercise.explanation || ''}`;
            fb.className = 'ex-feedback correct show';
            earnGrammarStar(`ex-${idx}`);
            const explEl = fb.querySelector('.ex-explanation');
            if (explEl) explEl.style.display = 'block';
          }
        } else {
          this.classList.add('incorrect');
          this.parentElement.querySelectorAll('.ex-cs-btn').forEach(b => {
            if (b.dataset.answer === correctYN) b.classList.add('correct');
          });
          fb.innerHTML = `✗ This is ${exercise.isCompound ? '' : 'NOT '}a compound sentence. ${exercise.explanation || ''}`;
          fb.className = 'ex-feedback incorrect show';
          const explEl = fb.querySelector('.ex-explanation');
          if (explEl) explEl.style.display = 'block';
        }
      });
    });

    // Conjunction buttons for compound sentences
    document.querySelectorAll('.ex-conj-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const idx = this.dataset.idx;
        const chosen = this.dataset.conj;
        const exercise = grammar.exercises[parseInt(idx)];
        const fb = document.getElementById(`ex-fb-${idx}`);

        this.parentElement.querySelectorAll('.ex-conj-btn').forEach(b => {
          b.disabled = true;
          if (b.dataset.conj === exercise.conjunction) b.classList.add('correct');
        });

        if (chosen === exercise.conjunction) {
          this.classList.add('correct');
          fb.innerHTML = `✓ Correct! The conjunction is "<strong>${exercise.conjunction}</strong>". ${exercise.explanation || ''}`;
          fb.className = 'ex-feedback correct show';
          earnGrammarStar(`ex-${idx}`);
        } else {
          this.classList.add('incorrect');
          fb.innerHTML = `✗ The conjunction is "<strong>${exercise.conjunction}</strong>". ${exercise.explanation || ''}`;
          fb.className = 'ex-feedback incorrect show';
        }
        const explEl = fb.querySelector('.ex-explanation');
        if (explEl) explEl.style.display = 'block';
      });
    });

    // ===== Multiple-Meaning buttons =====
    document.querySelectorAll('.ex-mm-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const idx = this.dataset.idx;
        const sidx = this.dataset.sidx;
        const isCorrect = this.dataset.correct === 'true';
        const fb = document.getElementById(`ex-mm-fb-${idx}-${sidx}`);
        const sentenceDiv = document.getElementById(`ex-mm-s-${idx}-${sidx}`);
        const exercise = grammar.exercises[parseInt(idx)];
        const sentenceData = exercise.sentences[parseInt(sidx)];

        // Disable all options in this sentence group
        sentenceDiv.querySelectorAll('.ex-mm-btn').forEach(b => {
          b.disabled = true;
          if (b.dataset.correct === 'true') b.classList.add('correct');
        });

        if (isCorrect) {
          this.classList.add('correct');
          fb.innerHTML = `✓ Correct! "${exercise.word}" here means: <strong>${sentenceData.correctMeaning}</strong>`;
          fb.className = 'ex-feedback correct show';
          // Only award star after BOTH sentences are correct
          const otherSidx = sidx === '0' ? '1' : '0';
          const otherFb = document.getElementById(`ex-mm-fb-${idx}-${otherSidx}`);
          if (otherFb && otherFb.classList.contains('correct')) {
            earnGrammarStar(`ex-${idx}`);
          }
        } else {
          this.classList.add('incorrect');
          fb.innerHTML = `✗ The correct meaning is: <strong>${sentenceData.correctMeaning}</strong>`;
          fb.className = 'ex-feedback incorrect show';
        }
      });
    });

    // ===== Root Word buttons =====
    document.querySelectorAll('.ex-opt-btn').forEach(btn => {
      // Skip if already bound (check for data-bound flag)
      if (btn.dataset.bound) return;
      // Check if this is inside a rootWord exercise
      const card = btn.closest('.ex-card');
      if (!card) return;
      const badge = card.querySelector('.ex-type-badge');
      if (!badge || !badge.textContent.includes('Root Word')) return;
      // Already handled by MC binding above, but ensure it doesn't double-bind
    });

    // ===== Linking Verb: verb button → then S/P =====
    document.querySelectorAll('.ex-lv-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const idx = this.dataset.idx;
        const verb = this.dataset.verb;
        const isCorrect = this.dataset.correct === 'true';
        const exercise = grammar.exercises[parseInt(idx)];
        const blank = document.getElementById(`ex-lv-blank-${idx}`);
        const subjSection = document.getElementById(`ex-lv-subj-${idx}`);
        const fb = document.getElementById(`ex-fb-${idx}`);

        // Disable all verb buttons
        this.parentElement.querySelectorAll('.ex-lv-btn').forEach(b => {
          b.disabled = true;
          if (b.dataset.verb === exercise.correctVerb) b.classList.add('correct');
        });

        if (isCorrect) {
          this.classList.add('correct');
          blank.textContent = verb;
          blank.classList.add('correct');
          // Show S/P selector
          subjSection.style.display = 'block';
        } else {
          this.classList.add('incorrect');
          blank.textContent = exercise.correctVerb;
          blank.classList.add('incorrect');
          fb.innerHTML = `✗ The correct verb is "<strong>${exercise.correctVerb}</strong>". ${exercise.explanation || ''}`;
          fb.className = 'ex-feedback incorrect show';
          const explEl = fb.querySelector('.ex-explanation');
          if (explEl) explEl.style.display = 'block';
        }
      });
    });

    // S/P buttons for linking verb
    document.querySelectorAll('.ex-sp-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const idx = this.dataset.idx;
        const isCorrect = this.dataset.correct === 'true';
        const exercise = grammar.exercises[parseInt(idx)];
        const fb = document.getElementById(`ex-fb-${idx}`);

        this.parentElement.querySelectorAll('.ex-sp-btn').forEach(b => b.disabled = true);

        if (isCorrect) {
          this.classList.add('correct');
          fb.innerHTML = `✓ Correct! Subject "<em>${exercise.subject}</em>" is ${exercise.number}. ${exercise.explanation || ''}`;
          fb.className = 'ex-feedback correct show';
          earnGrammarStar(`ex-${idx}`);
        } else {
          this.classList.add('incorrect');
          fb.innerHTML = `✗ Subject "<em>${exercise.subject}</em>" is ${exercise.number}. ${exercise.explanation || ''}`;
          fb.className = 'ex-feedback incorrect show';
        }
        const explEl = fb.querySelector('.ex-explanation');
        if (explEl) explEl.style.display = 'block';
      });
    });
  }

  // ===================== Word Building Check =====================

  function checkWordBuilding(grid, grammar) {
    let allCorrect = true;
    grid.querySelectorAll('.wb-input').forEach(input => {
      const answer = input.dataset.answer;
      const idx = input.dataset.idx;
      const fb = document.getElementById(`wb-fb-${idx}`);
      const userAnswer = input.value.trim().toLowerCase();

      if (userAnswer === answer.toLowerCase()) {
        input.classList.add('correct');
        fb.textContent = '✓';
        fb.className = 'wb-feedback correct';
        earnGrammarStar(`wb-${idx}`);
      } else {
        input.classList.add('incorrect');
        fb.textContent = `✗ ${answer}`;
        fb.className = 'wb-feedback incorrect';
        allCorrect = false;
      }
      input.disabled = true;
    });

    if (allCorrect) {
      grid.querySelector('.wb-check')?.setAttribute('disabled', 'true');
    }
  }

  // ===================== Star System =====================

  function earnGrammarStar(key) {
    const fullKey = `grammar-${key}`;
    if (StarSystem.earn(fullKey)) {
      // Stars will be updated by the app
      if (typeof updateAllTabStars === 'function') updateAllTabStars();
    }
  }

  function getStarCount() {
    if (!bookData?.grammar) return { earned: 0, total: 0 };
    const g = bookData.grammar;
    let total = 0;
    // Word building stars
    total += (g.wordBuilding || []).length;
    // Homophone stars
    total += (g.homophones || []).length;
    // Exercise stars
    total += (g.exercises || []).length;
    const earned = StarSystem.getSectionStars('grammar-');
    return { earned, total };
  }

  // ===================== In-text Grammar Highlighting =====================

  function highlightGrammarInText(paragraphHtml) {
    const grammar = bookData.grammar;
    if (!grammar) return paragraphHtml;

    // Process <g> tags: convert to clickable grammar highlights
    return paragraphHtml.replace(/<g\s+data-word="([^"]*)"\s+data-type="([^"]*)"\s+data-modifies="([^"]*)"\s+data-rule="([^"]*)">([^<]*)<\/g>/g,
      (match, word, type, modifies, rule, displayText) => {
        return `<span class="grammar-highlight grammar-${type}" data-word="${word}" data-type="${type}" data-modifies="${modifies}" data-rule="${rule}">${displayText}</span>`;
      }
    );
  }

  function setupGrammarTooltips() {
    document.addEventListener('click', function(e) {
      const hl = e.target.closest('.grammar-highlight');
      if (!hl) return;
      e.stopPropagation();
      showGrammarTooltip(hl);
    });
  }

  function showGrammarTooltip(el) {
    // Remove existing tooltips
    document.querySelectorAll('.grammar-tooltip').forEach(t => t.remove());

    const word = el.dataset.word;
    const type = el.dataset.type;
    const modifies = el.dataset.modifies;
    const rule = el.dataset.rule;

    const tooltip = document.createElement('div');
    tooltip.className = 'grammar-tooltip';
    tooltip.innerHTML = `
      <div class="gt-word">${word}</div>
      <div class="gt-type">${type}</div>
      <div class="gt-detail"><strong>Modifies:</strong> ${modifies}</div>
      <div class="gt-detail"><strong>Rule:</strong> ${rule}</div>
      <button class="gt-close">✕</button>
    `;

    el.style.position = 'relative';
    el.appendChild(tooltip);

    tooltip.querySelector('.gt-close').addEventListener('click', function(ev) {
      ev.stopPropagation();
      tooltip.remove();
    });

    // Auto-close on outside click
    setTimeout(() => {
      document.addEventListener('click', function closer() {
        tooltip.remove();
        document.removeEventListener('click', closer);
      });
    }, 100);
  }

  return { render, getStarCount, highlightGrammarInText, setupGrammarTooltips };
})();
window.GrammarModule = GrammarModule;
