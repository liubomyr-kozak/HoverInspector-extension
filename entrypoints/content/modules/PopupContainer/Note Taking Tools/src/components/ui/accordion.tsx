"use client";

import * as React from "react";
import { Collapse } from "antd";
import { cn } from "./utils";

type AccordionRootProps = {
  className?: string;
  type?: "single" | "multiple";
  value?: string | string[];
  defaultValue?: string | string[];
  onValueChange?: (v: string | string[]) => void;
  children?: React.ReactNode;
};

type AccordionItemProps = {
  className?: string;
  value: string;
  children?: React.ReactNode;
};

type AccordionTriggerProps = {
  className?: string;
  children?: React.ReactNode;
};

type AccordionContentProps = {
  className?: string;
  children?: React.ReactNode;
};

function isElementOf(
  node: any,
  comp: React.JSXElementConstructor<any>,
): node is React.ReactElement {
  return React.isValidElement(node) && node.type === comp;
}

function Accordion({ className, type = "single", value, defaultValue, onValueChange, children }: AccordionRootProps) {
  // Extract items from structure: AccordionItem -> (Trigger + Content)
  const items = React.useMemo(() => {
    const out: { key: string; label: React.ReactNode; children: React.ReactNode }[] = [];

    React.Children.forEach(children, (child) => {
      if (!React.isValidElement(child)) return;
      if (!isElementOf(child, AccordionItem)) return;

      const itemKey = (child.props as AccordionItemProps).value;
      let label: React.ReactNode = null;
      let body: React.ReactNode = null;

      React.Children.forEach(child.props.children, (nested) => {
        if (!React.isValidElement(nested)) return;
        if (isElementOf(nested, AccordionTrigger)) {
          label = nested.props.children;
        } else if (isElementOf(nested, AccordionContent)) {
          body = nested.props.children;
        }
      });

      if (itemKey) {
        out.push({
          key: itemKey,
          label: <div data-slot="accordion-trigger">{label}</div>,
          children: <div data-slot="accordion-content">{body}</div>,
        });
      }
    });

    return out;
  }, [children]);

  const accordion = type === "single";
  const activeKey = value as any;
  const defaultActiveKey = defaultValue as any;

  return (
    <Collapse
      className={cn(className)}
      accordion={accordion}
      activeKey={activeKey}
      defaultActiveKey={defaultActiveKey}
      onChange={(k) => {
        // AntD returns string | string[]
        if (accordion) {
          onValueChange?.(k as string);
        } else {
          onValueChange?.(Array.isArray(k) ? k : [k as string]);
        }
      }}
      items={items}
    />
  );
}

function AccordionItem({ className, value, children }: AccordionItemProps) {
  // Marker container for structure; hidden to avoid duplicate rendering
  return (
    <div data-slot="accordion-item" data-value={value} className={cn("hidden", className)}>
      {children}
    </div>
  );
}

function AccordionTrigger({ className, children }: AccordionTriggerProps) {
  return (
    <div data-slot="accordion-trigger-marker" className={cn("hidden", className)}>
      {children}
    </div>
  );
}

function AccordionContent({ className, children }: AccordionContentProps) {
  return (
    <div data-slot="accordion-content-marker" className={cn("hidden", className)}>
      {children}
    </div>
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
