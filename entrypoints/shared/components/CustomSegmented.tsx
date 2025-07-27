import React from "react";

type SegmentedOption = {
  value: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  activeClassName?: string;
};

type CustomSegmentedProps = {
  value: string;
  onChange: (value: string) => void;
  options: SegmentedOption[];
  className?: string;
  inactiveClassName?: string;
};

const CustomSegmented: React.FC<CustomSegmentedProps> = ({
  value,
  onChange,
  options,
  className = "",
  inactiveClassName = "bg-white text-gray-500 hover:bg-gray-100",
}) => {
  return (
    <div className={`inline-flex w-full rounded-xl border border-gray-300 overflow-hidden w-full ${className}`}>
      {options.map((option) => {
        const isActive = option.value === value;
        const activeClass = option.activeClassName ?? "bg-gray-200 text-black";

        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-sm font-medium transition-colors duration-200 ${
              isActive ? activeClass : inactiveClassName
            }`}
          >
            {option.icon}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default CustomSegmented;
