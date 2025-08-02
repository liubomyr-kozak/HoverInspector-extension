/**
 * Utility function to copy text to clipboard
 */
export const copyToClipboard = (text: string): Promise<void> => {
  return navigator.clipboard.writeText(text).catch((err) => {
    console.error("Failed to copy text: ", err);
  });
};