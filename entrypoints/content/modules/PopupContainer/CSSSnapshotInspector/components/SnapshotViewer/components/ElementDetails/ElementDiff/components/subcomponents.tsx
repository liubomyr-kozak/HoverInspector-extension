import React from "react";
import {
  IconCaretDownFilled,
  IconCaretRightFilled,
  IconMinus,
  IconPlus,
  IconSearch,
  IconTilde,
} from "@tabler/icons-react";
import { AttributeChange, CSSCategory, CSSPropertyChange, ShorthandPropertyChange } from "../types.ts";
import { RenderLineWithColor } from "../utils/cssTokens.tsx";

export const Container: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 shadow-sm mb-3 font-mono text-xs">
    {children}
  </div>
);

export const Header: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">{children}</div>
);

export const CSSSelector: React.FC<{ selector: string }> = ({ selector }) => (
  <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
    <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">
      {selector} {"{"}
    </div>
  </div>
);

export const CSSClosing: React.FC = () => (
  <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
    <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">{"}"}</div>
  </div>
);

export const SearchBar: React.FC<{
  search: string;
  onSearchChange: (value: string) => void;
  show: boolean;
}> = ({ search, onSearchChange, show }) => {
  if (!show) return null;
  return (
    <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
      <div className="relative">
        <input
          type="text"
          placeholder="Search properties..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-8 pr-3 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <IconSearch
          size={14}
          className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500"
        />
      </div>
    </div>
  );
};

export const EmptySection: React.FC<{ message: string }> = ({ message }) => (
  <div className="text-center text-gray-500 dark:text-gray-400 py-4 text-xs">{message}</div>
);

