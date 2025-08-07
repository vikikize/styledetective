document.addEventListener('DOMContentLoaded', () => {
  // Determine the browser runtime API (Chrome or Firefox)
  const runtime = typeof browser !== 'undefined' ? browser.runtime : chrome.runtime;
  const devtools = typeof browser !== 'undefined' ? browser.devtools : chrome.devtools;

  // Get references to DOM elements
  const selectorButton = document.getElementById('selectorButton');
  const clearButton = document.getElementById('clearButton');
  const validateButton = document.getElementById('validateButton');
  const validateAlignmentButton = document.getElementById('validateAlignmentButton');
  const styleProfileDropdown = document.getElementById('styleProfileDropdown');
  const calculateSpacingButton = document.getElementById('calculateSpacingButton');

  // Get references to display containers (managed by ui.js, but needed for direct display control)
  const infoDisplay = document.getElementById('infoDisplay');
  const alignmentDisplay = document.getElementById('alignmentDisplay');
  const spacingDisplay = document.getElementById('spacingDisplay');

  // State variables for the panel
  let selectorModeEnabled = false;
  let expectedStylesProfiles = {};
  let selectedProfileName = null;
  let lastSelectedDetails = []; // Stores details of elements selected on the inspected page

  /**
   * Loads expected style profiles from 'expectedStyles.json' and populates the dropdown.
   * Ensures graceful failure if the JSON is empty or malformed.
   */
  function loadExpectedStyles() {
    return fetch(runtime.getURL('expectedStyles.json'))
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        // Check if data is a valid non-empty object
        if (typeof data !== 'object' || data === null || Array.isArray(data) || Object.keys(data).length === 0) {
          console.error('Error: expectedStyles.json is empty or malformed (not a non-empty object).');
          expectedStylesProfiles = {}; // Ensure it's an empty object to prevent further errors
          styleProfileDropdown.innerHTML = '<option value="">No profiles found</option>';
          selectedProfileName = null;
          return;
        }

        expectedStylesProfiles = data;
        styleProfileDropdown.innerHTML = ''; // Clear existing options
        Object.keys(expectedStylesProfiles).forEach(profileName => {
          const option = document.createElement('option');
          option.value = profileName;
          option.textContent = profileName;
          styleProfileDropdown.appendChild(option);
        });
        // Set initial selected profile, prioritizing the first one if none is selected
        selectedProfileName = styleProfileDropdown.value || Object.keys(expectedStylesProfiles)[0];
      })
      .catch(error => {
        console.error('Error loading expected styles from expectedStyles.json:', error);
        expectedStylesProfiles = {}; // Ensure it's empty on any fetch/parse error
        styleProfileDropdown.innerHTML = '<option value="">Error loading profiles</option>';
        selectedProfileName = null;
      });
  }

  // --- Event Listeners ---

  // Toggle selector mode on the inspected page
  selectorButton.addEventListener('click', () => {
    selectorModeEnabled = !selectorModeEnabled;
    // Call UI function to update button appearance
    updateSelectorButton(selectorModeEnabled);
    // Send message to background script to inject/remove selector logic
    runtime.sendMessage({
      type: 'inject-selector-logic',
      enabled: selectorModeEnabled,
      apiName: typeof browser !== 'undefined' ? 'browser' : 'chrome', // Pass API name for background script
      tabId: devtools.inspectedWindow.tabId // Pass current tab ID
    }).catch(console.error);
  });

  // Clear selected elements and hide displays
  clearButton.addEventListener('click', () => {
    runtime.sendMessage({
      type: 'clear-selection',
      tabId: devtools.inspectedWindow.tabId
    }).catch(console.error);
    lastSelectedDetails = []; // Clear local state
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
      // Using alert for simplicity as per original code, but a custom modal is recommended for extensions
      alert('No elements selected to validate');
      return;
    }
    if (!selectedProfileName || !expectedStylesProfiles[selectedProfileName]) {
      alert('Please select a valid style profile');
      return;
    }

    // Hide other displays
    alignmentDisplay.style.display = 'none';
    spacingDisplay.style.display = 'none';
    infoDisplay.style.display = 'grid'; // Ensure info display is visible

    const expectedProfile = expectedStylesProfiles[selectedProfileName];
    // Call validation function from validation.js
    const results = lastSelectedDetails.map(el => validateElementStyles(el.styles, expectedProfile));
    // Call UI function to render cards with validation results
    renderCards(lastSelectedDetails, results, expectedStylesProfiles, selectedProfileName);
  });

  // Validate alignment of selected elements
  validateAlignmentButton.addEventListener('click', () => {
    if (lastSelectedDetails.length < 2) {
      alert('Please select at least 2 elements to validate alignment');
      return;
    }
    spacingDisplay.style.display = 'none'; // Hide spacing display
    infoDisplay.style.display = 'none'; // Hide info display

    // Call validation function from validation.js
    const alignmentResult = validateAlignment(lastSelectedDetails);
    // Call UI function to render alignment summary and cards
    renderAlignmentCardsWithSummary(lastSelectedDetails, alignmentResult, lastSelectedDetails);
  });

  // Calculate spacing between selected elements
  calculateSpacingButton.addEventListener('click', () => {
    if (!lastSelectedDetails.length || lastSelectedDetails.length < 2) {
      alert('Please select at least 2 elements to calculate spacing.');
      return;
    }

    // Call UI function to render spacing table, passing the validation function
    const spacingHTML = renderPairSpacingTable(lastSelectedDetails, calculatePairSpacing);
    spacingDisplay.innerHTML = spacingHTML;

    // Show spacing display, hide others
    spacingDisplay.style.display = 'block';
    infoDisplay.style.display = 'none';
    alignmentDisplay.style.display = 'none';
  });

  // Update selected profile name when dropdown changes
  styleProfileDropdown.addEventListener('change', e => {
    selectedProfileName = e.target.value;
  });

  // Listen for messages from the content script (via background.js)
  runtime.onMessage.addListener(message => {
    if (message.type === 'elementsSelected') {
      lastSelectedDetails = message.details; // Update local state with selected elements
      // Ensure info display is visible when elements are selected
      infoDisplay.style.display = 'grid';
      alignmentDisplay.style.display = 'none';
      spacingDisplay.style.display = 'none';
      // Render cards for the newly selected elements (without validation initially)
      renderCards(lastSelectedDetails, [], expectedStylesProfiles, selectedProfileName);
    }
  });

  // Initial setup when the panel loads
  updateSelectorButton(selectorModeEnabled); // Set initial button state
  loadExpectedStyles(); // Load style profiles
});
