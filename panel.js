document.addEventListener('DOMContentLoaded', () => {
  const runtime = typeof browser !== 'undefined' ? browser.runtime : chrome.runtime;
  const devtools = typeof browser !== 'undefined' ? browser.devtools : chrome.devtools;

  const selectorButton = document.getElementById('selectorButton');
  const clearButton = document.getElementById('clearButton');
  const validateButton = document.getElementById('validateButton');
  const validateAlignmentButton = document.getElementById('validateAlignmentButton');
  const styleProfileDropdown = document.getElementById('styleProfileDropdown');
  const infoDisplay = document.getElementById('infoDisplay');
  const alignmentDisplay = document.getElementById('alignmentDisplay');

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
        results[expectedKey] = null;
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
      alignmentDisplay.style.display = 'none';
    } else {
      selectorButton.textContent = 'Enable Selector Mode';
      selectorButton.classList.remove('bg-red');
      selectorButton.classList.add('bg-indigo');
    }
  }

  function createSection(title, data, validationResults = {}, expectedStyles = {}) {
    const rows = Object.entries(data).map(([key, value]) => {
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
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  }

  function renderCards(details, validationResultsPerElement = []) {
    if (!details.length) {
      infoDisplay.style.display = 'none';
      infoDisplay.innerHTML = '';
      return;
    }

    infoDisplay.style.display = 'grid';
    alignmentDisplay.style.display = 'none';

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
            top: s.top,
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
  }

  function pixelDiff(a, b) {
    return Math.abs(a - b) <= 0.5 ? 0 : parseFloat((a - b).toFixed(2));
  }

  function validateAlignment(details) {
    const result = {
      top: [],
      bottom: [],
      left: [],
      right: [],
      verticalCenter: [],
      horizontalCenter: [],
    };
    if (details.length < 2) return result;

    const rects = details.map(el => {
      const s = el.styles;
      return {
        tag: el.tag,
        id: el.id,
        classes: el.classes,
        top: s.absoluteY,
        left: s.absoluteX,
        width: s.absoluteWidth,
        height: s.absoluteHeight,
        bottom: s.absoluteY + s.absoluteHeight,
        right: s.absoluteX + s.absoluteWidth,
        verticalCenter: s.absoluteX + s.absoluteWidth / 2,
        horizontalCenter: s.absoluteY + s.absoluteHeight / 2,
      };
    });

    const base = rects[0];

    for (let i = 1; i < rects.length; i++) {
      const el = rects[i];
      result.top.push({ ...el, diff: pixelDiff(el.top, base.top) });
      result.bottom.push({ ...el, diff: pixelDiff(el.bottom, base.bottom) });
      result.left.push({ ...el, diff: pixelDiff(el.left, base.left) });
      result.right.push({ ...el, diff: pixelDiff(el.right, base.right) });
      result.verticalCenter.push({ ...el, diff: pixelDiff(el.verticalCenter, base.verticalCenter) });
      result.horizontalCenter.push({ ...el, diff: pixelDiff(el.horizontalCenter, base.horizontalCenter) });
    }

    return result;
  }

  function renderAlignmentSummaryTable(details) {
    if (details.length === 0) {
      return '';
    }

    const rows = details.map((el, idx) => {
      const s = el.styles;
      const tag = el.tag.toLowerCase();
      const idText = el.id ? `#${el.id}` : '';
      const number = idx + 1;

      return `
        <tr>
          <td>Element #${number}</td>
          <td>&lt;${tag}&gt; ${idText}</td>
          <td>${s.absoluteX}px</td>
          <td>${s.absoluteY}px</td>
          <td>${s.absoluteWidth}px</td>
          <td>${s.absoluteHeight}px</td>
          <td>${s.absoluteX + s.absoluteWidth}px</td>
          <td>${s.absoluteY + s.absoluteHeight}px</td>
          <td>${(s.absoluteX + s.absoluteWidth / 2).toFixed(2)}px</td>
          <td>${(s.absoluteY + s.absoluteHeight / 2).toFixed(2)}px</td>
        </tr>
      `;
    }).join('');

    return `
      <div class="element-card">
        <div class="card-header">Absolute Bounding Values Summary</div>
        <div class="card-section" style="overflow-x:auto;">
          <table class="properties-table" style="min-width: 700px;">
            <thead>
              <tr>
                <th>Element</th>
                <th>Tag & ID</th>
                <th>Left (X)</th>
                <th>Top (Y)</th>
                <th>Width</th>
                <th>Height</th>
                <th>Right</th>
                <th>Bottom</th>
                <th>Center X</th>
                <th>Center Y</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderAlignmentCardsWithSummary(details) {
    const alignmentResult = validateAlignment(details);
    alignmentDisplay.innerHTML = '';

    // Render summary table first (full width)
    const summaryTable = renderAlignmentSummaryTable(details);
    alignmentDisplay.innerHTML += summaryTable;

    // Create a container div for cards with grid layout
    const cardsContainer = document.createElement('div');
    cardsContainer.className = 'alignment-cards-container';

    Object.entries(alignmentResult).forEach(([key, items]) => {
      const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());

      const tableRows = items.map((el, idx) => {
        const elementNumber = idx + 2; // first element is base #1
        const tag = el.tag.toLowerCase();
        const idText = el.id ? ` #${el.id}` : '';
        const leftCell = `Element #${elementNumber} - &lt;${tag}&gt;${idText}`;
        let rightCell = '';

        if (el.diff === 0) {
          rightCell = `<span class="aligned">✓ Aligned</span>`;
        } else {
          rightCell = `<span class="not-aligned">${el.diff > 0 ? '+' : ''}${el.diff}px off</span>`;
        }

        return `
          <tr>
            <td class="property-name-cell">${leftCell}</td>
            <td class="property-value-cell">${rightCell}</td>
          </tr>
        `;
      }).join('');

      const baseElement = lastSelectedDetails[0];
      const baseTag = baseElement?.tag.toLowerCase() || 'unknown';
      const baseId = baseElement?.id ? ` #${baseElement.id}` : '';
      const baseLeftCell = `Element #1 - &lt;${baseTag}&gt;${baseId} (reference)`;
      const baseRightCell = 'reference';

      const tableHeader = `
        <tr>
          <td class="property-name-cell"><strong>${baseLeftCell}</strong></td>
          <td class="property-value-cell"><strong>${baseRightCell}</strong></td>
        </tr>
      `;

      const cardHTML = `
        <div class="element-card">
          <div class="card-header">${label} Alignment</div>
          <div class="card-section">
            <table class="properties-table">
              <tbody>
                ${tableHeader}
                ${tableRows}
              </tbody>
            </table>
          </div>
        </div>
      `;

      // Append card to container
      cardsContainer.innerHTML += cardHTML;
    });

    alignmentDisplay.appendChild(cardsContainer);

    infoDisplay.style.display = 'none';
    alignmentDisplay.style.display = 'block';
  }


  function loadExpectedStyles() {
    return fetch(chrome.runtime.getURL('expectedStyles.json'))
      .then(res => res.json())
      .then(data => {
        expectedStylesProfiles = data;
        styleProfileDropdown.innerHTML = '';
        Object.keys(expectedStylesProfiles).forEach(profileName => {
          const option = document.createElement('option');
          option.value = profileName;
          option.textContent = profileName;
          styleProfileDropdown.appendChild(option);
        });
        selectedProfileName = styleProfileDropdown.value || Object.keys(expectedStylesProfiles)[0];
      });
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
  alignmentDisplay.innerHTML = '';
  spacingDisplay.innerHTML = '';
  infoDisplay.style.display = 'none';
  alignmentDisplay.style.display = 'none';
  spacingDisplay.style.display = 'none';
});


  validateButton.addEventListener('click', () => {
    if (!lastSelectedDetails.length) {
      alert('No elements selected to validate');
      return;
    }
    if (!selectedProfileName || !expectedStylesProfiles[selectedProfileName]) {
      alert('Please select a valid style profile');
      return;
    }

    alignmentDisplay.style.display = 'none';
    infoDisplay.style.display = 'grid';

    const expectedProfile = expectedStylesProfiles[selectedProfileName];
    const results = lastSelectedDetails.map(el => validateElementStyles(el.styles, expectedProfile));
    renderCards(lastSelectedDetails, results);
  });

  validateAlignmentButton.addEventListener('click', () => {
    if (lastSelectedDetails.length < 2) {
      alert('Please select at least 2 elements to validate alignment');
      return;
    }

    renderAlignmentCardsWithSummary(lastSelectedDetails);
  });

  styleProfileDropdown.addEventListener('change', e => {
    selectedProfileName = e.target.value;
  });

  runtime.onMessage.addListener(message => {
    if (message.type === 'elementsSelected') {
      lastSelectedDetails = message.details;
      infoDisplay.style.display = 'grid';
      alignmentDisplay.style.display = 'none';
      renderCards(lastSelectedDetails);
    }
  });

  // Add references to the new button and spacing container in your HTML
