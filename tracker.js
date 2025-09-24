// ==================== DOM References ====================
const form = document.getElementById('recycling-form');
const categoryInput = document.getElementById('category');
const quantityInput = document.getElementById('quantity');
const logTableBody = document.getElementById('log-table-body');
const searchInput = document.getElementById('search-input');
const sortSelect = document.getElementById('sort-select');
const errorBox = document.getElementById('form-error');
const statsBox = document.getElementById('statsContainer'); // where totals will show
const chartCanvas = document.getElementById('recyclingChart'); // chart canvas
const badgeBox = document.getElementById('badgeContainer'); // <-- NEW: add this div in your HTML
let earnedBadges = JSON.parse(localStorage.getItem('earnedBadges')) || {}; // track badges per category


// ==================== Local Data ====================
let recyclingLogs = [];
let logIdCounter = 1;
let recyclingChart = null;

// ==================== INIT ====================
loadLogs();
restoreFilters();
renderAll();

// ==================== CREATE ====================
form.addEventListener('submit', (e) => {
  e.preventDefault();
  clearFormError();

  const category = categoryInput.value;
  const quantityRaw = quantityInput.value.trim();
  const quantity = Number(quantityRaw);
  const date = new Date().toISOString().slice(0, 10);

  if (!validateQuantity(quantityRaw, quantity)) return;

  recyclingLogs.push({ id: logIdCounter++, category, quantity, date });
  saveLogs();
  renderAll();
  form.reset();
  categoryInput.focus();
});

// ==================== RENDER ====================
function renderAll() {
  const searchTerm = searchInput.value.trim().toLowerCase();
  const sortValue = sortSelect.value;

  // Save filters
  localStorage.setItem('lastSearch', searchTerm);
  localStorage.setItem('lastSort', sortValue);

  // Filter
  let logs = recyclingLogs.filter(
    (log) =>
      log.category.toLowerCase().includes(searchTerm) ||
      log.quantity.toString().includes(searchTerm) ||
      log.date.includes(searchTerm)
  );

  // Sort
  logs = sortLogs(logs, sortValue);

  // Display table
  displayLogs(logs);

  // Stats & chart (based on ALL logs, not just filtered)
  renderStats();
  renderChart();
  renderBadges();
}

