// Admin Panel and Indicator Management
// Handles CRUD operations for panels and indicators

document.addEventListener('DOMContentLoaded', async () => {
  // Tab switching
  const tabs = document.querySelectorAll('.admin-tab');
  const tabContents = document.querySelectorAll('.admin-tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.dataset.tab;
      
      // Update active tab
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Update active content
      tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === `${targetTab}-tab`) {
          content.classList.add('active');
        }
      });

      // Load data for the active tab
      if (targetTab === 'panels') {
        loadPanels();
      } else if (targetTab === 'indicators') {
        loadIndicators();
      }
    });
  });

  // Panel Management
  const addPanelBtn = document.getElementById('add-panel-btn');
  const panelForm = document.getElementById('panel-form');
  const panelFormModal = document.getElementById('panel-form-modal');
  const closePanelFormBtn = document.getElementById('close-panel-form-modal');
  const cancelPanelFormBtn = document.getElementById('cancel-panel-form');

  if (addPanelBtn) {
    addPanelBtn.addEventListener('click', () => {
      openPanelForm();
    });
  }

  if (closePanelFormBtn) {
    closePanelFormBtn.addEventListener('click', closePanelForm);
  }

  if (cancelPanelFormBtn) {
    cancelPanelFormBtn.addEventListener('click', closePanelForm);
  }

  if (panelForm) {
    panelForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await savePanel();
    });
  }

  // Indicator Management
  const addIndicatorBtn = document.getElementById('add-indicator-btn');
  const indicatorForm = document.getElementById('indicator-form');
  const indicatorFormModal = document.getElementById('indicator-form-modal');
  const closeIndicatorFormBtn = document.getElementById('close-indicator-form-modal');
  const cancelIndicatorFormBtn = document.getElementById('cancel-indicator-form');
  const indicatorPanelFilter = document.getElementById('indicator-panel-filter');

  if (addIndicatorBtn) {
    addIndicatorBtn.addEventListener('click', () => {
      openIndicatorForm();
    });
  }

  if (closeIndicatorFormBtn) {
    closeIndicatorFormBtn.addEventListener('click', closeIndicatorForm);
  }

  if (cancelIndicatorFormBtn) {
    cancelIndicatorFormBtn.addEventListener('click', closeIndicatorForm);
  }

  if (indicatorForm) {
    indicatorForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await saveIndicator();
    });
  }

  if (indicatorPanelFilter) {
    indicatorPanelFilter.addEventListener('change', () => {
      loadIndicators();
    });
  }

  // Load initial data
  await loadPanels();
  await loadIndicators();
});

// ============================================
// PANEL MANAGEMENT FUNCTIONS
// ============================================

