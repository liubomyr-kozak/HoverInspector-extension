// Types for automation scenarios

/**
 * Represents a single step in an automation scenario
 */
export interface ScenarioStep {
  type: string;
  xpath?: string;
  alternativeXpaths?: string[]; // Array of alternative XPaths that can be used
  value?: string;
}

/**
 * Represents a complete automation scenario
 */
export interface Scenario {
  title: string;
  description?: string;
  data: ScenarioStep[];
  repeat: number;
  tags?: string[];
  category?: string;
  folderId?: string | null;
  executionSpeed?: number;
}

/**
 * Map of scenario IDs to scenario objects
 */
export interface ScenarioMap {
  [key: string]: Scenario;
}

/**
 * Represents a folder for organizing scenarios
 */
export interface ScenarioFolder {
  title: string;
  description?: string;
  parentId?: string | null;
}

/**
 * Map of folder IDs to folder objects
 */
export interface ScenarioFolderMap {
  [key: string]: ScenarioFolder;
}

/**
 * Represents a custom JavaScript function
 */
export interface CustomFunction {
  title: string;
  code: string;
}

/**
 * Map of function IDs to function objects
 */
export interface FunctionMap {
  [key: string]: CustomFunction;
}

/**
 * Frequency options for scheduled execution
 */
export enum ScheduleFrequency {
  ONCE = "once",
  DAILY = "daily",
  WEEKLY = "weekly",
  MONTHLY = "monthly",
  CUSTOM = "custom",
}

/**
 * Days of the week for weekly schedules
 */
export enum DayOfWeek {
  SUNDAY = 0,
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6,
}

/**
 * Represents a schedule for automated execution
 */
export interface ScheduleConfig {
  title: string;
  description?: string;
  scenarioId: string;
  enabled: boolean;
  frequency: ScheduleFrequency;
  startDate: string; // ISO date string
  startTime: string; // HH:MM format
  endDate?: string; // ISO date string, optional for recurring schedules
  daysOfWeek?: DayOfWeek[]; // For weekly schedules
  dayOfMonth?: number; // For monthly schedules
  interval?: number; // For custom intervals (in minutes)
  lastExecuted?: string; // ISO date string of last execution
  nextExecution?: string; // ISO date string of next scheduled execution
}

/**
 * Map of schedule IDs to schedule objects
 */
export interface ScheduleMap {
  [key: string]: ScheduleConfig;
}

/**
 * Types of triggers for automated execution
 */
export enum TriggerType {
  DOMAIN = "domain",
  PAGE_LOAD = "pageLoad",
  ELEMENT_PRESENT = "elementPresent",
  CUSTOM_EVENT = "customEvent",
}

/**
 * Represents a trigger for automated execution
 */
export interface TriggerConfig {
  title: string;
  description?: string;
  scenarioId: string;
  enabled: boolean;
  type: TriggerType;
  condition: {
    // For domain triggers
    domainPattern?: string;
    exactMatch?: boolean;

    // For element triggers
    elementXPath?: string;

    // For custom event triggers
    eventName?: string;

    // Additional conditions
    customCondition?: string; // JavaScript code for custom condition
  };
  lastTriggered?: string; // ISO date string of last trigger
}

/**
 * Map of trigger IDs to trigger objects
 */
export interface TriggerMap {
  [key: string]: TriggerConfig;
}

/**
 * Options for step types in the form
 */
export const stepTypeOptions = [
  { value: "", label: "(not set)" },
  { value: "value", label: "Change" },
  { value: "click", label: "Click" },
  { value: "hover", label: "Hover" },
  { value: "input", label: "Input" },
  { value: "select", label: "Select" },
  { value: "code", label: "Code" },
  { value: "function", label: "Function" },
  { value: "redirect", label: "Redirect" },
  { value: "update", label: "New page" },
  { value: "wait", label: "Timer" },
  { value: "confirmation", label: "Confirmation" },
  { value: "getText", label: "Get Text" },
];

/**
 * Status of an execution
 */
export enum ExecutionStatus {
  SUCCESS = "success",
  ERROR = "error",
  WARNING = "warning",
  RUNNING = "running",
  PENDING = "pending",
  PAUSED = "paused",
  CANCELLED = "cancelled",
}

/**
 * Represents a log entry for a single step execution
 */
export interface ExecutionLogEntry {
  stepIndex: number;
  stepType: string;
  stepDescription: string;
  status: ExecutionStatus;
  timestamp: string; // ISO date string
  duration: number; // in milliseconds
  details?: string;
  error?: string;
  warning?: string;
}

/**
 * Represents a complete execution log
 */
export interface ExecutionLog {
  entries: ExecutionLogEntry[];
  startTime: string; // ISO date string
  endTime: string; // ISO date string
  totalDuration: number; // in milliseconds
  status: ExecutionStatus;
}

/**
 * Represents an entry in the execution history
 */
export interface ExecutionHistoryEntry {
  id: string;
  scenarioId: string;
  scenarioTitle: string;
  executionTime: string; // ISO date string
  duration: number; // in milliseconds
  status: ExecutionStatus;
  stepsCompleted: number;
  totalSteps: number;
  error?: string;
  triggerType?: string; // manual, scheduled, triggered
  triggerId?: string; // ID of the schedule or trigger that initiated the execution
  log: ExecutionLog;
}

/**
 * Map of execution history entry IDs to execution history entries
 */
export interface ExecutionHistoryMap {
  [key: string]: ExecutionHistoryEntry;
}

/**
 * Types of notifications
 */
export enum NotificationType {
  SUCCESS = "success",
  ERROR = "error",
  WARNING = "warning",
  INFO = "info",
}

/**
 * Notification preferences
 */
export interface NotificationPreference {
  enabled: boolean;
  showSuccess: boolean;
  showError: boolean;
  showWarning: boolean;
  showInfo: boolean;
  desktop: boolean; // Show desktop notifications
  sound: boolean; // Play sound on notification
  soundVolume: number; // 0-100
}

/**
 * Notification configuration
 */
export interface NotificationConfig {
  preferences: NotificationPreference;
}

/**
 * Notification message
 */
export interface NotificationMessage {
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string; // ISO date string
  scenarioId?: string;
  executionId?: string;
}

/**
 * Map of notification message IDs to notification messages
 */
export interface NotificationMessageMap {
  [key: string]: NotificationMessage;
}
