import React, { useState } from "react";
import { Button } from "antd";
import { CopyOutlined, CheckOutlined } from "@ant-design/icons";

export interface CopyButtonProps {
  value: string;
  size?: "small" | "middle" | "large";
  type?: "text" | "link" | "ghost" | "default" | "primary" | "dashed";
  className?: string;
  style?: React.CSSProperties;
  title?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

/**
 * Reusable copy button component that copies text to clipboard
 * Shows visual feedback when copy is successful
 */
export const CopyButton: React.FC<CopyButtonProps> = ({
  value,
  size = "small",
  type = "text",
  className,
  style,
  title = "Copy to clipboard",
  icon,
  children,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      
      // Reset to initial state after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      
      // Fallback for older browsers
      try {
        const textArea = document.createElement("textarea");
        textArea.value = value;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
        }, 2000);
      } catch (fallbackError) {
        console.error("Fallback copy also failed:", fallbackError);
      }
    }
  };

  const buttonIcon = icon || (copied ? <CheckOutlined /> : <CopyOutlined />);
  const buttonTitle = copied ? "Copied!" : title;
  const buttonStyle = copied 
    ? { ...style, color: "#52c41a" } // Green color when copied
    : style;

  return (
    <Button
      type={type}
      size={size}
      icon={buttonIcon}
      onClick={handleCopy}
      className={className}
      style={buttonStyle}
      title={buttonTitle}
    >
      {children || (copied ? "Copied" : "")}
    </Button>
  );
};

export default CopyButton;