const calculateSpacingButton = document.getElementById('calculateSpacingButton');
const spacingDisplay = document.getElementById('spacingDisplay');

// Spacing calculation helper functions (copy from previous message, or define here)
function getRect(el) {
  const s = el.styles;
  return {
    left: s.absoluteX,
    right: s.absoluteX + s.absoluteWidth,
    top: s.absoluteY,
    bottom: s.absoluteY + s.absoluteHeight,
    width: s.absoluteWidth,
    height: s.absoluteHeight,
    tag: el.tag,
    id: el.id,
  };
}

function isFullOverlap(rect1, rect2) {
  const horizontal = (rect1.left <= rect2.left && rect1.right >= rect2.right) ||
                     (rect2.left <= rect1.left && rect2.right >= rect1.right);
  const vertical = (rect1.top <= rect2.top && rect1.bottom >= rect2.bottom) ||
                   (rect2.top <= rect1.top && rect2.bottom >= rect1.bottom);
  return horizontal && vertical;
}

function isHorizontalOverlap(rect1, rect2) {
  return !(rect1.right <= rect2.left || rect2.right <= rect1.left);
}

function isVerticalOverlap(rect1, rect2) {
  return !(rect1.bottom <= rect2.top || rect2.bottom <= rect1.top);
}

function calculateFullOverlapDistances(rect1, rect2) {
  return {
    leftToLeft: Math.abs(rect1.left - rect2.left),
    rightToRight: Math.abs(rect1.right - rect2.right),
    topToTop: Math.abs(rect1.top - rect2.top),
    bottomToBottom: Math.abs(rect1.bottom - rect2.bottom),
  };
}

