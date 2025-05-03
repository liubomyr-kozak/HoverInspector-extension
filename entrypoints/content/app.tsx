import React , {useMemo} from "react";

import AppController from "./modules/AppController/AppController.tsx";
import Launcher from "./modules/Launcher/Launcher.tsx";
import {PopupContainer} from "./modules/PopupContainer/PopupContainer.tsx";

import {DraggableModalProvider} from "@entrypoints/shared/components/ModalDraggable";

import './app.css';
import {useSelector} from "react-redux";
import {ElementInspector} from "@entrypoints/content/modules/ElementInspector";
import {
    AUTOMATION,
    INSPECTOR,
    POPUP_SUPPORT_TOOLS,
    RULER
} from "@entrypoints/content/modules/Launcher/LauncherIcons";
import {ViewportRuler} from "@entrypoints/content/modules/PopupContainer/ViewportRuler";
import FeatureHandler from "@entrypoints/content/modules/FeatureHandler/FeatureHandler";
import AutomationScenarios from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/AutomationScenarios";


export const App = () => {
    const {activeIcons = []} = useSelector((state: any) => state?.app.launcher);


    const isPopupActive = useMemo(() => {
        return POPUP_SUPPORT_TOOLS.some(id => activeIcons.includes(id))
    }, [activeIcons])

    return (
        <AppController>
            <DraggableModalProvider>
                {/*<FeatureHandler>*/}
                {activeIcons.includes(INSPECTOR.id) && <ElementInspector/>}
                {activeIcons.includes(RULER.id) && <ViewportRuler/>}

                <Launcher/>
                {isPopupActive && <PopupContainer/>}
                {/*</FeatureHandler>*/}
            </DraggableModalProvider>
        </AppController>
    );
};