/**
 * summarize.js - Summarize module (self-rendering)
 */
const SummarizeModule = (() => {
  function render(container) {
    const activities = bookData.summarizeActivities || [];
    container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'activity-layout active';
    wrapper.innerHTML = `<div class="activity-header"><h2>📝 Summarize</h2><p>For each section: identify the main idea, pick key details, and use transition words!</p></div>`;

    activities.forEach((act, actIdx) => {
      const section = document.createElement('div');
      section.className = 'summarize-section';

      section.innerHTML = `
        <h3 style="font-family:var(--font-ui);color:var(--primary);margin-bottom:15px;">📝 ${act.sectionTitle}</h3>
        <div class="summarize-step">
          <h4>Step 1: Main Idea</h4>
          <div class="main-idea-card">💡 ${act.mainIdea}</div>
        </div>
        <div class="summarize-step">
          <h4>Step 2: Select the KEY details (avoid distractors!)</h4>
          <div class="detail-pool" id="sumPool${actIdx}"></div>
        </div>
        <div class="summarize-step">
          <h4>Step 3: Arrange details in order + choose transition words</h4>
          <div class="transition-word-bar" id="sumTransitions${actIdx}"></div>
          <div class="summary-builder" id="sumBuilder${actIdx}">
            <p style="font-family:var(--font-ui);font-size:0.85em;color:#999;font-style:italic;">Select details in Step 2 first...</p>
          </div>
        </div>
      `;

      // Detail pool
      const pool = section.querySelector(`#sumPool${actIdx}`);
      const allDetails = [
        ...act.keyDetails.map((d, i) => ({ text: d, isKey: true, keyIdx: i })),
        ...act.distractors.map(d => ({ text: d, isKey: false, keyIdx: -1 }))
      ];
      shuffleArray(allDetails);
      allDetails.forEach(detail => {
        const item = document.createElement('div');
        item.className = 'detail-item';
        item.textContent = detail.text;
        item.addEventListener('click', () => {
          item.classList.toggle('selected');
          updateArrangeArea(actIdx, act);
        });
        pool.appendChild(item);
      });

      // Transition words
      const transBar = section.querySelector(`#sumTransitions${actIdx}`);
      act.transitionWords.forEach(tw => {
        const span = document.createElement('span');
        span.className = 'transition-word';
        span.textContent = tw;
        transBar.appendChild(span);
      });

      // Check button
      const checkBtn = document.createElement('button');
      checkBtn.className = 'btn btn-primary';
      checkBtn.textContent = 'Check My Summary';
      checkBtn.addEventListener('click', () => checkSummary(actIdx, act, section));
      section.appendChild(checkBtn);

      const feedback = document.createElement('div');
      feedback.className = 'explanation-box';
      feedback.id = `sumFb${actIdx}`;
      feedback.style.marginTop = '10px';
      section.appendChild(feedback);

      wrapper.appendChild(section);
    });

    const complete = document.createElement('div');
    complete.className = 'completion-banner';
    complete.id = 'sumComplete';
    complete.innerHTML = `<h3>🎉 All Summaries Done!</h3><p>You're a great summarizer!</p>`;
    wrapper.appendChild(complete);

    container.appendChild(wrapper);
  }

  function updateArrangeArea(actIdx, act) {
    const section = document.querySelectorAll('.summarize-section')[actIdx];
    const pool = section.querySelector(`#sumPool${actIdx}`);
    const builder = section.querySelector(`#sumBuilder${actIdx}`);
    const selected = Array.from(pool.querySelectorAll('.detail-item.selected')).map(el => el.textContent);

    builder.innerHTML = '';
    if (selected.length === 0) {
      builder.innerHTML = '<p style="font-family:var(--font-ui);font-size:0.85em;color:#999;font-style:italic;">Select details in Step 2 first...</p>';
      return;
    }

    // Store order for checking
    builder.dataset.order = JSON.stringify(selected);

    selected.forEach((text, i) => {
      const line = document.createElement('div');
      line.className = 'summary-line';

      // Transition dropdown
      const select = document.createElement('select');
      select.style.cssText = 'padding:4px 8px;border:1px solid var(--primary);border-radius:6px;font-family:var(--font-ui);font-size:0.8em;color:var(--primary);background:var(--primary-light);';
      const defaultOpt = document.createElement('option');
      defaultOpt.textContent = 'Transition...';
      select.appendChild(defaultOpt);
      act.transitionWords.forEach(tw => {
        const opt = document.createElement('option');
        opt.textContent = tw;
        select.appendChild(opt);
      });
      select.addEventListener('change', () => {
        select.style.background = select.value ? 'var(--primary)' : 'var(--primary-light)';
        select.style.color = select.value ? 'white' : 'var(--primary)';
      });

      const handle = document.createElement('span');
      handle.textContent = '☰';
      handle.style.cssText = 'cursor:grab;color:#999;margin-right:6px;';

      const textSpan = document.createElement('span');
      textSpan.className = 'line-detail';
      textSpan.textContent = text;

      const btns = document.createElement('span');
      btns.style.cssText = 'display:flex;gap:2px;margin-left:8px;';
      if (i > 0) {
        const up = document.createElement('button');
        up.textContent = '↑';
        up.style.cssText = 'border:none;background:none;cursor:pointer;color:var(--primary);';
        up.addEventListener('click', () => moveItem(builder, i, -1));
        btns.appendChild(up);
      }
      if (i < selected.length - 1) {
        const down = document.createElement('button');
        down.textContent = '↓';
        down.style.cssText = 'border:none;background:none;cursor:pointer;color:var(--primary);';
        down.addEventListener('click', () => moveItem(builder, i, 1));
        btns.appendChild(down);
      }

      line.appendChild(handle);
      line.appendChild(select);
      line.appendChild(textSpan);
      line.appendChild(btns);
      builder.appendChild(line);
    });

    // Model summary toggle
    const modelBtn = document.createElement('button');
    modelBtn.className = 'btn btn-secondary';
    modelBtn.textContent = '📖 Show Model Summary';
    modelBtn.style.marginTop = '12px';
    modelBtn.addEventListener('click', () => {
      const existing = builder.querySelector('.model-summary');
      if (existing) { existing.remove(); modelBtn.textContent = '📖 Show Model Summary'; return; }
      const model = document.createElement('div');
      model.className = 'model-summary';
      model.style.cssText = 'margin-top:10px;padding:12px;background:#e8f5e9;border-radius:8px;border-left:4px solid var(--correct-text);font-family:var(--font-ui);font-size:0.9em;';
      let html = `<strong>💡 ${act.mainIdea}</strong><br><br>`;
      act.keyDetails.forEach((d, i) => {
        const tw = act.transitionWords[i] || act.transitionWords[act.transitionWords.length - 1];
        html += `<strong>${tw}:</strong> ${d}<br>`;
      });
      model.innerHTML = html;
      builder.appendChild(model);
      modelBtn.textContent = '📖 Hide Model Summary';
    });
    builder.appendChild(modelBtn);
  }

  function moveItem(builder, pos, dir) {
    const lines = Array.from(builder.querySelectorAll('.summary-line'));
    const newPos = pos + dir;
    if (newPos < 0 || newPos >= lines.length) return;
    const parent = builder;
    const ref = newPos + 1 < lines.length ? lines[newPos + 1] : builder.querySelector('.btn');
    parent.insertBefore(lines[pos], ref);
    // Re-render to update arrows
    const selected = Array.from(lines).map(l => l.querySelector('.line-detail').textContent);
    [selected[pos], selected[newPos]] = [selected[newPos], selected[pos]];
    // Simple approach: just swap DOM nodes
    if (dir > 0) {
      parent.insertBefore(lines[pos], lines[newPos].nextSibling || builder.querySelector('.btn'));
    } else {
      parent.insertBefore(lines[pos], lines[newPos]);
    }
  }

  function checkSummary(actIdx, act, section) {
    const pool = section.querySelector(`#sumPool${actIdx}`);
    const items = pool.querySelectorAll('.detail-item');
    const builder = section.querySelector(`#sumBuilder${actIdx}`);
    const feedback = section.querySelector(`#sumFb${actIdx}`);

    let correct = 0, wrong = 0;
    items.forEach(item => {
      const isKey = act.keyDetails.includes(item.textContent);
      const isSelected = item.classList.contains('selected');
      item.style.pointerEvents = 'none';
      if (isKey && isSelected) { item.classList.add('correct-detail'); correct++; }
      else if (!isKey && isSelected) { item.classList.add('distractor-wrong'); wrong++; }
    });

    let stars = 0;
    if (correct >= Math.ceil(act.keyDetails.length / 2)) { StarSystem.earn(`sum-${actIdx}-details`); stars++; }
    if (wrong === 0 && correct === act.keyDetails.length) { StarSystem.earn(`sum-${actIdx}-perfect`); stars++; }
    if (typeof updateAllTabStars === 'function') updateAllTabStars();

    if (correct === act.keyDetails.length && wrong === 0) {
      feedback.className = 'explanation-box correct';
      feedback.innerHTML = `✓ Perfect! All ${act.keyDetails.length} key details found! +${stars}⭐`;
    } else {
      feedback.className = 'explanation-box incorrect';
      feedback.innerHTML = `${correct}/${act.keyDetails.length} correct. ${wrong > 0 ? `${wrong} distractor(s).` : ''} ${stars > 0 ? `+${stars}⭐` : 'Try again!'}`;
    }

    // Show model
    if (!builder.querySelector('.model-summary')) {
      const model = document.createElement('div');
      model.className = 'model-summary';
      model.style.cssText = 'margin-top:10px;padding:12px;background:#e8f5e9;border-radius:8px;border-left:4px solid var(--correct-text);font-family:var(--font-ui);font-size:0.9em;';
      let html = `<strong>💡 ${act.mainIdea}</strong><br><br>`;
      act.keyDetails.forEach((d, i) => {
        const tw = act.transitionWords[i] || act.transitionWords[act.transitionWords.length - 1];
        html += `<strong>${tw}:</strong> ${d}<br>`;
      });
      model.innerHTML = html;
      builder.appendChild(model);
    }

    const totalEarned = StarSystem.getSectionStars('sum-');
    if (totalEarned >= (bookData.summarizeActivities || []).length * 2) {
      document.getElementById('sumComplete')?.classList.add('show');
    }
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
window.SummarizeModule = SummarizeModule;
