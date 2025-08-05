chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'inject-selector-logic') {
    const { enabled, apiName, tabId } = message;

    const injectedSelectorLogic = (enabled) => {
      const styleId = 'my-element-selector-styles';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          .my-hover-outline {
            outline: 2px solid #a78bfa !important;
            outline-offset: 0 !important;
            outline-style: solid !important;
            cursor: pointer !important;
          }
          .my-selected-outline {
            outline: 2px solid #f87171 !important;
            outline-offset: 0 !important;
            outline-style: solid !important;
            cursor: pointer !important;
          }
        `;
        document.head.appendChild(style);
      }

      if (!window.__selectorState__) {
        window.__selectorState__ = {
          active: false,
          selectedElements: new Set(),
          lastHovered: null,
          onMouseMove: null,
          onClick: null,
          handlersAttached: false,
        };
      }

      const state = window.__selectorState__;

      state.onMouseMove = (event) => {
        if (!state.active) return;

        const el = event.target;
        if (!el) return;

        if (
          state.lastHovered &&
          state.lastHovered !== el &&
          !state.selectedElements.has(state.lastHovered)
        ) {
          state.lastHovered.classList.remove('my-hover-outline');
        }

        if (!state.selectedElements.has(el)) {
          el.classList.add('my-hover-outline');
        }

        state.lastHovered = el;
      };

      state.onClick = (event) => {
        if (!state.active) return;

        event.preventDefault();
        event.stopPropagation();

        const el = event.target;

        if (state.selectedElements.has(el)) {
          state.selectedElements.delete(el);
          el.classList.remove('my-selected-outline');
        } else {
          state.selectedElements.add(el);
          el.classList.remove('my-hover-outline');
          el.classList.add('my-selected-outline');
        }

        const selectedDetails = Array.from(state.selectedElements).map(elem => ({
          tag: elem.tagName,
          id: elem.id,
          classes: Array.from(elem.classList).join(' ')
        }));

        // Dispatch a custom DOM event with details instead of messaging directly
        const customEvent = new CustomEvent('my-extension-selected-elements', {
          detail: selectedDetails
        });
        window.dispatchEvent(customEvent);
      };

      const syncSelectedElements = () => {
        const selectedEls = Array.from(document.querySelectorAll('.my-selected-outline'));
        state.selectedElements.clear();
        selectedEls.forEach(el => state.selectedElements.add(el));

        const selectedDetails = selectedEls.map(elem => ({
          tag: elem.tagName,
          id: elem.id,
          classes: Array.from(elem.classList).join(' ')
        }));

        // Dispatch event for sync
        const customEvent = new CustomEvent('my-extension-selected-elements', {
          detail: selectedDetails
        });
        window.dispatchEvent(customEvent);
      };

      const toggleSelector = (enable) => {
        state.active = enable;

        if (enable) {
          if (!state.handlersAttached) {
            document.body.addEventListener('mousemove', state.onMouseMove);
            document.body.addEventListener('click', state.onClick, true);
            state.handlersAttached = true;
            console.log('Selector handlers attached.');
          }
          syncSelectedElements();
          console.log('Selector mode enabled');
        } else {
          document.querySelectorAll('.my-hover-outline').forEach(el => {
            if (!state.selectedElements.has(el)) {
              el.classList.remove('my-hover-outline');
            }
          });
          state.lastHovered = null;
          console.log('Selector mode disabled (handlers still attached)');
        }
      };

      toggleSelector(enabled);
    };

    chrome.scripting.executeScript({
      target: { tabId },
      func: injectedSelectorLogic,
      args: [enabled]
    });

    sendResponse({ success: true });
    return true;
  }

  if (message.type === 'clear-selection') {
    chrome.scripting.executeScript({
      target: { tabId: message.tabId },
      func: () => {
        if (!window.__selectorState__) return;
        const state = window.__selectorState__;
        state.selectedElements.forEach(el =>
          el.classList.remove('my-selected-outline')
        );
        state.selectedElements.clear();
        console.log('Selection cleared');
      }
    });
    return true;
  }

  if (message.type === 'elementsSelected') {
    // Forward the selection message to devtools panel
    chrome.runtime.sendMessage({
      type: 'elementsSelected',
      details: message.details
    });
  }
});
