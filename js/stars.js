/**
 * stars.js - Star/points system with localStorage persistence
 */
const StarSystem = (() => {
  let bookId = '';
  let stars = {};
  let totalPossible = 0;

  function init(id, total) {
    bookId = id;
    totalPossible = total;
    const saved = localStorage.getItem(`stars_${bookId}`);
    stars = saved ? JSON.parse(saved) : {};
    updateDisplay();
  }

  function earned(key) {
    return stars[key] === true;
  }

  function earn(key) {
    if (stars[key]) return false; // already earned
    stars[key] = true;
    save();
    updateDisplay();
    showToast();
    checkCompletion();
    return true;
  }

  function getCount() {
    return Object.values(stars).filter(v => v).length;
  }

  function getTotal() {
    return totalPossible;
  }

  function save() {
    localStorage.setItem(`stars_${bookId}`, JSON.stringify(stars));
  }

  function updateDisplay() {
    const count = getCount();
    const el = document.getElementById('starCount');
    const totalEl = document.getElementById('totalStars');
    const progressEl = document.getElementById('progressFill');
    if (el) el.textContent = count;
    if (totalEl) totalEl.textContent = totalPossible;
    if (progressEl) {
      const pct = totalPossible > 0 ? (count / totalPossible) * 100 : 0;
      progressEl.style.width = pct + '%';
    }
  }

  function showToast() {
    const toast = document.createElement('div');
    toast.className = 'star-earned-toast';
    toast.textContent = '+1 ⭐';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2100);
  }

  function checkCompletion() {
    if (getCount() >= totalPossible) {
      // Could trigger a celebration here
      console.log('All stars earned!');
    }
  }

  function getSectionStars(prefix) {
    // Count stars for a given prefix (e.g., 'sequence', 'evidence', 'vocab')
    return Object.entries(stars).filter(([k, v]) => k.startsWith(prefix) && v).length;
  }

  function reset() {
    stars = {};
    save();
    updateDisplay();
  }

  return { init, earned, earn, getCount, getTotal, getSectionStars, reset, updateDisplay };
})();
