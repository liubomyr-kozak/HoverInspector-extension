import React, { useState, useMemo } from "react";
import { IconUpload, IconCheck, IconX } from "@tabler/icons-react";

interface ImportSectionProps {
  title: string;
  placeholder: string;
  currentValues: string[];
  onImport?: (values: string[]) => void;
  parseValue?: (value: string) => string; // Optional value transformer
  // Canonical form used to match imported and page values (e.g. #fff and rgb(255, 255, 255));
  // null marks a value that isn't valid
  normalize?: (value: string) => string | null;
}

/**
 * Canonical pixel length for matching: "1rem", "16" and "16px" all give "16px" (1rem = 16px);
 * percentages are kept, anything else isn't a length
 */
export const normalizeLength = (value: string): string | null => {
  const match = /^(-?\d*\.?\d+)(px|rem|em|%)?$/.exec(value.trim().toLowerCase());
  if (!match) return null;
  if (match[2] === "%") return `${parseFloat(match[1])}%`;
  const pixels = parseFloat(match[1]) * (match[2] === "rem" || match[2] === "em" ? 16 : 1);
  return `${Math.round(pixels * 100) / 100}px`;
};

/**
 * Splits pasted values on spaces, commas, semicolons and new lines, but not inside parentheses,
 * so "rgb(1, 2, 3), #fff" gives two values
 */
const splitValues = (text: string): string[] => {
  const values: string[] = [];
  let current = "";
  let depth = 0;
  for (const char of text) {
    if (char === "(") depth++;
    if (char === ")") depth = Math.max(0, depth - 1);
    if (depth === 0 && /[\s,;]/.test(char)) {
      if (current) values.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  if (current) values.push(current);
  return values;
};

export const ImportSection: React.FC<ImportSectionProps> = ({
  title,
  placeholder,
  currentValues,
  onImport,
  parseValue = (value) => value.trim(),
  normalize = (value) => value.toLowerCase(),
}) => {
  const [importText, setImportText] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  // Parse imported values from text (split by spaces or newlines)
  const importedValues = useMemo(() => {
    if (!importText.trim()) return [];

    return splitValues(importText)
      .map((value) => parseValue(value))
      .filter((value) => value.length > 0);
  }, [importText, parseValue]);

  // Categorize imported values based on matches with current values
  const categorizedValues = useMemo(() => {
    const currentSet = new Set(currentValues.map((val) => normalize(val)).filter(Boolean));

    return importedValues.map((value) => {
      const normalized = normalize(value);
      return {
        value,
        isInvalid: normalized === null,
        isMatch: normalized !== null && currentSet.has(normalized),
      };
    });
  }, [importedValues, currentValues, normalize]);

  const handleImport = () => {
    if (onImport && importedValues.length > 0) {
      onImport(importedValues);
    }
  };

  return (
    <div className="mb-4 p-3 border border-gray-200 rounded-lg bg-gray-50">
      <div className="flex items-center justify-between mb-2">
        <h5 className="text-sm font-medium text-gray-700">Import {title}</h5>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          <IconUpload size={14} />
          {isExpanded ? "Hide" : "Show"} Import
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-3">
          <div>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder={placeholder}
              className="w-full h-20 p-2 text-sm border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Separate values with spaces, commas or new lines</p>
          </div>
          {importedValues.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-gray-600">Imported Values ({importedValues.length}):</span>
                {onImport && (
                  <button
                    onClick={handleImport}
                    className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                  >
                    Apply Import
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-1">
                {categorizedValues.map((item, index) => (
                  <span
                    key={index}
                    className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded ${
                      item.isMatch
                        ? "bg-green-100 text-green-800 border border-green-200"
                        : item.isInvalid
                          ? "bg-gray-100 text-gray-500 border border-gray-200 line-through"
                          : "bg-red-100 text-red-800 border border-red-200"
                    }`}
                    title={item.isMatch ? "Used on this page" : item.isInvalid ? "Not a valid value" : "Not used on this page"}
                  >
                    {item.isMatch ? (
                      <IconCheck size={10} className="text-green-600" />
                    ) : (
                      <IconX size={10} className="text-red-600" />
                    )}
                    {item.value}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Matches: {categorizedValues.filter((item) => item.isMatch).length}
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  Not on this page: {categorizedValues.filter((item) => !item.isMatch && !item.isInvalid).length}
                </span>
                {categorizedValues.some((item) => item.isInvalid) && (
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    Invalid: {categorizedValues.filter((item) => item.isInvalid).length}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
