import React, {JSX, useState, useEffect, useRef} from "react";
import {useDispatch, useSelector} from 'react-redux';
import {IconX, IconCalendarOff} from "@tabler/icons-react";
import {createGlobalStyle} from 'styled-components';

const GlobalStyle = createGlobalStyle`
    @keyframes spin {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }

    @keyframes colorPulse {
        0%, 100% {
            color: #15803d;
        }
        50% {
            color: #3aca70;
        }
    }
`;

import {
    onChangeFeaturePopupPosition,
    onChangeLauncherIconOrder,
} from "@entrypoints/content/store/app/saga-action/app.saga.action.ts";
import ExtensionStorageManager from "@entrypoints/core/services/storage/ExtensionStorageManager";
import {DraggableModal} from '@/entrypoints/shared/components/ModalDraggable';
import { hideSponsorMessage } from "@entrypoints/content/store/app/app.slice.ts";
import {Logo} from "@/entrypoints/shared/components/Logo/Logo.tsx";
import {ElementInspectorPopup} from "@entrypoints/content/modules/PopupContainer/ElementInspectorPopup.tsx";
import {
    ANALYZE_PAGE,
    AUTOMATION,
    CONVERT_TOOLS,
    INSPECTOR,
    PICKER, POPUP_SUPPORT_TOOLS,
    RULER
} from "@entrypoints/content/modules/Launcher/LauncherIcons.ts";
import {UnitConverter} from "@entrypoints/content/modules/PopupContainer/UnitConverter.tsx";
import ColorPicker from "@entrypoints/content/modules/PopupContainer/ColorPicker.tsx";
import AnalyzePageUI from "@entrypoints/content/modules/PopupContainer/AnalyzePageUI.tsx";
import AutomationScenarios
    from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/AutomationScenarios.tsx";
import {
    BecomeASponsor,
    BecomeASponsorText,
    FeatureContainer,
    HideButton
} from "@entrypoints/content/modules/PopupContainer/PopupContainer.styled.ts";
import RandomBackground from "@entrypoints/shared/components/RandomBackground.tsx";
import ViewportInfo from "@entrypoints/content/modules/PopupContainer/ViewportInfo.tsx";
import {PiCloverDuotone} from "react-icons/pi";
import {Popover} from "antd";
import SettingsButton from "@entrypoints/shared/components/SettingsButton.tsx";


// POPUP_SUPPORT_TOOLS mandatory updated this list
const COMPONENT_MAP: Record<string, JSX.Element> = {
    [INSPECTOR.id]: <ElementInspectorPopup/>,
    [CONVERT_TOOLS.id]: <UnitConverter/>,
    [PICKER.id]: <ColorPicker/>,
    [RULER.id]: <ViewportInfo/>,
    [ANALYZE_PAGE.id]: <AnalyzePageUI/>,
    [AUTOMATION.id]: <AutomationScenarios/>,
}