function calculateHorizontalSpacing(rect1, rect2) {
  if (rect1.right <= rect2.left) {
    return rect2.left - rect1.right;
  } else if (rect2.right <= rect1.left) {
    return rect1.left - rect2.right;
  }
  return 0;
}

function calculateVerticalSpacing(rect1, rect2) {
  if (rect1.bottom <= rect2.top) {
    return rect2.top - rect1.bottom;
  } else if (rect2.bottom <= rect1.top) {
    return rect1.top - rect2.bottom;
  }
  return 0;
}

function calculatePairSpacing(el1, el2) {
  const rect1 = getRect(el1);
  const rect2 = getRect(el2);

  if (isFullOverlap(rect1, rect2)) {
    return {
      relation: 'Full Overlap',
      ...calculateFullOverlapDistances(rect1, rect2),
      horizontalSpacing: 0,
      verticalSpacing: 0,
      note: 'One element fully contains the other',
    };
  }

  const horizontalOverlap = isHorizontalOverlap(rect1, rect2);
  const verticalOverlap = isVerticalOverlap(rect1, rect2);

  if (!horizontalOverlap && !verticalOverlap) {
    return {
      relation: 'No Overlap',
      horizontalSpacing: calculateHorizontalSpacing(rect1, rect2),
      verticalSpacing: calculateVerticalSpacing(rect1, rect2),
      note: 'Elements separated horizontally and vertically',
    };
  }

  if (horizontalOverlap && !verticalOverlap) {
    return {
      relation: 'Partial Vertical Overlap',
      horizontalSpacing: 0,
      verticalSpacing: calculateVerticalSpacing(rect1, rect2),
      note: 'Elements overlap horizontally but separated vertically',
    };
  }

  if (!horizontalOverlap && verticalOverlap) {
    return {
      relation: 'Partial Horizontal Overlap',
      horizontalSpacing: calculateHorizontalSpacing(rect1, rect2),
      verticalSpacing: 0,
      note: 'Elements overlap vertically but separated horizontally',
    };
  }

  return {
    relation: 'Partial Horizontal + Vertical Overlap',
    horizontalSpacing: 0,
    verticalSpacing: 0,
    note: 'Elements overlap both horizontally and vertically partially',
  };
}