// Helper: show a Bootstrap toast notification
function showBadgeToast(title, body) {
  if (!document.getElementById('toastContainer')) {
    const tc = document.createElement('div');
    tc.id = 'toastContainer';
    tc.className = 'position-fixed bottom-0 end-0 p-3';
    tc.style.zIndex = 10800;
    document.body.appendChild(tc);
  }
  const container = document.getElementById('toastContainer');

  const toastEl = document.createElement('div');
  toastEl.className = 'toast align-items-center text-white bg-success border-0';
  toastEl.setAttribute('role', 'alert');
  toastEl.setAttribute('aria-live', 'assertive');
  toastEl.setAttribute('aria-atomic', 'true');

  toastEl.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">
        <strong>${title}</strong>
        <div class="mt-1 small">${body}</div>
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `;

  container.appendChild(toastEl);
  const bsToast = new bootstrap.Toast(toastEl, { delay: 4500 });
  bsToast.show();
  toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
}

// Recalculate badges from logs (edits & deletes included)
function renderBadges() {
  if (!badgeBox) return;

  // 1) Count items per category
  const byCategory = recyclingLogs.reduce((acc, log) => {
    const cat = String(log.category || 'Uncategorized');
    const qty = Number(log.quantity) || 0;
    acc[cat] = (acc[cat] || 0) + qty;
    return acc;
  }, {});

  // 2) Compute how many badges per category (1 badge for each 10 items)
  const newBadges = {};
  Object.entries(byCategory).forEach(([cat, qty]) => {
    const milestones = Math.floor(qty / 10);
    if (milestones > 0) newBadges[cat] = milestones;
  });

  // 3) Compare to old badges to detect new ones
  const previous = JSON.parse(localStorage.getItem('earnedBadges')) || {};
  const gainedSummary = [];
  Object.entries(newBadges).forEach(([cat, nowCount]) => {
    const prevCount = previous[cat] || 0;
    if (nowCount > prevCount) {
      gainedSummary.push({ cat, gained: nowCount - prevCount, now: nowCount });
    }
  });

  // 4) Save new badges (so deletes & edits sync properly)
  earnedBadges = newBadges;
  localStorage.setItem('earnedBadges', JSON.stringify(earnedBadges));

  // 5) Render badges
  badgeBox.innerHTML = '';
  if (Object.keys(earnedBadges).length === 0) {
    badgeBox.innerHTML = `
      <div class="col-12">
        <div class="p-3 rounded-3 bg-white border text-center">
          <p class="mb-0 text-muted">No achievements yet. Recycle 10 items in any category to earn your first badge.</p>
        </div>
      </div>
    `;
  } else {
    Object.entries(earnedBadges).forEach(([cat, count]) => {
      const displayCat = cat.charAt(0).toUpperCase() + cat.slice(1);
      for (let i = 1; i <= count; i++) {
        const col = document.createElement('div');
        col.className = 'col-12 col-sm-6 col-md-4 col-lg-3';
        col.innerHTML = `
          <div class="card h-100 shadow-sm border-0 rounded-3 text-center p-3">
            <div class="card-body d-flex flex-column align-items-center justify-content-center">
              <div class="badge-icon mb-2" style="width:66px;height:66px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(25,135,84,0.08);">
                <i class="fas fa-recycle text-success" style="font-size:26px;"></i>
              </div>
              <h6 class="card-title text-dark fw-bold mb-1">Recycler Badge #${i}</h6>
              <p class="card-text text-muted small mb-0">Awarded for recycling ${i * 10}+ items in <strong>${displayCat}</strong>.</p>
            </div>
          </div>
        `;
        badgeBox.appendChild(col);
      }
    });
  }

  // 6) Toast new achievements
  if (gainedSummary.length > 0) {
    const title = '🎉 New Achievement' + (gainedSummary.length > 1 ? 's' : '') + '!';
    const body = gainedSummary.map(gs =>
      `${gs.gained} new badge${gs.gained > 1 ? 's' : ''} for ${gs.cat} (now ${gs.now * 10} items)`
    ).join(' • ');
    showBadgeToast(title, body);
  }
}

// ==================== SORT ====================
function sortLogs(logs, sortValue) {
  switch (sortValue) {
    case 'newest':
      return logs.sort((a, b) => new Date(b.date) - new Date(a.date));
    case 'oldest':
      return logs.sort((a, b) => new Date(a.date) - new Date(b.date));
    case 'category-asc':
      return logs.sort((a, b) => a.category.localeCompare(b.category));
    case 'category-desc':
      return logs.sort((a, b) => b.category.localeCompare(a.category));
    case 'quantity-asc':
      return logs.sort((a, b) => a.quantity - b.quantity);
    case 'quantity-desc':
      return logs.sort((a, b) => b.quantity - a.quantity);
    default:
      return logs;
  }
}

// ==================== DISPLAY ====================
function displayLogs(logs) {
  logTableBody.innerHTML = '';
  logs.forEach((log) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${log.date}</td>
      <td>${log.category}</td>
      <td>${log.quantity}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary edit-btn" data-id="${log.id}">Edit</button>
        <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${log.id}">Delete</button>
      </td>
    `;
    logTableBody.appendChild(row);
  });

  // Attach actions
  logTableBody.querySelectorAll('.edit-btn').forEach((btn) =>
    btn.addEventListener('click', () => openEditModal(Number(btn.dataset.id)))
  );
  logTableBody.querySelectorAll('.delete-btn').forEach((btn) =>
    btn.addEventListener('click', () => deleteEntry(Number(btn.dataset.id)))
  );
}