export function PopupContainer() {
    const dispatch = useDispatch()

    const {activeIcons = [], iconOrder: iconOrderStorage} = useSelector((state: any) => state?.app.launcher);
    const featurePopupIsMinimized = useSelector((state: any) => state?.app.featurePopupIsMinimized);
    const featurePopupPosition = useSelector((state: any) => state?.app.featurePopupPosition);
    const sponsorMessage = useSelector((state: any) => state?.app.sponsorMessage);

    const [isLongPress, setIsLongPress] = useState(false);
    const [luckySponsorHide, setLuckySponsorHide] = useState(false);
    const pressTimer = useRef<NodeJS.Timeout | null>(null);
    const pressTimerDate = useRef<number>(null);

    const handleUpdatePopupSetting = (data) => {
        dispatch(onChangeFeaturePopupPosition.getPayload(data));
    };

    const handleSponsorMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        setIsLongPress(true);

        pressTimerDate.current = Date.now();
        pressTimer.current = setTimeout(() => {
            setLuckySponsorHide(true);
        }, 1000);
    };

    const handleHideSponsorMessage = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const isSimpleClick = Date.now() - (pressTimerDate.current || 0) < 1000;

        if (isSimpleClick) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            const hiddenUntil = tomorrow.getTime();
            await ExtensionStorageManager.hideSponsorMessage(hiddenUntil);
            dispatch(hideSponsorMessage(hiddenUntil));
        }

        pressTimer.current && clearTimeout(pressTimer.current);
        pressTimer.current = null;
        setIsLongPress(false);
    };

    const handleHideSponsorMessageForMonth = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const oneMonthLater = new Date();
        oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

        const hiddenUntil = oneMonthLater.getTime();
        await ExtensionStorageManager.hideSponsorMessage(hiddenUntil);
        dispatch(hideSponsorMessage(hiddenUntil));
    };

    const shouldShowSponsorMessage = !sponsorMessage?.hiddenUntil ||
        Date.now() > sponsorMessage.hiddenUntil;

    // Check if iconOrderStorage contains all elements from POPUP_SUPPORT_TOOLS
    // If not, add missing elements to the end of the list
    let iconOrder = iconOrderStorage;
    if (iconOrderStorage.length > 0) {
        // Find elements in POPUP_SUPPORT_TOOLS that are not in iconOrderStorage
        const missingElements = POPUP_SUPPORT_TOOLS.filter(id => !iconOrderStorage.includes(id));
        
        // If there are missing elements, add them to the end of iconOrderStorage
        if (missingElements.length > 0) {
            iconOrder = [...iconOrderStorage, ...missingElements];
            // Update the storage with the new iconOrder
            dispatch(onChangeLauncherIconOrder.getPayload(iconOrder));
        }
    } else {
        // If iconOrderStorage is empty, use POPUP_SUPPORT_TOOLS
        iconOrder = POPUP_SUPPORT_TOOLS;
    }

    return (
        <>
            <GlobalStyle/>
            <DraggableModal
                open={!featurePopupIsMinimized}
                title={<Logo/>}
                initialHeight={featurePopupPosition.height}
                initialWidth={featurePopupPosition.width}
                initialX={featurePopupPosition.x}
                initialY={featurePopupPosition.y}
                onModalStateChange={handleUpdatePopupSetting}
                footer={
                    shouldShowSponsorMessage ? (
                        <BecomeASponsor
                            target={"_blank"}
                            href={"https://github.com/liubomyr-kozak/HoverInspectorSupport/blob/main/SponsorRequest.md"}
                        >
                            <div className="hover-effect">
                                <RandomBackground/>
                            </div>

                            {luckySponsorHide
                                ? <BecomeASponsorText className="px-4">
                                    <p className="flex items-center justify-center transition-colors"
                                       style={{
                                           animation: 'colorPulse 1s infinite',
                                       }}
                                    >
                                        <PiCloverDuotone size={18} className="mr-2" />
                                        Welcome to the club! You found my secret gift!
                                    </p>
                                    <HideButton
                                        onClick={handleHideSponsorMessageForMonth}
                                        title="Hide sponsor message for 1 month"
                                    >
                                        Hide sponsor message for 1 month
                                    </HideButton>
                                </BecomeASponsorText>
                                : <BecomeASponsorText>
                                    <h3>Become a Sponsor</h3>
                                    <p>Support the project and help bring new features faster.</p>
                                </BecomeASponsorText>}

                            <div
                                style={{
                                    position: 'absolute',
                                    top: '5px',
                                    right: '5px',
                                    cursor: 'pointer',
                                    zIndex: 10,
                                    background: 'rgba(255,255,255,0.7)',
                                    borderRadius: '50%',
                                    padding: '2px'
                                }}
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleHideSponsorMessage(e);
                                }}
                                onMouseDown={handleSponsorMouseDown}
                                onMouseUp={handleHideSponsorMessage}
                                title="Hide until tomorrow"
                            >
                                <IconX
                                    size={16}
                                    style={{
                                        animation: isLongPress ? 'spin 1s linear infinite' : 'none'
                                    }}
                                />
                            </div>
                        </BecomeASponsor>
                    ) : null
                }>


                <FeatureContainer>
                    {iconOrder
                        .filter(id => activeIcons.includes(id))
                        .map(id => COMPONENT_MAP[id])
                    }
                </FeatureContainer>
            </DraggableModal>
        </>
    )
}