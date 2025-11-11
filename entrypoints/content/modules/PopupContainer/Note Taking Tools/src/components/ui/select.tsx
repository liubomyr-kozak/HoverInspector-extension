"use client";

import * as React from "react";
import "antd/dist/reset.css";
import { Select as AntSelect, SelectProps as AntSelectProps } from "antd";
import { cn } from "./utils";

type RootProps<ValueType = any> = AntSelectProps<ValueType>;

function Select<ValueType = any>({ className, ...props }: RootProps<ValueType> & { className?: string }) {
  return <AntSelect className={cn(className)} data-slot="select" {...props} />;
}

// Structural helpers (no-ops to ease migration)
function SelectGroup(props: React.PropsWithChildren) {
  return <>{props.children}</>;
}
function SelectValue(props: React.PropsWithChildren) {
  return null;
}
function SelectTrigger(props: React.PropsWithChildren<{ className?: string }>) {
  return (
    <span className={cn("hidden", props.className)} data-slot="select-trigger">
      {props.children}
    </span>
  );
}
function SelectContent(props: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div className={cn("hidden", props.className)} data-slot="select-content">
      {props.children}
    </div>
  );
}
function SelectLabel(props: React.PropsWithChildren<{ className?: string }>) {
  return (
    <span className={cn("hidden", props.className)} data-slot="select-label">
      {props.children}
    </span>
  );
}

type ItemProps = {
  className?: string;
  value: string | number;
  children?: React.ReactNode;
  disabled?: boolean;
};
function SelectItem({ className, value, children, disabled }: ItemProps) {
  return (
    <AntSelect.Option value={value} disabled={disabled} className={cn(className)} data-slot="select-item">
      {children}
    </AntSelect.Option>
  );
}

function SelectSeparator() {
  return null;
}
function SelectScrollUpButton() {
  return null;
}
function SelectScrollDownButton() {
  return null;
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
  );
}

function SelectLabel({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn("text-muted-foreground px-2 py-1.5 text-xs", className)}
      {...props}
    />
  );
}

function SelectItem({ className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "focus:bg-accent focus:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        className,
      )}
      {...props}
    >
      <span className="absolute right-2 flex size-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

function SelectSeparator({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("bg-border pointer-events-none -mx-1 my-1 h-px", className)}
      {...props}
    />
  );
}

function SelectScrollUpButton({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn("flex cursor-default items-center justify-center py-1", className)}
      {...props}
    >
      <ChevronUpIcon className="size-4" />
    </SelectPrimitive.ScrollUpButton>
  );
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn("flex cursor-default items-center justify-center py-1", className)}
      {...props}
    >
      <ChevronDownIcon className="size-4" />
    </SelectPrimitive.ScrollDownButton>
  );
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
