/**
 * Utilities for setting or removing tabindex on all focusable elements
 * in a parent div. Useful for hiding elements off-canvas without setting
 * display:none, while still removing from the tab order
 */

export function removeTabindex($elm) {
  $elm.find('a, button, :input, [tabindex]').attr('tabindex', '-1');
}

export function restoreTabindex($elm) {
  $elm.find('a, button, :input, [tabindex]').attr('tabindex', '0');
}
