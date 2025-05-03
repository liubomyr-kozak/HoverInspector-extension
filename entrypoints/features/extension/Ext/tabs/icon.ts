import {Browser} from "@wxt-dev/browser";

const PATH_TO_EXTENSION_32LOGO_FILE = "icon/32.png";
const PATH_TO_EXTENSION_32LOGO__ACTIVE__FILE = "icon/32-active.png";

export class IconActivate {
    activate(tabId?: number) {
        const setting = {
            tabId: undefined,
            path: {
                32: PATH_TO_EXTENSION_32LOGO__ACTIVE__FILE,
            },
        } as any;

        // з цією мовою іконка буде мінятись тільки на певній табі, в інших вона буде дефолтною
        if (tabId) {
            setting.tabId = tabId;
        }

        browser.action?.setIcon(setting);
    }

    deactivate(tabId?: number) {
        const setting = {
            tabId: undefined,
            path: {
                32: PATH_TO_EXTENSION_32LOGO_FILE,
            },
        } as any;

        if (tabId) {
            setting.tabId = tabId;
        }

        browser.action?.setIcon(setting);
    }

    setIdle() {
        const setting = {
            path: {
                32: PATH_TO_EXTENSION_32LOGO_FILE,
            },
        };

        // console.log("😜😜😜 IconActivate::idleIcon -> browser", browser.action.setIcon);
        // browser.action?.setIcon(setting);
    }
}

export default new IconActivate()