import React from "react";
import { Divider } from "antd";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { CustomFunction } from "../../types.ts";

// Yup validation schema
const validationSchema = yup.object().shape({
  title: yup.string().required("Please enter a name for the function"),
  code: yup.string().required("Please enter code for the function"),
});

interface AddFunctionFormProps {
  currentFunction: CustomFunction | null;
  onFormChange?: (formData: CustomFunction) => void;
}

/**
 * Component for adding or editing a custom function
 */
const AddFunctionForm: React.FC<AddFunctionFormProps> = ({ currentFunction, onFormChange }) => {
  // Initialize form values
  const initialValues = {
    title: currentFunction?.title || "",
    code: currentFunction?.code || "",
  };

  // Initialize React Hook Form
  const {
    control,
    watch,
    formState: { errors },
  } = useForm<CustomFunction>({
    resolver: yupResolver(validationSchema),
    defaultValues: initialValues,
    mode: "onChange",
  });

  // Watch form changes and notify parent
  const watchedValues = watch();
  React.useEffect(() => {
    if (onFormChange) {
      onFormChange(watchedValues);
    }
  }, [watchedValues, onFormChange]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div>
        <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
          Function Name
        </label>
        <Controller
          name="title"
          control={control}
          render={({ field }) => (
            <input 
              {...field} 
              type="text"
              placeholder="Enter function name"
              style={{
                width: '100%',
                padding: '4px 11px',
                border: `1px solid ${errors.title ? '#ff4d4f' : '#d9d9d9'}`,
                borderRadius: '6px',
                fontSize: '14px',
                lineHeight: '1.5',
                transition: 'border-color 0.2s',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = errors.title ? '#ff4d4f' : '#1890ff';
                e.target.style.boxShadow = `0 0 0 2px ${errors.title ? 'rgba(255, 77, 79, 0.2)' : 'rgba(24, 144, 255, 0.2)'}`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = errors.title ? '#ff4d4f' : '#d9d9d9';
                e.target.style.boxShadow = 'none';
              }}
            />
          )}
        />
        {errors.title && (
          <div style={{ color: "#ff4d4f", fontSize: "14px", marginTop: "4px" }}>
            {errors.title.message}
          </div>
        )}
      </div>

      <Divider orientation="left">Function Code</Divider>

      <div>
        <Controller
          name="code"
          control={control}
          render={({ field }) => (
            <textarea
              {...field}
              placeholder="Enter JavaScript code for the function"
              rows={10}
              style={{
                width: '100%',
                padding: '4px 11px',
                border: `1px solid ${errors.code ? '#ff4d4f' : '#d9d9d9'}`,
                borderRadius: '6px',
                fontSize: '14px',
                lineHeight: '1.5',
                transition: 'border-color 0.2s',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'monospace'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = errors.code ? '#ff4d4f' : '#1890ff';
                e.target.style.boxShadow = `0 0 0 2px ${errors.code ? 'rgba(255, 77, 79, 0.2)' : 'rgba(24, 144, 255, 0.2)'}`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = errors.code ? '#ff4d4f' : '#d9d9d9';
                e.target.style.boxShadow = 'none';
              }}
            />
          )}
        />
        {errors.code && (
          <div style={{ color: "#ff4d4f", fontSize: "14px", marginTop: "4px" }}>
            {errors.code.message}
          </div>
        )}
      </div>
    </div>
  );
};

export default AddFunctionForm;
