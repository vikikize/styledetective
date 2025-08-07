/**
 * Validates an element's computed styles against a given expected style profile.
 * It normalizes values for accurate comparison.
 *
 * @param {object} elementStyles An object containing the computed styles of an element.
 * @param {object} expectedProfile An object containing the expected CSS properties and values.
 * @returns {object} An object where keys are CSS property names and values are booleans
 * indicating if the actual style matches the expected style (true for match,
 * false for mismatch, null for not asserted/missing).
 */
function validateElementStyles(elementStyles, expectedProfile) {
  const results = {};
  for (const [expectedKey, expectedValRaw] of Object.entries(expectedProfile)) {
    // toCamelCase is from utils.js
    const key = toCamelCase(expectedKey);
    const actualValRaw = elementStyles[key];
    if (actualValRaw === undefined || actualValRaw === null) {
      results[expectedKey] = null; // Not found in actual styles
      continue;
    }
    // normalizeCssValue is from utils.js
    const expectedVal = normalizeCssValue(expectedValRaw);
    const actualVal = normalizeCssValue(actualValRaw);
    results[expectedKey] = (expectedVal === actualVal);
  }
  return results;
}

/**
 * Validates the alignment of multiple elements based on their absolute bounding box values.
 * The first element in the `details` array is used as the reference.
 *
 * @param {Array<object>} details An array of element detail objects, each containing 'styles' with absolute dimensions.
 * @returns {object} An object containing arrays of alignment differences for top, bottom, left, right,
 * verticalCenter, and horizontalCenter. Each item in the array includes the element
 * and its pixel difference from the base element.
 */
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

/**
 * Checks if one rectangle fully overlaps or contains another.
 * @param {object} rect1 Bounding box of the first element.
 * @param {object} rect2 Bounding box of the second element.
 * @returns {boolean} True if full overlap/containment, false otherwise.
 */
function isFullOverlap(rect1, rect2) {
  const horizontal = (rect1.left <= rect2.left && rect1.right >= rect2.right) ||
                     (rect2.left <= rect1.left && rect2.right >= rect1.right);
  const vertical = (rect1.top <= rect2.top && rect1.bottom >= rect2.bottom) ||
                   (rect2.top <= rect1.top && rect2.bottom >= rect1.bottom);
  return horizontal && vertical;
}

/**
 * Checks if two rectangles have any horizontal overlap.
 * @param {object} rect1 Bounding box of the first element.
 * @param {object} rect2 Bounding box of the second element.
 * @returns {boolean} True if horizontal overlap, false otherwise.
 */
function isHorizontalOverlap(rect1, rect2) {
  return !(rect1.right <= rect2.left || rect2.right <= rect1.left);
}

/**
 * Checks if two rectangles have any vertical overlap.
 * @param {object} rect1 Bounding box of the first element.
 * @param {object} rect2 Bounding box of the second element.
 * @returns {boolean} True if vertical overlap, false otherwise.
 */
function isVerticalOverlap(rect1, rect2) {
  return !(rect1.bottom <= rect2.top || rect2.bottom <= rect1.top);
}

/**
 * Calculates the distances between corresponding sides when there is a full overlap.
 * @param {object} rect1 Bounding box of the first element.
 * @param {object} rect2 Bounding box of the second element.
 * @returns {object} Object with leftToLeft, rightToRight, topToTop, bottomToBottom distances.
 */
function calculateFullOverlapDistances(rect1, rect2) {
  return {
    leftToLeft: Math.abs(rect1.left - rect2.left),
    rightToRight: Math.abs(rect1.right - rect2.right),
    topToTop: Math.abs(rect1.top - rect2.top),
    bottomToBottom: Math.abs(rect1.bottom - rect2.bottom),
  };
}

/**
 * Calculates the horizontal spacing between two rectangles.
 * Returns 0 if they overlap horizontally.
 * @param {object} rect1 Bounding box of the first element.
 * @param {object} rect2 Bounding box of the second element.
 * @returns {number} The horizontal spacing in pixels.
 */
function calculateHorizontalSpacing(rect1, rect2) {
  if (rect1.right <= rect2.left) {
    return rect2.left - rect1.right;
  } else if (rect2.right <= rect1.left) {
    return rect1.left - rect2.right;
  }
  return 0; // Overlapping horizontally
}

/**
 * Calculates the vertical spacing between two rectangles.
 * Returns 0 if they overlap vertically.
 * @param {object} rect1 Bounding box of the first element.
 * @param {object} rect2 Bounding box of the second element.
 * @returns {number} The vertical spacing in pixels.
 */
function calculateVerticalSpacing(rect1, rect2) {
  if (rect1.bottom <= rect2.top) {
    return rect2.top - rect1.bottom;
  } else if (rect2.bottom <= rect1.top) {
    return rect1.top - rect2.bottom;
  }
  return 0; // Overlapping vertically
}

/**
 * Calculates the spacing and relationship between two elements.
 * @param {object} el1 First element details object.
 * @param {object} el2 Second element details object.
 * @returns {object} An object describing the relationship and spacing.
 */
function calculatePairSpacing(el1, el2) {
  // getRect is from utils.js
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
