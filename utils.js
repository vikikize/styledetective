/**
 * Converts a kebab-case string to camelCase.
 * @param {string} str The string to convert.
 * @returns {string} The camelCase string.
 */
function toCamelCase(str) {
  return str.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
}

/**
 * Normalizes a CSS color value to its computed RGB format.
 * Creates a temporary canvas context to perform the normalization.
 * @param {string} value The color string (e.g., "red", "#FF0000", "rgb(255,0,0)").
 * @returns {string} The normalized RGB color string or the original value if invalid.
 */
function normalizeColor(value) {
  if (!value) return value;
  const ctx = document.createElement('canvas').getContext('2d');
  ctx.fillStyle = value;
  return ctx.fillStyle;
}

/**
 * Normalizes various CSS property values for consistent comparison.
 * Handles colors (RGB, HEX, HSL, transparent), numeric values, and other strings.
 * @param {string|number} val The CSS property value.
 * @returns {string|number} The normalized value.
 */
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

/**
 * Calculates the absolute pixel difference between two numbers,
 * considering a small tolerance for floating-point inaccuracies.
 * @param {number} a First value.
 * @param {number} b Second value.
 * @returns {number} The difference, rounded to two decimal places, or 0 if within tolerance.
 */
function pixelDiff(a, b) {
  return Math.abs(a - b) <= 0.5 ? 0 : parseFloat((a - b).toFixed(2));
}

/**
 * Extracts the bounding client rectangle properties and element identity
 * from an element details object.
 * @param {object} el The element details object (from getStyleSnapshot).
 * @returns {object} An object containing bounding box properties and element identity.
 */
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
