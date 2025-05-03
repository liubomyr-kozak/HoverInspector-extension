import React, {FC, useEffect} from "react";
import {useDispatch, useSelector} from "react-redux";
import PopupSettingModel from "@entrypoints/core/Models/PopupSettingModel.ts";
import {INSPECTOR} from "@entrypoints/content/modules/Launcher/LauncherIcons.ts";

const FeatureHandler: FC<{ children: React.ReactNode }> = ({children}) => {
    const dispatch = useDispatch();

    const {activeIcons = []} = useSelector(
        (state: any) => state?.app.launcher
    );


    useEffect(() => {
        PopupSettingModel.setHandleDomInspector(activeIcons.includes(INSPECTOR.id))
    }, [activeIcons])

    return <>{children}</>
}


export default FeatureHandler