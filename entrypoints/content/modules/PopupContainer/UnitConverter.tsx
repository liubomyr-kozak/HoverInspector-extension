import React, {useState, useEffect, useRef} from 'react';
import {InputNumber, Select, Row, Col, Typography, Divider, Button, List, Popover} from 'antd';
import {FeatureTitle} from "@entrypoints/content/modules/PopupContainer/PopupContainer.styled.ts";
import copy from "copy-to-clipboard";
import {Tooltip} from "@entrypoints/shared/components/Tooltip.tsx";
import SettingsButton from "@entrypoints/shared/components/SettingsButton.tsx";
import {IconBrandSlack} from "@tabler/icons-react";
import {IconTrash, IconCopy, IconSettings} from "@tabler/icons-react";

const {Text} = Typography;

const units = ['px', 'rem', 'em', '%', 'vw', 'vh'];

// Define the type for history items
interface ConversionHistoryItem {
    id: number;
    inputValue: number;
    inputUnit: string;
    outputValue: number;
    outputUnit: string;
    baseSize: number;
}

export const UnitConverter: React.FC = () => {
    const [inputValue, setInputValue] = useState<number>(16);
    const [inputUnit, setInputUnit] = useState<string>('px');
    const [outputUnit, setOutputUnit] = useState<string>('rem');
    const [baseSize, setBaseSize] = useState<number>(16);
    const [history, setHistory] = useState<ConversionHistoryItem[]>([]);
    
    // Ref to store timeout ID for debounce
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    
    // Load history from localStorage on component mount
    useEffect(() => {
        const savedHistory = localStorage.getItem('unitConverterHistory');
        if (savedHistory) {
            try {
                const parsedHistory = JSON.parse(savedHistory);
                setHistory(parsedHistory);
            } catch (e) {
                console.error('Failed to parse history from localStorage', e);
            }
        }
    }, []);
    
    // Save history to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('unitConverterHistory', JSON.stringify(history));
    }, [history]);
    
    // Auto-save to history when conversion parameters change (with debounce)
    useEffect(() => {
        // Clear any existing timeout to implement debounce
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        
        // Set a new timeout to save after 1.5 seconds of inactivity
        saveTimeoutRef.current = setTimeout(() => {
            addToHistory();
            saveTimeoutRef.current = null;
        }, 3500);
        
        // Cleanup function to clear timeout if component unmounts
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [inputValue, inputUnit, outputUnit, baseSize]);

    const convert = (value: number, from: string, to: string) => {
        // Якщо одиниці співпадають — повертаємо значення без змін
        if (from === to) return value;

        // Конвертуємо початкове значення у пікселі
        const pxValue = (() => {
            switch (from) {
                case 'px':
                    // Якщо вихідне значення в пікселях — повертаємо як є
                    return value;
                case 'rem':
                case 'em':
                    // rem/em множимо на базовий розмір шрифту
                    return value * baseSize;
                case '%':
                    // % — частка від базового розміру (для шрифту, а не viewport!)
                    return (value / 100) * baseSize;
                case 'vw':
                    // vw — % від ширини viewport
                    return (window.innerWidth * value) / 100;
                case 'vh':
                    // vh — % від висоти viewport
                    return (window.innerHeight * value) / 100;
                default:
                    return value;
            }
        })();

        // Тепер конвертуємо з пікселів у цільову одиницю
        const result = (() => {
            switch (to) {
                case 'px':
                    return pxValue;
                case 'rem':
                case 'em':
                    return pxValue / baseSize;
                case '%':
                    // % повертається як відношення до baseSize, тільки якщо мова про шрифт
                    return (pxValue / baseSize) * 100;
                case 'vw':
                    // Для vw рахуємо, скільки це від ширини viewport
                    return (pxValue / window.innerWidth) * 100;
                case 'vh':
                    return (pxValue / window.innerHeight) * 100;
                default:
                    return pxValue;
            }
        })();

        return parseFloat(result.toFixed(4));
    };

    const outputValue = convert(inputValue, inputUnit, outputUnit);
    
    // Function to add current conversion to history
    const addToHistory = () => {
        // Create a new history item
        const newHistoryItem: ConversionHistoryItem = {
            id: Date.now(), // Use timestamp as a unique ID
            inputValue,
            inputUnit,
            outputValue,
            outputUnit,
            baseSize
        };
        
        // Check if this is just a case change from the last history item
        setHistory(prevHistory => {
            // If history is empty, add the new item
            if (prevHistory.length === 0) {
                return [newHistoryItem];
            }
            
            // Get the last history item
            const lastItem = prevHistory[0];
            
            // Check if only the case has changed (comparing input and output units case-insensitively)
            const isCaseChangeOnly = 
                lastItem.inputValue === newHistoryItem.inputValue &&
                lastItem.inputUnit.toLowerCase() === newHistoryItem.inputUnit.toLowerCase() &&
                lastItem.outputValue === newHistoryItem.outputValue &&
                lastItem.outputUnit.toLowerCase() === newHistoryItem.outputUnit.toLowerCase() &&
                lastItem.baseSize === newHistoryItem.baseSize;
            
            // If it's just a case change, don't add to history
            if (isCaseChangeOnly) {
                return prevHistory;
            }
            
            // Otherwise, add to history (limit to 20 items to prevent excessive storage)
            const updatedHistory = [newHistoryItem, ...prevHistory].slice(0, 20);
            return updatedHistory;
        });
    };
    
    // Function to clear history
    const clearHistory = () => {
        setHistory([]);
    };
    
    // Function to use a history item
    const useHistoryItem = (item: ConversionHistoryItem) => {
        setInputValue(item.inputValue);
        setInputUnit(item.inputUnit);
        setOutputUnit(item.outputUnit);
        setBaseSize(item.baseSize);
    };

    const unitOptions = units.map((unit) => ({
        label: <span>{unit}</span>,
        value: unit,
    }));

    // Create the content for the settings popover
    const settingsContent = (
        <div className="p-2" style={{minWidth: '250px'}}>
            <div className="font-medium mb-2">Unit Converter Settings</div>
            <div>
                <div className="mb-4">
                    <Text>Base font size:</Text>
                    <InputNumber
                        min={1}
                        value={baseSize}
                        onChange={(v) => setBaseSize(v ?? 16)}
                        style={{width: '100%', marginTop: '8px'}}
                        addonAfter="px"
                    />
                </div>
            </div>
        </div>
    );

    return (
        <div className={'w-full'}>
            <FeatureTitle className="mr-2 flex w-full">
                Unit Converter
                <Popover
                    content={settingsContent}
                    title={null}
                    trigger="hover"
                    placement="bottomRight"
                    zIndex={1150}
                    // @ts-ignore
                    getPopupContainer={() => document.querySelector('hover-inspector')?.shadowRoot as HTMLElement}
                >
                    <SettingsButton />
                </Popover>
            </FeatureTitle>

            <Row gutter={12} style={{marginBottom: 16}}>
                <Col span={10}>
                    <InputNumber
                        min={0}
                        value={inputValue}
                        onChange={(v) => setInputValue(v ?? 0)}
                        style={{width: '100%'}}
                        addonAfter={inputUnit}
                    />
                </Col>
                <Col span={6}>
                    <Select
                        value={inputUnit}
                        onChange={setInputUnit}
                        options={unitOptions}
                        style={{width: '100%'}}
                        // @ts-ignore
                        getPopupContainer={() => (document.querySelector('hover-inspector')!.shadowRoot as HTMLElement)?.querySelector('html > body')}
                    />
                </Col>
                <Col span={2} style={{textAlign: 'center', lineHeight: '32px'}}>
                    =
                </Col>
                <Col span={6}>
                    <Select
                        value={outputUnit}
                        onChange={setOutputUnit}
                        options={unitOptions}
                        style={{width: '100%'}}
                        // @ts-ignore
                        getPopupContainer={() => (document.querySelector('hover-inspector')!.shadowRoot as HTMLElement)?.querySelector('html > body')}
                    />
                </Col>
            </Row>

            <Row style={{marginBottom: 12}}>
                <Col span={24}>
                    <div className="flex justify-end mt-2">
                        <span className="text-gray-500 mr-2">Result: ({inputValue}{inputUnit} ÷ {baseSize}px) = </span>
                        <Tooltip placement="top" title="Click to Copy" clickTile={'Copied!'}>
                            <span
                                className="bg-blue-100 text-blue-800 font-semibold rounded-xs py-1 px-2 cursor-pointer"
                                onClick={() => {
                                    copy(`${outputValue}${outputUnit}`)
                                }}>
                                {outputValue} {outputUnit}
                            </span>
                        </Tooltip>
                    </div>
                </Col>
            </Row>

            <Divider/>
            
            {/* History Section */}
            {history.length > 0 && (
                <>
                    <Divider orientation="left">
                        <div className="flex items-center">
                            <span>Conversion History</span>
                            <Button 
                                type="text" 
                                danger 
                                icon={<IconTrash size={16} />} 
                                size="small" 
                                onClick={clearHistory}
                                style={{ marginLeft: '8px' }}
                            />
                        </div>
                    </Divider>
                    
                    <List
                        size="small"
                        dataSource={history}
                        renderItem={(item) => (
                            <List.Item
                                key={item.id}
                                className="cursor-pointer hover:bg-gray-50"
                                onClick={() => useHistoryItem(item)}
                                actions={[
                                    <Tooltip title="Copy Result" key="copy">
                                        <Button 
                                            type="text" 
                                            icon={<IconCopy size={16} />} 
                                            size="small" 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                copy(`${item.outputValue}${item.outputUnit}`);
                                            }}
                                        />
                                    </Tooltip>
                                ]}
                            >
                                <div className="flex flex-col">
                                    <div>
                                        <span className="font-medium">{item.inputValue}{item.inputUnit}</span>
                                        <span className="mx-2">→</span>
                                        <span className="font-medium">{item.outputValue}{item.outputUnit}</span>
                                    </div>
                                </div>
                            </List.Item>
                        )}

                    />
                </>
            )}
        </div>
    );
};