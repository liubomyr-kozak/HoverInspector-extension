/**
 * Automation Easy - Type Definitions Index
 * 
 * This file serves as the entry point for all type definitions for the Automation Easy extension.
 * It references all the other type definition files to make them available to TypeScript code.
 */

/// <reference path="./types.d.ts" />
/// <reference path="./dto.d.ts" />
/// <reference path="./actions.d.ts" />
/// <reference path="./executor.d.ts" />
/// <reference path="./integration.d.ts" />

/**
 * Global declaration to make the AutomationEasy namespace available globally
 */
declare global {
  /**
   * The AutomationEasy namespace contains all types and interfaces for the Automation Easy extension.
   */
  namespace AutomationEasy {
    // This namespace is defined in the referenced files
  }
}

/**
 * Export the AutomationEasy namespace for module imports
 */
export = AutomationEasy;
export as namespace AutomationEasy;