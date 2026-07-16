/**
 * progress-io.js - Export/Import learning progress
 * Allows users to download all star progress as JSON and restore from file.
 */
const ProgressIO = (() => {

  function getAllProgress() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('stars_')) {
        data[key] = JSON.parse(localStorage.getItem(key));
      }
    }
    return data;
  }

  function getBookCount(data) {
    return Object.keys(data).filter(k => k.startsWith('stars_')).length;
  }

  function getTotalStars(data) {
    let total = 0;
    Object.values(data).forEach(bookStars => {
      total += Object.values(bookStars).filter(v => v === true).length;
    });
    return total;
  }

  function exportProgress() {
    const data = getAllProgress();
    const bookCount = getBookCount(data);

    if (bookCount === 0) {
      alert('暂无学习进度可以导出。');
      return;
    }

    const totalStars = getTotalStars(data);
    const confirm_msg = `即将导出 ${bookCount} 本书的学习进度（共 ${totalStars} 颗星星）。\n\n确认导出？`;
    if (!confirm(confirm_msg)) return;

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `reading-progress-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importProgress(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        const keys = Object.keys(data).filter(k => k.startsWith('stars_'));

        if (keys.length === 0) {
          alert('文件中没有找到学习进度数据。');
          return;
        }

        let totalNewStars = 0;
        keys.forEach(key => {
          const existing = localStorage.getItem(key);
          if (existing) {
            const existingData = JSON.parse(existing);
            const merged = { ...existingData, ...data[key] };
            localStorage.setItem(key, JSON.stringify(merged));
            totalNewStars += Object.values(data[key]).filter(v => v === true).length;
          } else {
            localStorage.setItem(key, JSON.stringify(data[key]));
            totalNewStars += Object.values(data[key]).filter(v => v === true).length;
          }
        });

        const confirm_msg = `已导入 ${keys.length} 本书的进度（${totalNewStars} 颗星星）。\n\n页面将刷新以显示最新进度。`;
        alert(confirm_msg);
        location.reload();
      } catch (err) {
        alert('文件解析失败，请确认选择的是正确的进度文件。');
        console.error('Import error:', err);
      }
    };
    reader.readAsText(file);
  }

  function setupButtons() {
    // Find or create the controls container
    let controls = document.getElementById('progress-controls');
    if (!controls) {
      controls = document.createElement('div');
      controls.id = 'progress-controls';
      const header = document.querySelector('.header');
      if (header) {
        header.appendChild(controls);
      } else {
        document.body.prepend(controls);
      }
    }

    controls.innerHTML = `
      <button class="progress-btn" id="btn-export" title="Export all progress to JSON file">
        <span class="btn-icon">📤</span>
        <span class="btn-label">Export</span>
      </button>
      <button class="progress-btn" id="btn-import" title="Import progress from JSON file">
        <span class="btn-icon">📥</span>
        <span class="btn-label">Import</span>
      </button>
      <input type="file" id="file-import" accept=".json" style="display:none;" />
    `;

    document.getElementById('btn-export').addEventListener('click', exportProgress);

    const fileInput = document.getElementById('file-import');
    document.getElementById('btn-import').addEventListener('click', () => {
      fileInput.click();
    });
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        importProgress(e.target.files[0]);
        fileInput.value = ''; // reset for re-import
      }
    });
  }

  return { setupButtons };
})();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => ProgressIO.setupButtons());
} else {
  ProgressIO.setupButtons();
}