export const CSSPropertyRow: React.FC<{ property: CSSPropertyChange }> = ({ property }) => {
  const icon =
    property.changeType === "added" ? (
      <IconPlus size={12} className="text-green-600" />
    ) : property.changeType === "removed" ? (
      <IconMinus size={12} className="text-red-600" />
    ) : property.changeType === "modified" ? (
      <IconTilde size={12} className="text-orange-600" />
    ) : null;

  const styles =
    property.changeType === "added"
      ? "bg-green-50 dark:bg-green-900/30 border-l-2 border-green-500 dark:border-green-600"
      : property.changeType === "removed"
        ? "bg-red-50 dark:bg-red-900/30 border-l-2 border-red-500 dark:border-red-600"
        : property.changeType === "modified"
          ? "bg-orange-50 dark:bg-orange-900/30 border-l-2 border-orange-500 dark:border-orange-600"
          : "";

  return (
    <div className={`rounded-sm ${styles}`}>
      <div className="text-gray-800 dark:text-gray-100 flex items-center gap-2 ml-1">
        {icon}
        <div className="ml-1 flex-1">
          <div>
            <span className="text-blue-600">{property.property}</span>
            {property.changeType === "removed" ? (
              <span className="text-xs text-gray-500 ml-2">
                <s className="text-red-600">
                  <RenderLineWithColor lineValue={property.oldValue || ""} />
                </s>
              </span>
            ) : property.changeType === "modified" ? (
              <span className="text-xs text-gray-500 ml-2">
                <span className="text-green-600">
                  <RenderLineWithColor lineValue={property.newValue || ""} />
                </span>
                <s className="text-red-600 ml-2">
                  <RenderLineWithColor lineValue={property.oldValue || ""} />
                </s>
              </span>
            ) : property.changeType === "added" ? (
              <span className="text-xs text-gray-500 ml-2">
                <span className="text-green-600">
                  <RenderLineWithColor lineValue={property.newValue || ""} />
                </span>
              </span>
            ) : (
              <>
                <span className="text-gray-600">: </span>
                <RenderLineWithColor lineValue={property.currentValue} />
                <span className="text-gray-600">;</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const ShorthandRow: React.FC<{
  shorthand: ShorthandPropertyChange;
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ shorthand, isExpanded, onToggle }) => {
  const icon =
    shorthand.changeType === "added" ? (
      <IconPlus size={12} className="text-green-600" />
    ) : shorthand.changeType === "removed" ? (
      <IconMinus size={12} className="text-red-600" />
    ) : shorthand.changeType === "modified" ? (
      <IconTilde size={12} className="text-orange-600" />
    ) : null;

  const styles =
    shorthand.changeType === "added"
      ? "bg-green-50 dark:bg-green-900/30 border-l-2 border-green-500 dark:border-green-600"
      : shorthand.changeType === "removed"
        ? "bg-red-50 dark:bg-red-900/30 border-l-2 border-red-500 dark:border-red-600"
        : shorthand.changeType === "modified"
          ? "bg-orange-50 dark:bg-orange-900/30 border-l-2 border-orange-500 dark:border-orange-600"
          : "";

  let shorthandValue = "";
  if (shorthand.shorthand === "margin" || shorthand.shorthand === "padding") {
    const [top, right, bottom, left] = shorthand.individual.map((p) => shorthand.values[p]);
    if (top === right && right === bottom && bottom === left) shorthandValue = top;
    else if (top === bottom && right === left) shorthandValue = `${top} ${right}`;
    else if (right === left) shorthandValue = `${top} ${right} ${bottom}`;
    else shorthandValue = `${top} ${right} ${bottom} ${left}`;
  } else if (shorthand.shorthand === "border-style" || shorthand.shorthand === "border-width" || shorthand.shorthand === "border-color") {
    const [top, right, bottom, left] = shorthand.individual.map((p) => shorthand.values[p]);
    if (top === right && right === bottom && bottom === left) shorthandValue = top;
    else if (top === bottom && right === left) shorthandValue = `${top} ${right}`;
    else if (right === left) shorthandValue = `${top} ${right} ${bottom}`;
    else shorthandValue = `${top} ${right} ${bottom} ${left}`;
  } else {
    shorthandValue = shorthand.individual.map((p) => shorthand.values[p]).join(" ");
  }

  return (
    <div className={`rounded-sm ${styles}`}>
      <div className="text-gray-800 dark:text-gray-100">
        <div
          className="flex items-center gap-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ml-1"
          onClick={onToggle}
        >
          {icon}
          <div style={{ marginLeft: "-5px", width: "9px" }}>
            {isExpanded ? (
              <IconCaretDownFilled size={12} className="text-gray-500 dark:text-gray-400" />
            ) : (
              <IconCaretRightFilled size={12} className="text-gray-500 dark:text-gray-400" />
            )}
          </div>
          <div className="flex-1">
            <span className="text-blue-600">{shorthand.shorthand}</span>
            <span className="text-gray-600">: </span>
            <span className="text-green-600">
              <RenderLineWithColor lineValue={shorthandValue} />
            </span>
            <span className="text-gray-600">;</span>
          </div>
        </div>
        {isExpanded && (
          <div className="ml-6 mx-1 border-l border-gray-200 pl-4">
            {shorthand.individual.map((prop) => (
              <div key={prop} className="text-xs">
                <span className="text-blue-500">{prop}</span>
                <span className="text-gray-500">: </span>
                <span className="text-green-500">
                  <RenderLineWithColor lineValue={shorthand.values[prop]} />
                </span>
                <span className="text-gray-500">;</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const CategorySection: React.FC<{
  category: CSSCategory;
  isExpanded: boolean;
  onToggle: () => void;
  searchTerm: string;
  shorthandStates: Record<string, boolean>;
  onShorthandToggle: (shorthand: string) => void;
}> = ({ category, isExpanded, onToggle, searchTerm, shorthandStates, onShorthandToggle }) => {
  const filteredProperties = searchTerm
    ? category.properties.filter((p) => p.property.toLowerCase().includes(searchTerm.toLowerCase()))
    : category.properties;
  const filteredShorthands = searchTerm
    ? category.shorthands.filter((s) => s.shorthand.toLowerCase().includes(searchTerm.toLowerCase()))
    : category.shorthands;
  if (filteredProperties.length === 0 && filteredShorthands.length === 0) return null;

  return (
    <div className="border-b border-gray-100 dark:border-gray-800 last:border-b-0">
      <div
        className="px-4 py-2 bg-gray-50 dark:bg-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
        onClick={onToggle}
      >
        {isExpanded ? (
          <IconCaretDownFilled size={12} className="text-gray-500 dark:text-gray-400" />
        ) : (
          <IconCaretRightFilled size={12} className="text-gray-500 dark:text-gray-400" />
        )}
        <span className="text-xs text-gray-600 dark:text-gray-400">/* {category.label} */</span>
      </div>
      {isExpanded && (
        <div className="px-4 pb-2">
          {filteredShorthands.map((sh, i) => (
            <ShorthandRow
              key={`${sh.shorthand}-${i}`}
              shorthand={sh}
              isExpanded={shorthandStates[sh.shorthand] || false}
              onToggle={() => onShorthandToggle(sh.shorthand)}
            />
          ))}
          {filteredProperties.map((prop, i) => (
            <CSSPropertyRow key={`${prop.property}-${i}`} property={prop} />
          ))}
        </div>
      )}
    </div>
  );
};

export const AttributeRow: React.FC<{ attribute: AttributeChange }> = ({ attribute }) => {
  const icon =
    attribute.changeType === "added" ? (
      <IconPlus size={12} className="text-green-600" />
    ) : attribute.changeType === "removed" ? (
      <IconMinus size={12} className="text-red-600" />
    ) : attribute.changeType === "modified" ? (
      <IconTilde size={12} className="text-orange-600" />
    ) : null;
  const styles =
    attribute.changeType === "added"
      ? "bg-green-50 dark:bg-green-900/30 border-l-2 border-green-500 dark:border-green-600"
      : attribute.changeType === "removed"
        ? "bg-red-50 dark:bg-red-900/30 border-l-2 border-red-500 dark:border-red-600"
        : attribute.changeType === "modified"
          ? "bg-orange-50 dark:bg-orange-900/30 border-l-2 border-orange-500 dark:border-orange-600"
          : "";
  return (
    <div className={`rounded-sm ${styles}`}>
      <div className="text-gray-800 dark:text-gray-100 flex items-center gap-2 ml-1">
        {icon}
        <div className="ml-1 flex-1">
          <div>
            <span className="text-purple-600">{attribute.attribute}</span>
            {attribute.changeType === "removed" ? (
              <span className="text-xs text-gray-500 ml-2">
                <span className="text-red-600">"{attribute.oldValue}"</span>
              </span>
            ) : attribute.changeType === "modified" ? (
              <span className="text-xs text-gray-500 ml-2">
                <span className="text-green-600">"{attribute.newValue}"</span>
                <span className="mx-1 text-gray-400">→</span>
                <span className="text-red-600">"{attribute.oldValue}"</span>
              </span>
            ) : attribute.changeType === "added" ? (
              <span className="text-xs text-gray-500 ml-2">
                <span className="text-green-600">"{attribute.newValue}"</span>
              </span>
            ) : (
              <>
                <span className="text-gray-600">="</span>
                <span className="text-green-600">"{attribute.currentValue}"</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const ClassRow: React.FC<{ classNameStr: string; changeType: "added" | "removed" }> = ({
  classNameStr,
  changeType,
}) => {
  const icon =
    changeType === "added" ? (
      <IconPlus size={12} className="text-green-600" />
    ) : (
      <IconMinus size={12} className="text-red-600" />
    );
  const styles =
    changeType === "added"
      ? "bg-green-50 dark:bg-green-900/30 border-l-2 border-green-500 dark:border-green-600"
      : "bg-red-50 dark:bg-red-900/30 border-l-2 border-red-500 dark:border-red-600";
  return (
    <div className={`rounded-sm ${styles}`}>
      <div className="text-gray-800 dark:text-gray-100 flex items-center gap-2 ml-1">
        {icon}
        <div className="ml-1 flex-1">
          <div>
            <span className="text-indigo-600">{classNameStr}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
              {changeType === "added" ? "(added)" : "(removed)"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
