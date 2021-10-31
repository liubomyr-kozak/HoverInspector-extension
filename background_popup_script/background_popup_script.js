import LocalStorage from "../src/core/services/LocalStorage";

const EXT_HOVER = "ExtHoverInspectorSettings"

export function actionsContext(request, sendResponseCb) {
  if (request.action == "storage.action.getBackup") {
    const appSettings = LocalStorage.update(EXT_HOVER)
    sendResponseCb({ appSettings });
    return true;
  }

  if (request.action == "storage.action.addBackup") {
    const appSettings = LocalStorage.update(EXT_HOVER, request.data.appSettings)
    sendResponseCb({ wordList, appSettings });
    return true;
  }

  if (request.action == "storage.action.getSettings") {
    sendResponseCb(LocalStorage.get(EXT_HOVER));
    return true;
  }

  if (request.action == "storage.action.setSettings") {
    sendResponseCb(LocalStorage.update(EXT_HOVER, request.data));
    return true;
  }
}
