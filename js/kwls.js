/**
 * kwls.js - KWLS Chart module (K/W/L/S)
 * K = What I Know, W = What I Want to Know
 * L = What I Learned, S = What I Still Want to Know
 */
const KwlsModule = (() => {
  function render(container) {
    const data = bookData.kwls || {};
    const prompts = data.prompts || {
      K: 'What do you already know about this topic?',
      W: 'What do you want to learn?',
      L: 'What did you learn from reading?',
      S: 'What do you still want to know?'
    };
    const sampleAnswers = data.sampleAnswers || {};
    const colors = { K: '#1565c0', W: '#f57f17', L: '#2e7d32', S: '#9c27b0' };
    const icons = { K: '🧠', W: '❓', L: '💡', S: '🔍' };
    const labels = { K: 'What I Know', W: 'What I Want to Know', L: 'What I Learned', S: 'What I Still Want to Know' };

    container.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.className = 'activity-layout active';
    wrapper.innerHTML = `
      <div class="activity-header">
        <h2>📊 KWLS Chart</h2>
        <p>Track your learning! Fill in each section before and after reading.</p>
      </div>
    `;

    // Instructions
    const intro = document.createElement('div');
    intro.style.cssText = 'background:#e8eaf6;padding:15px;border-radius:10px;margin-bottom:20px;font-family:var(--font-ui);font-size:0.9em;';
    intro.innerHTML = `
      <strong>How to use KWLS:</strong><br>
      🧠 <strong>K</strong> — Fill in <strong>before reading</strong>: What do you already know?<br>
      ❓ <strong>W</strong> — Fill in <strong>before reading</strong>: What do you want to learn?<br>
      💡 <strong>L</strong> — Fill in <strong>after reading</strong>: What did you learn?<br>
      🔍 <strong>S</strong> — Fill in <strong>after reading</strong>: What do you still want to know?
    `;
    wrapper.appendChild(intro);

    // 4 sections
    ['K', 'W', 'L', 'S'].forEach(key => {
      const section = document.createElement('div');
      section.style.cssText = `background:white;border:2px solid ${colors[key]};border-radius:12px;padding:20px;margin-bottom:20px;`;
      section.innerHTML = `
        <h3 style="color:${colors[key]};font-family:var(--font-ui);margin-bottom:10px;">${icons[key]} ${key}: ${labels[key]}</h3>
        <p style="font-family:var(--font-ui);font-size:0.85em;color:#666;margin-bottom:10px;">${prompts[key]}</p>
        <textarea class="kwls-textarea" data-key="${key}" style="width:100%;min-height:100px;padding:12px;border:2px solid #e0e0e0;border-radius:8px;font-family:var(--font-body);font-size:0.95em;line-height:1.8;resize:vertical;" placeholder="Write your answer here..."></textarea>
      `;

      // Show sample answers for L section
      if (sampleAnswers[key]) {
        const samples = document.createElement('div');
        samples.style.cssText = 'margin-top:10px;';
        const toggle = document.createElement('button');
        toggle.className = 'btn btn-secondary';
        toggle.style.cssText = 'font-size:0.8em;padding:5px 12px;';
        toggle.textContent = `📖 Show Example Answers`;
        toggle.addEventListener('click', () => {
          if (samples.querySelector('.kwls-samples')) {
            samples.querySelector('.kwls-samples').remove();
            toggle.textContent = `📖 Show Example Answers`;
          } else {
            const div = document.createElement('div');
            div.className = 'kwls-samples';
            div.style.cssText = 'margin-top:8px;padding:10px;background:#f5f5f5;border-radius:6px;font-family:var(--font-ui);font-size:0.85em;';
            div.innerHTML = `<strong>Example answers:</strong><ul style="margin:5px 0 0 20px;">${sampleAnswers[key].map(a => `<li>${a}</li>`).join('')}</ul>`;
            samples.appendChild(div);
            toggle.textContent = `📖 Hide Example Answers`;
          }
        });
        samples.appendChild(toggle);
        section.appendChild(samples);
      }

      // Submit button per section
      const submitBtn = document.createElement('button');
      submitBtn.className = 'btn btn-primary';
      submitBtn.style.cssText = 'margin-top:10px;font-size:0.85em;padding:6px 16px;';
      submitBtn.textContent = '✓ Save';
      submitBtn.addEventListener('click', () => {
        const textarea = section.querySelector('textarea');
        if (textarea.value.trim().length > 10) {
          StarSystem.earn(`kwls-${key}`);
          if (typeof updateAllTabStars === 'function') updateAllTabStars();
          submitBtn.textContent = '✓ Saved!';
          submitBtn.disabled = true;
          submitBtn.style.background = 'var(--correct-text)';
          textarea.style.borderColor = 'var(--correct-text)';
        } else {
          textarea.style.borderColor = 'var(--incorrect-text)';
          setTimeout(() => { textarea.style.borderColor = '#e0e0e0'; }, 1500);
        }
      });
      section.appendChild(submitBtn);

      wrapper.appendChild(section);
    });

    container.appendChild(wrapper);
  }

  return { render };
})();

// Expose to global scope for dynamic loading
window.KwlsModule = KwlsModule;
