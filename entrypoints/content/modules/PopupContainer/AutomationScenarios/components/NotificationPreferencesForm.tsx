import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Switch, 
  Card, 
  Checkbox, 
  Divider, 
  Button, 
  Space, 
  Slider, 
  Typography, 
  message 
} from 'antd';
import { 
  BellOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  WarningOutlined, 
  InfoCircleOutlined,
  SoundOutlined,
  DesktopOutlined
} from '@ant-design/icons';
import { NotificationPreference } from '../types';

const { Title, Text } = Typography;

interface NotificationPreferencesFormProps {
  preferences: NotificationPreference;
  onSave: (preferences: NotificationPreference) => Promise<boolean>;
}

/**
 * Component for configuring notification preferences
 */
const NotificationPreferencesForm: React.FC<NotificationPreferencesFormProps> = ({
  preferences,
  onSave
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(preferences.enabled);
  const [soundEnabled, setSoundEnabled] = useState(preferences.sound);
  
  // Initialize form with preferences
  useEffect(() => {
    form.setFieldsValue({
      enabled: preferences.enabled,
      showSuccess: preferences.showSuccess,
      showError: preferences.showError,
      showWarning: preferences.showWarning,
      showInfo: preferences.showInfo,
      desktop: preferences.desktop,
      sound: preferences.sound,
      soundVolume: preferences.soundVolume
    });
    
    setNotificationsEnabled(preferences.enabled);
    setSoundEnabled(preferences.sound);
  }, [preferences, form]);
  
  // Handle form submission
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      const success = await onSave(values);
      
      if (success) {
        message.success('Notification preferences saved successfully');
      } else {
        message.error('Failed to save notification preferences');
      }
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      message.error('Failed to save notification preferences');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle notifications enabled/disabled
  const handleNotificationsEnabledChange = (checked: boolean) => {
    setNotificationsEnabled(checked);
    form.setFieldsValue({ enabled: checked });
  };
  
  // Handle sound enabled/disabled
  const handleSoundEnabledChange = (checked: boolean) => {
    setSoundEnabled(checked);
    form.setFieldsValue({ sound: checked });
  };
  
  return (
    <Card>
      <Form
        form={form}
        layout="vertical"
        initialValues={preferences}
        onFinish={handleSubmit}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <Title level={4} style={{ margin: 0 }}>
            <BellOutlined style={{ marginRight: '8px' }} />
            Notification Preferences
          </Title>
          
          <Form.Item name="enabled" valuePropName="checked" style={{ margin: 0 }}>
            <Switch 
              checkedChildren="Enabled" 
              unCheckedChildren="Disabled" 
              onChange={handleNotificationsEnabledChange}
            />
          </Form.Item>
        </div>
        
        <Divider />
        
        <div style={{ opacity: notificationsEnabled ? 1 : 0.5, pointerEvents: notificationsEnabled ? 'auto' : 'none' }}>
          <Title level={5}>Notification Types</Title>
          <Space direction="vertical" style={{ width: '100%', marginBottom: '16px' }}>
            <Form.Item name="showSuccess" valuePropName="checked">
              <Checkbox>
                <Space>
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  <Text>Success notifications</Text>
                </Space>
              </Checkbox>
            </Form.Item>
            
            <Form.Item name="showError" valuePropName="checked">
              <Checkbox>
                <Space>
                  <CloseCircleOutlined style={{ color: '#f5222d' }} />
                  <Text>Error notifications</Text>
                </Space>
              </Checkbox>
            </Form.Item>
            
            <Form.Item name="showWarning" valuePropName="checked">
              <Checkbox>
                <Space>
                  <WarningOutlined style={{ color: '#faad14' }} />
                  <Text>Warning notifications</Text>
                </Space>
              </Checkbox>
            </Form.Item>
            
            <Form.Item name="showInfo" valuePropName="checked">
              <Checkbox>
                <Space>
                  <InfoCircleOutlined style={{ color: '#1890ff' }} />
                  <Text>Info notifications</Text>
                </Space>
              </Checkbox>
            </Form.Item>
          </Space>
          
          <Divider />
          
          <Title level={5}>Notification Delivery</Title>
          <Space direction="vertical" style={{ width: '100%', marginBottom: '16px' }}>
            <Form.Item name="desktop" valuePropName="checked">
              <Checkbox>
                <Space>
                  <DesktopOutlined />
                  <Text>Desktop notifications</Text>
                </Space>
              </Checkbox>
            </Form.Item>
            
            <Form.Item name="sound" valuePropName="checked">
              <Checkbox onChange={e => handleSoundEnabledChange(e.target.checked)}>
                <Space>
                  <SoundOutlined />
                  <Text>Sound notifications</Text>
                </Space>
              </Checkbox>
            </Form.Item>
            
            <div style={{ opacity: soundEnabled ? 1 : 0.5, pointerEvents: soundEnabled ? 'auto' : 'none', paddingLeft: '24px' }}>
              <Form.Item name="soundVolume" label="Sound Volume">
                <Slider 
                  min={0} 
                  max={100} 
                  step={1}
                  marks={{
                    0: '0%',
                    25: '25%',
                    50: '50%',
                    75: '75%',
                    100: '100%'
                  }}
                />
              </Form.Item>
              
              <Button 
                icon={<SoundOutlined />} 
                onClick={() => {
                  // Play a test sound
                  const audio = new Audio('/notification-sound.mp3');
                  audio.volume = form.getFieldValue('soundVolume') / 100;
                  audio.play().catch(error => {
                    console.error('Error playing test sound:', error);
                    message.warning('Could not play test sound. Browser may require user interaction first.');
                  });
                }}
              >
                Test Sound
              </Button>
            </div>
          </Space>
        </div>
        
        <Divider />
        
        <Form.Item>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading}
            disabled={!notificationsEnabled}
          >
            Save Preferences
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default NotificationPreferencesForm;