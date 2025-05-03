const asyncDispatch = (result) => (dispatch) => {
  Promise.resolve().then(() => {
    dispatch(result);
  });
};

class ServiceReduxHandler {
  _dispatch = () => {};
  _getState = () => {};
  listeners = {};

  init(store) {
    this._dispatch = store.dispatch;
    this._getState = store.getState;
  }

  listenAction = (action) => {
    if (!action) return;
    if (this.listeners[action.type]) {
      this.listeners[action.type](action);
    }
  };

  addServiceListener = (type, listener) => {
    this.listeners[type] = listener;

    return () => {
      this.removeServiceListener(type);
    };
  };

  removeServiceListener = (type) => {
    this.listeners[type] = null;
  };

  dispatch = (action) => {
    if (typeof action === "function") {
      return action(this.dispatch);
    }

    this._dispatch(
      // @ts-ignore
      asyncDispatch({
        type: action.type,
        payload: action.payload,
      }),
    );
  };

  getState = () => {
    return this._getState();
  };
}

export default new ServiceReduxHandler();
