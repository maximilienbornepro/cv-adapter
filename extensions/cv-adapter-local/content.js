// Content script for CV Adapter extension

/**
 * Detect all fillable form fields on the page
 */
function detectFormFields() {
  const fields = [];
  const selectors = [
    'input[type="text"]:not([readonly]):not([disabled])',
    'input[type="email"]:not([readonly]):not([disabled])',
    'input[type="tel"]:not([readonly]):not([disabled])',
    'input[type="url"]:not([readonly]):not([disabled])',
    'input:not([type]):not([readonly]):not([disabled])',
    'textarea:not([readonly]):not([disabled])',
    'select:not([disabled])',
    '[contenteditable="true"]',
    '.ProseMirror',
    '.tiptap',
  ];

  const elements = document.querySelectorAll(selectors.join(','));

  elements.forEach((el, index) => {
    // Skip hidden elements
    if (!el.offsetParent && el.offsetWidth === 0 && el.offsetHeight === 0) {
      return;
    }

    // Generate unique selector
    const selector = generateSelector(el, index);

    // Detect field type
    const type = detectFieldType(el);

    // Get field info
    const field = {
      selector,
      type,
      label: getFieldLabel(el),
      placeholder: el.placeholder || null,
      name: el.name || null,
      id: el.id || null,
      options: type === 'select' ? getSelectOptions(el) : null,
      context: getFieldContext(el),
    };

    fields.push(field);
  });

  return fields;
}

/**
 * Generate unique CSS selector for element
 */
function generateSelector(el, index) {
  // Prefer ID
  if (el.id) {
    return `#${CSS.escape(el.id)}`;
  }

  // Use name attribute
  if (el.name) {
    const nameSelector = `[name="${CSS.escape(el.name)}"]`;
    if (document.querySelectorAll(nameSelector).length === 1) {
      return nameSelector;
    }
  }

  // Use data attributes
  if (el.dataset && Object.keys(el.dataset).length > 0) {
    for (const [key, value] of Object.entries(el.dataset)) {
      const dataSelector = `[data-${key}="${CSS.escape(value)}"]`;
      if (document.querySelectorAll(dataSelector).length === 1) {
        return dataSelector;
      }
    }
  }

  // Fallback to position-based selector
  const tag = el.tagName.toLowerCase();
  const parent = el.parentElement;

  if (parent) {
    const siblings = Array.from(parent.children).filter(c => c.tagName === el.tagName);
    if (siblings.length > 1) {
      const idx = siblings.indexOf(el) + 1;
      const parentSelector = generateParentSelector(parent);
      return `${parentSelector} > ${tag}:nth-of-type(${idx})`;
    }
  }

  // Use nth-of-type from body
  const allSame = document.querySelectorAll(tag);
  const idx = Array.from(allSame).indexOf(el) + 1;
  return `${tag}:nth-of-type(${idx})`;
}

/**
 * Generate simple parent selector
 */
function generateParentSelector(el) {
  if (el.id) {
    return `#${CSS.escape(el.id)}`;
  }

  if (el.className && typeof el.className === 'string') {
    const classes = el.className.trim().split(/\s+/).slice(0, 2);
    if (classes.length > 0) {
      return classes.map(c => `.${CSS.escape(c)}`).join('');
    }
  }

  return el.tagName.toLowerCase();
}

/**
 * Detect field type
 */
function detectFieldType(el) {
  const tag = el.tagName.toLowerCase();

  if (tag === 'textarea') return 'textarea';
  if (tag === 'select') return 'select';

  if (el.isContentEditable || el.contentEditable === 'true') return 'contenteditable';
  if (el.classList.contains('ProseMirror')) return 'contenteditable';
  if (el.classList.contains('tiptap')) return 'contenteditable';

  if (tag === 'input') {
    const type = (el.type || 'text').toLowerCase();
    if (['email', 'tel', 'url'].includes(type)) return type;
    return 'text';
  }

  return 'text';
}

/**
 * Get field label
 */
