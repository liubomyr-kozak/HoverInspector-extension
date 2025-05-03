import {defineExtensionMessaging} from '@webext-core/messaging';
import {
    HOVER_INSPECTOR_ACTIVATE,
    HOVER_INSPECTOR_CHECK_SCRIPT,
    HOVER_INSPECTOR_DEACTIVATE
} from "@entrypoints/shared/globalEvents.ts";

interface ProtocolMap {
    getStringLength(s: string): number;

    [HOVER_INSPECTOR_ACTIVATE](s: any): any;

    [HOVER_INSPECTOR_DEACTIVATE](s: any): any;

    [HOVER_INSPECTOR_CHECK_SCRIPT](s: any): any;
}

export const {sendMessage, onMessage} = defineExtensionMessaging<ProtocolMap>();