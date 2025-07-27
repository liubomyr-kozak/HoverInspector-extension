import { ExtensionInstanceTabLoader } from "./ExtensionInstanceTabLoader.ts";
import { Deferred } from "../../background/shared/utils.ts";

const loadStrategy = new ExtensionInstanceTabLoader();
const initializationDeferred = new Deferred();

const onReady = async (callback: any) => {
  await initializationDeferred.promise;
  callback();
};

const init = async () => {
  // тут не можна скидувати всі параметри, тому що браузер можна закрити
  // і відкрити через деякий час, і ініціалізація буде відбуватись повторно
  // тому тут важливо працювати з локалсториджом і їхніми значеннями
  // iconActivateInstance.idleIcon(); // !!!! це мабуть прийдеться видалити бо блимає іконка час від часу, мабуть браузер перезапускає сам цей файл

  initializationDeferred.resolve();
  // відмовився бо без цього працює
  // await loadStrategy.firstInitAppSendEventToInitSettings();
};

export default {
  init,
  onReady,
  loadStrategy,
};
