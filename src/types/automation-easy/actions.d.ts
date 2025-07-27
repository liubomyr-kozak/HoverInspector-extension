/**
 * Automation Easy - Actions Module Declarations
 * 
 * This file contains type declarations for the actions module in the Automation Easy extension.
 */

declare namespace AutomationEasy {
  /**
   * Action Functions
   */
  
  /**
   * Handles errors in actions
   * @param error - The error to handle
   * @param ignoreErrors - Whether to ignore the error or throw it
   */
  function handleError(error: Error, ignoreErrors?: boolean): void;
  
  /**
   * Waits for a specified amount of time
   * @param params - Wait parameters
   * @returns Promise that resolves after the specified delay
   */
  function wait(params: WaitParams): Promise<void>;
  
  /**
   * Sets the value of an input element
   * @param params - Input parameters
   * @returns Promise that resolves after the input is set
   */
  function setInput(params: SetInputParams): Promise<void>;
  
  /**
   * Counts elements matching a selector
   * @param params - Count elements parameters
   * @returns Promise that resolves with the count of matching elements
   */
  function countElements(params: CountElementsParams): Promise<number>;
  
  /**
   * Navigates back in the browser history
   * @param waitTime - Time to wait after navigation
   * @param ignoreErrors - Whether to ignore errors
   * @returns Promise that resolves after navigation
   */
  function goBack(waitTime?: number, ignoreErrors?: boolean): Promise<void>;
  
  /**
   * Simulates input events on elements
   * @param data - Input event parameters
   * @returns Promise that resolves after the events are simulated
   */
  function simulateInputEvent(data: { data: { selector: string } }): Promise<void>;
  
  /**
   * Performs smooth scrolling
   * @param data - Scroll parameters
   * @returns Promise that resolves after scrolling
   */
  function smoothScroll(data: ScrollParams): Promise<void>;
  
  /**
   * Refreshes the current page
   * @param waitTime - Time to wait after refresh
   * @param ignoreErrors - Whether to ignore errors
   * @returns Promise that resolves after refresh
   */
  function refresh(waitTime?: number, ignoreErrors?: boolean): Promise<void>;
  
  /**
   * Executes steps in a loop for each matching element
   * @param params - Loop parameters
   * @returns Promise that resolves after the loop completes
   */
  function loop(params: LoopParams): Promise<void>;
  
  /**
   * Executes custom JavaScript code
   * @param script - JavaScript code to execute
   * @param waitTime - Time to wait after execution
   * @param ignoreError - Whether to ignore errors
   * @returns Promise that resolves after execution
   */
  function executeScript(script: string, waitTime?: number, ignoreError?: boolean): Promise<void>;
  
  /**
   * Gets all links from the current page
   * @returns Promise that resolves with an array of links
   */
  function getLinksFromPage(): Promise<string[]>;
  
  /**
   * Opens a URL in a tab and waits for it to load
   * @param url - The URL to open
   * @param tabId - The ID of the tab to use
   * @returns Promise that resolves with the updated tab
   */
  function openUrlInTabAndWait(url: string, tabId: number): Promise<chrome.tabs.Tab>;
  
  /**
   * Gets all unique email addresses from the page
   * @returns Promise that resolves with an array of email addresses
   */
  function getAllUniqueEmails(): Promise<string[]>;
  
  /**
   * Gets all unique phone numbers from the page
   * @returns Promise that resolves with an array of phone numbers
   */
  function getAllUniquePhoneNumbers(): Promise<string[]>;
  
  /**
   * Gets the URL of the current page
   * @returns Promise that resolves with the page URL
   */
  function getPageUrl(): Promise<string>;
  
  /**
   * Gets the title of the current page
   * @returns Promise that resolves with the page title
   */
  function getPageTitle(): Promise<string>;
  
  /**
   * Gets the visible text content of the page
   * @returns Promise that resolves with the page content and visibility status
   */
  function getPageContentAndCheckVisibility(): Promise<{ visibleTextContent: string, isElementVisible: boolean }>;
  
  /**
   * Clicks on an element
   * @param params - Click parameters
   * @returns Promise that resolves after the click
   */
  function clickElement(params: ClickElementParams): Promise<void>;
  
  /**
   * Extracts data from elements
   * @param params - Save data parameters
   * @returns Promise that resolves with the extracted data
   */
  function saveData(params: SaveDataParams): Promise<any[]>;
}