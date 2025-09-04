// Local utils file to provide missing exports and re-export from correct packages
// Create local NewLineSymbol enum (not properly exported from packages)
export var NewLineSymbol;
(function (NewLineSymbol) {
    NewLineSymbol[NewLineSymbol["CRLF"] = 1] = "CRLF";
    NewLineSymbol[NewLineSymbol["CR"] = 2] = "CR";
    NewLineSymbol[NewLineSymbol["LF"] = 3] = "LF";
    NewLineSymbol[NewLineSymbol["NEWLINE"] = 4] = "NEWLINE";
    NewLineSymbol[NewLineSymbol["NORMAL"] = 5] = "NORMAL";
    NewLineSymbol[NewLineSymbol["NULL"] = 6] = "NULL";
})(NewLineSymbol || (NewLineSymbol = {}));
// Re-export all available utilities from @git-diff-view/utils
export * from "@git-diff-view/utils";
// Add missing constant that's not in @git-diff-view/utils but needed by components
export const expandLineNumberColorName = "--diff-expand-lineNumber-color--";
// Create DiffModeEnum as a flag enum based on usage patterns found in the code
export var DiffModeEnum;
(function (DiffModeEnum) {
    DiffModeEnum[DiffModeEnum["SplitGitHub"] = 1] = "SplitGitHub";
    DiffModeEnum[DiffModeEnum["SplitGitLab"] = 2] = "SplitGitLab";
    DiffModeEnum[DiffModeEnum["Split"] = 3] = "Split";
    DiffModeEnum[DiffModeEnum["Unified"] = 4] = "Unified";
})(DiffModeEnum || (DiffModeEnum = {}));
