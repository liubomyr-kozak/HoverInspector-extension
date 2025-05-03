import {all, spawn} from "redux-saga/effects";


import * as appSaga from "./app/app.saga.ts";

export default function* rootSaga() {
    yield all(
        [
            ...Object.values(appSaga),
        ].map(spawn),
    );
}
