document.addEventListener('DOMContentLoaded', () => {
  // Determine the browser runtime API (Chrome or Firefox)
  const runtime = typeof browser !== 'undefined' ? browser.runtime : chrome.runtime;
  const devtools = typeof browser !== 'undefined' ? browser.devtools : chrome.devtools;

  // Get references to DOM elements
  const selectorButton = document.getElementById('selectorButton');
  const clearButton = document.getElementById('clearButton');
  const validateButton = document.getElementById('validateButton');
  const validateAlignmentButton = document.getElementById('validateAlignmentButton');
  // const styleProfileInput = document.getElementById('styleProfileInput');
  const styleProfileList = document.getElementById('styleProfileList');
  const calculateSpacingButton = document.getElementById('calculateSpacingButton');
  const clearSearchButton = document.getElementById('clearSearchButton');
  const interactionModeSelect = document.getElementById('interactionModeSelect'); // New reference for the close button

  // Get references to display containers (managed by ui.js, but needed for direct display control)
  const infoDisplay = document.getElementById('infoDisplay');
  const alignmentDisplay = document.getElementById('alignmentDisplay');
  const spacingDisplay = document.getElementById('spacingDisplay');

  // State variables for the panel
  let selectorModeEnabled = false;
  let selectionMode = 'Hover-On'; // Default mode
  let expectedStylesProfiles = {};
  let selectedProfileName = null;
  let lastSelectedDetails = [];

  const choicesInstance = new Choices(styleProfileList, {
    searchEnabled: true,
    shouldSort: false,
    itemSelectText: '',
    placeholderValue: 'Select style profile...',
    searchPlaceholderValue: 'Type to search profiles...',
    removeItemButton: true,  // user can clear selection with x button
  });

  /**
   * Loads expected style profiles from 'expectedStyles.json' and populates the datalist.
   * Ensures graceful failure if the JSON is empty or malformed.
   */
  function loadExpectedStyles() {
  return fetch(runtime.getURL('expectedStyles.json'))
    .then(res => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.json();
    })
    .then(data => {
      if (typeof data !== 'object' || data === null || Array.isArray(data) || Object.keys(data).length === 0) {
        console.error('expectedStyles.json empty or malformed.');
        expectedStylesProfiles = {};
        choicesInstance.clearStore();
        choicesInstance.disable();
        selectedProfileName = null;
        return;
      }

      expectedStylesProfiles = data;
      console.log('Loaded expected styles:', expectedStylesProfiles);

      // Clear all choices, including placeholder
      choicesInstance.clearStore();

      // Add placeholder option (disabled, selected)
      choicesInstance.setChoices(
        [{ value: '', label: 'Select style profile...', disabled: true, selected: true }],
        'value',
        'label',
        false
      );

      // Add profile options dynamically
      const profiles = Object.keys(expectedStylesProfiles).map(name => ({
        value: name,
        label: name,
      }));

      choicesInstance.setChoices(profiles, 'value', 'label', false);

      choicesInstance.enable();
      selectedProfileName = null;
    })
    .catch(err => {
      console.error('Error loading expected styles:', err);
      expectedStylesProfiles = {};
      choicesInstance.clearStore();
      choicesInstance.disable();
      selectedProfileName = null;
    });
}

styleProfileList.addEventListener('change', (event) => {
  selectedProfileName = event.target.value || null;
  console.log('Selected profile:', selectedProfileName);
  // You can add any additional logic here if needed
});

  // --- Event Listeners ---
  interactionModeSelect.addEventListener('change', (e) => {
    selectionMode = e.target.value;
  });

  // Toggle selector mode on the inspected page
  selectorButton.addEventListener('click', () => {
    selectorModeEnabled = !selectorModeEnabled;
    updateSelectorButton(selectorModeEnabled);
    runtime.sendMessage({
      type: 'inject-selector-logic',
      enabled: selectorModeEnabled,
      apiName: typeof browser !== 'undefined' ? 'browser' : 'chrome',
      tabId: devtools.inspectedWindow.tabId,
      selectionMode: selectionMode
    }).catch(console.error);
  });

  // Clear selected elements and hide displays
  clearButton.addEventListener('click', () => {
    runtime.sendMessage({
      type: 'clear-selection',
      tabId: devtools.inspectedWindow.tabId
    }).catch(console.error);
    lastSelectedDetails = [];
    infoDisplay.innerHTML = '';
    alignmentDisplay.innerHTML = '';
    spacingDisplay.innerHTML = '';
    infoDisplay.style.display = 'none';
    alignmentDisplay.style.display = 'none';
    spacingDisplay.style.display = 'none';
  });

  // Validate styles of selected elements
  validateButton.addEventListener('click', () => {
    if (!lastSelectedDetails.length) {
      alert('No elements selected to validate');
      return;
    }
    if (!selectedProfileName || !expectedStylesProfiles[selectedProfileName]) {
      alert('Please select a valid style profile from the list.');
      return;
    }
    
    console.log('Selected Profile for Validation:', selectedProfileName);

    alignmentDisplay.style.display = 'none';
    spacingDisplay.style.display = 'none';
    infoDisplay.style.display = 'grid';

    const expectedProfile = expectedStylesProfiles[selectedProfileName];
    const results = lastSelectedDetails.map(el => validateElementStyles(el.styles, expectedProfile));
    renderCards(lastSelectedDetails, results, expectedStylesProfiles, selectedProfileName);
  });

  // Validate alignment of selected elements
  validateAlignmentButton.addEventListener('click', () => {
    if (lastSelectedDetails.length < 2) {
      alert('Please select at least 2 elements to validate alignment');
      return;
    }
    spacingDisplay.style.display = 'none';
    infoDisplay.style.display = 'none';

    const alignmentResult = validateAlignment(lastSelectedDetails);
    renderAlignmentCardsWithSummary(lastSelectedDetails, alignmentResult, lastSelectedDetails);
  });

  // Calculate spacing between selected elements
  calculateSpacingButton.addEventListener('click', () => {
    if (!lastSelectedDetails.length || lastSelectedDetails.length < 2) {
      alert('Please select at least 2 elements to calculate spacing.');
      return;
    }

    const spacingHTML = renderPairSpacingTable(lastSelectedDetails, calculatePairSpacing);
    spacingDisplay.innerHTML = spacingHTML;

    spacingDisplay.style.display = 'block';
    infoDisplay.style.display = 'none';
    alignmentDisplay.style.display = 'none';
  });

  // Update selected profile name when input changes
  // styleProfileInput.addEventListener('input', e => {
  //   const value = e.target.value;
  //   if (expectedStylesProfiles.hasOwnProperty(value)) {
  //     selectedProfileName = value;
  //   } else {
  //     selectedProfileName = null;
  //   }
  //   // Show/hide the clear button based on input value
  //   clearSearchButton.style.display = value ? 'block' : 'none';
  // });
  
  // Clear the search input when the clear button is clicked
  // clearSearchButton.addEventListener('click', () => {
  //   styleProfileInput.value = '';
  //   selectedProfileName = null;
  //   clearSearchButton.style.display = 'none';
  //   styleProfileInput.focus(); // Return focus to the input field
  // });

  // Listen for messages from the content script (via background.js)
  runtime.onMessage.addListener(message => {
    if (message.type === 'elementsSelected') {
      lastSelectedDetails = message.details;
      infoDisplay.style.display = 'grid';
      alignmentDisplay.style.display = 'none';
      spacingDisplay.style.display = 'none';
      renderCards(lastSelectedDetails, [], expectedStylesProfiles, selectedProfileName);
    }
  });

  // Initial setup when the panel loads
  updateSelectorButton(selectorModeEnabled);
  loadExpectedStyles();
});