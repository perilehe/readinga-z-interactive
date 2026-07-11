/**
 * problemSolution.js - Problem & Solution module
 * Students identify problems, causes, effects, and solutions in a story
 */
const ProblemSolutionModule = (() => {
  function render(container) {
    const problems = bookData.problemSolution || [];
    container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'activity-layout active';
    wrapper.innerHTML = `
      <div class="activity-header">
        <h2>🔍 Problem & Solution</h2>
        <p>Analyze the story! Identify problems, their causes, effects, and solutions.</p>
      </div>
    `;

    // Instructions
    const intro = document.createElement('div');
    intro.style.cssText = 'background:#e8eaf6;padding:15px;border-radius:10px;margin-bottom:20px;font-family:var(--font-ui);font-size:0.9em;';
    intro.innerHTML = `
      <strong>How to analyze Problem & Solution:</strong><br>
      1️⃣ <strong>Problem</strong> — What went wrong?<br>
      2️⃣ <strong>Cause</strong> — Why did this problem happen?<br>
      3️⃣ <strong>Effect</strong> — What happened because of the problem?<br>
      4️⃣ <strong>Solution</strong> — How was the problem solved?
    `;
    wrapper.appendChild(intro);

    problems.forEach((item, idx) => {
      const card = document.createElement('div');
      card.style.cssText = 'background:white;border:2px solid #e0e0e0;border-radius:12px;padding:20px;margin-bottom:20px;';

      card.innerHTML = `
        <h3 style="font-family:var(--font-ui);color:var(--primary);margin-bottom:5px;">Problem ${idx + 1}: ${item.title}</h3>
        <p style="font-family:var(--font-ui);font-size:0.85em;color:#666;margin-bottom:15px;font-style:italic;">${item.context || ''}</p>
      `;

      // Four fields: Problem, Cause, Effect, Solution
      const fields = [
        { key: 'problem', label: '1️⃣ What is the problem?', icon: '❌', color: '#c62828' },
        { key: 'cause', label: '2️⃣ What caused this problem?', icon: '❓', color: '#f57f17' },
        { key: 'effect', label: '3️⃣ What happened because of it?', icon: '💥', color: '#ff9800' },
        { key: 'solution', label: '4️⃣ How was it solved?', icon: '✅', color: '#2e7d32' }
      ];

      fields.forEach(field => {
        const fieldDiv = document.createElement('div');
        fieldDiv.style.cssText = 'margin-bottom:12px;';

        const label = document.createElement('label');
        label.style.cssText = `display:block;font-family:var(--font-ui);font-size:0.85em;color:${field.color};font-weight:600;margin-bottom:4px;`;
        label.textContent = `${field.icon} ${field.label}`;
        fieldDiv.appendChild(label);

        if (item.choices && item.choices[field.key]) {
          // Multiple choice
          const optionsDiv = document.createElement('div');
          optionsDiv.style.cssText = 'display:flex;flex-direction:column;gap:6px;';

          item.choices[field.key].forEach((choice, ci) => {
            const opt = document.createElement('div');
            opt.className = 'ps-choice';
            opt.style.cssText = 'padding:8px 12px;background:#f5f5f5;border:2px solid #ddd;border-radius:6px;cursor:pointer;font-family:var(--font-ui);font-size:0.85em;transition:all 0.2s;';
            opt.textContent = choice;
            opt.dataset.field = field.key;
            opt.dataset.idx = ci;
            opt.addEventListener('click', () => {
              optionsDiv.querySelectorAll('.ps-choice').forEach(o => {
                o.classList.remove('selected');
                o.style.borderColor = '#ddd';
                o.style.background = '#f5f5f5';
              });
              opt.classList.add('selected');
              opt.style.borderColor = field.color;
              opt.style.background = `${field.color}11`;
            });
            optionsDiv.appendChild(opt);
          });

          fieldDiv.appendChild(optionsDiv);
        } else {
          // Text input
          const textarea = document.createElement('textarea');
          textarea.className = 'ps-textarea';
          textarea.dataset.field = field.key;
          textarea.style.cssText = 'width:100%;min-height:60px;padding:8px;border:2px solid #ddd;border-radius:6px;font-family:var(--font-body);font-size:0.9em;line-height:1.6;resize:vertical;';
          textarea.placeholder = 'Type your answer...';
          fieldDiv.appendChild(textarea);
        }

        card.appendChild(fieldDiv);
      });

      // Check button
      const checkBtn = document.createElement('button');
      checkBtn.className = 'btn btn-primary';
      checkBtn.textContent = 'Check My Answers';
      checkBtn.addEventListener('click', () => checkProblem(idx, item, card));
      card.appendChild(checkBtn);

      // Feedback
      const feedback = document.createElement('div');
      feedback.className = 'explanation-box';
      feedback.id = `psFb${idx}`;
      feedback.style.marginTop = '10px';
      card.appendChild(feedback);

      wrapper.appendChild(card);
    });

    // Completion
    const complete = document.createElement('div');
    complete.className = 'completion-banner';
    complete.id = 'psComplete';
    complete.innerHTML = `<h3>🎉 All Problems Analyzed!</h3><p>Great job identifying problems and solutions!</p>`;
    wrapper.appendChild(complete);

    container.appendChild(wrapper);
  }

  function checkProblem(idx, item, card) {
    const feedback = card.querySelector(`#psFb${idx}`);
    const answers = item.answers || {};
    let correct = 0;
    const total = 4;

    ['problem', 'cause', 'effect', 'solution'].forEach(field => {
      if (item.choices && item.choices[field]) {
        // Check multiple choice
        const selected = card.querySelector(`.ps-choice.selected[data-field="${field}"]`);
        const correctIdx = answers[field];
        const options = card.querySelectorAll(`.ps-choice[data-field="${field}"]`);

        options.forEach((opt, i) => {
          opt.style.pointerEvents = 'none';
          if (i === correctIdx) {
            opt.style.borderColor = 'var(--correct-text)';
            opt.style.background = 'var(--correct-bg)';
          }
        });

        if (selected && parseInt(selected.dataset.idx) === correctIdx) {
          correct++;
        }
      } else {
        // Check text input - just validate they wrote something reasonable
        const textarea = card.querySelector(`.ps-textarea[data-field="${field}"]`);
        if (textarea && textarea.value.trim().length > 10) {
          textarea.style.borderColor = 'var(--correct-text)';
          textarea.style.background = 'var(--correct-bg)';
          correct++;
        } else if (textarea) {
          textarea.style.borderColor = '#ff9800';
          textarea.style.background = '#fff3e0';
        }
      }
    });

    // Show model answers
    let modelHtml = '<div style="margin-top:10px;padding:12px;background:#f5f5f5;border-radius:6px;font-family:var(--font-ui);font-size:0.85em;">';
    modelHtml += '<strong>📖 Model Answers:</strong><br><br>';
    const labels = { problem: '❌ Problem', cause: '❓ Cause', effect: '💥 Effect', solution: '✅ Solution' };
    Object.entries(answers).forEach(([key, val]) => {
      if (typeof val === 'number' && item.choices && item.choices[key]) {
        modelHtml += `<strong>${labels[key]}:</strong> ${item.choices[key][val]}<br>`;
      } else if (typeof val === 'string') {
        modelHtml += `<strong>${labels[key]}:</strong> ${val}<br>`;
      }
    });
    modelHtml += '</div>';

    if (correct === total) {
      StarSystem.earn(`ps-${idx}`);
      feedback.className = 'explanation-box correct';
      feedback.innerHTML = `✓ Perfect! All ${total} parts correct! +1⭐${modelHtml}`;
    } else {
      feedback.className = 'explanation-box incorrect';
      feedback.innerHTML = `${correct}/${total} correct. Review the model answers below.${modelHtml}`;
      if (correct >= 2) {
        StarSystem.earn(`ps-${idx}`);
      }
    }

    if (typeof updateAllTabStars === 'function') updateAllTabStars();

    // Check completion
    const totalEarned = StarSystem.getSectionStars('ps-');
    const totalPossible = (bookData.problemSolution || []).length;
    if (totalEarned >= totalPossible) {
      document.getElementById('psComplete')?.classList.add('show');
    }
  }

  return { render };
})();

// Expose to global scope
window.ProblemSolutionModule = ProblemSolutionModule;
