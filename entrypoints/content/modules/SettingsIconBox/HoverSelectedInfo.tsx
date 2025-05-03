import React, { useEffect } from "react";

import {
    SettingTab,
    SettingTabHeader,
    TabContainer,
} from "./HoverSelectedInfo.styled.ts";
import {IconBrandAbstract, IconCode, IconLayersSelected, IconWashDryShade} from "@tabler/icons-react";
import CustomSegmented from "@/entrypoints/shared/components/CustomSegmented.tsx";
import Title from "antd/es/typography/Title";
import PopupStyleInspector from "./components/PopupStyleInspector.tsx";
import StyleVisualizer from "./components/StyleVisualizer.tsx";
import {useDispatch, useSelector} from "react-redux";
import {
    onUpdateInspectorViewTypeWatcher
} from "@entrypoints/content/store/app/saga-action/app.saga.action.ts";
import DomNodeManager from "@entrypoints/core/services/dom/DomNodeManager.ts";
import {setSelectedElementType} from "@entrypoints/content/store/app/app.slice.ts";
import DomNodeManagerInstance from "@entrypoints/core/services/dom/DomNodeManager.ts";


const HoverSelectedInfo = () => {
    const dispatch = useDispatch();
    const app = useSelector((state: any) => state.app)

    const viewType = app.viewType || 'ui';
    const selectedElementType = app.selectedElementType;
    const isSingleSelect = app.isSingleSelect;

    const isElementWasSelected = DomNodeManagerInstance.isFirstNodeSelected;
    const activeElement = isElementWasSelected ? selectedElementType : 'hoverElement';
    
    // When isSingleSelect is true, automatically set selectedElementType to 'hoverElement'
    useEffect(() => {
        if (isSingleSelect && selectedElementType === 'selectedElement') {
            dispatch(setSelectedElementType('hoverElement'));
        }
    }, [isSingleSelect, selectedElementType, dispatch]);

    const handleUpdateInspectorViewType = (data) => {
        dispatch(onUpdateInspectorViewTypeWatcher.getPayload(data));
    };

    const handleSetSelectedElementType = (elementType) => {
        dispatch(setSelectedElementType(elementType))
        const selectedNode = DomNodeManager.get(elementType);

        if (selectedNode instanceof HTMLElement) {
            const originalOutline = selectedNode.style.outline;
            const originalTransition = selectedNode.style.transition;
            const originalBoxShadow = selectedNode.style.boxShadow;
            const originalBackground = selectedNode.style.background;

            selectedNode.style.outline = "2px solid #f29d68";
            selectedNode.style.outlineOffset = "2px";
            selectedNode.style.transition = "all 0.25s ease-in-out";
            selectedNode.style.boxShadow = "0 0 8px 2px rgba(242, 157, 104, 0.8)";
            selectedNode.style.background = "#f29d68";

            setTimeout(() => {
                selectedNode.style.outline = originalOutline;
                selectedNode.style.transition = originalTransition;
                selectedNode.style.boxShadow = originalBoxShadow;
                selectedNode.style.background = originalBackground;
            }, 400);
        }
    };

    return (
        <SettingTab>
            <SettingTabHeader>
                <Title level={5}>View Type </Title>
                <CustomSegmented
                    className="mb-5"
                    value={viewType}
                    onChange={handleUpdateInspectorViewType}
                    options={[
                        {
                            value: 'code',
                            label: 'Style Code',
                            icon: <IconCode size={16}/>,
                            activeClassName: 'bg-sky-500 text-sky-100',
                        },
                        {
                            value: 'ui',
                            label: 'UI Details',
                            icon: <IconBrandAbstract size={16}/>,
                            activeClassName: '[background:linear-gradient(135deg,#ff7e5f,#feb47b)] text-orange-100',
                        },
                    ]}
                    inactiveClassName="bg-white text-gray-500 hover:bg-gray-100"
                />

                {!isSingleSelect && (
                    <>
                        <Title level={5}>Selected Element</Title>
                        <CustomSegmented
                            className="mb-5"
                            value={selectedElementType}
                            onChange={handleSetSelectedElementType}
                            options={[
                                {
                                    label: 'source',
                                    value: 'selectedElement',
                                    icon: <IconWashDryShade size={16}/>,
                                    activeClassName: 'bg-slate-500 text-slate-100',
                                },
                                {
                                    label: 'target',
                                    value: 'hoverElement',
                                    icon: <IconLayersSelected size={16}/>,
                                    activeClassName: 'bg-slate-500 text-slate-100',
                                },
                            ]}
                            inactiveClassName="bg-white text-gray-500 hover:bg-gray-100"
                        />
                    </>
                )}
            </SettingTabHeader>

            <TabContainer active>
                {viewType === "code" ? (
                    <PopupStyleInspector selectedElementType={activeElement}/>
                ) : (
                    <StyleVisualizer selectedElementType={activeElement}/>
                )}
            </TabContainer>
        </SettingTab>
    );
};

export default HoverSelectedInfo;