// ==================== STATS ====================
function renderStats() {
  if (!statsBox) return;

  if (!recyclingLogs || recyclingLogs.length === 0) {
    statsBox.innerHTML = '<p class="text-muted">No recycling data yet.</p>';
    return;
  }

  // total across all logs
  const total = recyclingLogs.reduce((sum, log) => sum + log.quantity, 0);
  const byCategory = recyclingLogs.reduce((acc, log) => {
    acc[log.category] = (acc[log.category] || 0) + log.quantity;
    return acc;
  }, {});

  // Build HTML with progress bars
  const itemsHTML = Object.entries(byCategory).map(([cat, qty]) => {
    const percent = total > 0 ? Math.round((qty / total) * 100) : 0;

    return `
      <div class="mb-3">
        <div class="d-flex justify-content-between">
          <span><strong>${cat.charAt(0).toUpperCase() + cat.slice(1)}:</strong></span>
          <span>${qty} items</span>
        </div>
        <div class="progress">
          <div class="progress-bar bg-success" role="progressbar"
               style="width: ${percent}%"
               aria-valuenow="${percent}" aria-valuemin="0" aria-valuemax="100">
            ${percent}%
          </div>
        </div>
      </div>
    `;
  }).join('');

  statsBox.innerHTML = `
        ${itemsHTML}
        <div class="mt-3 p-2 bg-light rounded text-center">
          <strong>Total Recycled: ${total} items</strong>
        </div>
      </div>
    </div>
  `;
}

// ==================== CHART ====================
function renderChart() {
  if (!chartCanvas) return;

  const byCategory = recyclingLogs.reduce((acc, log) => {
    acc[log.category] = (acc[log.category] || 0) + log.quantity;
    return acc;
  }, {});

  const labels = Object.keys(byCategory);
  const data = Object.values(byCategory);

  if (recyclingChart) {
    recyclingChart.destroy();
  }

  recyclingChart = new Chart(chartCanvas, {
    type: 'pie',
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: [
            '#4CAF50',
            '#2196F3',
            '#FF9800',
            '#9C27B0',
            '#F44336',
          ],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' },
      },
    },
  });
}

// ==================== EDIT ====================
function openEditModal(id) {
  const log = recyclingLogs.find((l) => l.id === id);
  if (!log) return;

  document.getElementById('edit-category').value = log.category;
  document.getElementById('edit-quantity').value = log.quantity;
  document.getElementById('edit-log-id').value = log.id;

  bootstrap.Modal.getOrCreateInstance(document.getElementById('edit-modal')).show();
}

document.getElementById('edit-log-form').addEventListener('submit', (e) => {
  e.preventDefault();

  const id = Number(document.getElementById('edit-log-id').value);
  const category = document.getElementById('edit-category').value;
  const quantity = Number(document.getElementById('edit-quantity').value.trim());

  const log = recyclingLogs.find((l) => l.id === id);
  if (log) {
    log.category = category;
    log.quantity = quantity;
  }

  saveLogs();
  renderAll();
  bootstrap.Modal.getOrCreateInstance(document.getElementById('edit-modal')).hide();
});

// ==================== DELETE ====================
function deleteEntry(id) {
  if (!confirm('Are you sure you want to delete this entry?')) return;
  recyclingLogs = recyclingLogs.filter((l) => l.id !== id);
  saveLogs();
  renderAll();
}

// ==================== STORAGE ====================
function saveLogs() {
  localStorage.setItem('recyclingLogs', JSON.stringify(recyclingLogs));
}
function loadLogs() {
  const stored = localStorage.getItem('recyclingLogs');
  if (stored) {
    recyclingLogs = JSON.parse(stored);
    if (recyclingLogs.length > 0) {
      logIdCounter = Math.max(...recyclingLogs.map((l) => l.id)) + 1;
    }
  }
}
function restoreFilters() {
  searchInput.value = localStorage.getItem('lastSearch') || '';
  sortSelect.value = localStorage.getItem('lastSort') || 'newest';
}

// ==================== VALIDATION ====================
function validateQuantity(raw, qty) {
  if (raw === '') return showFormError('Please enter a quantity (kg).'), false;
  if (isNaN(qty)) return showFormError('Quantity must be a number'), false;
  if (!Number.isFinite(qty)) return showFormError('Quantity must be finite'), false;
  if (qty < 1) return showFormError('Quantity must be at least 1 kg.'), false;
  return true;
}

// ==================== ERRORS ====================
function showFormError(msg) {
  if (!errorBox) return alert(msg);
  errorBox.textContent = msg;
  errorBox.style.display = 'block';
  setTimeout(clearFormError, 3000);
}
function clearFormError() {
  if (errorBox) {
    errorBox.textContent = '';
    errorBox.style.display = 'none';
  }
}

// ==================== EVENTS ====================
searchInput.addEventListener('input', renderAll);
sortSelect.addEventListener('change', renderAll);
