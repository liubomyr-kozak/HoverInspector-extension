import React from 'react';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

interface FormTextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

const inputStyles = (error?: boolean) => ({
  width: '100%',
  padding: '4px 11px',
  border: `1px solid ${error ? '#ff4d4f' : '#d9d9d9'}`,
  borderRadius: '6px',
  fontSize: '14px',
  lineHeight: '1.5',
  transition: 'border-color 0.2s',
  outline: 'none',
});

const textareaStyles = (error?: boolean) => ({
  ...inputStyles(error),
  resize: 'vertical' as const,
  fontFamily: 'inherit',
});

const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>, error?: boolean) => {
  e.target.style.borderColor = error ? '#ff4d4f' : '#1890ff';
  e.target.style.boxShadow = `0 0 0 2px ${error ? 'rgba(255, 77, 79, 0.2)' : 'rgba(24, 144, 255, 0.2)'}`;
};

const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>, error?: boolean) => {
  e.target.style.borderColor = error ? '#ff4d4f' : '#d9d9d9';
  e.target.style.boxShadow = 'none';
};

/**
 * HTML input component styled to match Ant Design appearance
 * Replacement for deprecated Ant Design Input component
 */
export const FormInput: React.FC<FormInputProps> = ({ error, style, onFocus, onBlur, ...props }) => {
  return (
    <input
      {...props}
      style={{ ...inputStyles(error), ...style }}
      onFocus={(e) => {
        handleFocus(e, error);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        handleBlur(e, error);
        onBlur?.(e);
      }}
    />
  );
};

/**
 * HTML textarea component styled to match Ant Design appearance
 * Replacement for deprecated Ant Design Input.TextArea component
 */
export const FormTextArea: React.FC<FormTextAreaProps> = ({ error, style, onFocus, onBlur, ...props }) => {
  return (
    <textarea
      {...props}
      style={{ ...textareaStyles(error), ...style }}
      onFocus={(e) => {
        handleFocus(e, error);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        handleBlur(e, error);
        onBlur?.(e);
      }}
    />
  );
};