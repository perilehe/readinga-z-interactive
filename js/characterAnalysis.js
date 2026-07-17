/**
 * characterAnalysis.js - Biography character analysis module
 * Three-column chart: Personality | Accomplishments | Influence
 * Users sort fact cards into the correct category.
 */
const CharacterAnalysisModule = (() => {

  function render(container) {
    const data = bookData.characterAnalysis;
    if (!data) {
      container.innerHTML = '<div style="padding:40px;text-align:center;font-family:var(--font-ui);color:#999;">No character analysis configured.</div>';
      return;
    }

    container.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'ca-container';

    // Header
    const header = document.createElement('div');
    header.className = 'ca-header';
    header.innerHTML = `
      <h2>👤 ${data.character} — Elements of a Biography</h2>
      <p class="ca-explanation">A biography tells about a real person's life. Sort the facts below into the correct category.</p>
    `;
    wrap.appendChild(header);

    // Three-column chart
    const chart = document.createElement('div');
    chart.className = 'ca-chart';

    const categoryNames = Object.keys(data.categories);
    categoryNames.forEach(catName => {
      const cat = data.categories[catName];
      const col = document.createElement('div');
      col.className = 'ca-column';
      col.dataset.category = catName;
      col.innerHTML = `
        <div class="ca-col-header" style="background:${cat.color || '#667eea'}">
          <span class="ca-col-icon">${cat.icon || '📌'}</span>
          <span class="ca-col-name">${catName}</span>
        </div>
        <p class="ca-col-prompt">${cat.prompt}</p>
        <div class="ca-col-items" id="ca-col-${catName.replace(/\s/g, '')}"></div>
      `;
      chart.appendChild(col);
    });
    wrap.appendChild(chart);

    // Fact pool (shuffled)
    const allFacts = [];
    categoryNames.forEach(catName => {
      data.categories[catName].items.forEach(item => {
        allFacts.push({ text: item, category: catName });
      });
    });
    // Shuffle
    for (let i = allFacts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allFacts[i], allFacts[j]] = [allFacts[j], allFacts[i]];
    }

    const pool = document.createElement('div');
    pool.className = 'ca-pool';
    pool.innerHTML = `<h3>📋 Facts from the Book</h3><p class="ca-pool-hint">Click a fact, then click the column where it belongs.</p>`;
    const poolItems = document.createElement('div');
    poolItems.className = 'ca-pool-items';

    allFacts.forEach((fact, idx) => {
      const card = document.createElement('div');
      card.className = 'ca-fact-card';
      card.dataset.factIdx = idx;
      card.dataset.category = fact.category;
      card.textContent = fact.text;
      card.addEventListener('click', () => selectFact(card));
      poolItems.appendChild(card);
    });
    pool.appendChild(poolItems);
    wrap.appendChild(pool);

    // Check button
    const checkBtn = document.createElement('button');
    checkBtn.className = 'btn btn-primary ca-check-btn';
    checkBtn.textContent = '✓ Check Answers';
    checkBtn.addEventListener('click', () => checkAnswers(data, categoryNames));
    wrap.appendChild(checkBtn);

    // Feedback area
    const fb = document.createElement('div');
    fb.className = 'ca-feedback';
    fb.id = 'ca-feedback';
    wrap.appendChild(fb);

    // Quote reflection (if provided)
    if (data.quote) {
      const quoteSection = document.createElement('div');
      quoteSection.className = 'ca-quote';
      quoteSection.innerHTML = `
        <h3>💬 Quote Reflection</h3>
        <blockquote class="ca-quote-text">${data.quote}</blockquote>
        <p class="ca-quote-prompt">${data.quotePrompt || 'How does this quote reflect the character\'s personality, accomplishments, and influence?'}</p>
        <textarea class="ca-quote-input" id="ca-quote-input" placeholder="Type your reflection here..." rows="4"></textarea>
        <button class="btn btn-primary ca-quote-save" id="ca-quote-save">Save Reflection</button>
        <div class="ca-quote-saved" id="ca-quote-saved" style="display:none;">✓ Reflection saved!</div>
      `;
      wrap.appendChild(quoteSection);

      // Save handler
      setTimeout(() => {
        const saveBtn = document.getElementById('ca-quote-save');
        const input = document.getElementById('ca-quote-input');
        const saved = document.getElementById('ca-quote-saved');
        // Load saved
        const savedText = localStorage.getItem(`ca-quote-${bookData.meta.id}`);
        if (savedText) {
          input.value = savedText;
        }
        saveBtn.addEventListener('click', () => {
          if (input.value.trim()) {
            localStorage.setItem(`ca-quote-${bookData.meta.id}`, input.value);
            saved.style.display = 'block';
            earnStar('quote');
            setTimeout(() => saved.style.display = 'none', 2000);
          }
        });
      }, 0);
    }

    container.appendChild(wrap);

    // Column click handler for placing facts
    setTimeout(() => {
      document.querySelectorAll('.ca-column').forEach(col => {
        col.addEventListener('click', function(e) {
          // Don't trigger if clicking on an already-placed card
          if (e.target.classList.contains('ca-placed-card')) return;
          if (selectedFactCard) {
            const catName = this.dataset.category;
            const itemsContainer = this.querySelector('.ca-col-items');
            // Move the card to this column
            selectedFactCard.classList.remove('selected');
            selectedFactCard.classList.add('ca-placed-card');
            selectedFactCard.dataset.placedIn = catName;
            itemsContainer.appendChild(selectedFactCard);
            selectedFactCard = null;
          }
        });
      });

      // Click on placed card to return to pool
      document.querySelectorAll('.ca-placed-card').forEach(card => {
        card.addEventListener('click', function(e) {
          e.stopPropagation();
          returnToPool(this);
        });
      });
    }, 0);
  }

  let selectedFactCard = null;

  function selectFact(card) {
    // Deselect previous
    if (selectedFactCard) selectedFactCard.classList.remove('selected');
    // Select this one
    card.classList.add('selected');
    selectedFactCard = card;
  }

  function returnToPool(card) {
    card.classList.remove('ca-placed-card', 'correct', 'incorrect');
    card.dataset.placedIn = '';
    const poolItems = document.querySelector('.ca-pool-items');
    if (poolItems) poolItems.appendChild(card);
  }

  function checkAnswers(data, categoryNames) {
    let correct = 0;
    let total = 0;
    let allPlaced = true;

    document.querySelectorAll('.ca-fact-card').forEach(card => {
      const placedIn = card.dataset.placedIn;
      const correctCat = card.dataset.category;
      total++;

      if (!placedIn) {
        allPlaced = false;
        card.classList.add('incorrect');
        return;
      }

      card.classList.remove('correct', 'incorrect');
      if (placedIn === correctCat) {
        card.classList.add('correct');
        correct++;
      } else {
        card.classList.add('incorrect');
      }
    });

    const fb = document.getElementById('ca-feedback');
    if (!allPlaced) {
      fb.innerHTML = '⚠️ Please place all facts in a column before checking.';
      fb.className = 'ca-feedback warning show';
      return;
    }

    if (correct === total) {
      fb.innerHTML = `✓ Perfect! All ${total} facts are in the correct category!`;
      fb.className = 'ca-feedback correct show';
      // Award stars for each category
      categoryNames.forEach(catName => earnStar(`cat-${catName.replace(/\s/g, '')}`));
    } else {
      fb.innerHTML = `${correct} of ${total} correct. <span style="color:#4caf50">Green</span> = correct, <span style="color:#f44336">Red</span> = wrong. Click a wrong card to return it to the pool and try again.`;
      fb.className = 'ca-feedback incorrect show';
    }

    // Re-bind click on placed cards
    document.querySelectorAll('.ca-placed-card').forEach(card => {
      card.onclick = function(e) {
        e.stopPropagation();
        returnToPool(this);
        const fb2 = document.getElementById('ca-feedback');
        fb2.className = 'ca-feedback';
      };
    });
  }

  function earnStar(key) {
    const fullKey = `characterAnalysis-${key}`;
    if (StarSystem.earn(fullKey)) {
      if (typeof updateAllTabStars === 'function') updateAllTabStars();
    }
  }

  function getStarCount() {
    if (!bookData?.characterAnalysis) return { earned: 0, total: 0 };
    const cats = Object.keys(bookData.characterAnalysis.categories || {});
    const total = cats.length + 1; // categories + quote
    const earned = StarSystem.getSectionStars('characterAnalysis-');
    return { earned, total };
  }

  return { render, getStarCount };
})();
window.CharacterAnalysisModule = CharacterAnalysisModule;
