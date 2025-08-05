document.addEventListener('DOMContentLoaded', () => {
  const runtime = typeof browser !== 'undefined' ? browser.runtime : chrome.runtime;
  const devtools = typeof browser !== 'undefined' ? browser.devtools : chrome.devtools;

  const selectorButton = document.getElementById('selectorButton');
  const clearButton = document.getElementById('clearButton');
  const infoDisplay = document.getElementById('infoDisplay');

  let selectorModeEnabled = false;

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

  function createCardHeader(index, tag, id, classes) {
    return `
      <div class="card-header">
        <span class="badge-number">${index}</span>
        <span class="tag-name">&lt;${tag}&gt;</span>
        ${id ? `<span class="element-id">#${id}</span>` : ''}
        ${classes ? `<span class="element-classes">.${classes.split(' ').join('.')}</span>` : ''}
      </div>
    `;
  }

  // Updated createSection to use a table for key-value pairs
  function createSection(title, data) {
    const rows = Object.entries(data)
      .map(([key, value]) => `
        <tr>
          <td class="property-name">${key}</td>
          <td class="property-value" title="${value}">${value}</td>
        </tr>
      `).join('');
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

  function renderCards(details) {
    if (details.length === 0) {
      infoDisplay.style.display = 'none';
      infoDisplay.innerHTML = '';
      return;
    }

    const cardsHTML = details.map((elem, idx) => {
      const s = elem.styles;
      return `
        <div class="element-card">
          ${createCardHeader(idx + 1, elem.tag, elem.id, elem.classes)}

          ${createSection('Tag Info', {
            Tag: s.tagName,
            Id: s.id || '(none)',
            Classes: s.classList || '(none)'
          })}

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
          })}

          ${createSection('Margin', {
            'margin-top': s.marginTop,
            'margin-right': s.marginRight,
            'margin-bottom': s.marginBottom,
            'margin-left': s.marginLeft
          })}

          ${createSection('Padding', {
            'padding-top': s.paddingTop,
            'padding-right': s.paddingRight,
            'padding-bottom': s.paddingBottom,
            'padding-left': s.paddingLeft
          })}

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
          })}

          ${createSection('Border Radius', {
            'border-top-left-radius': s.borderTopLeftRadius,
            'border-top-right-radius': s.borderTopRightRadius,
            'border-bottom-right-radius': s.borderBottomRightRadius,
            'border-bottom-left-radius': s.borderBottomLeftRadius
          })}

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
          })}

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
          })}
        </div>
      `;
    }).join('');

    infoDisplay.innerHTML = cardsHTML;
    infoDisplay.style.display = 'block';
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
    infoDisplay.innerHTML = '';
    infoDisplay.style.display = 'none';
  });

  runtime.onMessage.addListener((message) => {
    if (message.type === 'elementsSelected') {
      renderCards(message.details);
    }
  });

  updateSelectorButton();
});
