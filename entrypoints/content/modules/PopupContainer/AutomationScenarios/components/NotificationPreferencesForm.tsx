import React, { useEffect, useState } from "react";
import { Button, Card, Checkbox, Divider, message, Slider, Space, Switch, Typography } from "antd";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  BellOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DesktopOutlined,
  InfoCircleOutlined,
  SoundOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { NotificationPreference } from "../types";

// Yup validation schema
const validationSchema = yup.object().shape({
  enabled: yup.boolean(),
  showSuccess: yup.boolean(),
  showError: yup.boolean(),
  showWarning: yup.boolean(),
  showInfo: yup.boolean(),
  desktop: yup.boolean(),
  sound: yup.boolean(),
  soundVolume: yup.number().min(0).max(100),
});

const { Title, Text } = Typography;

interface NotificationPreferencesFormProps {
  preferences: NotificationPreference;
  onSave: (preferences: NotificationPreference) => Promise<boolean>;
}

/**
 * Component for configuring notification preferences
 */
const NotificationPreferencesForm: React.FC<NotificationPreferencesFormProps> = ({ preferences, onSave }) => {
  const [loading, setLoading] = useState(false);

  // Initialize React Hook Form
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<NotificationPreference>({
    resolver: yupResolver(validationSchema),
    defaultValues: preferences,
  });

  const notificationsEnabled = watch("enabled");
  const soundEnabled = watch("sound");

  // Update form when preferences change
  useEffect(() => {
    Object.keys(preferences).forEach((key) => {
      setValue(key as keyof NotificationPreference, preferences[key as keyof NotificationPreference]);
    });
  }, [preferences, setValue]);

  // Handle form submission
  const onSubmit = async (data: NotificationPreference) => {
    try {
      setLoading(true);
      const success = await onSave(data);

      if (success) {
        message.success("Notification preferences saved successfully");
      } else {
        message.error("Failed to save notification preferences");
      }
    } catch (error) {
      console.error("Error saving notification preferences:", error);
      message.error("Failed to save notification preferences");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <Title level={4} style={{ margin: 0 }}>
            <BellOutlined style={{ marginRight: "8px" }} />
            Notification Preferences
          </Title>

          <Controller
            name="enabled"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Switch
                checked={value}
                onChange={onChange}
                checkedChildren="Enabled"
                unCheckedChildren="Disabled"
              />
            )}
          />
        </div>

        <Divider />

        <div style={{ opacity: notificationsEnabled ? 1 : 0.5, pointerEvents: notificationsEnabled ? "auto" : "none" }}>
          <Title level={5}>Notification Types</Title>
          <Space direction="vertical" style={{ width: "100%", marginBottom: "16px" }}>
            <Controller
              name="showSuccess"
              control={control}
              render={({ field: { value, onChange } }) => (
                <Checkbox checked={value} onChange={onChange}>
                  <Space>
                    <CheckCircleOutlined style={{ color: "#52c41a" }} />
                    <Text>Success notifications</Text>
                  </Space>
                </Checkbox>
              )}
            />

            <Controller
              name="showError"
              control={control}
              render={({ field: { value, onChange } }) => (
                <Checkbox checked={value} onChange={onChange}>
                  <Space>
                    <CloseCircleOutlined style={{ color: "#f5222d" }} />
                    <Text>Error notifications</Text>
                  </Space>
                </Checkbox>
              )}
            />

            <Controller
              name="showWarning"
              control={control}
              render={({ field: { value, onChange } }) => (
                <Checkbox checked={value} onChange={onChange}>
                  <Space>
                    <WarningOutlined style={{ color: "#faad14" }} />
                    <Text>Warning notifications</Text>
                  </Space>
                </Checkbox>
              )}
            />

            <Controller
              name="showInfo"
              control={control}
              render={({ field: { value, onChange } }) => (
                <Checkbox checked={value} onChange={onChange}>
                  <Space>
                    <InfoCircleOutlined style={{ color: "#1890ff" }} />
                    <Text>Info notifications</Text>
                  </Space>
                </Checkbox>
              )}
            />
          </Space>

          <Divider />

          <Title level={5}>Notification Delivery</Title>
          <Space direction="vertical" style={{ width: "100%", marginBottom: "16px" }}>
            <Controller
              name="desktop"
              control={control}
              render={({ field: { value, onChange } }) => (
                <Checkbox checked={value} onChange={onChange}>
                  <Space>
                    <DesktopOutlined />
                    <Text>Desktop notifications</Text>
                  </Space>
                </Checkbox>
              )}
            />

            <Controller
              name="sound"
              control={control}
              render={({ field: { value, onChange } }) => (
                <Checkbox checked={value} onChange={onChange}>
                  <Space>
                    <SoundOutlined />
                    <Text>Sound notifications</Text>
                  </Space>
                </Checkbox>
              )}
            />

            <div
              style={{
                opacity: soundEnabled ? 1 : 0.5,
                pointerEvents: soundEnabled ? "auto" : "none",
                paddingLeft: "24px",
              }}
            >
              <div style={{ marginBottom: "8px" }}>
                <Text strong>Sound Volume</Text>
              </div>
              <Controller
                name="soundVolume"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <Slider
                    value={value}
                    onChange={onChange}
                    min={0}
                    max={100}
                    step={1}
                    marks={{
                      0: "0%",
                      25: "25%",
                      50: "50%",
                      75: "75%",
                      100: "100%",
                    }}
                  />
                )}
              />

              <Button
                icon={<SoundOutlined />}
                onClick={() => {
                  // Play a test sound
                  const audio = new Audio("/notification-sound.mp3");
                  const currentVolume = watch("soundVolume");
                  audio.volume = currentVolume / 100;
                  audio.play().catch((error) => {
                    console.error("Error playing test sound:", error);
                    message.warning("Could not play test sound. Browser may require user interaction first.");
                  });
                }}
              >
                Test Sound
              </Button>
            </div>
          </Space>
        </div>

        <Divider />

        <Button type="primary" htmlType="submit" loading={loading} disabled={!notificationsEnabled}>
          Save Preferences
        </Button>
      </form>
    </Card>
  );
};

export default NotificationPreferencesForm;