// Helper to render nested spacing details table inside main spacing cell
function renderSpacingDetailsTable(spacing) {
  // spacing is an object that can have keys like:
  // horizontalSpacing, verticalSpacing, leftToLeft, rightToRight, topToTop, bottomToBottom
  const rows = [];

  if ('leftToLeft' in spacing) {
    rows.push(`<tr><td class="spacing-label">Left to Left</td><td class="spacing-value">${spacing.leftToLeft}px</td></tr>`);
  }
  if ('rightToRight' in spacing) {
    rows.push(`<tr><td class="spacing-label">Right to Right</td><td class="spacing-value">${spacing.rightToRight}px</td></tr>`);
  }
  if ('topToTop' in spacing) {
    rows.push(`<tr><td class="spacing-label">Top to Top</td><td class="spacing-value">${spacing.topToTop}px</td></tr>`);
  }
  if ('bottomToBottom' in spacing) {
    rows.push(`<tr><td class="spacing-label">Bottom to Bottom</td><td class="spacing-value">${spacing.bottomToBottom}px</td></tr>`);
  }
  if ('horizontalSpacing' in spacing) {
    rows.push(`<tr><td class="spacing-label">Horizontal Spacing</td><td class="spacing-value">${spacing.horizontalSpacing}px</td></tr>`);
  }
  if ('verticalSpacing' in spacing) {
    rows.push(`<tr><td class="spacing-label">Vertical Spacing</td><td class="spacing-value">${spacing.verticalSpacing}px</td></tr>`);
  }

  return `
    <table class="nested-spacing-table">
      <tbody>
        ${rows.join('')}
      </tbody>
    </table>
  `;
}

function formatElementLabel(index, el) {
  const tag = el.tag?.toLowerCase() || 'unknown';
  const idPart = el.id ? ` #${el.id}` : '';
  const classPart = el.classes ? ` .${el.classes.trim().split(/\s+/).join('.')}` : '';
  return `Element #${index} - &lt;${tag}&gt;${idPart}${classPart}`;
}


function renderPairSpacingTable(details) {
  if (details.length < 2) {
    return '<p>Select at least 2 elements to calculate spacing.</p>';
  }

  const rows = [];
  const pairCount = Math.floor(details.length / 2);

  for (let i = 0; i < pairCount; i++) {
    const el1 = details[i * 2];
    const el2 = details[i * 2 + 1];

    const spacing = calculatePairSpacing(el1, el2);

    const el1Text = formatElementLabel(i * 2 + 1, el1);
    const el2Text = formatElementLabel(i * 2 + 2, el2);

    let spacingDetailsHTML = '';

    if (spacing.relation === 'Full Overlap') {
      spacingDetailsHTML = renderSpacingDetailsTable({
        leftToLeft: spacing.leftToLeft,
        rightToRight: spacing.rightToRight,
        topToTop: spacing.topToTop,
        bottomToBottom: spacing.bottomToBottom,
      });
    } else {
      spacingDetailsHTML = renderSpacingDetailsTable({
        horizontalSpacing: spacing.horizontalSpacing,
        verticalSpacing: spacing.verticalSpacing,
      });
    }

    rows.push(`
      <tr>
        <td>${i + 1}</td>
        <td>${el1Text}</td>
        <td>${el2Text}</td>
        <td>${spacing.relation}</td>
        <td>${spacingDetailsHTML}</td>
        <td>${spacing.note || ''}</td>
      </tr>
    `);
  }

  const oddNote = details.length % 2 === 1
    ? `<p><em>Note: Element #${details.length} skipped due to odd number of elements.</em></p>`
    : '';

  return `
  <div class="element-card">
    <div class="card-header">Spacing Between Element Pairs</div>
    <div class="card-section" style="overflow-x: auto;">
      ${oddNote}
      <table class="spacing-summary-table properties-table" style="min-width: 700px;">
        <thead>
          <tr>
            <th>Pair #</th>
            <th>Element 1</th>
            <th>Element 2</th>
            <th>Relation</th>
            <th>Spacing Details</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          ${rows.join('')}
        </tbody>
      </table>
    </div>
  </div>
`;
}


// Add click handler to new button
calculateSpacingButton.addEventListener('click', () => {
  if (lastSelectedDetails.length < 2) {
    alert('Please select at least 2 elements to calculate spacing.');
    return;
  }

  const spacingHTML = renderPairSpacingTable(lastSelectedDetails);
  spacingDisplay.innerHTML = spacingHTML;

  // Show spacing display, hide others
  spacingDisplay.style.display = 'block';
  infoDisplay.style.display = 'none';
  alignmentDisplay.style.display = 'none';
});


  updateSelectorButton();
  loadExpectedStyles();
});
