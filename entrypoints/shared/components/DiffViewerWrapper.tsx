import React, { useMemo } from "react";
import { DiffModeEnum, DiffView, SplitSide } from "./git-diff-view/react/src";
import { generateDiffFile } from "@git-diff-view/file";

import diffViewCss from "@git-diff-view/react/styles/diff-view.css?inline";

// The library fades line numbers to 50% (#a8a8a8, 2.3:1) and greys hunk headers to #777 on blue (3.9:1)
const diffViewContrastCss = `
.diff-tailwindcss-wrapper .diff-line-num .opacity-\\[0\\.5\\] {
  opacity: 1;
}
.diff-tailwindcss-wrapper[data-theme="light"] .diff-style-root {
  --diff-hunk-content-color--: #4b5563;
}
`;

// Import types from the old implementation for compatibility
export interface DiffViewerWrapperProps {
  // Old react-diff-viewer-continued props
  oldValue: string;
  newValue: string;
  splitView?: boolean;
  linesOffset?: number;
  disableWordDiff?: boolean;
  compareMethod?: string; // We'll ignore this as git-diff-view has its own algorithm
  extraLinesSurroundingDiff?: number;
  hideLineNumbers?: boolean;
  displaySingleLineNumbers?: boolean;
  alwaysShowLines?: string[];
  showDiffOnly?: boolean;
  renderContent?: (source: string) => React.ReactElement;
  codeFoldMessageRenderer?: (
    totalFoldedLines: number,
    leftStartLineNumber: number,
    rightStartLineNumber: number,
  ) => React.ReactElement;
  onLineNumberClick?: (lineId: string, event: React.MouseEvent<HTMLElement>) => void;
  onLineClick?: (lineId: string, metadata: any, event: React.MouseEvent<HTMLElement>) => void;
  renderGutter?: (data: any) => React.ReactElement;
  highlightLines?: string[];
  styles?: any;
  useDarkTheme?: boolean;
  summary?: string | React.ReactElement;
  leftTitle?: string | React.ReactElement;
  rightTitle?: string | React.ReactElement;
  nonce?: string;
  container?: HTMLElement | ShadowRoot | null;
  // Wrap long lines instead of cutting them off (narrow panels)
  wrapLines?: boolean;
}

/**
 * Compatibility wrapper for react-diff-viewer-continued that uses git-diff-view internally
 */
export const DiffViewerWrapper: React.FC<DiffViewerWrapperProps> = ({
  oldValue,
  newValue,
  splitView = true,
  useDarkTheme = false,
  leftTitle,
  rightTitle,
  hideLineNumbers = false,
  showDiffOnly = true,
  onLineClick,
  wrapLines = false,
  // Other props are ignored for now in this initial implementation
  ...otherProps
}) => {
  // Inject CSS into shadow DOM for proper styling
  const diffFile = useMemo(() => {
    try {
      // Validate input values - ensure they are strings and not empty
      if (typeof oldValue !== "string" || typeof newValue !== "string") {
        console.warn("DiffViewerWrapper: Invalid input types, expected strings");
        return null;
      }

      // Handle empty values gracefully
      const safeOldValue = oldValue || "";
      const safeNewValue = newValue || "";

      // If both values are identical, return early to avoid diff parsing errors
      if (safeOldValue === safeNewValue) {
        return "IDENTICAL_CONTENT";
      }

      // Use generateDiffFile as shown in the working example
      const oldFileName = typeof leftTitle === "string" ? leftTitle : "Old File";
      const newFileName = typeof rightTitle === "string" ? rightTitle : "New File";

      const instance = generateDiffFile(
        oldFileName,
        safeOldValue,
        newFileName,
        safeNewValue,
        "tsx", // old file language
        "tsx", // new file language
      );

      instance.initRaw();
      return instance;
    } catch (error) {
      console.error("DiffViewerWrapper: Error creating DiffFile:", error);
      console.error("DiffViewerWrapper: Input values:", {
        oldValue:
          typeof oldValue === "string"
            ? oldValue?.substring(0, 100) + (oldValue?.length > 100 ? "..." : "")
            : typeof oldValue,
        newValue:
          typeof newValue === "string"
            ? newValue?.substring(0, 100) + (newValue?.length > 100 ? "..." : "")
            : typeof newValue,
        leftTitle,
        rightTitle,
      });

      // Try to create a fallback diff with empty content if original values cause issues
      try {
        const fallbackInstance = generateDiffFile("Fallback Old", "", "Fallback New", "", "txt", "txt");
        fallbackInstance.initRaw();
        return fallbackInstance;
      } catch (fallbackError) {
        console.error("DiffViewerWrapper: Fallback also failed:", fallbackError);
        return null;
      }
    }
  }, [oldValue, newValue, leftTitle, rightTitle]);

  // Handle identical content case: there is nothing to diff, but keep every line clickable
  if (diffFile === "IDENTICAL_CONTENT") {
    const lines = (oldValue || "").split("\n");
    return (
      <div className="h-full">
        <div style={{ padding: "12px", fontFamily: "monospace", fontSize: "12px", backgroundColor: "#f8f9fa" }}>
          <div style={{ marginBottom: "8px", fontWeight: 600, color: "#166534", fontFamily: "inherit" }}>
            No differences found{leftTitle && rightTitle ? ` between ${leftTitle} and ${rightTitle}` : ""}
          </div>
          <div style={{ overflow: "auto", maxHeight: "calc(100vh - 100px)" }}>
            {lines.map((line, index) => (
              <div
                key={index}
                onClick={(event) => onLineClick?.(`L${index + 1}`, { lineNumber: index + 1, side: SplitSide.old }, event)}
                style={{ whiteSpace: wrapLines ? "pre-wrap" : "pre", wordBreak: wrapLines ? "break-all" : undefined, cursor: onLineClick ? "pointer" : "default", lineHeight: "20px" }}
              >
                {line}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!diffFile) {
    return (
      <div style={{ padding: "20px", color: "#666", textAlign: "center" }}>
        <div>Unable to load diff viewer</div>
        <div style={{ fontSize: "12px", marginTop: "5px" }}>Check browser console for detailed error information</div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <style>{diffViewCss + diffViewContrastCss}</style>
      <DiffView
        diffFile={diffFile}
        diffViewMode={splitView ? DiffModeEnum.SplitGitHub : DiffModeEnum.Unified}
        diffViewTheme={useDarkTheme ? "dark" : "light"}
        diffViewHighlight={true}
        diffViewWrap={wrapLines}
        className="diff-viewer-wrapper"
        onLineClick={(lineNumber: number, side: SplitSide, event: React.MouseEvent<HTMLElement>) => {
          if (onLineClick) {
            // Convert to the expected format for compatibility
            const lineId = `${side === SplitSide.old ? "L" : "R"}${lineNumber}`;
            const metadata = { lineNumber, side };
            onLineClick(lineId, metadata, event);
          }
        }}
      />
    </div>
  );
};

// Export as default to maintain compatibility
export default DiffViewerWrapper;