function getFieldLabel(el) {
  // Check for label element
  if (el.id) {
    const label = document.querySelector(`label[for="${el.id}"]`);
    if (label) return label.textContent.trim();
  }

  // Check parent label
  const parentLabel = el.closest('label');
  if (parentLabel) {
    return parentLabel.textContent.replace(el.value || '', '').trim();
  }

  // Check aria-label
  if (el.getAttribute('aria-label')) {
    return el.getAttribute('aria-label');
  }

  // Check preceding label
  const prev = el.previousElementSibling;
  if (prev && prev.tagName === 'LABEL') {
    return prev.textContent.trim();
  }

  // Check for legend in fieldset
  const fieldset = el.closest('fieldset');
  if (fieldset) {
    const legend = fieldset.querySelector('legend');
    if (legend) return legend.textContent.trim();
  }

  return null;
}

/**
 * Get select options
 */
function getSelectOptions(select) {
  return Array.from(select.options).map(opt => opt.textContent.trim());
}

/**
 * Get surrounding context
 */
function getFieldContext(el) {
  // Get text from nearby elements
  const parent = el.closest('div, section, form, fieldset');
  if (!parent) return null;

  const text = parent.textContent || '';
  // Limit context length
  return text.substring(0, 200).trim() || null;
}

/**
 * Fill a single field
 */
function fillField(selector, value) {
  const el = document.querySelector(selector);
  if (!el) {
    console.warn(`[CV Adapter] Element not found: ${selector}`);
    return false;
  }

  const type = detectFieldType(el);

  try {
    switch (type) {
      case 'text':
      case 'email':
      case 'tel':
      case 'url':
        fillInputField(el, value);
        break;

      case 'textarea':
        fillTextareaField(el, value);
        break;

      case 'select':
        fillSelectField(el, value);
        break;

      case 'contenteditable':
        fillContentEditableField(el, value);
        break;

      default:
        el.value = value;
    }

    return true;
  } catch (err) {
    console.error(`[CV Adapter] Error filling ${selector}:`, err);
    return false;
  }
}

/**
 * Fill input field with events
 */
function fillInputField(el, value) {
  el.focus();
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  el.blur();
}

/**
 * Fill textarea field with events
 */
function fillTextareaField(el, value) {
  el.focus();
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  el.blur();
}

/**
 * Fill select field
 */
function fillSelectField(select, value) {
  const valueLower = value.toLowerCase();

  // Find best matching option
  let bestMatch = null;
  let bestScore = 0;

  Array.from(select.options).forEach(opt => {
    const optText = opt.textContent.toLowerCase();
    const optValue = opt.value.toLowerCase();

    if (optText === valueLower || optValue === valueLower) {
      bestMatch = opt;
      bestScore = 100;
    } else if (optText.includes(valueLower) || optValue.includes(valueLower)) {
      const score = valueLower.length / optText.length * 50;
      if (score > bestScore) {
        bestMatch = opt;
        bestScore = score;
      }
    }
  });

  if (bestMatch) {
    select.value = bestMatch.value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

/**
 * Fill contenteditable field
 */
function fillContentEditableField(el, value) {
  el.focus();
  el.innerHTML = value.replace(/\n/g, '<br>');
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.blur();
}

/**
 * Fill all fields
 */
function fillAllFields(fieldsMap) {
  let filled = 0;
  let failed = 0;

  for (const [selector, value] of Object.entries(fieldsMap)) {
    const success = fillField(selector, value);
    if (success) {
      filled++;
    } else {
      failed++;
    }
  }

  return { filled, failed };
}

// Message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case 'detectFields':
      const fields = detectFormFields();
      sendResponse({ fields });
      break;

    case 'fillFields':
      const result = fillAllFields(message.fields || {});
      sendResponse(result);
      break;

    case 'ping':
      sendResponse({ ok: true });
      break;

    default:
      sendResponse({ error: 'Unknown action' });
  }

  return true; // Keep channel open for async response
});

// Log when content script is loaded
console.log('[CV Adapter] Content script loaded');
