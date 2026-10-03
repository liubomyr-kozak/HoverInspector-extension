import React from "react";

type SegmentedOption = {
  value: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  /** Overrides the selected style; by default every segmented control uses the primary colour */
  activeClassName?: string;
};

type CustomSegmentedProps = {
  value: string;
  onChange: (value: string) => void;
  options: SegmentedOption[];
  className?: string;
  inactiveClassName?: string;
  /** Accessible name of the group, e.g. the visible heading above it */
  ariaLabel?: string;
};

const CustomSegmented: React.FC<CustomSegmentedProps> = ({
  value,
  onChange,
  options,
  className = "",
  inactiveClassName = "bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900",
  ariaLabel,
}) => {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={`inline-flex w-full rounded-md border border-gray-300 overflow-hidden ${className}`}
    >
      {options.map((option, index) => {
        const isActive = option.value === value;
        const activeClass = option.activeClassName ?? "bg-blue-600 text-white";

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(option.value)}
            className={`flex flex-1 min-w-0 cursor-pointer items-center justify-center gap-2 px-3 h-8 text-sm font-medium transition-colors duration-150 focus-visible:-outline-offset-2 ${
              index > 0 ? "border-l border-gray-300" : ""
            } ${isActive ? activeClass : inactiveClassName}`}
          >
            {option.icon}
            <span className="truncate">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default CustomSegmented;
