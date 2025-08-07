/**
 * Updates the text and styling of the selector button based on its enabled state.
 * @param {boolean} selectorModeEnabled - True if selector mode is enabled, false otherwise.
 */
function updateSelectorButton(selectorModeEnabled) {
  const selectorButton = document.getElementById('selectorButton');
  const infoDisplay = document.getElementById('infoDisplay');
  const alignmentDisplay = document.getElementById('alignmentDisplay');
  const spacingDisplay = document.getElementById('spacingDisplay');

  if (selectorModeEnabled) {
    selectorButton.textContent = '❌';
    selectorButton.classList.remove('bg-indigo');
    selectorButton.classList.add('bg-red');
    infoDisplay.style.display = 'none';
    alignmentDisplay.style.display = 'none';
    spacingDisplay.style.display = 'none';
  } else {
    selectorButton.textContent = '🔍';
    selectorButton.classList.remove('bg-red');
    selectorButton.classList.add('bg-indigo');
  }
}

/**
 * Creates an HTML section for displaying a group of properties in a card.
 * @param {string} title - The title of the section.
 * @param {object} data - An object of key-value pairs representing the properties.
 * @param {object} validationResults - An object mapping property keys to validation results (true/false/null).
 * @param {object} expectedStyles - An object of expected styles for displaying mismatches.
 * @returns {string} The HTML string for the section.
 */
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

/**
 * Renders the element style cards in the infoDisplay.
 * @param {Array<object>} details - An array of selected element details.
 * @param {Array<object>} validationResultsPerElement - An array of validation results for each element.
 * @param {object} expectedStylesProfiles - The loaded expected styles profiles.
 * @param {string} selectedProfileName - The name of the currently selected style profile.
 */
function renderCards(details, validationResultsPerElement = [], expectedStylesProfiles, selectedProfileName) {
  const infoDisplay = document.getElementById('infoDisplay');
  const alignmentDisplay = document.getElementById('alignmentDisplay');
  const spacingDisplay = document.getElementById('spacingDisplay');

  if (!details.length) {
    infoDisplay.style.display = 'none';
    infoDisplay.innerHTML = '';
    return;
  }

  infoDisplay.style.display = 'grid';
  alignmentDisplay.style.display = 'none';
  spacingDisplay.style.display = 'none';

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

/**
 * Renders a summary table of absolute bounding values for all selected elements.
 * @param {Array<object>} details - An array of selected element details.
 * @returns {string} The HTML string for the summary table.
 */
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

/**
 * Renders the alignment validation results, including a summary table and individual alignment cards.
 * @param {Array<object>} details - An array of selected element details.
 * @param {object} alignmentResult - The result object from validateAlignment.
 * @param {Array<object>} lastSelectedDetails - The array of last selected element details (used for base element info).
 */
function renderAlignmentCardsWithSummary(details, alignmentResult, lastSelectedDetails) {
  const infoDisplay = document.getElementById('infoDisplay');
  const alignmentDisplay = document.getElementById('alignmentDisplay');
  const spacingDisplay = document.getElementById('spacingDisplay');

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
  spacingDisplay.style.display = 'none';
  alignmentDisplay.style.display = 'block';
}

/**
 * Helper to render nested spacing details table inside main spacing cell.
 * @param {object} spacing - An object containing spacing details (e.g., horizontalSpacing, verticalSpacing, leftToLeft).
 * @returns {string} The HTML string for the nested table.
 */
function renderSpacingDetailsTable(spacing) {
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

/**
 * Formats an element's label for display, including its index, tag, ID, and classes.
 * @param {number} index - The 1-based index of the element.
 * @param {object} el - The element details object.
 * @returns {string} The formatted element label string.
 */
function formatElementLabel(index, el) {
  const tag = el.tag?.toLowerCase() || 'unknown';
  const idPart = el.id ? ` #${el.id}` : '';
  const classPart = el.classes ? ` .${el.classes.trim().split(/\s+/).join('.')}` : '';
  return `Element #${index} - &lt;${tag}&gt;${idPart}${classPart}`;
}

/**
 * Renders a table summarizing the spacing between element pairs.
 * @param {Array<object>} details - An array of selected element details.
 * @param {function} calculatePairSpacing - The function to calculate spacing between a pair (from validation.js).
 * @returns {string} The HTML string for the spacing summary table.
 */
function renderPairSpacingTable(details, calculatePairSpacing) {
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
