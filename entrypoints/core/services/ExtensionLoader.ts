import { ExtensionInstanceTabLoader } from "./ExtensionInstanceTabLoader.ts";
import { Deferred } from "../../background/shared/utils.ts";

const loadStrategy = new ExtensionInstanceTabLoader();
const initializationDeferred = new Deferred();

const onReady = async (callback: any) => {
  await initializationDeferred.promise;
  callback();
};

const init = async () => {
  // Do not reset all parameters here: the browser can be closed
  // and reopened later, and initialisation runs again,
  // so it is important to work with the stored values here.
  // iconActivateInstance.idleIcon(); // probably to be removed: the icon blinks from time to time, likely because the browser restarts this file

  initializationDeferred.resolve();
  // Dropped: works without it
  // await loadStrategy.firstInitAppSendEventToInitSettings();
};

export default {
  init,
  onReady,
  loadStrategy,
};
