/**
 * evidence.js - Q&A with Evidence module (self-rendering)
 */
const EvidenceModule = (() => {
  let questions = [];
  let currentQ = 0;
  let selectedSentences = new Set();
  let selectedAnswer = null;
  let answered = false;
  let currentChoices = [];

  function render(container) {
    questions = (bookData.questions || []).filter(q => q.level !== 3);
    currentQ = 0;
    renderQuestion(container);
  }

  function renderQuestion(container) {
    if (!container) container = document.getElementById('mainContent');
    container.innerHTML = '';
    answered = false;
    selectedAnswer = null;
    selectedSentences = new Set();

    const wrapper = document.createElement('div');
    wrapper.className = 'activity-layout active';

    // Header
    const header = document.createElement('div');
    header.className = 'activity-header';
    header.innerHTML = `<h2>❓ Questions with Evidence</h2><p>First highlight evidence in the text, then answer the question.</p>`;
    wrapper.appendChild(header);

    if (currentQ >= questions.length) {
      const complete = document.createElement('div');
      complete.className = 'completion-banner show';
      complete.innerHTML = `<h3>🎉 All Questions Done!</h3><p>Great job finding evidence and answering questions!</p>`;
      wrapper.appendChild(complete);
      container.appendChild(wrapper);
      return;
    }

    const q = questions[currentQ];
    currentChoices = q.choices.map((c, i) => ({ text: c, isCorrect: i === q.correctChoice }));
    shuffleArray(currentChoices);

    // Question card
    const qCard = document.createElement('div');
    qCard.className = 'question-card';
    qCard.innerHTML = `<span class="question-level">Level ${q.level} · pp. ${q.pages}</span><div class="question-text">${q.question}</div>`;
    wrapper.appendChild(qCard);

    // Evidence passage
    const passage = document.createElement('div');
    passage.className = 'evidence-passage';
    passage.innerHTML = `<div class="passage-instruction">📍 Step 1: Click sentences to select them as your evidence:</div>`;

    const section = bookData.sections.find(s => s.id === q.section);
    if (section) {
      const passageText = document.createElement('div');
      passageText.style.cssText = 'font-size:1em;line-height:2.2;';
      let sentenceIdx = 0;
      section.paragraphs.forEach((para, pIdx) => {
        const cleanPara = para.replace(/<\/?s>/g, '').replace(/<\/?v>/g, '').replace(/<\/?o>/g, '');
        const sentences = splitIntoSentences(cleanPara);
        sentences.forEach(sent => {
          if (sent.trim()) {
            const span = document.createElement('span');
            span.className = 'evidence-sentence';
            span.textContent = sent + ' ';
            span.dataset.sentIdx = sentenceIdx;
            span.dataset.sentText = sent.trim().toLowerCase();
            span.addEventListener('click', () => toggleEvidence(span, sentenceIdx, wrapper));
            passageText.appendChild(span);
            sentenceIdx++;
          }
        });
        if (pIdx < section.paragraphs.length - 1) {
          passageText.appendChild(document.createElement('br'));
          passageText.appendChild(document.createElement('br'));
        }
      });
      passage.appendChild(passageText);
    }
    wrapper.appendChild(passage);

    // Evidence status
    const status = document.createElement('div');
    status.id = 'evStatus';
    status.style.cssText = 'font-family:var(--font-ui);font-size:0.85em;color:#666;padding:8px 12px;background:#f5f5f5;border-radius:6px;margin-bottom:12px;';
    status.textContent = 'Select at least one sentence as evidence to unlock the answer choices.';
    wrapper.appendChild(status);

    // Answer section
    const answerSection = document.createElement('div');
    answerSection.className = 'answer-section';
    answerSection.id = 'evAnswerSection';
    answerSection.innerHTML = `<h4 style="font-family:var(--font-ui);color:#555;margin-bottom:10px;">📝 Step 2: Choose your answer:</h4>`;

    currentChoices.forEach((choice, idx) => {
      const div = document.createElement('div');
      div.className = 'answer-choice';
      div.textContent = choice.text;
      div.addEventListener('click', () => {
        if (answered) return;
        answerSection.querySelectorAll('.answer-choice').forEach(c => c.classList.remove('selected'));
        div.classList.add('selected');
        selectedAnswer = idx;
      });
      answerSection.appendChild(div);
    });

    const submitBtn = document.createElement('button');
    submitBtn.className = 'btn btn-primary';
    submitBtn.textContent = 'Submit Answer';
    submitBtn.style.marginTop = '12px';
    submitBtn.addEventListener('click', () => submitAnswer(wrapper));
    answerSection.appendChild(submitBtn);

    const explanation = document.createElement('div');
    explanation.className = 'explanation-box';
    explanation.id = 'evExplanation';
    answerSection.appendChild(explanation);

    wrapper.appendChild(answerSection);

    // Navigation
    const nav = document.createElement('div');
    nav.className = 'evidence-nav';
    nav.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-top:20px;font-family:var(--font-ui);';

    const prevBtn = document.createElement('button');
    prevBtn.className = 'btn btn-secondary';
    prevBtn.textContent = '← Previous';
    prevBtn.disabled = currentQ === 0;
    prevBtn.addEventListener('click', () => { if (currentQ > 0) { currentQ--; renderQuestion(container); } });

    const counter = document.createElement('span');
    counter.className = 'evidence-counter';
    counter.textContent = `Question ${currentQ + 1} / ${questions.length}`;

    const nextBtn = document.createElement('button');
    nextBtn.className = 'btn btn-secondary';
    nextBtn.textContent = 'Next →';
    nextBtn.disabled = currentQ === questions.length - 1;
    nextBtn.addEventListener('click', () => { if (currentQ < questions.length - 1) { currentQ++; renderQuestion(container); } });

    nav.appendChild(prevBtn);
    nav.appendChild(counter);
    nav.appendChild(nextBtn);
    wrapper.appendChild(nav);

    container.appendChild(wrapper);
  }

  function splitIntoSentences(text) {
    const matches = text.match(/[^.!?]*[.!?]+/g);
    if (!matches) return [text];
    const joined = matches.join('');
    const remainder = text.slice(joined.length).trim();
    const result = matches.map(m => m.trim());
    if (remainder) result.push(remainder);
    return result;
  }

  function toggleEvidence(span, idx, wrapper) {
    if (answered) return;
    span.classList.toggle('highlighted');
    if (span.classList.contains('highlighted')) {
      selectedSentences.add(idx);
    } else {
      selectedSentences.delete(idx);
    }
    const answerSection = wrapper.querySelector('#evAnswerSection');
    const status = wrapper.querySelector('#evStatus');
    if (selectedSentences.size > 0) {
      answerSection.classList.add('unlocked');
      status.textContent = `✓ ${selectedSentences.size} sentence(s) selected. Now choose your answer below.`;
      status.style.cssText = 'font-family:var(--font-ui);font-size:0.85em;color:var(--correct-text);padding:8px 12px;background:var(--correct-bg);border-radius:6px;margin-bottom:12px;';
    } else {
      answerSection.classList.remove('unlocked');
      status.textContent = 'Select at least one sentence as evidence to unlock the answer choices.';
      status.style.cssText = 'font-family:var(--font-ui);font-size:0.85em;color:#666;padding:8px 12px;background:#f5f5f5;border-radius:6px;margin-bottom:12px;';
    }
  }

  function submitAnswer(wrapper) {
    if (selectedAnswer === null || answered) return;
    answered = true;
    const q = questions[currentQ];
    const answerSection = wrapper.querySelector('#evAnswerSection');
    const choices = answerSection.querySelectorAll('.answer-choice');
    const explanation = wrapper.querySelector('#evExplanation');
    const selectedChoice = currentChoices[selectedAnswer];
    const isCorrect = selectedChoice.isCorrect;

    choices.forEach((c, idx) => {
      c.style.pointerEvents = 'none';
      if (currentChoices[idx].isCorrect) c.classList.add('correct');
      if (idx === selectedAnswer && !isCorrect) c.classList.add('incorrect');
    });

    const evidenceSpans = wrapper.querySelectorAll('.evidence-sentence');
    const expectedKeywords = q.evidence.toLowerCase().split(/\s+/).filter(w => w.length > 4).map(w => w.replace(/[^a-z]/g, ''));
    let correctEv = 0, wrongEv = 0;

    evidenceSpans.forEach(span => {
      const idx = parseInt(span.dataset.sentIdx);
      const sentText = span.dataset.sentText;
      if (selectedSentences.has(idx)) {
        const matchCount = expectedKeywords.filter(kw => sentText.includes(kw)).length;
        if (matchCount >= 1) { span.classList.add('correct-evidence'); correctEv++; }
        else { span.style.background = '#fff3e0'; span.style.borderBottom = '2px solid #ff9800'; wrongEv++; }
      }
    });

    if (!isCorrect || correctEv === 0) {
      evidenceSpans.forEach(span => {
        const sentText = span.dataset.sentText;
        const matchCount = expectedKeywords.filter(kw => sentText.includes(kw)).length;
        if (matchCount >= 1 && !span.classList.contains('highlighted') && !span.classList.contains('correct-evidence')) {
          span.style.background = '#e8f5e9';
          span.style.borderBottom = '2px dashed var(--correct-text)';
        }
      });
    }

    let fb = '';
    if (isCorrect && correctEv > 0) {
      fb = `✓ Correct! ✓ Evidence (${correctEv} match${correctEv > 1 ? 'es' : ''})! +1⭐<br><em>${q.explanation}</em>`;
      StarSystem.earn(`ev-${q.id}`);
    } else if (isCorrect) {
      fb = `✓ Correct answer! Try to find more evidence next time.<br><em>${q.explanation}</em>`;
      StarSystem.earn(`ev-${q.id}`);
    } else {
      fb = `✗ Not quite. ${correctEv > 0 ? `Found ${correctEv} evidence.` : 'Try to find evidence in the text.'}<br><em>${q.explanation}</em>`;
    }

    explanation.className = `explanation-box ${isCorrect ? 'correct' : 'incorrect'}`;
    explanation.innerHTML = fb;
    if (typeof updateAllTabStars === 'function') updateAllTabStars();
  }

  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  return { render };
})();

// Expose to global scope for dynamic loading
window.EvidenceModule = EvidenceModule;
