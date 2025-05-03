/**
 * Checks if an element is a button or has button-like characteristics
 * @param element The DOM element to check
 * @returns {boolean} True if the element is a button or has button-like characteristics
 */
export const isButtonElement = (element: Element | null): boolean => {
  if (!element) return false;

  // Check if it's a button tag
  if (element.tagName.toLowerCase() === 'button') {
    return true;
  }

  // Check if it has role="button"
  if (element.getAttribute('role')?.toLowerCase() === 'button') {
    return true;
  }

  // Check if it's an input with type="button", type="submit", or type="reset"
  if (element.tagName.toLowerCase() === 'input') {
    const type = element.getAttribute('type')?.toLowerCase();
    if (type === 'button' || type === 'submit' || type === 'reset') {
      return true;
    }
  }

  // Check if it's an anchor tag with href and has button-like styling
  if (element.tagName.toLowerCase() === 'a' && element.hasAttribute('href')) {
    const computedStyle = window.getComputedStyle(element);
    
    // Check for common button characteristics
    const hasBackgroundColor = computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)';
    const hasBorder = computedStyle.border !== 'none' && computedStyle.border !== '';
    const hasPadding = computedStyle.padding !== '0px';
    const hasButtonLikeCursor = computedStyle.cursor === 'pointer';
    const hasRoundedCorners = computedStyle.borderRadius !== '0px';
    
    // If it has at least 3 of these characteristics, it's likely a button
    let buttonCharacteristics = 0;
    if (hasBackgroundColor) buttonCharacteristics++;
    if (hasBorder) buttonCharacteristics++;
    if (hasPadding) buttonCharacteristics++;
    if (hasButtonLikeCursor) buttonCharacteristics++;
    if (hasRoundedCorners) buttonCharacteristics++;
    
    return buttonCharacteristics >= 3;
  }

  // Check for div or span with button-like characteristics
  if (element.tagName.toLowerCase() === 'div' || element.tagName.toLowerCase() === 'span') {
    const computedStyle = window.getComputedStyle(element);
    
    // Check for common button characteristics
    const hasBackgroundColor = computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)';
    const hasBorder = computedStyle.border !== 'none' && computedStyle.border !== '';
    const hasPadding = computedStyle.padding !== '0px';
    const hasButtonLikeCursor = computedStyle.cursor === 'pointer';
    const hasRoundedCorners = computedStyle.borderRadius !== '0px';
    const hasClickHandler = element.hasAttribute('onclick') || element.hasAttribute('data-click');
    
    // If it has at least 4 of these characteristics, it's likely a button
    let buttonCharacteristics = 0;
    if (hasBackgroundColor) buttonCharacteristics++;
    if (hasBorder) buttonCharacteristics++;
    if (hasPadding) buttonCharacteristics++;
    if (hasButtonLikeCursor) buttonCharacteristics++;
    if (hasRoundedCorners) buttonCharacteristics++;
    if (hasClickHandler) buttonCharacteristics++;
    
    return buttonCharacteristics >= 4;
  }

  return false;
};