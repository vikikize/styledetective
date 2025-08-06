document.addEventListener('DOMContentLoaded', () => {
  const runtime = typeof browser !== 'undefined' ? browser.runtime : chrome.runtime;
  const devtools = typeof browser !== 'undefined' ? browser.devtools : chrome.devtools;

  const selectorButton = document.getElementById('selectorButton');
  const clearButton = document.getElementById('clearButton');
  const validateButton = document.getElementById('validateButton');
  const styleProfileDropdown = document.getElementById('styleProfileDropdown');
  const infoDisplay = document.getElementById('infoDisplay');

  let selectorModeEnabled = false;
  let expectedStylesProfiles = {};
  let selectedProfileName = null;
  let lastSelectedDetails = [];

  function toCamelCase(str) {
    return str.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
  }

  function normalizeColor(value) {
    if (!value) return value;
    const ctx = document.createElement('canvas').getContext('2d');
    ctx.fillStyle = value;
    return ctx.fillStyle;
  }

  function normalizeCssValue(val) {
    if (typeof val !== 'string') return val;
    val = val.trim().toLowerCase();

    if (val.startsWith('rgb') || val.startsWith('#') || val.startsWith('hsl') || val === 'transparent') {
      return normalizeColor(val);
    }

    const num = parseFloat(val);
    if (!isNaN(num)) return num;

    return val;
  }

  function validateElementStyles(elementStyles, expectedProfile) {
    const results = {};
    for (const [expectedKey, expectedValRaw] of Object.entries(expectedProfile)) {
      const key = toCamelCase(expectedKey);

      const actualValRaw = elementStyles[key];
      if (actualValRaw === undefined || actualValRaw === null) {
        results[expectedKey] = null; // unknown/missing
        continue;
      }

      const expectedVal = normalizeCssValue(expectedValRaw);
      const actualVal = normalizeCssValue(actualValRaw);

      results[expectedKey] = (expectedVal === actualVal);
    }
    return results;
  }

  function updateSelectorButton() {
    if (selectorModeEnabled) {
      selectorButton.textContent = 'Disable Selector Mode';
      selectorButton.classList.remove('bg-indigo');
      selectorButton.classList.add('bg-red');
      infoDisplay.style.display = 'none';
    } else {
      selectorButton.textContent = 'Enable Selector Mode';
      selectorButton.classList.remove('bg-red');
      selectorButton.classList.add('bg-indigo');
    }
  }

  function createSection(title, data, validationResults = {}, expectedStyles = {}) {
    const rows = Object.entries(data)
      .map(([key, value]) => {
        let rowClass = '';
        let expectedValue = expectedStyles[key];
        let displayValue = value;

        if (validationResults.hasOwnProperty(key)) {
          if (validationResults[key] === true) {
            rowClass = 'match';
          } else if (validationResults[key] === false) {
            rowClass = 'mismatch';
            displayValue = `<span class="actual-value">${value}</span> <span class="expected-value">(Expected: ${expectedValue})</span>`;
          } else {
            rowClass = 'not-asserted';
          }
        }

        return `
          <tr class="${rowClass}">
            <td class="property-name">${key}</td>
            <td class="property-value" title="${value}">${displayValue}</td>
          </tr>
        `;
      }).join('');

    return `
      <div class="card-section">
        <h4>${title}</h4>
        <table class="properties-table">
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderCards(details, validationResultsPerElement = []) {
    if (details.length === 0) {
      infoDisplay.style.display = 'none';
      infoDisplay.innerHTML = '';
      return;
    }

    const expectedProfile = expectedStylesProfiles[selectedProfileName];

    const cardsHTML = details.map((elem, idx) => {
      const s = elem.styles;
      const validationResults = validationResultsPerElement[idx] || {};

      return `
        <div class="element-card">
          <div class="card-header">
            <span class="badge-number">${idx + 1}</span>
            <span class="tag-name">&lt;${elem.tag}&gt;</span>
            ${elem.id ? `<span class="element-id">#${elem.id}</span>` : ''}
            ${elem.classes ? `<span class="element-classes">.${elem.classes.split(' ').join('.')}</span>` : ''}
          </div>

          ${createSection('Tag Info', {
            Tag: s.tagName,
            Id: s.id || '(none)',
            Classes: s.classList || '(none)'
          }, validationResults, expectedProfile)}

          ${createSection('Layout', {
            display: s.display,
            position: s.position,
            top: s.top,           // original CSS style value (string like '0px' or 'auto')
            right: s.right,
            bottom: s.bottom,
            left: s.left,
            width: s.width,
            height: s.height,
            'max-width': s.maxWidth,
            'max-height': s.maxHeight,
            'min-width': s.minWidth,
            'min-height': s.minHeight,
            'box-sizing': s.boxSizing
          }, validationResults, expectedProfile)}

          ${createSection('Absolute Position & Size', {
            'absolute-x': s.absoluteX ? s.absoluteX.toFixed(2) + 'px' : 'N/A',
            'absolute-y': s.absoluteY ? s.absoluteY.toFixed(2) + 'px' : 'N/A',
            'absolute-width': s.absoluteWidth ? s.absoluteWidth.toFixed(2) + 'px' : 'N/A',
            'absolute-height': s.absoluteHeight ? s.absoluteHeight.toFixed(2) + 'px' : 'N/A'
          })}

          ${createSection('Margin', {
            'margin-top': s.marginTop,
            'margin-right': s.marginRight,
            'margin-bottom': s.marginBottom,
            'margin-left': s.marginLeft
          }, validationResults, expectedProfile)}

          ${createSection('Padding', {
            'padding-top': s.paddingTop,
            'padding-right': s.paddingRight,
            'padding-bottom': s.paddingBottom,
            'padding-left': s.paddingLeft
          }, validationResults, expectedProfile)}

          ${createSection('Border', {
            'border-top': s.borderTop,
            'border-top-width': s.borderTopWidth,
            'border-top-style': s.borderTopStyle,
            'border-top-color': s.borderTopColor,
            'border-right': s.borderRight,
            'border-right-width': s.borderRightWidth,
            'border-right-style': s.borderRightStyle,
            'border-right-color': s.borderRightColor,
            'border-bottom': s.borderBottom,
            'border-bottom-width': s.borderBottomWidth,
            'border-bottom-style': s.borderBottomStyle,
            'border-bottom-color': s.borderBottomColor,
            'border-left': s.borderLeft,
            'border-left-width': s.borderLeftWidth,
            'border-left-style': s.borderLeftStyle,
            'border-left-color': s.borderLeftColor
          }, validationResults, expectedProfile)}

          ${createSection('Border Radius', {
            'border-top-left-radius': s.borderTopLeftRadius,
            'border-top-right-radius': s.borderTopRightRadius,
            'border-bottom-right-radius': s.borderBottomRightRadius,
            'border-bottom-left-radius': s.borderBottomLeftRadius
          }, validationResults, expectedProfile)}

          ${createSection('Typography', {
            'font-family': s.fontFamily,
            'font-size': s.fontSize,
            'font-weight': s.fontWeight,
            'font-style': s.fontStyle,
            'font-variant': s.fontVariant,
            'letter-spacing': s.letterSpacing,
            'line-height': s.lineHeight,
            'text-align': s.textAlign,
            'text-decoration': s.textDecoration,
            'text-indent': s.textIndent,
            'text-shadow': s.textShadow,
            'text-transform': s.textTransform,
            'white-space': s.whiteSpace,
            'word-spacing': s.wordSpacing,
            'word-break': s.wordBreak,
            'word-wrap': s.wordWrap
          }, validationResults, expectedProfile)}

          ${createSection('Color & Background', {
            color: s.color,
            background: s.background,
            'background-color': s.backgroundColor,
            'background-image': s.backgroundImage,
            'background-position': s.backgroundPosition,
            'background-repeat': s.backgroundRepeat,
            'background-size': s.backgroundSize,
            'background-attachment': s.backgroundAttachment,
            opacity: s.opacity
          }, validationResults, expectedProfile)}
        </div>
      `;
    }).join('');

    infoDisplay.innerHTML = cardsHTML;
    infoDisplay.style.display = 'block';
  }

  async function loadExpectedStyles() {
    try {
      const response = await fetch(chrome.runtime.getURL('expectedStyles.json'));
      expectedStylesProfiles = await response.json();

      if (styleProfileDropdown) {
        styleProfileDropdown.innerHTML = '';
        Object.keys(expectedStylesProfiles).forEach(profileName => {
          const option = document.createElement('option');
          option.value = profileName;
          option.textContent = profileName;
          styleProfileDropdown.appendChild(option);
        });
        selectedProfileName = styleProfileDropdown.value || Object.keys(expectedStylesProfiles)[0];
      }
    } catch (err) {
      console.error('Failed to load expectedStyles.json:', err);
    }
  }

  function validateSelection() {
    if (!lastSelectedDetails.length) {
      alert('No elements selected to validate');
      return;
    }
    if (!selectedProfileName || !expectedStylesProfiles[selectedProfileName]) {
      alert('Please select a valid style profile');
      return;
    }
    const expectedProfile = expectedStylesProfiles[selectedProfileName];

    const validationResultsPerElement = lastSelectedDetails.map(elem => {
      return validateElementStyles(elem.styles, expectedProfile);
    });

    renderCards(lastSelectedDetails, validationResultsPerElement);
  }

  selectorButton.addEventListener('click', () => {
    selectorModeEnabled = !selectorModeEnabled;
    updateSelectorButton();

    runtime.sendMessage({
      type: 'inject-selector-logic',
      enabled: selectorModeEnabled,
      apiName: typeof browser !== 'undefined' ? 'browser' : 'chrome',
      tabId: devtools.inspectedWindow.tabId
    }).catch(console.error);
  });

  clearButton.addEventListener('click', () => {
    runtime.sendMessage({
      type: 'clear-selection',
      tabId: devtools.inspectedWindow.tabId
    });
    lastSelectedDetails = [];
    infoDisplay.innerHTML = '';
    infoDisplay.style.display = 'none';
  });

  validateButton.addEventListener('click', () => {
    validateSelection();
  });

  runtime.onMessage.addListener((message) => {
    if (message.type === 'elementsSelected') {
      lastSelectedDetails = message.details;
      renderCards(lastSelectedDetails); // render WITHOUT validation until Validate button clicked
    }
  });

  if (styleProfileDropdown) {
    styleProfileDropdown.addEventListener('change', (e) => {
      selectedProfileName = e.target.value;
    });
  }

  updateSelectorButton();
  loadExpectedStyles();
});
