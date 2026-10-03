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

  const tag = element.tagName.toLowerCase();
  if (tag !== 'a' && tag !== 'div' && tag !== 'span') return false;

  const computedStyle = window.getComputedStyle(element);
  const isClickable =
    computedStyle.cursor === 'pointer' ||
    element.hasAttribute('onclick') ||
    element.hasAttribute('data-click');
  // A link with href is clickable by nature; a div or span must look clickable
  // before its box styling counts, otherwise every card or panel would be a "button"
  if (tag !== 'a' && !isClickable) return false;
  if (tag === 'a' && !element.hasAttribute('href')) return false;

  const hasBackgroundColor = !/^(transparent|rgba\(0, 0, 0, 0\))$/.test(computedStyle.backgroundColor);
  const hasBorder = ['Top', 'Right', 'Bottom', 'Left'].some(
    (side) =>
      computedStyle[`border${side}Style` as any] !== 'none' &&
      parseFloat(computedStyle[`border${side}Width` as any]) > 0
  );
  const hasPadding = ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'].some(
    (prop) => parseFloat(computedStyle[prop as any]) > 0
  );
  const hasRoundedCorners = parseFloat(computedStyle.borderTopLeftRadius) > 0;
  // Buttons are compact; large boxes are cards or sections even when clickable
  const rect = element.getBoundingClientRect();
  const isCompact = rect.height > 0 && rect.height <= 80 && rect.width <= 400;

  let buttonCharacteristics = 0;
  if (hasBackgroundColor) buttonCharacteristics++;
  if (hasBorder) buttonCharacteristics++;
  if (hasPadding) buttonCharacteristics++;
  if (hasRoundedCorners) buttonCharacteristics++;

  return isCompact && buttonCharacteristics >= (tag === 'a' ? 2 : 3);
};
