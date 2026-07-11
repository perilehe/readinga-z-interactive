/**
 * app.js - Dynamic controller
 * Reads activities config from book JSON, creates tabs dynamically,
 * delegates rendering to each module.
 */
let bookData = null;
let currentTab = null;

// Module registry: activity name → { icon, label, moduleName }
const MODULE_REGISTRY = {
  read:           { icon: '📖', label: 'Read',         moduleName: null },
  sequence:       { icon: '🔢', label: 'Sequence',     moduleName: 'SequenceModule' },
  evidence:       { icon: '❓', label: 'Evidence',     moduleName: 'EvidenceModule' },
  summarize:      { icon: '📝', label: 'Summarize',    moduleName: 'SummarizeModule' },
  vocabulary:     { icon: '📚', label: 'Vocab',        moduleName: 'VocabularyModule' },
  typing:         { icon: '⌨️', label: 'Typing',       moduleName: 'TypingModule' },
  authorPurpose:  { icon: '🎯', label: 'Purpose',      moduleName: 'AuthorPurposeModule' },
  kwls:           { icon: '📊', label: 'KWLS',         moduleName: 'KwlsModule' },
  pronoun:        { icon: '🔤', label: 'Pronouns',     moduleName: 'PronounModule' },
  problemSolution:{ icon: '🔍', label: 'Problem',      moduleName: 'ProblemSolutionModule' }
};

// Lazy lookup — modules are loaded after app.js
function getModule(activityName) {
  const reg = MODULE_REGISTRY[activityName];
  if (!reg || !reg.moduleName) return null;
  return window[reg.moduleName] || null;
}

function getBookId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('book') || 'a-new-skyline';
}

async function loadBook() {
  const id = getBookId();
  try {
    const resp = await fetch(`books/${id}.json?v=${Date.now()}`);
    if (!resp.ok) throw new Error('Book not found');
    bookData = await resp.json();
    console.log('Book loaded, first paragraph sample:', bookData.sections[0]?.paragraphs[0]?.substring(0, 200));
    initApp();
  } catch (e) {
    console.error('Failed to load book:', e);
    document.body.innerHTML = '<div style="padding:40px;text-align:center;"><h2>Book not found</h2><p>Check the URL or <a href="index.html">go to bookshelf</a>.</p></div>';
  }
}

function initApp() {
  const meta = bookData.meta;
  const activities = bookData.activities || ['read', 'sequence', 'evidence', 'summarize', 'vocabulary', 'typing'];

  // Header
  document.title = `${meta.title} - Level ${meta.level}`;
  document.getElementById('bookTitle').textContent = meta.title;
  document.getElementById('bookSubtitle').textContent = `by ${meta.author}`;
  document.getElementById('bookLevel').textContent = `Level ${meta.level}`;

  // Calculate total stars
  const totalStars = calculateTotalStars(activities);
  StarSystem.init(meta.id, totalStars);

  // Build dynamic tabs
  buildTabs(activities);

  // Quiz popup for in-text vocab stars
  setupQuizPopup();

  // Activate first tab
  activateTab(activities[0]);
}

function calculateTotalStars(activities) {
  let total = 0;
  activities.forEach(act => {
    switch (act) {
      case 'sequence':
        total += (bookData.sequenceEvents || []).length;
        break;
      case 'evidence':
        total += (bookData.questions || []).filter(q => q.level !== 3).length;
        break;
      case 'summarize':
        total += (bookData.summarizeActivities || []).length * 2;
        break;
      case 'vocabulary':
        total += (bookData.vocabulary || []).length * 2;
        break;
      case 'typing':
        total += (bookData.vocabulary || []).length;
        break;
      case 'authorPurpose':
        total += (bookData.authorPurpose?.purposes || []).length;
        break;
      case 'kwls':
        total += 2; // L + S sections
        break;
      case 'pronoun':
        total += (bookData.pronounAgreement || []).length;
        break;
      case 'problemSolution':
        total += (bookData.problemSolution || []).length;
        break;
    }
  });
  return total;
}

function buildTabs(activities) {
  const tabNav = document.getElementById('tabNav');
  tabNav.innerHTML = '';

  activities.forEach(act => {
    const reg = MODULE_REGISTRY[act];
    if (!reg) return;

    const btn = document.createElement('button');
    btn.className = 'tab-btn';
    btn.dataset.tab = act;
    btn.innerHTML = `
      <span class="tab-icon">${reg.icon}</span> ${reg.label}
      <span class="tab-stars" id="tab-${act}-stars"></span>
    `;
    btn.addEventListener('click', () => activateTab(act));
    tabNav.appendChild(btn);
  });
}

