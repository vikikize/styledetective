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
      const details = message.details;
      if (details.length === 0) {
        infoDisplay.style.display = 'none';
        return;
      }

      infoDisplay.innerHTML = `
        <p><strong>Selected elements:</strong> ${details.length}</p>
        <ul>
          ${details.map(d => `<li>&lt;${d.tag}&gt; id="${d.id || ''}" class="${d.classes || ''}"</li>`).join('')}
        </ul>
      `;
      infoDisplay.style.display = 'block';
    }
  });
});
