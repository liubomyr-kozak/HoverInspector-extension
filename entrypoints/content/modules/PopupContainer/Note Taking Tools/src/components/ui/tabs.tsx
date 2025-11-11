"use client";

import * as React from "react";
import { Tabs as AntTabs } from "antd";
import { cn } from "./utils";

type TabsRootProps = {
  className?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (key: string) => void;
  destroyInactiveTabPane?: boolean;
  children?: React.ReactNode;
};

type TabsTriggerProps = {
  className?: string;
  value: string;
  children?: React.ReactNode;
};

type TabsContentProps = {
  className?: string;
  value: string;
  children?: React.ReactNode;
};

function isElementOf(
  node: any,
  comp: React.JSXElementConstructor<any>,
): node is React.ReactElement {
  return React.isValidElement(node) && node.type === comp;
}

function flattenChildren(children: React.ReactNode): React.ReactElement[] {
  const out: React.ReactElement[] = [];
  React.Children.forEach(children as any, (child) => {
    if (!child) return;
    if (Array.isArray(child)) {
      out.push(...flattenChildren(child));
    } else if (React.isValidElement(child)) {
      out.push(child);
      if (child.props && child.props.children) {
        out.push(...flattenChildren(child.props.children));
      }
    }
  });
  return out;
}

function Tabs({ className, value, defaultValue, onValueChange, destroyInactiveTabPane, children }: TabsRootProps) {
  // Collect triggers and contents by value
  const all = React.useMemo(() => flattenChildren(children), [children]);

  const triggers = new Map<string, React.ReactNode>();
  const contents = new Map<string, React.ReactNode>();

  for (const el of all) {
    if (isElementOf(el, TabsTrigger)) {
      const v = (el.props as TabsTriggerProps).value;
      if (v) triggers.set(v, el.props.children);
    } else if (isElementOf(el, TabsContent)) {
      const v = (el.props as TabsContentProps).value;
      if (v) contents.set(v, el.props.children);
    }
  }

  const items = Array.from(triggers.entries()).map(([key, label]) => ({
    key,
    label: <span data-slot="tabs-trigger-label">{label}</span>,
    children: <div data-slot="tabs-content">{contents.get(key) ?? null}</div>,
  }));

  // Fallback first key when neither value nor defaultValue provided
  const firstKey = items[0]?.key;

  return (
    <AntTabs
      className={cn("flex flex-col gap-2", className)}
      activeKey={value}
      defaultActiveKey={defaultValue ?? firstKey}
      onChange={(k) => onValueChange?.(k)}
      destroyInactiveTabPane={destroyInactiveTabPane}
      items={items}
    />
  );
}

function TabsList({ className, ...props }: { className?: string; children?: React.ReactNode }) {
  // Structural container only
  return (
    <div data-slot="tabs-list" className={cn("inline-flex items-center gap-2", className)} {...props} />
  );
}

function TabsTrigger({ className, ...props }: TabsTriggerProps) {
  // Marker node for Tabs to build AntD items; hidden in DOM
  return (
    <span
      data-slot="tabs-trigger"
      data-value={props.value}
      className={cn("hidden", className)}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: TabsContentProps) {
  // Marker node for Tabs to attach content; hidden in DOM (AntD renders actual pane)
  return (
    <div
      data-slot="tabs-content-marker"
      data-value={props.value}
      className={cn("hidden", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
