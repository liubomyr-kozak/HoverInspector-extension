import React, { useState, useMemo } from "react";
import { IconUpload, IconCheck, IconX } from "@tabler/icons-react";

interface ImportSectionProps {
  title: string;
  placeholder: string;
  currentValues: string[];
  onImport?: (values: string[]) => void;
  parseValue?: (value: string) => string; // Optional value transformer
}

export const ImportSection: React.FC<ImportSectionProps> = ({
  title,
  placeholder,
  currentValues,
  onImport,
  parseValue = (value) => value.trim(),
}) => {
  const [importText, setImportText] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  // Parse imported values from text (split by spaces or newlines)
  const importedValues = useMemo(() => {
    if (!importText.trim()) return [];

    return importText
      .split(/[\s\n]+/)
      .map((value) => parseValue(value))
      .filter((value) => value.length > 0);
  }, [importText, parseValue]);

  // Categorize imported values based on matches with current values
  const categorizedValues = useMemo(() => {
    const currentSet = new Set(currentValues.map((val) => val.toLowerCase()));

    return importedValues.map((value) => ({
      value,
      isMatch: currentSet.has(value.toLowerCase()),
    }));
  }, [importedValues, currentValues]);

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
            <p className="text-xs text-gray-500 mt-1">Separate values with spaces or new lines</p>
          </div>
          // this part is not userfrendly
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
                        : "bg-red-100 text-red-800 border border-red-200"
                    }`}
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
                  New: {categorizedValues.filter((item) => !item.isMatch).length}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
