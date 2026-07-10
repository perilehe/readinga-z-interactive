/**
 * pronoun.js - Pronoun Agreement module
 * Students replace nouns with appropriate pronouns
 */
const PronounModule = (() => {
  function render(container) {
    const exercises = bookData.pronounAgreement || [];
    container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'activity-layout active';
    wrapper.innerHTML = `
      <div class="activity-header">
        <h2>🔤 Pronoun Agreement</h2>
        <p>Replace the underlined words with the correct pronoun!</p>
      </div>
    `;

    // Instructions
    const intro = document.createElement('div');
    intro.style.cssText = 'background:#e8eaf6;padding:15px;border-radius:10px;margin-bottom:20px;font-family:var(--font-ui);font-size:0.9em;';
    intro.innerHTML = `
      <strong>Pronoun Agreement:</strong> A pronoun must match its antecedent (the word it replaces) in number and gender.<br>
      <em>Example:</em> "The boy scratched <u>the boy's</u> head" → "The boy scratched <strong>his</strong> head"
    `;
    wrapper.appendChild(intro);

    // Pronoun bank
    const pronouns = ['he', 'she', 'it', 'they', 'him', 'her', 'them', 'his', 'her', 'its', 'their'];
    const bank = document.createElement('div');
    bank.style.cssText = 'margin-bottom:20px;';
    bank.innerHTML = `<h4 style="font-family:var(--font-ui);color:#555;margin-bottom:8px;">Pronoun Bank (click to use):</h4>`;
    const bankItems = document.createElement('div');
    bankItems.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;';
    pronouns.forEach(p => {
      const chip = document.createElement('span');
      chip.style.cssText = 'padding:4px 12px;background:var(--primary-light);border:1px solid var(--primary);border-radius:15px;font-family:var(--font-ui);font-size:0.85em;color:var(--primary);cursor:pointer;';
      chip.textContent = p;
      bankItems.appendChild(chip);
    });
    bank.appendChild(bankItems);
    wrapper.appendChild(bank);

    // Exercises
    exercises.forEach((ex, idx) => {
      const card = document.createElement('div');
      card.style.cssText = 'background:white;padding:18px;border-radius:10px;border:2px solid #e0e0e0;margin-bottom:15px;font-family:var(--font-ui);';

      // Show sentence with underlined part highlighted
      let sentenceHtml = ex.original;
      if (ex.underline) {
        sentenceHtml = sentenceHtml.replace(ex.underline, `<mark style="background:#fff9c4;padding:2px 4px;border-radius:3px;font-weight:bold;">${ex.underline}</mark>`);
      }

      card.innerHTML = `
        <div style="font-size:0.85em;color:#999;margin-bottom:5px;">Sentence ${idx+1}</div>
        <div style="font-size:1em;line-height:1.8;margin-bottom:12px;">${sentenceHtml}</div>
        <div style="font-size:0.85em;color:#666;margin-bottom:8px;font-style:italic;">💡 ${ex.hint}</div>
        <div style="display:flex;gap:8px;align-items:center;">
          <input type="text" class="pronoun-input" data-idx="${idx}" placeholder="Type pronoun here..." style="padding:8px 12px;border:2px solid #ddd;border-radius:8px;font-family:var(--font-ui);font-size:0.95em;width:200px;">
          <button class="btn btn-primary pronoun-check" data-idx="${idx}" style="font-size:0.85em;padding:6px 14px;">Check</button>
          <span class="pronoun-result" data-idx="${idx}" style="font-size:0.9em;"></span>
        </div>
      `;
      wrapper.appendChild(card);
    });

    // Attach event listeners
    wrapper.querySelectorAll('.pronoun-check').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx);
        const input = wrapper.querySelector(`.pronoun-input[data-idx="${idx}"]`);
        const result = wrapper.querySelector(`.pronoun-result[data-idx="${idx}"]`);
        const ex = exercises[idx];
        const answer = input.value.trim().toLowerCase();
        const correct = ex.answer.toLowerCase();

        if (answer === correct) {
          result.innerHTML = '✓ Correct!';
          result.style.color = 'var(--correct-text)';
          input.style.borderColor = 'var(--correct-text)';
          input.style.background = 'var(--correct-bg)';
          input.disabled = true;
          btn.disabled = true;
          btn.style.background = 'var(--correct-text)';
          StarSystem.earn(`pronoun-${idx}`);
          if (typeof updateAllTabStars === 'function') updateAllTabStars();
        } else {
          result.innerHTML = `✗ Try again! (Hint: starts with "${correct[0]}")`;
          result.style.color = 'var(--incorrect-text)';
          input.style.borderColor = 'var(--incorrect-text)';
          setTimeout(() => { input.style.borderColor = '#ddd'; result.innerHTML = ''; }, 2000);
        }
      });
    });

    // Completion banner
    const complete = document.createElement('div');
    complete.className = 'completion-banner';
    complete.id = 'pronounComplete';
    complete.innerHTML = `<h3>🎉 All pronoun exercises done!</h3><p>Great job with pronoun agreement!</p>`;
    wrapper.appendChild(complete);

    container.appendChild(wrapper);
  }

  return { render };
})();

// Expose to global scope for dynamic loading
window.PronounModule = PronounModule;
