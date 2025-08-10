import React, { useEffect, useRef, useState } from "react";
import { Button, Col, Divider, InputNumber, List, Popover, Row, Select, Typography } from "antd";
import { FeatureTitle } from "@entrypoints/content/modules/PopupContainer/PopupContainer.styled";
import copy from "copy-to-clipboard";
import { Tooltip } from "@entrypoints/shared/components/Tooltip";
import SettingsButton from "@entrypoints/shared/components/SettingsButton";
import { IconCopy, IconTrash } from "@tabler/icons-react";
import {
  PortalModalHeader,
  HeaderPortalId,
} from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/components/ScenarioPortalHeaderButtons";
import { FeatureIcon } from "@entrypoints/shared/components/FeatureIcon.tsx";
import { CONVERT_TOOLS, RULER } from "@entrypoints/content/modules/Launcher/LauncherIcons.ts";

const { Text } = Typography;

const units = ["px", "rem", "em", "%", "vw", "vh"];

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
  const [inputUnit, setInputUnit] = useState<string>("px");
  const [outputUnit, setOutputUnit] = useState<string>("rem");
  const [baseSize, setBaseSize] = useState<number>(16);
  const [history, setHistory] = useState<ConversionHistoryItem[]>([]);

  // Ref to store timeout ID for debounce
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem("unitConverterHistory");
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        setHistory(parsedHistory);
      } catch (e) {
        console.error("Failed to parse history from localStorage", e);
      }
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("unitConverterHistory", JSON.stringify(history));
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
        case "px":
          // Якщо вихідне значення в пікселях — повертаємо як є
          return value;
        case "rem":
        case "em":
          // rem/em множимо на базовий розмір шрифту
          return value * baseSize;
        case "%":
          // % — частка від базового розміру (для шрифту, а не viewport!)
          return (value / 100) * baseSize;
        case "vw":
          // vw — % від ширини viewport
          return (window.innerWidth * value) / 100;
        case "vh":
          // vh — % від висоти viewport
          return (window.innerHeight * value) / 100;
        default:
          return value;
      }
    })();

    // Тепер конвертуємо з пікселів у цільову одиницю
    const result = (() => {
      switch (to) {
        case "px":
          return pxValue;
        case "rem":
        case "em":
          return pxValue / baseSize;
        case "%":
          // % повертається як відношення до baseSize, тільки якщо мова про шрифт
          return (pxValue / baseSize) * 100;
        case "vw":
          // Для vw рахуємо, скільки це від ширини viewport
          return (pxValue / window.innerWidth) * 100;
        case "vh":
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
      baseSize,
    };

    // Check if this is just a case change from the last history item
    setHistory((prevHistory) => {
      // Якщо історія порожня → додаємо новий елемент
      if (prevHistory.length === 0) {
        return [newHistoryItem];
      }

      // Знаходимо індекс дубліката (порівнюємо всі важливі поля)
      const duplicateIndex = prevHistory.findIndex(
        (item) =>
          item.inputValue === newHistoryItem.inputValue &&
          item.inputUnit.toLowerCase() === newHistoryItem.inputUnit.toLowerCase() &&
          item.outputValue === newHistoryItem.outputValue &&
          item.outputUnit.toLowerCase() === newHistoryItem.outputUnit.toLowerCase() &&
          item.baseSize === newHistoryItem.baseSize,
      );

      // Якщо дубліката нема → додаємо новий елемент в початок
      if (duplicateIndex === -1) {
        return [newHistoryItem, ...prevHistory].slice(0, 20);
      }

      // Якщо дублікат вже на початку → нічого не змінюємо
      if (duplicateIndex === 0) {
        return prevHistory;
      }

      // Якщо дублікат є, але не на початку →
      // видаляємо його зі старої позиції і переносимо на початок
      const updatedHistory = [newHistoryItem, ...prevHistory.filter((_, idx) => idx !== duplicateIndex)].slice(0, 20);

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

  return (
    <div className={"w-full"}>
      <PortalModalHeader portalId={HeaderPortalId.UNIT_CONVERTER}>
        <FeatureTitle>
          <FeatureIcon icon={CONVERT_TOOLS.icon} isBetta />
          {CONVERT_TOOLS.title}
        </FeatureTitle>
      </PortalModalHeader>

      <Row gutter={12} style={{ marginBottom: 16 }}>
        <Col span={10}>
          <InputNumber
            min={0}
            value={inputValue}
            onChange={(v) => setInputValue(v ?? 0)}
            style={{ width: "100%" }}
            addonAfter={inputUnit}
          />
        </Col>
        <Col span={6}>
          <Select
            value={inputUnit}
            onChange={setInputUnit}
            options={unitOptions}
            style={{ width: "100%" }}
            // @ts-ignore
            getPopupContainer={() =>
              (document.querySelector("hover-inspector")!.shadowRoot as HTMLElement)?.querySelector("html > body")
            }
          />
        </Col>
        <Col span={2} style={{ textAlign: "center", lineHeight: "32px" }}>
          =
        </Col>
        <Col span={6}>
          <Select
            value={outputUnit}
            onChange={setOutputUnit}
            options={unitOptions}
            style={{ width: "100%" }}
            // @ts-ignore
            getPopupContainer={() =>
              (document.querySelector("hover-inspector")!.shadowRoot as HTMLElement)?.querySelector("html > body")
            }
          />
        </Col>
      </Row>

      <Row style={{ marginBottom: 12 }}>
        <Col span={24}>
          <div className="flex justify-end mt-2">
            <span className="text-gray-500 mr-2">
              Result: ({inputValue}
              {inputUnit} ÷ {baseSize}px) ={" "}
            </span>
            <Tooltip placement="top" title="Click to Copy" clickTile={"Copied!"}>
              <span
                className="bg-blue-100 text-blue-800 font-semibold rounded-xs py-1 px-2 cursor-pointer"
                onClick={() => {
                  copy(`${outputValue}${outputUnit}`);
                }}
              >
                {outputValue} {outputUnit}
              </span>
            </Tooltip>
          </div>
        </Col>
      </Row>

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
                style={{ marginLeft: "8px" }}
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
                  </Tooltip>,
                ]}
              >
                <div className="flex flex-col">
                  <div>
                    <span className="font-medium">
                      {item.inputValue}
                      {item.inputUnit}
                    </span>
                    <span className="mx-2">→</span>
                    <span className="font-medium">
                      {item.outputValue}
                      {item.outputUnit}
                    </span>
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
