import React from "react";
import type { CSSDiff } from "@entrypoints/content/modules/PopupContainer/CSSSnapshotInspector/components/utils/cssParser.ts";
import { generateClassCSS } from "../utils/cssGenerators";

interface NodeWithClassRules {
  classRules?: Record<string, Record<string, any>>;
}

interface ClassViewProps {
  diff: CSSDiff | null;
  search: string;
  leftNode: NodeWithClassRules | null;
  rightNode: NodeWithClassRules | null;
}

interface ClassDiff {
  added: Set<string>;
  removed: Set<string>;
  modified: Map<string, { oldProps: Record<string, any>; newProps: Record<string, any> }>;
  unchanged: Set<string>;
}

const getClassDifferences = (leftNode: NodeWithClassRules | null, rightNode: NodeWithClassRules | null): ClassDiff => {
  const leftClasses = leftNode?.classRules || {};
  const rightClasses = rightNode?.classRules || {};

  const leftClassNames = new Set(Object.keys(leftClasses));
  const rightClassNames = new Set(Object.keys(rightClasses));

  const added = new Set<string>();
  const removed = new Set<string>();
  const modified = new Map<string, { oldProps: Record<string, any>; newProps: Record<string, any> }>();
  const unchanged = new Set<string>();

  // Find added classes
  rightClassNames.forEach((className) => {
    if (!leftClassNames.has(className)) {
      added.add(className);
    }
  });

  // Find removed classes
  leftClassNames.forEach((className) => {
    if (!rightClassNames.has(className)) {
      removed.add(className);
    }
  });

  // Find modified and unchanged classes
  leftClassNames.forEach((className) => {
    if (rightClassNames.has(className)) {
      const oldProps = leftClasses[className] || {};
      const newProps = rightClasses[className] || {};

      const oldStr = JSON.stringify(oldProps);
      const newStr = JSON.stringify(newProps);

      if (oldStr !== newStr) {
        modified.set(className, { oldProps, newProps });
      } else {
        unchanged.add(className);
      }
    }
  });

  return { added, removed, modified, unchanged };
};

const renderClassRule = (
  className: string,
  rules: Record<string, any>,
  type: "added" | "removed" | "modified" | "unchanged",
  search: string,
) => {
  const searchLower = search.toLowerCase();
  const classNameLower = className.toLowerCase();
  const rulesStr = Object.entries(rules)
    .map(([prop, value]) => `${prop}: ${value};`)
    .join(" ")
    .toLowerCase();

  // Skip if search doesn't match
  if (search.trim() && !classNameLower.includes(searchLower) && !rulesStr.includes(searchLower)) {
    return null;
  }

  const properties = Object.entries(rules)
    .map(([prop, value]) => `  ${prop}: ${value};`)
    .join("\n");

  let bgColor = "bg-gray-50";
  let borderColor = "border-gray-200";
  let textColor = "text-gray-800";

  switch (type) {
    case "added":
      bgColor = "bg-green-50";
      borderColor = "border-green-200";
      textColor = "text-green-800";
      break;
    case "removed":
      bgColor = "bg-red-50";
      borderColor = "border-red-200";
      textColor = "text-red-800";
      break;
    case "modified":
      bgColor = "bg-blue-50";
      borderColor = "border-blue-200";
      textColor = "text-blue-800";
      break;
  }

  return (
    <div key={`${className}-${type}`} className={`rounded-lg border ${borderColor} ${bgColor} todo-compact-mode`}>
      <pre className="p-3 text-xs font-mono todo-high-contrast">
        <code className={textColor}>{`.${className} {\n${properties}\n}`}</code>
      </pre>
    </div>
  );
};

const renderModifiedClass = (
  className: string,
  oldProps: Record<string, any>,
  newProps: Record<string, any>,
  search: string,
) => {
  const searchLower = search.toLowerCase();
  const classNameLower = className.toLowerCase();
  const oldStr = Object.entries(oldProps)
    .map(([prop, value]) => `${prop}: ${value};`)
    .join(" ")
    .toLowerCase();
  const newStr = Object.entries(newProps)
    .map(([prop, value]) => `${prop}: ${value};`)
    .join(" ")
    .toLowerCase();

  // Skip if search doesn't match
  if (
    search.trim() &&
    !classNameLower.includes(searchLower) &&
    !oldStr.includes(searchLower) &&
    !newStr.includes(searchLower)
  ) {
    return null;
  }

  const oldProperties = Object.entries(oldProps)
    .map(([prop, value]) => `  ${prop}: ${value};`)
    .join("\n");

  const newProperties = Object.entries(newProps)
    .map(([prop, value]) => `  ${prop}: ${value};`)
    .join("\n");

  return (
    <div key={`${className}-modified`} className="rounded-lg border border-blue-200 bg-blue-50 mb-3 todo-compact-mode">
      <div className="px-3 py-2 border-b border-blue-200 text-blue-800 font-semibold text-sm todo-large-text">
        .{className} (Modified)
      </div>
      <div className="p-3 grid grid-cols-2 gap-3">
        <div className="bg-red-50 border border-red-200 rounded px-2 py-2">
          <div className="text-red-700 text-xs font-semibold mb-1">Before</div>
          <pre className="text-xs font-mono todo-high-contrast">
            <code className="text-red-700">{`.${className} {\n${oldProperties}\n}`}</code>
          </pre>
        </div>
        <div className="bg-green-50 border border-green-200 rounded px-2 py-2">
          <div className="text-green-700 text-xs font-semibold mb-1">After</div>
          <pre className="text-xs font-mono todo-high-contrast">
            <code className="text-green-700">{`.${className} {\n${newProperties}\n}`}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};

export const ClassView: React.FC<ClassViewProps> = ({ diff, search, leftNode, rightNode }) => {
  const classDiff = getClassDifferences(leftNode, rightNode);

  const hasAnyChanges = classDiff.added.size > 0 || classDiff.removed.size > 0 || classDiff.modified.size > 0;

  if (!hasAnyChanges && classDiff.unchanged.size === 0) {
    return <div className="p-4 text-gray-500 text-center max-h-96 overflow-auto">No classes found</div>;
  }

  const leftClasses = leftNode?.classRules || {};
  const rightClasses = rightNode?.classRules || {};

  return (
    <div className="max-h-96 overflow-auto p-4 space-y-2">
      {/* Added classes */}
      {Array.from(classDiff.added).map((className) =>
        renderClassRule(className, rightClasses[className] || {}, "added", search),
      )}

      {/* Removed classes */}
      {Array.from(classDiff.removed).map((className) =>
        renderClassRule(className, leftClasses[className] || {}, "removed", search),
      )}

      {/* Modified classes */}
      {Array.from(classDiff.modified.entries()).map(([className, { oldProps, newProps }]) =>
        renderModifiedClass(className, oldProps, newProps, search),
      )}

      {/* Unchanged classes */}
      {Array.from(classDiff.unchanged).map((className) =>
        renderClassRule(className, rightClasses[className] || {}, "unchanged", search),
      )}

      {search.trim() &&
        [...classDiff.added, ...classDiff.removed, ...classDiff.unchanged].length === 0 &&
        classDiff.modified.size === 0 && <div className="p-4 text-gray-500 text-center">No matching classes found</div>}
    </div>
  );
};
