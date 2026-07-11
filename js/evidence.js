/**
 * evidence.js - Q&A with Evidence module (split-panel layout)
 */
const EvidenceModule = (() => {
  let questions = [];
  let currentQ = 0;
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

    const wrapper = document.createElement('div');
    wrapper.className = 'activity-layout active';

    // Header
    const header = document.createElement('div');
    header.className = 'activity-header';
    header.innerHTML = `<h2>❓ Questions with Evidence</h2><p>Read the passage on the left, then answer questions on the right.</p>`;
    wrapper.appendChild(header);

    if (currentQ >= questions.length) {
      const complete = document.createElement('div');
      complete.className = 'completion-banner show';
      complete.innerHTML = `<h3>🎉 All Questions Done!</h3><p>Great job answering all the questions!</p>`;
      wrapper.appendChild(complete);
      container.appendChild(wrapper);
      return;
    }

    const q = questions[currentQ];
    currentChoices = q.choices.map((c, i) => ({ text: c, isCorrect: i === q.correctChoice }));
    shuffleArray(currentChoices);

    // Split panel layout
    const splitPanel = document.createElement('div');
    splitPanel.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:20px;';

    // Left panel: Passage
    const leftPanel = document.createElement('div');
    leftPanel.style.cssText = 'background:white;padding:20px;border-radius:10px;border:2px solid #e0e0e0;max-height:600px;overflow-y:auto;';
    leftPanel.innerHTML = `<h3 style="font-family:var(--font-ui);color:var(--primary);margin-bottom:15px;">📖 Passage: ${q.section.charAt(0).toUpperCase() + q.section.slice(1)}</h3>`;

    const section = bookData.sections.find(s => s.id === q.section);
    if (section) {
      const passageText = document.createElement('div');
      passageText.style.cssText = 'font-size:0.95em;line-height:2;font-family:var(--font-body);';
      section.paragraphs.forEach((para, pIdx) => {
        const cleanPara = para.replace(/<\/?s>/g, '').replace(/<\/?v>/g, '').replace(/<\/?o>/g, '');
        const p = document.createElement('p');
        p.textContent = cleanPara;
        p.style.marginBottom = '12px';
        passageText.appendChild(p);
      });
      leftPanel.appendChild(passageText);
    }

    // Right panel: Question and answers
    const rightPanel = document.createElement('div');
    rightPanel.style.cssText = 'display:flex;flex-direction:column;gap:15px;';

    // Question card
    const qCard = document.createElement('div');
    qCard.className = 'question-card';
    qCard.innerHTML = `<span class="question-level">Level ${q.level} · pp. ${q.pages}</span><div class="question-text">${q.question}</div>`;
    rightPanel.appendChild(qCard);

    // Answer section
    const answerSection = document.createElement('div');
    answerSection.className = 'answer-section';
    answerSection.style.cssText = 'background:white;padding:20px;border-radius:10px;border:2px solid #e0e0e0;';
    answerSection.innerHTML = `<h4 style="font-family:var(--font-ui);color:#555;margin-bottom:15px;">📝 Choose your answer:</h4>`;

    currentChoices.forEach((choice, idx) => {
      const div = document.createElement('div');
      div.className = 'answer-choice';
      div.textContent = choice.text;
      div.style.cursor = 'pointer';
      div.addEventListener('click', (e) => {
        e.stopPropagation();
        if (answered) return;
        answerSection.querySelectorAll('.answer-choice').forEach(c => c.classList.remove('selected'));
        div.classList.add('selected');
        selectedAnswer = idx;
        console.log('Selected answer:', idx, choice.text);
      });
      answerSection.appendChild(div);
    });

    const submitBtn = document.createElement('button');
    submitBtn.className = 'btn btn-primary';
    submitBtn.textContent = 'Submit Answer';
    submitBtn.style.marginTop = '15px';
    submitBtn.style.cursor = 'pointer';
    submitBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      console.log('Submit clicked, selectedAnswer:', selectedAnswer, 'answered:', answered);
      if (selectedAnswer === null) {
        alert('Please select an answer first!');
        return;
      }
      if (answered) return;
      answered = true;
      submitAnswer(rightPanel, q);
    });
    answerSection.appendChild(submitBtn);

    const explanation = document.createElement('div');
    explanation.className = 'explanation-box';
    explanation.id = 'evExplanation';
    explanation.style.marginTop = '15px';
    answerSection.appendChild(explanation);

    rightPanel.appendChild(answerSection);

    splitPanel.appendChild(leftPanel);
    splitPanel.appendChild(rightPanel);
    wrapper.appendChild(splitPanel);

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

  function submitAnswer(panel, q) {
    const answerSection = panel.querySelector('.answer-section');
    const choices = answerSection.querySelectorAll('.answer-choice');
    const explanation = panel.querySelector('#evExplanation');
    const selectedChoice = currentChoices[selectedAnswer];
    const isCorrect = selectedChoice.isCorrect;

    choices.forEach((c, idx) => {
      c.style.pointerEvents = 'none';
      if (currentChoices[idx].isCorrect) c.classList.add('correct');
      if (idx === selectedAnswer && !isCorrect) c.classList.add('incorrect');
    });

    let fb = '';
    if (isCorrect) {
      fb = `✓ Correct!<br><em>${q.explanation}</em>`;
      StarSystem.earn(`ev-${q.id}`);
    } else {
      fb = `✗ Not quite.<br><em>${q.explanation}</em>`;
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
