import { defineExtensionMessaging } from "@webext-core/messaging";
import {
  HOVER_INSPECTOR_ACTIVATE,
  HOVER_INSPECTOR_CHECK_SCRIPT,
  HOVER_INSPECTOR_DEACTIVATE,
  DEV_SCRIPT_INJECTED,
  PROD_SCRIPT_INJECTED,
  SCRIPT_INJECTION_ERROR,
} from "@entrypoints/shared/globalEvents.ts";

interface ProtocolMap {
  getStringLength(s: string): number;

  [HOVER_INSPECTOR_ACTIVATE](s: any): any;

  [HOVER_INSPECTOR_DEACTIVATE](s: any): any;

  [HOVER_INSPECTOR_CHECK_SCRIPT](s: any): any;

  [DEV_SCRIPT_INJECTED](data: { downloadUrl: string; filename: string; publicUrl: string; timestamp: number }): {
    success: boolean;
    mode: string;
  };

  [PROD_SCRIPT_INJECTED](data: { filename: string; publicUrl: string; timestamp: number }): {
    success: boolean;
    mode: string;
  };

  [SCRIPT_INJECTION_ERROR](data: { error: string; timestamp: number }): { received: boolean };
}

export const { sendMessage, onMessage } = defineExtensionMessaging<ProtocolMap>();
