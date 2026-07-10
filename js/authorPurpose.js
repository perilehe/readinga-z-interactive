/**
 * authorPurpose.js - Author's Purpose module
 * Students determine if the author wrote to Inform, Entertain, or Persuade
 * and find evidence from the text.
 */
const AuthorPurposeModule = (() => {
  function render(container) {
    const data = bookData.authorPurpose || {};
    const purposes = data.purposes || ['Inform', 'Entertain', 'Persuade'];
    container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'activity-layout active';
    wrapper.innerHTML = `
      <div class="activity-header">
        <h2>🎯 Author's Purpose</h2>
        <p>Why did the author write this book? Check all purposes that apply and find evidence!</p>
      </div>
    `;

    const intro = document.createElement('div');
    intro.style.cssText = 'background:#e8eaf6;padding:15px;border-radius:10px;margin-bottom:20px;font-family:var(--font-ui);font-size:0.9em;';
    intro.innerHTML = `
      <strong>Three purposes of writing:</strong><br>
      <span style="color:#1565c0;">📘 <strong>Inform</strong></span> — give facts and information<br>
      <span style="color:#2e7d32;">🎬 <strong>Entertain</strong></span> — amuse or tell interesting stories<br>
      <span style="color:#c62828;">📢 <strong>Persuade</strong></span> — convince the reader of something
    `;
    wrapper.appendChild(intro);

    // Checkboxes for purposes
    const purposeSection = document.createElement('div');
    purposeSection.style.cssText = 'margin-bottom:20px;';
    purposeSection.innerHTML = `<h4 style="font-family:var(--font-ui);color:#555;margin-bottom:10px;">Which purposes does this book serve? (Check all that apply)</h4>`;

    const purposeColors = { 'Inform': '#1565c0', 'Entertain': '#2e7d32', 'Persuade': '#c62828' };
    const purposeIcons = { 'Inform': '📘', 'Entertain': '🎬', 'Persuade': '📢' };

    purposes.forEach(purpose => {
      const label = document.createElement('label');
      label.style.cssText = `display:flex;align-items:center;gap:10px;padding:10px 15px;margin-bottom:8px;background:white;border:2px solid #ddd;border-radius:8px;cursor:pointer;font-family:var(--font-ui);transition:all 0.2s;`;

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.dataset.purpose = purpose;
      checkbox.style.cssText = 'width:18px;height:18px;cursor:pointer;';
      checkbox.addEventListener('change', () => {
        label.style.borderColor = checkbox.checked ? purposeColors[purpose] : '#ddd';
        label.style.background = checkbox.checked ? `${purposeColors[purpose]}11` : 'white';
        updateEvidenceSection();
      });

      label.appendChild(checkbox);
      label.innerHTML += `<span style="font-size:1.2em;">${purposeIcons[purpose]}</span><strong style="color:${purposeColors[purpose]}">${purpose}</strong>`;
      // Re-add checkbox since innerHTML replaced it
      label.prepend(checkbox);
      purposeSection.appendChild(label);
    });
    wrapper.appendChild(purposeSection);

    // Evidence text areas
    const evidenceSection = document.createElement('div');
    evidenceSection.id = 'apEvidence';
    evidenceSection.style.cssText = 'margin-bottom:20px;';
    evidenceSection.innerHTML = `<h4 style="font-family:var(--font-ui);color:#555;margin-bottom:10px;">Find evidence from the text for each purpose you selected:</h4>`;
    wrapper.appendChild(evidenceSection);

    // Submit
    const submitBtn = document.createElement('button');
    submitBtn.className = 'btn btn-primary';
    submitBtn.textContent = 'Check My Answers';
    submitBtn.addEventListener('click', () => checkAnswers(purposes, data, wrapper));
    wrapper.appendChild(submitBtn);

    const feedback = document.createElement('div');
    feedback.className = 'explanation-box';
    feedback.id = 'apFeedback';
    feedback.style.marginTop = '10px';
    wrapper.appendChild(feedback);

    container.appendChild(wrapper);

    function updateEvidenceSection() {
      evidenceSection.innerHTML = '<h4 style="font-family:var(--font-ui);color:#555;margin-bottom:10px;">Find evidence from the text:</h4>';
      const checked = Array.from(purposeSection.querySelectorAll('input:checked')).map(cb => cb.dataset.purpose);
      if (checked.length === 0) {
        evidenceSection.innerHTML += '<p style="font-family:var(--font-ui);color:#999;font-style:italic;">Select a purpose above first.</p>';
        return;
      }
      checked.forEach(purpose => {
        const area = document.createElement('div');
        area.style.cssText = 'margin-bottom:15px;';
        const prompt = data.evidencePrompts?.[purpose] || `Write evidence for ${purpose}:`;
        area.innerHTML = `
          <label style="font-family:var(--font-ui);font-size:0.9em;color:${purposeColors[purpose]};font-weight:600;">${purposeIcons[purpose]} ${prompt}</label>
          <textarea class="ap-evidence" data-purpose="${purpose}" style="width:100%;min-height:80px;padding:10px;border:2px solid #ddd;border-radius:8px;font-family:var(--font-body);font-size:0.95em;line-height:1.6;margin-top:5px;resize:vertical;" placeholder="Type evidence from the book here..."></textarea>
        `;
        evidenceSection.appendChild(area);
      });
    }
  }

  function checkAnswers(purposes, data, wrapper) {
    const checked = Array.from(wrapper.querySelectorAll('input[type=checkbox]:checked')).map(cb => cb.dataset.purpose);
    const feedback = wrapper.querySelector('#apFeedback');
    const answerKey = data.answerKey || {};

    // For this book, Inform and Entertain are correct, Persuade is not
    const correctPurposes = purposes.filter(p => answerKey[p] && !answerKey[p].toLowerCase().includes('does not'));
    const wrongPurposes = checked.filter(p => !correctPurposes.includes(p));
    const missedPurposes = correctPurposes.filter(p => !checked.includes(p));

    let stars = 0;
    let html = '';

    // Check purpose selection
    if (wrongPurposes.length === 0 && missedPurposes.length === 0) {
      html += `✓ <strong>Correct!</strong> You identified the right purposes.<br>`;
      StarSystem.earn('ap-purposes');
      stars++;
    } else {
      if (missedPurposes.length > 0) html += `✗ Missing: ${missedPurposes.join(', ')}<br>`;
      if (wrongPurposes.length > 0) html += `✗ Not applicable: ${wrongPurposes.join(', ')}<br>`;
    }

    // Check evidence
    const textareas = wrapper.querySelectorAll('.ap-evidence');
    let evidenceGood = 0;
    textareas.forEach(ta => {
      const purpose = ta.dataset.purpose;
      const text = ta.value.trim();
      if (text.length > 20) {
        evidenceGood++;
        ta.style.borderColor = 'var(--correct-text)';
        ta.style.background = 'var(--correct-bg)';
      } else if (text.length > 0) {
        ta.style.borderColor = '#ff9800';
        ta.style.background = '#fff3e0';
      } else {
        ta.style.borderColor = 'var(--incorrect-text)';
        ta.style.background = 'var(--incorrect-bg)';
      }
    });

    if (evidenceGood >= correctPurposes.length) {
      html += `✓ Great evidence for all purposes!`;
      StarSystem.earn('ap-evidence');
      stars++;
    } else {
      html += `${evidenceGood}/${correctPurposes.length} purposes have sufficient evidence. Write more details!`;
    }

    // Show answer key
    html += `<div style="margin-top:15px;padding:12px;background:#f5f5f5;border-radius:8px;font-family:var(--font-ui);font-size:0.85em;">`;
    html += `<strong>📖 Answer Key:</strong><br><br>`;
    Object.entries(answerKey).forEach(([purpose, answer]) => {
      html += `<strong style="color:${purpose === 'Inform' ? '#1565c0' : purpose === 'Entertain' ? '#2e7d32' : '#c62828'};">${purpose}:</strong> ${answer}<br><br>`;
    });
    html += `</div>`;

    feedback.className = `explanation-box ${stars === 2 ? 'correct' : 'incorrect'}`;
    feedback.innerHTML = html;
    if (typeof updateAllTabStars === 'function') updateAllTabStars();
  }

  return { render };
})();

// Expose to global scope for dynamic loading
window.AuthorPurposeModule = AuthorPurposeModule;
