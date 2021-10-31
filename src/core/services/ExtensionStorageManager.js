import { actionsContext } from "../../../background_popup_script/background_popup_script";
import { isDevelopment, isProduction } from "../../shared/helpers";
import { USER_STATUS_NEW } from "../../store/app.constant";

class ExtensionStorageManager {

  requestProcessing = (data, callback) => {
    if (isProduction()) {
      chrome.extension.sendMessage(data, callback);
    }

    if (isDevelopment()) {
      actionsContext(data, callback);
    }
  }

  getSettings() {
    return new Promise((resolve) => {
      this.requestProcessing(this.createAction('storage.action.getSettings'), resolve);
    })
  }

  setSettings(data) {
    return new Promise((resolve) => {
      this.requestProcessing(this.createAction('storage.action.setSettings', data), resolve);
    })
  }

  initInitialData() {
    return Promise
      .all([this.getSettings()])
      .then((data) => {
        const setting = data[0];
        if (!setting) {
          this.requestProcessing(
            this.createAction(
              'storage.action.setSettings',
              {
                "name": "settings",
                "version": "1.0.0",
                "settings": {},
                "user": {
                  "status": USER_STATUS_NEW
                }
              }
            ),
            () => {
            });
        }
      })
  }

  createAction = (actionType, data) => ({ action: actionType, data });
}


export default new ExtensionStorageManager()