function activateTab(tabId) {
  currentTab = tabId;

  // Update tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
  });

  // Clear content area
  const content = document.getElementById('mainContent');
  content.innerHTML = '';

  // Render the appropriate module
  if (tabId === 'read') {
    renderReadTab(content);
  } else {
    const mod = getModule(tabId);
    if (mod && typeof mod.render === 'function') {
      mod.render(content);
    } else {
      content.innerHTML = `<div style="padding:40px;text-align:center;font-family:var(--font-ui);color:#999;">Module "${tabId}" not available for this book.</div>`;
    }
  }

  updateAllTabStars();
}

// ===================== READ TAB =====================

function renderReadTab(container) {
  container.innerHTML = '';

  const layout = document.createElement('div');
  layout.className = 'read-layout';

  // Left: text panel
  const textPanel = document.createElement('div');
  textPanel.className = 'text-panel';

  // TOC
  const toc = document.createElement('div');
  toc.className = 'toc';
  toc.innerHTML = `<h3>📖 Contents</h3>`;
  const tocList = document.createElement('ul');
  bookData.sections.forEach(s => {
    const li = document.createElement('li');
    li.innerHTML = `<a href="#section-${s.id}">${s.title}</a>`;
    li.querySelector('a').addEventListener('click', e => {
      e.preventDefault();
      document.getElementById(`section-${s.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    tocList.appendChild(li);
  });
  toc.appendChild(tocList);
  textPanel.appendChild(toc);

  // Legend
  const legend = document.createElement('div');
  legend.className = 'legend';
  legend.innerHTML = `
    <h4>Reading Guide</h4>
    <div class="legend-items">
      <div class="legend-item"><span class="subject" style="font-weight:bold;">Subject</span></div>
      <div class="legend-item"><span class="verb" style="font-weight:bold;">Verb</span></div>
      <div class="legend-item"><span class="object" style="font-weight:bold;">Object</span></div>
      <div class="legend-item"><span>⭐</span> Click stars for vocab quiz!</div>
      <div class="legend-item">📍 Focus: <strong style="font-size:0.9em;">${bookData.meta.focusQuestion}</strong></div>
    </div>
  `;
  textPanel.appendChild(legend);

  // Sections
  bookData.sections.forEach(s => {
    const div = document.createElement('div');
    div.className = 'section';
    div.id = `section-${s.id}`;
    div.innerHTML = `<h2 class="section-title">${s.title}</h2>`;

    const content2 = document.createElement('div');
    content2.className = 'text-content';

    s.paragraphs.forEach(p => {
      const para = document.createElement('p');
      let html = p
        .replace(/<s>(.*?)<\/s>/g, '<span class="subject">$1</span>')
        .replace(/<v>(.*?)<\/v>/g, '<span class="verb">$1</span>')
        .replace(/<o>(.*?)<\/o>/g, '<span class="object">$1</span>');

      (bookData.vocabulary || []).forEach(v => {
        const regex = new RegExp(`\\b(${v.word})\\b`, 'gi');
        const starKey = `vocab-${v.word}`;
        const earnedClass = StarSystem.earned(starKey) ? 'earned' : 'unearned';
        html = html.replace(regex, `$1 <span data-quiz="${v.word}" class="vocab-star ${earnedClass}" style="font-family:var(--font-ui);font-size:0.75em;cursor:pointer;">⭐<span style="color:#999;font-weight:normal;">${v.pos}</span></span>`);
      });

      para.innerHTML = html;
      content2.appendChild(para);
    });

    div.appendChild(content2);
    textPanel.appendChild(div);
  });

  layout.appendChild(textPanel);

  // Right: notes panel
  const notesPanel = document.createElement('div');
  notesPanel.className = 'notes-panel';
  notesPanel.innerHTML = `<h3 style="color: var(--primary); margin-bottom: 15px; font-family: var(--font-ui);">📝 Study Notes</h3>`;

  const notesContainer = document.createElement('div');
  bookData.sections.forEach(s => {
    const notes = bookData.notes?.[s.id];
    if (!notes || notes.length === 0) return;
    const label = document.createElement('div');
    label.style.cssText = 'font-family: var(--font-ui); font-size: 0.8em; color: #999; margin: 15px 0 8px; text-transform: uppercase; letter-spacing: 1px;';
    label.textContent = s.title;
    notesContainer.appendChild(label);
    notes.forEach(note => {
      const card = document.createElement('div');
      card.className = `note-card ${note.type}-note`;
      card.innerHTML = `
        <div class="note-title">${note.type === 'vocab' ? '⭐' : '📐'} ${note.title}</div>
        <div class="note-content">${note.content}</div>
      `;
      notesContainer.appendChild(card);
    });
  });
  notesPanel.appendChild(notesContainer);
  layout.appendChild(notesPanel);

  container.appendChild(layout);
}

// ===================== TAB STARS =====================

function updateAllTabStars() {
  const activities = bookData.activities || [];
  activities.forEach(act => {
    const el = document.getElementById(`tab-${act}-stars`);
    if (!el) return;
    const { earned, total } = getModuleStars(act);
    el.textContent = total > 0 ? `⭐${earned}/${total}` : '';
  });
}

function getModuleStars(act) {
  switch (act) {
    case 'sequence':
      return {
        earned: StarSystem.getSectionStars('seq-'),
        total: (bookData.sequenceEvents || []).length
      };
    case 'evidence':
      return {
        earned: StarSystem.getSectionStars('ev-'),
        total: (bookData.questions || []).filter(q => q.level !== 3).length
      };
    case 'summarize':
      return {
        earned: StarSystem.getSectionStars('sum-'),
        total: (bookData.summarizeActivities || []).length * 2
      };
    case 'vocabulary':
      return {
        earned: StarSystem.getSectionStars('vocab-'),
        total: (bookData.vocabulary || []).length * 2
      };
    case 'typing':
      return {
        earned: StarSystem.getSectionStars('typing-'),
        total: (bookData.vocabulary || []).length
      };
    case 'authorPurpose':
      return {
        earned: StarSystem.getSectionStars('ap-'),
        total: (bookData.authorPurpose?.purposes || []).length
      };
    case 'kwls':
      return {
        earned: StarSystem.getSectionStars('kwls-'),
        total: 2
      };
    case 'pronoun':
      return {
        earned: StarSystem.getSectionStars('pronoun-'),
        total: (bookData.pronounAgreement || []).length
      };
    case 'problemSolution':
      return {
        earned: StarSystem.getSectionStars('ps-'),
        total: (bookData.problemSolution || []).length
      };
    default:
      return { earned: 0, total: 0 };
  }
}

// ===================== QUIZ POPUP =====================

let currentQuiz = null;
let quizAttempts = 0;

function setupQuizPopup() {
  document.getElementById('quizClose').addEventListener('click', closeQuiz);
  document.getElementById('quizOverlay').addEventListener('click', closeQuiz);

  document.addEventListener('click', e => {
    const star = e.target.closest('.vocab-star');
    if (star) {
      e.stopPropagation();
      openVocabQuiz(star.dataset.quiz);
    }
  });
}

function openVocabQuiz(word) {
  const vocab = (bookData.vocabulary || []).find(v => v.word === word);
  if (!vocab) return;

  const quiz = vocab.quiz;
  currentQuiz = vocab;
  quizAttempts = 0;

  document.getElementById('quizQuestion').textContent = quiz.prompt;
  document.getElementById('quizContext').textContent = `"${vocab.sentence}"`;

  const optionsContainer = document.getElementById('quizOptions');
  optionsContainer.innerHTML = '';
  quiz.options.forEach((opt, idx) => {
    const div = document.createElement('div');
    div.className = 'quiz-option';
    div.textContent = opt;
    div.addEventListener('click', () => handleQuizAnswer(idx));
    optionsContainer.appendChild(div);
  });

  document.getElementById('quizFeedback').className = 'quiz-feedback';
  document.getElementById('quizFeedback').textContent = '';
  document.getElementById('quizPopup').classList.add('active');
  document.getElementById('quizOverlay').classList.add('active');
}

function handleQuizAnswer(selected) {
  const quiz = currentQuiz.quiz;
  const options = document.querySelectorAll('#quizOptions .quiz-option');
  const feedback = document.getElementById('quizFeedback');

  if (selected === quiz.answer) {
    options[quiz.answer].classList.add('correct');
    options.forEach(o => o.style.pointerEvents = 'none');
    feedback.className = 'quiz-feedback correct show';
    feedback.innerHTML = `✓ Correct! <button class="btn btn-primary" style="margin-top:8px;padding:6px 16px;font-size:0.85em;" onclick="closeQuiz()">Close</button>`;
    const key = `vocab-${currentQuiz.word}`;
    if (StarSystem.earn(key)) {
      document.querySelectorAll(`.vocab-star[data-quiz="${currentQuiz.word}"]`).forEach(s => {
        s.classList.add('earned');
        s.classList.remove('unearned');
      });
      updateAllTabStars();
    }
  } else {
    quizAttempts++;
    options[selected].classList.add('incorrect');
    options[selected].style.pointerEvents = 'none';
    if (quizAttempts >= 2) {
      options[quiz.answer].classList.add('correct');
      options.forEach(o => o.style.pointerEvents = 'none');
      feedback.className = 'quiz-feedback incorrect show';
      feedback.innerHTML = `The correct answer is highlighted. <button class="btn btn-secondary" style="margin-top:8px;padding:6px 16px;font-size:0.85em;" onclick="closeQuiz()">Close</button>`;
    } else {
      feedback.className = 'quiz-feedback incorrect show';
      feedback.textContent = '✗ Not quite. Try again!';
    }
  }
}

function closeQuiz() {
  document.getElementById('quizPopup').classList.remove('active');
  document.getElementById('quizOverlay').classList.remove('active');
  currentQuiz = null;
}

// Start
loadBook();
