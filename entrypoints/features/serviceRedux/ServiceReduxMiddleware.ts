import ServiceReduxHandler from "./ServiceReduxHandler.ts";

export const serviceReduxMiddleware = (store) => {
    ServiceReduxHandler.init(store);

    return (next) => {
        return (action) => {
            if (typeof action === "function") {
                const {dispatch, getState} = store;
                return action(dispatch, getState);
            }

            ServiceReduxHandler.listenAction(action);

            // console.error(":: -> action", action);

            try {
                next(action);
            } catch (e) {
                console.error(":: -> action", action);
                console.error(":: -> next", e);
            }
        };
    };
};