async function loadPanels() {
  const container = document.getElementById('panels-container');
  if (!container) return;

  try {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">⏳</div><p>Loading panels...</p></div>';

    const panels = await AdminService.getAllPanels();

    if (panels.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📋</div><p>No panels found. Add your first panel to get started.</p></div>';
      return;
    }

    container.innerHTML = panels.map(panel => `
      <div class="panel-card" data-panel-id="${panel.id}">
        <div class="panel-header">
          <div>
            <h3 style="margin-bottom: 0.5rem;">${panel.icon || '📋'} ${panel.title}</h3>
            <span class="category-badge category-${panel.category}">${panel.category}</span>
          </div>
          <div class="panel-actions">
            <button class="btn-secondary" onclick="openAddIndicatorsToPanel('${panel.id}', '${panel.title.replace(/'/g, "\\'")}')" style="background-color: #0D4D6C; color: white; border-color: #0D4D6C;">Add Indicators</button>
            <button class="btn-secondary" onclick="editPanel('${panel.id}')">Edit</button>
            <button class="btn-secondary" onclick="deletePanelConfirm('${panel.id}', '${panel.title.replace(/'/g, "\\'")}')" style="color: #ef4444;">Delete</button>
          </div>
        </div>
        ${panel.description ? `<p style="color: #6b7280; margin-bottom: 0.5rem;">${panel.description}</p>` : ''}
        ${panel.purpose ? `<p style="color: #6b7280; font-size: 0.875rem;">Purpose: ${panel.purpose}</p>` : ''}
        <div class="panel-meta">
          <div class="meta-item">
            <span class="meta-label">Created</span>
            <span class="meta-value">${new Date(panel.created_at).toLocaleDateString()}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">ID</span>
            <span class="meta-value" style="font-family: monospace; font-size: 0.875rem;">${panel.id}</span>
          </div>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading panels:', error);
    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">❌</div><p>Error loading panels: ${error.message}</p></div>`;
  }
}

function openPanelForm(panelId = null) {
  const modal = document.getElementById('panel-form-modal');
  const form = document.getElementById('panel-form');
  const title = document.getElementById('panel-form-title');
  const formId = document.getElementById('panel-form-id');

  if (!modal || !form || !title || !formId) {
    console.error('Panel form elements not found');
    return;
  }

  if (panelId) {
    // Edit mode - load panel data
    AdminService.getAllPanels().then(panels => {
      const panel = panels.find(p => p.id === panelId);
      if (panel) {
  formId.value = panel.id;
  document.getElementById('panel-title').value = panel.title;
  document.getElementById('panel-category').value = panel.category;
  document.getElementById('panel-impact').value = panel.impact || '';
  document.getElementById('panel-description').value = panel.description || '';
  document.getElementById('panel-esg-class').value = panel.esg_class || '';
  document.getElementById('panel-primary-framework').value = panel.primary_framework || '';
  document.getElementById('panel-purpose').value = panel.purpose || '';
  document.getElementById('panel-unicode').value = panel.unicode || '';
  document.getElementById('panel-icon').value = panel.icon || '';

  // SDGs multi-select (if stored as array or comma-separated string)
  const sdgSelect = document.getElementById('panel-sdgs');
  if (panel.sdgs && sdgSelect) {
    const sdgValues = Array.isArray(panel.sdgs)
      ? panel.sdgs
      : String(panel.sdgs).split(',').map(s => s.trim());

    Array.from(sdgSelect.options).forEach(opt => {
      opt.selected = sdgValues.includes(opt.value);
    });
  }

  title.textContent = 'Edit Panel';
}
    });
  } else {
    // Add mode
    form.reset();
    formId.value = '';
    title.textContent = 'Add Panel';
  }

  modal.classList.remove('hidden');
}

function closePanelForm() {
  const modal = document.getElementById('panel-form-modal');
  modal.classList.add('hidden');
  document.getElementById('panel-form').reset();
}

async function savePanel() {
  const formId = document.getElementById('panel-form-id').value;
  const title = document.getElementById('panel-title').value;
  const category = document.getElementById('panel-category').value;
  const impact = document.getElementById('panel-impact').value;
  const description = document.getElementById('panel-description').value;
  const esgClass = document.getElementById('panel-esg-class').value;
  const primaryFramework = document.getElementById('panel-primary-framework').value;
  const sdgSelect = document.getElementById('panel-sdgs');
  const purpose = document.getElementById('panel-purpose').value;
  const unicode = document.getElementById('panel-unicode').value;
  const icon = document.getElementById('panel-icon').value;

  // Multi-select SDGs (array)
  const sdgs = Array.from(sdgSelect.selectedOptions).map(o => o.value);

  if (!title || !category || !impact || !esgClass || !primaryFramework) {
    alert('Please fill in all required fields');
    return;
  }

  try {
    const panelData = {
      title,
      category,
      impact,
      description,
      esg_class: esgClass,
      primary_framework: primaryFramework,
      sdgs,
      purpose,
      unicode,
      icon
    };

    if (formId) {
      // Update existing panel
      await AdminService.updatePanel(formId, panelData);
      alert('Panel updated successfully!');
    } else {
      // Create new panel
      await AdminService.createPanel(panelData);
      alert('Panel created successfully!');
    }

    closePanelForm();
    await loadPanels();
  } catch (error) {
    console.error('Error saving panel:', error);
    alert(`Error: ${error.message}`);
  }
}

async function editPanel(panelId) {
  openPanelForm(panelId);
}

async function deletePanelConfirm(panelId, panelTitle) {
  if (!confirm(`Are you sure you want to delete "${panelTitle}"?\n\nThis action cannot be undone.`)) {
    return;
  }

  try {
    await AdminService.deletePanel(panelId);
    alert('Panel deleted successfully!');
    await loadPanels();
  } catch (error) {
    console.error('Error deleting panel:', error);
    alert(`Error: ${error.message}`);
  }
}

// ============================================
// INDICATOR MANAGEMENT FUNCTIONS
// ============================================

async function loadIndicators() {
  const container = document.getElementById('indicators-container');
  const filter = document.getElementById('indicator-panel-filter');
  if (!container) return;

  try {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">⏳</div><p>Loading indicators...</p></div>';

    const panelFilter = filter ? filter.value : 'all';
    const indicators = await AdminService.getAllIndicators({ panelId: panelFilter });

    if (indicators.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📊</div><p>No indicators found. Add your first indicator to get started.</p></div>';
      return;
    }

    container.innerHTML = indicators.map(indicator => {
      const panel = indicator.panels;
      return `
        <div class="indicator-card" data-indicator-id="${indicator.id}">
          <div class="indicator-header">
            <div>
              <h3 style="margin-bottom: 0.5rem;">${indicator.title}</h3>
              ${panel ? `<p style="color: #6b7280; font-size: 0.875rem;">Panel: <strong>${panel.title}</strong> <span class="category-badge category-${panel.category}">${panel.category}</span></p>` : ''}
            </div>
            <div class="indicator-actions">
              <button class="btn-secondary" onclick="editIndicator('${indicator.id}')">Edit</button>
              <button class="btn-secondary" onclick="deleteIndicatorConfirm('${indicator.id}', '${indicator.title.replace(/'/g, "\\'")}')" style="color: #ef4444;">Delete</button>
            </div>
          </div>
          ${indicator.description ? `<p style="color: #6b7280; margin-bottom: 0.5rem;">${indicator.description}</p>` : ''}
          <div class="indicator-meta">
            ${indicator.unit ? `<div class="meta-item"><span class="meta-label">Unit</span><span class="meta-value">${indicator.unit}</span></div>` : ''}
            ${indicator.frameworks ? `<div class="meta-item"><span class="meta-label">Frameworks</span><span class="meta-value">${indicator.frameworks}</span></div>` : ''}
            ${indicator.formula_required ? `<div class="meta-item"><span class="meta-label">Formula Required</span><span class="meta-value">Yes</span></div>` : ''}
            <div class="meta-item">
              <span class="meta-label">Created</span>
              <span class="meta-value">${new Date(indicator.created_at).toLocaleDateString()}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">ID</span>
              <span class="meta-value" style="font-family: monospace; font-size: 0.875rem;">${indicator.id}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Error loading indicators:', error);
    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">❌</div><p>Error loading indicators: ${error.message}</p></div>`;
  }
}

async function loadPanelsForIndicatorForm() {
  const select = document.getElementById('indicator-panel');
  const filter = document.getElementById('indicator-panel-filter');
  
  if (!select) return;

  try {
    const panels = await AdminService.getAllPanels();
    
    // Clear and populate select
    select.innerHTML = '<option value="">Select panel</option>';
    panels.forEach(panel => {
      const option = document.createElement('option');
      option.value = panel.id;
      option.textContent = `${panel.icon || '📋'} ${panel.title} (${panel.category})`;
      select.appendChild(option);
    });

    // Also populate filter dropdown
    if (filter) {
      filter.innerHTML = '<option value="all">All Panels</option>';
      panels.forEach(panel => {
        const option = document.createElement('option');
        option.value = panel.id;
        option.textContent = `${panel.icon || '📋'} ${panel.title}`;
        filter.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Error loading panels for form:', error);
  }
}

function openIndicatorForm(indicatorId = null) {
  const modal = document.getElementById('indicator-form-modal');
  const form = document.getElementById('indicator-form');
  const title = document.getElementById('indicator-form-title');
  const formId = document.getElementById('indicator-form-id');

  if (!modal || !form || !title || !formId) {
    console.error('Indicator form elements not found');
    return;
  }

  // Load panels first
  loadPanelsForIndicatorForm().then(() => {
    if (indicatorId) {
      // Edit mode - load indicator data
      AdminService.getAllIndicators().then(indicators => {
        const indicator = indicators.find(i => i.id === indicatorId);
        if (indicator) {
          formId.value = indicator.id;
          document.getElementById('indicator-title').value = indicator.title;
          document.getElementById('indicator-panel').value = indicator.panel_id;
          document.getElementById('indicator-description').value = indicator.description || '';
          document.getElementById('indicator-unit').value = indicator.unit || '';
          document.getElementById('indicator-frameworks').value = indicator.frameworks || '';
          document.getElementById('indicator-formula-required').checked = indicator.formula_required || false;
          title.textContent = 'Edit Indicator';
        }
      });
    } else {
      // Add mode
      form.reset();
      formId.value = '';
      title.textContent = 'Add Indicator';
    }

    modal.classList.remove('hidden');
  });
}

function closeIndicatorForm() {
  const modal = document.getElementById('indicator-form-modal');
  modal.classList.add('hidden');
  document.getElementById('indicator-form').reset();
}

async function saveIndicator() {
  const form = document.getElementById('indicator-form');
  const formId = document.getElementById('indicator-form-id').value;
  const title = document.getElementById('indicator-title').value;
  const panelId = document.getElementById('indicator-panel').value;
  const description = document.getElementById('indicator-description').value;
  const unit = document.getElementById('indicator-unit').value;
  const frameworks = document.getElementById('indicator-frameworks').value;
  const formulaRequired = document.getElementById('indicator-formula-required').checked;

  if (!title || !panelId) {
    alert('Please fill in all required fields');
    return;
  }

  try {
    const indicatorData = {
      title,
      panelId,
      description,
      unit,
      frameworks,
      formulaRequired
    };

    if (formId) {
      // Update existing indicator
      await AdminService.updateIndicator(formId, indicatorData);
      alert('Indicator updated successfully!');
    } else {
      // Create new indicator
      await AdminService.createIndicator(indicatorData);
      alert('Indicator created successfully!');
    }

    closeIndicatorForm();
    await loadIndicators();
  } catch (error) {
    console.error('Error saving indicator:', error);
    alert(`Error: ${error.message}`);
  }
}

async function editIndicator(indicatorId) {
  openIndicatorForm(indicatorId);
}

async function deleteIndicatorConfirm(indicatorId, indicatorTitle) {
  if (!confirm(`Are you sure you want to delete "${indicatorTitle}"?\n\nThis action cannot be undone.`)) {
    return;
  }

  try {
    await AdminService.deleteIndicator(indicatorId);
    alert('Indicator deleted successfully!');
    await loadIndicators();
  } catch (error) {
    console.error('Error deleting indicator:', error);
    alert(`Error: ${error.message}`);
  }
}

// ============================================
// ADD INDICATORS TO PANEL FUNCTIONS
// ============================================

let currentPanelForIndicators = null;
let allIndicatorsForSelection = [];

async function openAddIndicatorsToPanel(panelId, panelTitle) {
  currentPanelForIndicators = panelId;
  const modal = document.getElementById('add-indicators-to-panel-modal');
  const title = document.getElementById('add-indicators-modal-title');
  const panelName = document.getElementById('add-indicators-panel-name');
  const indicatorsList = document.getElementById('indicators-selection-list');

  if (!modal || !title || !panelName || !indicatorsList) {
    console.error('Add indicators modal elements not found');
    return;
  }

  title.textContent = 'Add Indicators to Panel';
  panelName.textContent = `Panel: ${panelTitle}`;
  indicatorsList.innerHTML = '<div class="empty-state"><div class="empty-state-icon">⏳</div><p>Loading indicators...</p></div>';

  modal.classList.remove('hidden');

  // Load all indicators
  try {
    allIndicatorsForSelection = await AdminService.getAllIndicators({ panelId: 'all' });
    
    if (allIndicatorsForSelection.length === 0) {
      indicatorsList.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📊</div><p>No indicators found in the system.</p></div>';
      return;
    }

    // Render indicators with checkboxes
    indicatorsList.innerHTML = allIndicatorsForSelection.map(indicator => {
      const currentPanel = indicator.panels;
      const isInCurrentPanel = indicator.panel_id === panelId;
      
      return `
        <div style="padding: 0.75rem; border-bottom: 1px solid #e5e7eb; ${isInCurrentPanel ? 'background-color: #f0fdf4;' : ''}">
          <label style="display: flex; align-items: flex-start; gap: 0.75rem; cursor: pointer;">
            <input type="checkbox" 
                   class="indicator-checkbox" 
                   data-indicator-id="${indicator.id}" 
                   ${isInCurrentPanel ? 'checked disabled' : ''}
                   style="margin-top: 0.25rem; width: 1.25rem; height: 1.25rem; cursor: pointer; flex-shrink: 0;">
            <div style="flex: 1;">
              <div style="font-weight: 500; margin-bottom: 0.25rem;">${indicator.title}</div>
              ${indicator.description ? `<div style="color: #6b7280; font-size: 0.875rem; margin-bottom: 0.25rem;">${indicator.description}</div>` : ''}
              ${currentPanel ? `<div style="color: #6b7280; font-size: 0.75rem;">Current Panel: <strong>${currentPanel.title}</strong></div>` : ''}
              ${isInCurrentPanel ? `<div style="color: #059669; font-size: 0.75rem; margin-top: 0.25rem;">✓ Already in this panel</div>` : ''}
            </div>
          </label>
        </div>
      `;
    }).join('');

    // Attach event listeners
    attachIndicatorSelectionListeners();
  } catch (error) {
    console.error('Error loading indicators:', error);
    indicatorsList.innerHTML = `<div class="empty-state"><div class="empty-state-icon">❌</div><p>Error loading indicators: ${error.message}</p></div>`;
  }
}

function attachIndicatorSelectionListeners() {
  // Remove existing listeners by cloning elements
  const selectAllBtn = document.getElementById('select-all-indicators-btn');
  const deselectAllBtn = document.getElementById('deselect-all-indicators-btn');
  const submitBtn = document.getElementById('add-indicators-submit-btn');
  const cancelBtn = document.getElementById('cancel-add-indicators-btn');
  const closeBtn = document.getElementById('close-add-indicators-modal');

  // Select All
  if (selectAllBtn) {
    const newSelectAll = selectAllBtn.cloneNode(true);
    selectAllBtn.parentNode.replaceChild(newSelectAll, selectAllBtn);
    newSelectAll.addEventListener('click', () => {
      document.querySelectorAll('.indicator-checkbox:not([disabled])').forEach(checkbox => {
        checkbox.checked = true;
      });
    });
  }

  // Deselect All
  if (deselectAllBtn) {
    const newDeselectAll = deselectAllBtn.cloneNode(true);
    deselectAllBtn.parentNode.replaceChild(newDeselectAll, deselectAllBtn);
    newDeselectAll.addEventListener('click', () => {
      document.querySelectorAll('.indicator-checkbox:not([disabled])').forEach(checkbox => {
        checkbox.checked = false;
      });
    });
  }

  // Submit
  if (submitBtn) {
    const newSubmit = submitBtn.cloneNode(true);
    submitBtn.parentNode.replaceChild(newSubmit, submitBtn);
    newSubmit.addEventListener('click', async () => {
      await addSelectedIndicatorsToPanel();
    });
  }

  // Cancel
  if (cancelBtn) {
    const newCancel = cancelBtn.cloneNode(true);
    cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);
    newCancel.addEventListener('click', closeAddIndicatorsModal);
  }

  // Close button
  if (closeBtn) {
    const newClose = closeBtn.cloneNode(true);
    closeBtn.parentNode.replaceChild(newClose, closeBtn);
    newClose.addEventListener('click', closeAddIndicatorsModal);
  }
}

async function addSelectedIndicatorsToPanel() {
  if (!currentPanelForIndicators) return;

  const checkboxes = document.querySelectorAll('.indicator-checkbox:checked:not([disabled])');
  const selectedIndicatorIds = Array.from(checkboxes).map(cb => cb.dataset.indicatorId);

  if (selectedIndicatorIds.length === 0) {
    alert('Please select at least one indicator to add.');
    return;
  }

  const submitBtn = document.getElementById('add-indicators-submit-btn');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Adding...';
  }

  try {
    await AdminService.addIndicatorsToPanel(selectedIndicatorIds, currentPanelForIndicators);
    
    // Close the add indicators modal
    closeAddIndicatorsModal();
    
    // Show success modal
    showAddIndicatorsSuccessModal(`${selectedIndicatorIds.length} indicator(s) added successfully to the panel!`);
    
    // Refresh page after delay
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  } catch (error) {
    console.error('Error adding indicators to panel:', error);
    alert(`Error: ${error.message}`);
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Add Selected Indicators';
    }
  }
}

function closeAddIndicatorsModal() {
  const modal = document.getElementById('add-indicators-to-panel-modal');
  if (modal) {
    modal.classList.add('hidden');
  }
  currentPanelForIndicators = null;
  allIndicatorsForSelection = [];
}

function showAddIndicatorsSuccessModal(message) {
  const successModal = document.getElementById('add-indicators-success-modal');
  const successMessage = document.getElementById('add-indicators-success-message');
  
  if (successMessage) {
    successMessage.textContent = message;
  }
  
  if (successModal) {
    successModal.classList.remove('hidden');
  }
}

// Make functions available globally for onclick handlers
window.editPanel = editPanel;
window.deletePanelConfirm = deletePanelConfirm;
window.editIndicator = editIndicator;
window.deleteIndicatorConfirm = deleteIndicatorConfirm;
window.openAddIndicatorsToPanel = openAddIndicatorsToPanel;

