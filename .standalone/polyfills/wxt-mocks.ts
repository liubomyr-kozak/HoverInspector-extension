/**
 * Mock implementations for WXT functions used in the standalone build
 */

/**
 * Mock implementation of defineBackground from WXT
 * Simply returns the object passed to it
 */
export function defineBackground(options: any) {
  console.log('Mock defineBackground called with:', options);
  return options;
}

/**
 * Mock implementation of defineContentScript from WXT
 * Simply returns the object passed to it
 */
export function defineContentScript(options: any) {
  console.log('Mock defineContentScript called with:', options);
  
  // In standalone mode, we immediately execute the main function
  if (options.main && typeof options.main === 'function') {
    // Create a mock context object
    const ctx = { isInvalid: false };
    
    // Execute the main function with a timeout to ensure DOM is ready
    setTimeout(() => {
      options.main(ctx).catch((error: any) => {
        console.error('Error executing content script main function:', error);
      });
    }, 0);
  }
  
  return options;
}

/**
 * Mock implementation of createShadowRootUi from WXT
 * Creates a basic shadow root UI element without browser extension specifics
 */
export async function createShadowRootUi(ctx: any, options: any) {
  console.log('Mock createShadowRootUi called with:', options);
  
  // Create a container element
  const containerElement = document.createElement(options.name || 'div');
  containerElement.style.position = options.position || 'fixed';
  containerElement.style.zIndex = options.zIndex?.toString() || '9999';
  
  // Create a shadow root
  const shadow = containerElement.attachShadow({ mode: 'open' });
  
  // Append to document if anchor is specified
  const anchor = options.anchor ? document.querySelector(options.anchor) : document.body;
  
  return {
    shadow,
    mount: () => {
      anchor?.appendChild(containerElement);
      if (options.onMount) {
        options.onMount(shadow);
      }
    },
    unmount: () => {
      const elements = shadow.childNodes;
      if (options.onRemove) {
        options.onRemove(elements);
      }
      containerElement.remove();
    }
  };
}