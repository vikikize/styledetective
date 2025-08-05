chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'inject-selector-logic') {
    const { enabled, apiName, tabId } = message;

    const injectedSelectorLogic = (enabled) => {
      if (!window.__selectorState__) {
        window.__selectorState__ = {
          active: false,
          selectedElements: new Set(),
          onMouseMove: null,
          onClick: null,
          handlersAttached: false,
          hoverBox: null,
        };
      }

      const state = window.__selectorState__;

      // Create or reuse highlight overlay container
      if (!window.__highlightOverlay__) {
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.pointerEvents = 'none';
        overlay.style.zIndex = '2147483647';
        window.__highlightOverlay__ = overlay;
        document.body.appendChild(overlay);
      }
      const overlay = window.__highlightOverlay__;

      function clearHoverBox() {
        if (state.hoverBox) {
          if (overlay.contains(state.hoverBox)) {
            overlay.removeChild(state.hoverBox);
          }
          state.hoverBox = null;
        }
      }

      function updateHoverBox(el) {
        clearHoverBox();
        if (!el || state.selectedElements.has(el)) return;

        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;

        const box = document.createElement('div');
        box.style.position = 'fixed';
        box.style.top = `${rect.top}px`;
        box.style.left = `${rect.left}px`;
        box.style.width = `${rect.width}px`;
        box.style.height = `${rect.height}px`;
        box.style.border = '2px solid #a78bfa';
        box.style.borderRadius = '4px';
        box.style.backgroundColor = 'rgba(167, 139, 250, 0.15)';
        box.style.boxSizing = 'border-box';

        overlay.appendChild(box);
        state.hoverBox = box;
      }

      function updateSelectedHighlights() {
        overlay.querySelectorAll('.selected-highlight').forEach(el => el.remove());

        const selectedArray = Array.from(state.selectedElements);

        selectedArray.forEach((el, index) => {
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) return;

          const box = document.createElement('div');
          box.className = 'selected-highlight';
          box.style.position = 'fixed';
          box.style.top = `${rect.top}px`;
          box.style.left = `${rect.left}px`;
          box.style.width = `${rect.width}px`;
          box.style.height = `${rect.height}px`;
          box.style.border = '2px solid #f87171';
          box.style.borderRadius = '4px';
          box.style.backgroundColor = 'rgba(248, 113, 113, 0.15)';
          box.style.boxSizing = 'border-box';

          // Badge
          const badge = document.createElement('div');
          badge.textContent = index + 1;
          badge.style.position = 'absolute';
          badge.style.top = '0';
          badge.style.left = '0';
          badge.style.transform = 'translate(-50%, -50%)';
          badge.style.backgroundColor = '#f87171';
          badge.style.color = '#fff';
          badge.style.fontSize = '12px';
          badge.style.width = '18px';
          badge.style.height = '18px';
          badge.style.display = 'flex';
          badge.style.alignItems = 'center';
          badge.style.justifyContent = 'center';
          badge.style.borderRadius = '50%';
          badge.style.boxShadow = '0 1px 4px rgba(0, 0, 0, 0.2)';

          box.appendChild(badge);
          overlay.appendChild(box);
        });
      }

      const syncSelectedElements = () => {
        updateSelectedHighlights();

        const selectedDetails = Array.from(state.selectedElements).map(elem => {
          const style = window.getComputedStyle(elem);

          return {
            tag: elem.tagName,
            id: elem.id,
            classes: Array.from(elem.classList).join(' '),
            styles: {
              // Tag Info
              tagName: elem.tagName,
              id: elem.id,
              classList: Array.from(elem.classList).join(' '),

              // Layout
              display: style.display,
              position: style.position,
              top: style.top,
              right: style.right,
              bottom: style.bottom,
              left: style.left,
              width: style.width,
              height: style.height,
              maxWidth: style.maxWidth,
              maxHeight: style.maxHeight,
              minWidth: style.minWidth,
              minHeight: style.minHeight,
              boxSizing: style.boxSizing,

              // Margin
              marginTop: style.marginTop,
              marginRight: style.marginRight,
              marginBottom: style.marginBottom,
              marginLeft: style.marginLeft,

              // Padding
              paddingTop: style.paddingTop,
              paddingRight: style.paddingRight,
              paddingBottom: style.paddingBottom,
              paddingLeft: style.paddingLeft,

              // Border
              borderTop: style.borderTop,
              borderTopWidth: style.borderTopWidth,
              borderTopStyle: style.borderTopStyle,
              borderTopColor: style.borderTopColor,
              borderRight: style.borderRight,
              borderRightWidth: style.borderRightWidth,
              borderRightStyle: style.borderRightStyle,
              borderRightColor: style.borderRightColor,
              borderBottom: style.borderBottom,
              borderBottomWidth: style.borderBottomWidth,
              borderBottomStyle: style.borderBottomStyle,
              borderBottomColor: style.borderBottomColor,
              borderLeft: style.borderLeft,
              borderLeftWidth: style.borderLeftWidth,
              borderLeftStyle: style.borderLeftStyle,
              borderLeftColor: style.borderLeftColor,

              // Border Radius
              borderTopLeftRadius: style.borderTopLeftRadius,
              borderTopRightRadius: style.borderTopRightRadius,
              borderBottomRightRadius: style.borderBottomRightRadius,
              borderBottomLeftRadius: style.borderBottomLeftRadius,

              // Typography
              fontFamily: style.fontFamily,
              fontSize: style.fontSize,
              fontWeight: style.fontWeight,
              fontStyle: style.fontStyle,
              fontVariant: style.fontVariant,
              letterSpacing: style.letterSpacing,
              lineHeight: style.lineHeight,
              textAlign: style.textAlign,
              textDecoration: style.textDecoration,
              textIndent: style.textIndent,
              textShadow: style.textShadow,
              textTransform: style.textTransform,
              whiteSpace: style.whiteSpace,
              wordSpacing: style.wordSpacing,
              wordBreak: style.wordBreak,
              wordWrap: style.wordWrap,

              // Colors & Background
              color: style.color,
              background: style.background,
              backgroundColor: style.backgroundColor,
              backgroundImage: style.backgroundImage,
              backgroundPosition: style.backgroundPosition,
              backgroundRepeat: style.backgroundRepeat,
              backgroundSize: style.backgroundSize,
              backgroundAttachment: style.backgroundAttachment,
              opacity: style.opacity,
            }
          };
        });

        const customEvent = new CustomEvent('my-extension-selected-elements', {
          detail: selectedDetails
        });
        window.dispatchEvent(customEvent);
      };

      const toggleSelector = (enable) => {
        if (state.handlersAttached) {
          document.body.removeEventListener('mousemove', state.onMouseMove);
          document.body.removeEventListener('click', state.onClick, true);
          state.handlersAttached = false;
        }

        state.active = enable;

        if (enable) {
          // Re-define handlers each time
          state.onMouseMove = (event) => {
            if (!state.active) return;
            updateHoverBox(event.target);
          };

          state.onClick = (event) => {
            if (!state.active) return;

            event.preventDefault();
            event.stopPropagation();

            const el = event.target;

            if (state.selectedElements.has(el)) {
              state.selectedElements.delete(el);
            } else {
              state.selectedElements.add(el);
            }

            updateSelectedHighlights();

            const selectedDetails = Array.from(state.selectedElements).map(elem => {
              const style = window.getComputedStyle(elem);

              return {
                tag: elem.tagName,
                id: elem.id,
                classes: Array.from(elem.classList).join(' '),
                styles: {
                  // Tag Info
                  tagName: elem.tagName,
                  id: elem.id,
                  classList: Array.from(elem.classList).join(' '),

                  // Layout
                  display: style.display,
                  position: style.position,
                  top: style.top,
                  right: style.right,
                  bottom: style.bottom,
                  left: style.left,
                  width: style.width,
                  height: style.height,
                  maxWidth: style.maxWidth,
                  maxHeight: style.maxHeight,
                  minWidth: style.minWidth,
                  minHeight: style.minHeight,
                  boxSizing: style.boxSizing,

                  // Margin
                  marginTop: style.marginTop,
                  marginRight: style.marginRight,
                  marginBottom: style.marginBottom,
                  marginLeft: style.marginLeft,

                  // Padding
                  paddingTop: style.paddingTop,
                  paddingRight: style.paddingRight,
                  paddingBottom: style.paddingBottom,
                  paddingLeft: style.paddingLeft,

                  // Border
                  borderTop: style.borderTop,
                  borderTopWidth: style.borderTopWidth,
                  borderTopStyle: style.borderTopStyle,
                  borderTopColor: style.borderTopColor,
                  borderRight: style.borderRight,
                  borderRightWidth: style.borderRightWidth,
                  borderRightStyle: style.borderRightStyle,
                  borderRightColor: style.borderRightColor,
                  borderBottom: style.borderBottom,
                  borderBottomWidth: style.borderBottomWidth,
                  borderBottomStyle: style.borderBottomStyle,
                  borderBottomColor: style.borderBottomColor,
                  borderLeft: style.borderLeft,
                  borderLeftWidth: style.borderLeftWidth,
                  borderLeftStyle: style.borderLeftStyle,
                  borderLeftColor: style.borderLeftColor,

                  // Border Radius
                  borderTopLeftRadius: style.borderTopLeftRadius,
                  borderTopRightRadius: style.borderTopRightRadius,
                  borderBottomRightRadius: style.borderBottomRightRadius,
                  borderBottomLeftRadius: style.borderBottomLeftRadius,

                  // Typography
                  fontFamily: style.fontFamily,
                  fontSize: style.fontSize,
                  fontWeight: style.fontWeight,
                  fontStyle: style.fontStyle,
                  fontVariant: style.fontVariant,
                  letterSpacing: style.letterSpacing,
                  lineHeight: style.lineHeight,
                  textAlign: style.textAlign,
                  textDecoration: style.textDecoration,
                  textIndent: style.textIndent,
                  textShadow: style.textShadow,
                  textTransform: style.textTransform,
                  whiteSpace: style.whiteSpace,
                  wordSpacing: style.wordSpacing,
                  wordBreak: style.wordBreak,
                  wordWrap: style.wordWrap,

                  // Colors & Background
                  color: style.color,
                  background: style.background,
                  backgroundColor: style.backgroundColor,
                  backgroundImage: style.backgroundImage,
                  backgroundPosition: style.backgroundPosition,
                  backgroundRepeat: style.backgroundRepeat,
                  backgroundSize: style.backgroundSize,
                  backgroundAttachment: style.backgroundAttachment,
                  opacity: style.opacity,
                }
              };
            });

            const customEvent = new CustomEvent('my-extension-selected-elements', {
              detail: selectedDetails
            });
            window.dispatchEvent(customEvent);

            updateHoverBox(event.target);
          };

          document.body.addEventListener('mousemove', state.onMouseMove);
          document.body.addEventListener('click', state.onClick, true);
          state.handlersAttached = true;

          syncSelectedElements();
          console.log('Selector mode enabled');
        } else {
          clearHoverBox();
          console.log('Selector mode disabled');
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
        state.selectedElements.clear();

        if (window.__highlightOverlay__) {
          window.__highlightOverlay__.innerHTML = '';
        }
      }
    });
    return true;
  }

  if (message.type === 'elementsSelected') {
    chrome.runtime.sendMessage({
      type: 'elementsSelected',
      details: message.details
    });
  }
});
