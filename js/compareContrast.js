/**
 * compareContrast.js - Compare and contrast module
 * Table with N objects as columns, M criteria as rows.
 * Each cell is a multiple-choice question.
 */
const CompareContrastModule = (() => {

  function render(container) {
    const data = bookData.compareContrast;
    if (!data) {
      container.innerHTML = '<div style="padding:40px;text-align:center;font-family:var(--font-ui);color:#999;">No compare/contrast configured.</div>';
      return;
    }

    container.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'cc-container';

    // Header
    const header = document.createElement('div');
    header.className = 'cc-header';
    header.innerHTML = `
      <h2>⚖️ ${data.title || 'Compare & Contrast'}</h2>
      <p class="cc-explanation">${data.explanation || 'Compare how these topics are alike and different.'}</p>
    `;
    wrap.appendChild(header);

    // Build comparison table
    const table = document.createElement('div');
    table.className = 'cc-table';
    table.style.setProperty('--cc-cols', data.objects.length);

    // Header row: object names
    const headerRow = document.createElement('div');
    headerRow.className = 'cc-row cc-header-row';
    headerRow.style.gridTemplateColumns = `minmax(120px, 1fr) repeat(${data.objects.length}, 1fr)`;
    headerRow.innerHTML = `<div class="cc-cell cc-criterion-cell">Criterion</div>`;
    data.objects.forEach(obj => {
      const cell = document.createElement('div');
      cell.className = 'cc-cell cc-object-cell';
      cell.textContent = obj;
      headerRow.appendChild(cell);
    });
    table.appendChild(headerRow);

    // Data rows: one per criterion
    data.criteria.forEach((crit, critIdx) => {
      const row = document.createElement('div');
      row.className = 'cc-row';
      row.style.gridTemplateColumns = `minmax(120px, 1fr) repeat(${data.objects.length}, 1fr)`;

      // Criterion name cell
      const critCell = document.createElement('div');
      critCell.className = 'cc-cell cc-criterion-cell';
      critCell.textContent = crit.name;
      row.appendChild(critCell);

      // One cell per object
      crit.answers.forEach((correctAnswer, objIdx) => {
        const cell = document.createElement('div');
        cell.className = 'cc-cell cc-answer-cell';
        cell.id = `cc-cell-${critIdx}-${objIdx}`;

        // Generate options: correct answer + 2 distractors from other objects in same row
        const distractors = crit.answers.filter((_, i) => i !== objIdx);
        // Add more distractors if needed
        const allDistractors = [...distractors];
        while (allDistractors.length < 2) {
          allDistractors.push('(not applicable)');
        }
        // Shuffle options
        const options = [correctAnswer, ...allDistractors.slice(0, 2)];
        for (let i = options.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [options[i], options[j]] = [options[j], options[i]];
        }

        cell.innerHTML = `
          <div class="cc-options" id="cc-opts-${critIdx}-${objIdx}">
            ${options.map((opt, oi) => `<button class="cc-opt-btn" data-correct="${opt === correctAnswer}" data-idx="${critIdx}-${objIdx}">${opt}</button>`).join('')}
          </div>
          <div class="cc-cell-fb" id="cc-fb-${critIdx}-${objIdx}"></div>
        `;
        row.appendChild(cell);
      });

      table.appendChild(row);
    });

    wrap.appendChild(table);

    // Summary / feedback area
    const summary = document.createElement('div');
    summary.className = 'cc-summary';
    summary.id = 'cc-summary';
    summary.innerHTML = `<p>Fill in all cells to complete the comparison chart.</p>`;
    wrap.appendChild(summary);

    container.appendChild(wrap);

    // Bind click handlers
    setTimeout(() => {
      document.querySelectorAll('.cc-opt-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          const idx = this.dataset.idx;
          const isCorrect = this.dataset.correct === 'true';
          const [critIdx, objIdx] = idx.split('-');
          const fb = document.getElementById(`cc-fb-${critIdx}-${objIdx}`);
          const cell = document.getElementById(`cc-cell-${critIdx}-${objIdx}`);

          // Disable all buttons in this cell
          this.parentElement.querySelectorAll('.cc-opt-btn').forEach(b => {
            b.disabled = true;
            if (b.dataset.correct === 'true') b.classList.add('correct');
          });

          if (isCorrect) {
            this.classList.add('correct');
            fb.textContent = '✓';
            fb.className = 'cc-cell-fb correct';
            earnStar(`cc-${idx}`);
          } else {
            this.classList.add('incorrect');
            fb.textContent = '✗';
            fb.className = 'cc-cell-fb incorrect';
          }

          updateSummary(data);
        });
      });
    }, 0);
  }

  function updateSummary(data) {
    const total = data.objects.length * data.criteria.length;
    const earned = document.querySelectorAll('.cc-opt-btn.correct').length / data.objects.length;
    // Each cell has exactly one correct button that gets .correct class
    const correctCells = document.querySelectorAll('.cc-cell:has(.cc-opt-btn.correct)').length;

    const summary = document.getElementById('cc-summary');
    if (correctCells === total) {
      summary.innerHTML = `<div class="cc-complete">✓ Comparison complete! You filled all ${total} cells correctly.</div>`;
    } else {
      summary.innerHTML = `<p>Progress: ${correctCells} of ${total} cells filled correctly.</p>`;
    }
  }

  function earnStar(key) {
    const fullKey = `compareContrast-${key}`;
    if (StarSystem.earn(fullKey)) {
      if (typeof updateAllTabStars === 'function') updateAllTabStars();
    }
  }

  function getStarCount() {
    if (!bookData?.compareContrast) return { earned: 0, total: 0 };
    const d = bookData.compareContrast;
    const total = (d.objects || []).length * (d.criteria || []).length;
    const earned = StarSystem.getSectionStars('compareContrast-');
    return { earned, total };
  }

  return { render, getStarCount };
})();
window.CompareContrastModule = CompareContrastModule;
