/**
 * Automation Easy - Integration Module Declarations
 * 
 * This file contains type declarations for the integration modules in the Automation Easy extension.
 */

declare namespace AutomationEasy {
  /**
   * Google Spreadsheet Integration
   */
  
  // Spreadsheet API interface
  interface SpreadsheetApi {
    /**
     * Appends data to a Google Spreadsheet
     * @param spreadsheetId - The ID of the spreadsheet
     * @param range - The range to append to (e.g., "A:A")
     * @param values - The values to append
     * @param sheetName - Optional sheet name
     * @returns Promise that resolves with the response from the API
     */
    append(spreadsheetId: string, range: string, values: any[][], sheetName?: string): Promise<SpreadsheetResponse>;
    
    /**
     * Gets data from a Google Spreadsheet
     * @param spreadsheetId - The ID of the spreadsheet
     * @param range - The range to get (e.g., "A1:B10")
     * @param sheetName - Optional sheet name
     * @returns Promise that resolves with the data from the spreadsheet
     */
    get(spreadsheetId: string, range: string, sheetName?: string): Promise<any[][]>;
    
    /**
     * Updates data in a Google Spreadsheet
     * @param spreadsheetId - The ID of the spreadsheet
     * @param range - The range to update (e.g., "A1:B10")
     * @param values - The values to update
     * @param sheetName - Optional sheet name
     * @returns Promise that resolves with the response from the API
     */
    update(spreadsheetId: string, range: string, values: any[][], sheetName?: string): Promise<SpreadsheetResponse>;
    
    /**
     * Clears data in a Google Spreadsheet
     * @param spreadsheetId - The ID of the spreadsheet
     * @param range - The range to clear (e.g., "A1:B10")
     * @param sheetName - Optional sheet name
     * @returns Promise that resolves with the response from the API
     */
    clear(spreadsheetId: string, range: string, sheetName?: string): Promise<SpreadsheetResponse>;
  }
  
  // Spreadsheet utility functions
  
  /**
   * Loads URLs from a Google Spreadsheet
   * @param spreadsheetId - The ID of the spreadsheet
   * @param sheetName - The name of the sheet
   * @param column - The column containing the URLs
   * @returns Promise that resolves with an array of URL objects
   */
  function loadUrlsFromSpreadsheet(
    spreadsheetId: string, 
    sheetName: string, 
    column: string
  ): Promise<Array<{value: string, row: number}>>;
  
  /**
   * Formats values for export to Google Sheets
   * @param mapping - Mapping of variables to spreadsheet columns
   * @param getVariableFunction - Function to retrieve variable values
   * @param verticalRotation - Whether to rotate data vertically
   * @returns Object containing the formatted data and range
   */
  function formatValuesForGoogleSheets(
    mapping: Record<string, string>, 
    getVariableFunction: (variableName: string) => any,
    verticalRotation?: boolean
  ): Promise<{data: any[][], range: string}>;
  
  /**
   * Rotates an array vertically for spreadsheet export
   * @param array - The array to rotate
   * @returns The rotated array
   */
  function rotateVerticalArray(array: any[]): any[][];
  
  /**
   * AI Integration
   */
  
  /**
   * Generates a message using AI
   * @param systemText - System prompt for the AI
   * @param assistantText - Assistant prompt for the AI
   * @returns Promise that resolves with the generated message
   */
  function generateMessageWithPrompt(systemText: string, assistantText: string): Promise<string>;
  
  /**
   * Database Integration
   */
  
  // SimpleDB interface
  interface SimpleDB {
    /**
     * Creates a new record in the database
     * @param id - The ID of the record
     * @param value - The value to store
     * @param table - The table to store in
     * @param callback - Callback function called when the operation completes
     */
    create(id: string, value: any, table: string, callback: (result: any) => void): void;
    
    /**
     * Reads a record from the database
     * @param id - The ID of the record to read
     * @param table - The table to read from
     * @param callback - Callback function called with the result
     */
    read(id: string, table: string, callback: (result: any) => void): void;
    
    /**
     * Updates a record in the database
     * @param id - The ID of the record to update
     * @param value - The new value
     * @param table - The table to update
     * @param callback - Callback function called when the operation completes
     */
    update(id: string, value: any, table: string, callback: (result: any) => void): void;
    
    /**
     * Deletes a record from the database
     * @param id - The ID of the record to delete
     * @param table - The table to delete from
     * @param callback - Callback function called when the operation completes
     */
    delete(id: string, table: string, callback: (result: any) => void): void;
  }
  
  // Database table constants
  const TABLE_SCENARIOS: string;
  const TABLE_EXECUTIONS: string;
  const TABLE_SCHEDULES: string;
  const TABLE_TRIGGERS: string;
}