/**
 * sequence.js - Sequence Events module (self-rendering)
 */
const SequenceModule = (() => {
  let events = [];
  let selectedCard = null;
  let placements = {};
  let checked = false;

  function render(container) {
    events = [...(bookData.sequenceEvents || [])];
    checked = false;
    placements = {};
    selectedCard = null;

    container.innerHTML = `
      <div class="activity-layout active">
        <div class="activity-header">
          <h2>🔢 Sequence Events</h2>
          <p>Put the events in chronological order on the timeline!</p>
        </div>
        <div class="sequence-container" id="seqContainer">
          <div class="event-cards-pool">
            <h3>📋 Event Cards (click to select, then click timeline slot)</h3>
            <div id="seqCardsPool"></div>
          </div>
          <div class="timeline-area">
            <h3>📅 Timeline</h3>
            <div class="timeline-slots" id="seqTimelineSlots"></div>
          </div>
          <div class="sequence-actions">
            <button class="btn btn-primary" id="seqCheckBtn">Check Order</button>
            <button class="btn btn-secondary" id="seqResetBtn" style="margin-left:10px;">Reset</button>
          </div>
        </div>
        <div class="completion-banner" id="seqComplete">
          <h3>🎉 Timeline Complete!</h3>
          <p>You've correctly ordered all events!</p>
        </div>
      </div>
    `;

    renderCards();
    renderTimeline();

    document.getElementById('seqCheckBtn').addEventListener('click', checkSequence);
    document.getElementById('seqResetBtn').addEventListener('click', () => render(container));
  }

  function renderCards() {
    const pool = document.getElementById('seqCardsPool');
    pool.innerHTML = '';
    const shuffled = events.map((e, i) => ({ ...e, originalIndex: i }));
    shuffleArray(shuffled);
    shuffled.forEach(evt => {
      const card = document.createElement('div');
      card.className = 'event-card';
      card.dataset.eventIndex = evt.originalIndex;
      card.textContent = evt.event;
      card.addEventListener('click', () => selectCard(card, evt.originalIndex));
      card.draggable = true;
      card.addEventListener('dragstart', e => {
        e.dataTransfer.setData('text/plain', evt.originalIndex);
        card.style.opacity = '0.5';
      });
      card.addEventListener('dragend', () => { card.style.opacity = ''; });
      pool.appendChild(card);
    });
  }

  function renderTimeline() {
    const timeline = document.getElementById('seqTimelineSlots');
    timeline.innerHTML = '';
    events.forEach((evt, i) => {
      const slot = document.createElement('div');
      slot.className = 'timeline-slot';
      slot.dataset.slotIndex = i;
      slot.innerHTML = `<span class="slot-year">${evt.year}</span><span class="slot-event" style="color:#aaa;font-style:italic;">Click a card, then click here</span>`;
      slot.addEventListener('click', () => placeInSlot(i));
      slot.addEventListener('dragover', e => { e.preventDefault(); slot.classList.add('hover'); });
      slot.addEventListener('dragleave', () => slot.classList.remove('hover'));
      slot.addEventListener('drop', e => {
        e.preventDefault();
        slot.classList.remove('hover');
        const fromSlot = e.dataTransfer.getData('fromSlot');
        if (fromSlot !== '') {
          // Dragging from another timeline slot - swap
          swapSlots(parseInt(fromSlot), i);
        } else {
          // Dragging from card pool
          placeEvent(parseInt(e.dataTransfer.getData('text/plain')), i);
        }
      });
      // Make filled slots draggable too
      slot.addEventListener('dragstart', e => {
        if (slot.classList.contains('filled') && placements[i] !== undefined) {
          e.dataTransfer.setData('fromSlot', i.toString());
          slot.style.opacity = '0.5';
        }
      });
      slot.addEventListener('dragend', () => { slot.style.opacity = ''; });
      timeline.appendChild(slot);
    });
  }

  function swapSlots(fromSlotIdx, toSlotIdx) {
    if (fromSlotIdx === toSlotIdx) return;
    if (checked) return;

    const fromEvent = placements[fromSlotIdx];
    const toEvent = placements[toSlotIdx];

    // Update placements
    if (toEvent !== undefined) {
      placements[fromSlotIdx] = toEvent;
    } else {
      delete placements[fromSlotIdx];
    }
    placements[toSlotIdx] = fromEvent;

    // Update UI
    updateSlotUI(fromSlotIdx);
    updateSlotUI(toSlotIdx);
  }

  function updateSlotUI(slotIdx) {
    const slot = document.querySelectorAll('.timeline-slot')[slotIdx];
    if (!slot) return;

    if (placements[slotIdx] !== undefined) {
      const evt = events[placements[slotIdx]];
      slot.querySelector('.slot-event').textContent = evt.event;
      slot.querySelector('.slot-event').style.cssText = 'color:#333;font-style:normal;';
      slot.classList.add('filled');
      slot.draggable = true;
    } else {
      slot.querySelector('.slot-event').textContent = 'Empty';
      slot.querySelector('.slot-event').style.cssText = 'color:#aaa;font-style:italic;';
      slot.classList.remove('filled');
      slot.draggable = false;
    }
  }

  function selectCard(card, eventIndex) {
    if (card.classList.contains('placed') || checked) return;
    document.querySelectorAll('.event-card.selected').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    selectedCard = eventIndex;
  }

  function placeInSlot(slotIndex) {
    if (selectedCard === null || checked) return;
    const slots = document.querySelectorAll('.timeline-slot');
    if (slots[slotIndex].classList.contains('filled')) return;
    placeEvent(selectedCard, slotIndex);
    selectedCard = null;
  }

  function placeEvent(eventIndex, slotIndex) {
    if (checked) return;
    // Remove event from any previous slot
    Object.entries(placements).forEach(([s, e]) => {
      if (e === eventIndex) {
        delete placements[s];
        updateSlotUI(parseInt(s));
      }
    });
    placements[slotIndex] = eventIndex;
    const card = document.querySelector(`.event-card[data-event-index="${eventIndex}"]`);
    if (card) { card.classList.add('placed'); card.classList.remove('selected'); }
    updateSlotUI(slotIndex);
  }

  function checkSequence() {
    if (checked) return;
    checked = true;
    let correct = 0;
    const slots = document.querySelectorAll('.timeline-slot');
    Object.entries(placements).forEach(([slotIdx, eventIdx]) => {
      const slot = slots[parseInt(slotIdx)];
      const card = document.querySelector(`.event-card[data-event-index="${eventIdx}"]`);
      if (parseInt(slotIdx) === eventIdx) {
        slot.style.borderColor = 'var(--correct-text)';
        slot.style.background = 'var(--correct-bg)';
        if (card) card.classList.add('correct');
        correct++;
        StarSystem.earn(`seq-${eventIdx}`);
      } else {
        slot.style.borderColor = 'var(--incorrect-text)';
        slot.style.background = 'var(--incorrect-bg)';
        if (card) card.classList.add('incorrect');
      }
    });
    if (typeof updateAllTabStars === 'function') updateAllTabStars();
    const unplaced = events.length - Object.keys(placements).length;
    if (correct === events.length) {
      document.getElementById('seqComplete').classList.add('show');
    } else if (unplaced > 0) {
      alert(`${correct} correct, ${Object.keys(placements).length - correct} wrong, ${unplaced} not placed. Try again!`);
      checked = false;
      slots.forEach(s => { s.style.borderColor = ''; s.style.background = ''; });
      document.querySelectorAll('.event-card').forEach(c => c.classList.remove('correct', 'incorrect'));
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
window.SequenceModule = SequenceModule;
