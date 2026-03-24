// Popup script for CV Adapter extension

// State management
let cvData = null;
let detectedFields = [];

// DOM elements
const elements = {
  statusIndicator: document.getElementById('statusIndicator'),
  loadingState: document.getElementById('loadingState'),
  notConnectedState: document.getElementById('notConnectedState'),
  noCVState: document.getElementById('noCVState'),
  readyState: document.getElementById('readyState'),
  errorState: document.getElementById('errorState'),
  cvName: document.getElementById('cvName'),
  cvTitle: document.getElementById('cvTitle'),
  fieldCount: document.getElementById('fieldCount'),
  autofillBtn: document.getElementById('autofillBtn'),
  resultMessage: document.getElementById('resultMessage'),
  errorMessage: document.getElementById('errorMessage'),
  openPlatformBtn: document.getElementById('openPlatformBtn'),
  createCVBtn: document.getElementById('createCVBtn'),
  retryBtn: document.getElementById('retryBtn'),
};

// Show a specific state, hide others
function showState(stateName) {
  const states = ['loadingState', 'notConnectedState', 'noCVState', 'readyState', 'errorState'];
  states.forEach(state => {
    elements[state].style.display = state === stateName ? 'flex' : 'none';
  });
}

// Update status indicator
function setStatus(status) {
  elements.statusIndicator.className = 'status-indicator';
  if (status === 'connected') {
    elements.statusIndicator.classList.add('connected');
  } else if (status === 'error') {
    elements.statusIndicator.classList.add('error');
  }
}

// Show result message
function showResult(message, isError = false) {
  elements.resultMessage.textContent = message;
  elements.resultMessage.className = 'result-message ' + (isError ? 'error' : 'success');
  elements.resultMessage.style.display = 'block';

  setTimeout(() => {
    elements.resultMessage.style.display = 'none';
  }, 5000);
}

// Fetch CV data from API
async function fetchCV() {
  try {
    const response = await fetch(`${CONFIG.API_BASE}/cv`, {
      credentials: 'include',
    });

    if (response.status === 401) {
      return { error: 'not_authenticated' };
    }

    if (!response.ok) {
      throw new Error('Failed to fetch CV');
    }

    const data = await response.json();
    return { cv: data };
  } catch (err) {
    console.error('Fetch CV error:', err);
    return { error: 'fetch_error', message: err.message };
  }
}

// Get detected fields from content script
async function getDetectedFields() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const response = await chrome.tabs.sendMessage(tab.id, { action: 'detectFields' });
    return response?.fields || [];
  } catch (err) {
    console.error('Field detection error:', err);
    return [];
  }
}

// Trigger autofill
async function triggerAutofill() {
  if (!cvData || detectedFields.length === 0) {
    showResult('Aucun champ a remplir', true);
    return;
  }

  elements.autofillBtn.disabled = true;
  elements.autofillBtn.textContent = 'Remplissage en cours...';

  try {
    // Get current tab info
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Call autofill API
    const response = await fetch(`${CONFIG.API_BASE}/autofill-form`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        cvData: cvData.cvData,
        fields: detectedFields,
        pageUrl: tab.url,
        pageTitle: tab.title,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Autofill failed');
    }

    const result = await response.json();

    // Send fill command to content script
    await chrome.tabs.sendMessage(tab.id, {
      action: 'fillFields',
      fields: result.fields,
    });

    showResult(`${Object.keys(result.fields).length} champs remplis`);
  } catch (err) {
    console.error('Autofill error:', err);
    showResult(err.message || 'Erreur lors du remplissage', true);
  } finally {
    elements.autofillBtn.disabled = false;
    elements.autofillBtn.textContent = 'Remplir le formulaire';
  }
}

// Initialize popup
async function init() {
  showState('loadingState');

  // Fetch CV
  const cvResult = await fetchCV();

  if (cvResult.error === 'not_authenticated') {
    setStatus('error');
    showState('notConnectedState');
    return;
  }

  if (cvResult.error) {
    setStatus('error');
    elements.errorMessage.textContent = cvResult.message || 'Erreur de connexion';
    showState('errorState');
    return;
  }

  cvData = cvResult.cv;

  // Check if CV has data
  if (!cvData.cvData || !cvData.cvData.name) {
    setStatus('connected');
    showState('noCVState');
    return;
  }

  // Update CV info
  elements.cvName.textContent = cvData.cvData.name || 'Sans nom';
  elements.cvTitle.textContent = cvData.cvData.title || 'Aucun titre';

  // Detect fields on page
  detectedFields = await getDetectedFields();
  elements.fieldCount.textContent = detectedFields.length;
  elements.autofillBtn.disabled = detectedFields.length === 0;

  setStatus('connected');
  showState('readyState');
}

// Event listeners
elements.autofillBtn.addEventListener('click', triggerAutofill);

elements.openPlatformBtn.addEventListener('click', (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: CONFIG.BASE_URL });
});

elements.createCVBtn.addEventListener('click', (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: `${CONFIG.BASE_URL}/cv-adapter/` });
});

elements.retryBtn.addEventListener('click', init);

// Initialize on load
document.addEventListener('DOMContentLoaded', init);
