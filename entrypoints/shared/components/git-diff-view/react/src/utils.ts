// Local utils file to provide missing exports and re-export from correct packages

// Create local NewLineSymbol enum (not properly exported from packages)
export enum NewLineSymbol {
  CRLF = 1,
  CR = 2,
  LF = 3,
  NEWLINE = 4,
  NORMAL = 5,
  NULL = 6,
}

// Re-export all available utilities from @git-diff-view/utils
export * from "@git-diff-view/utils";

// Add missing constant that's not in @git-diff-view/utils but needed by components
export const expandLineNumberColorName = "--diff-expand-lineNumber-color--";

// Create DiffModeEnum as a flag enum based on usage patterns found in the code
export enum DiffModeEnum {
  SplitGitHub = 1,
  SplitGitLab = 2,
  Split = 3,
  Unified = 4,
}
