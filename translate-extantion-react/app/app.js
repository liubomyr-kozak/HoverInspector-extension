import React, {useState, useEffect} from "react";
import {AppProvider} from "./app-context";
import LauncherIcon from "./launcher/launcher-icon";
import Sidebar from "./sidebar/sidebar";
import {getAllWordsFromStorage} from "./API/googleAPI";

const App = () => {
    const [isVisible, setVisible] = useState(true);

    const setVisibleFn = () => {
        setVisible(!isVisible);
    };

    const initialState = {
        wordsList: require('./initData.json')
    };

    useEffect(() => {
        getAllWordsFromStorage((wordData) => {
            console.log(wordData);
        })
    }, []);

    const reducer = (state, action) => {
        switch (action.type) {
            case 'addWord':
                return {
                    ...state,
                    wordsList: [...state.wordsList, action.wordData]
                };
            default:
                return state;
        }
    };

    return (
        <AppProvider initialState={initialState} reducer={reducer}>
            <LauncherIcon isLauncherVisible={!isVisible} toggleVisible={setVisibleFn}/>
            <Sidebar isSidebarVisible={isVisible} toggleVisible={setVisibleFn}/>
        </AppProvider>
    )
};


export default App;
