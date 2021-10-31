import ServiceReduxHandler from "./ServiceReduxHandler";

export const serviceReduxMiddleware = (store) => {
  ServiceReduxHandler.init(store);

  return (next) => {
    return (action) => {
      if (typeof action === "function") {
        const { dispatch, getState } = store;
        return action(dispatch, getState);
      }

      ServiceReduxHandler.listenAction(action);
      next(action);
    };
  };
};
