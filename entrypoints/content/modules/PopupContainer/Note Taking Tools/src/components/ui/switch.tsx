"use client";

import * as React from "react";
import { Switch as AntSwitch, SwitchProps as AntSwitchProps } from "antd";

import { cn } from "./utils";

type SwitchProps = {
  className?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  onCheckedChange?: (checked: boolean) => void;
} & Omit<AntSwitchProps, "checked" | "defaultChecked" | "onChange">;

function Switch({ className, checked, defaultChecked, disabled, onCheckedChange, ...rest }: SwitchProps) {
  return (
    <AntSwitch
      data-slot="switch"
      className={cn("", className)}
      checked={checked}
      defaultChecked={defaultChecked}
      disabled={disabled}
      onChange={(val) => onCheckedChange?.(val)}
      {...rest}
    />
  );
}

export { Switch };
