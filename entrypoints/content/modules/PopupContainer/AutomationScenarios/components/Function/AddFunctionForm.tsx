import React from "react";
import { Divider, Form, Input } from "antd";
import { CustomFunction } from "../../types.ts";

interface AddFunctionFormProps {
  form: any; // Form instance from antd
  currentFunction: CustomFunction | null;
}

/**
 * Component for adding or editing a custom function
 */
const AddFunctionForm: React.FC<AddFunctionFormProps> = ({ form, currentFunction }) => {
  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{ title: currentFunction?.title || "", code: currentFunction?.code || "" }}
    >
      <Form.Item
        name="title"
        label="Function Name"
        rules={[{ required: true, message: "Please enter a name for the function" }]}
      >
        <Input placeholder="Enter function name" />
      </Form.Item>

      <Divider orientation="left">Function Code</Divider>

      <Form.Item name="code" rules={[{ required: true, message: "Please enter code for the function" }]}>
        <Input.TextArea
          placeholder="Enter JavaScript code for the function"
          rows={10}
          style={{ fontFamily: "monospace" }}
        />
      </Form.Item>
    </Form>
  );
};

export default AddFunctionForm;
