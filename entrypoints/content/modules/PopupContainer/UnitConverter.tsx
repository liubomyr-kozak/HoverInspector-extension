import React, { useEffect, useRef, useState } from "react";
import { Col, InputNumber, Row, Select, Space } from "antd";
import { IconButton } from "@entrypoints/shared/components/IconButton";
import { FeatureTitle, FeatureTitleText } from "@entrypoints/content/modules/PopupContainer/PopupContainer.styled";
import copy from "copy-to-clipboard";
import { Tooltip } from "@entrypoints/shared/components/Tooltip";
import { IconCopy, IconTrash } from "@tabler/icons-react";
import {
  PortalModalHeader,
  HeaderPortalId,
} from "@entrypoints/content/modules/PopupContainer/AutomationScenarios/components/ScenarioPortalHeaderButtons";
import { FeatureIcon } from "@entrypoints/shared/components/FeatureIcon.tsx";
import { CONVERT_TOOLS, RULER } from "@entrypoints/content/modules/Launcher/LauncherIcons.ts";


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

// Kept in extension storage so it follows the user across sites and never touches the page's own localStorage
const HISTORY_STORAGE_KEY = "unitConverterHistory";

const getPopupContainer = () =>
  (document.querySelector("hover-inspector")!.shadowRoot as unknown as HTMLElement)?.querySelector("html > body") as HTMLElement;

// rem is relative to the page's root font size, which is not always 16px
const getRootFontSize = () => parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;

export const UnitConverter: React.FC = () => {
  const [inputValue, setInputValue] = useState<number>(16);
  const [inputUnit, setInputUnit] = useState<string>("px");
  const [outputUnit, setOutputUnit] = useState<string>("rem");
  const [baseSize, setBaseSize] = useState<number>(getRootFontSize);
  const [history, setHistory] = useState<ConversionHistoryItem[]>([]);
  const historyLoaded = useRef(false);
  // vw/vh results depend on the window size, so follow it
  const [viewport, setViewport] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const onResize = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const userChangedInput = useRef(false);

  // Ref to store timeout ID for debounce
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    browser.storage.local
      .get(HISTORY_STORAGE_KEY)
      .then((stored) => {
        const saved = stored?.[HISTORY_STORAGE_KEY];
        if (Array.isArray(saved)) setHistory(saved);
      })
      .catch((e) => console.error("Failed to load conversion history", e))
      .finally(() => {
        historyLoaded.current = true;
      });
  }, []);

  useEffect(() => {
    if (!historyLoaded.current) return;
    browser.storage.local.set({ [HISTORY_STORAGE_KEY]: history }).catch(() => undefined);
  }, [history]);

  // Auto-save to history when the user changes the conversion (with debounce); opening the tool adds nothing
  useEffect(() => {
    if (!userChangedInput.current) {
      userChangedInput.current = true;
      return;
    }

    // Clear any existing timeout to implement debounce
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Save after a few seconds without changes
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
          return (viewport.width * value) / 100;
        case "vh":
          // vh — % від висоти viewport
          return (viewport.height * value) / 100;
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
          return (pxValue / viewport.width) * 100;
        case "vh":
          return (pxValue / viewport.height) * 100;
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
          <FeatureTitleText title={CONVERT_TOOLS.title}>{CONVERT_TOOLS.title}</FeatureTitleText>
        </FeatureTitle>
      </PortalModalHeader>

      {/* The value and its unit form one control; the unit is chosen in the select only, not repeated */}
      <Row gutter={8} align="middle" wrap={false} style={{ marginBottom: 16 }}>
        <Col flex="auto">
          <Space.Compact block>
            <InputNumber
              value={inputValue}
              onChange={(v) => setInputValue(v ?? 0)}
              style={{ width: "100%" }}
              aria-label="Value"
            />
            <Select
              value={inputUnit}
              onChange={setInputUnit}
              options={unitOptions}
              style={{ width: 84, flex: "none" }}
              aria-label="From unit"
              // @ts-ignore
              getPopupContainer={getPopupContainer}
            />
          </Space.Compact>
        </Col>
        <Col flex="none" className="text-gray-500" style={{ fontSize: 16, lineHeight: "32px" }} aria-hidden>
          =
        </Col>
        <Col flex="84px">
          <Select
            value={outputUnit}
            onChange={setOutputUnit}
            options={unitOptions}
            style={{ width: "100%" }}
            aria-label="To unit"
            // @ts-ignore
            getPopupContainer={getPopupContainer}
          />
        </Col>
      </Row>

      <Row gutter={12} align="middle" style={{ marginBottom: 12 }}>
        <Col flex="none">
          <Tooltip placement="top" title="Root font size used for rem, em and % (defaults to this page's)">
            <span className="text-gray-500">Base size</span>
          </Tooltip>
        </Col>
        <Col flex="110px">
          <InputNumber
            min={1}
            aria-label="Base size"
            value={baseSize}
            onChange={(v) => setBaseSize(v || 16)}
            addonAfter="px"
            style={{ width: "100%" }}
          />
        </Col>
        <Col flex="auto" className="text-right text-gray-500 text-xs">
          viewport {viewport.width}×{viewport.height}
        </Col>
      </Row>

      <Row style={{ marginBottom: 12 }}>
        <Col span={24}>
          <div className="flex justify-end items-center mt-2">
            <span className="text-gray-500 mr-2">
              {inputValue}
              {inputUnit} =
            </span>
            <Tooltip placement="top" title="Click to copy" clickTile={"Copied!"}>
              <button
                type="button"
                aria-label={`Copy ${outputValue}${outputUnit}`}
                className="bg-blue-50 text-blue-800 border border-blue-200 font-semibold rounded py-0.5 px-2 cursor-pointer hover:bg-blue-100"
                onClick={() => {
                  copy(`${outputValue}${outputUnit}`);
                }}
              >
                {outputValue}
                {outputUnit}
              </button>
            </Tooltip>
          </div>
        </Col>
      </Row>

      {/* History: each row is a button that restores the conversion, with a separate copy button */}
      {history.length > 0 && (
        <section aria-labelledby="unit-converter-history-title" className="mt-2">
          <div className="flex items-center justify-between gap-2 pb-1 mb-1 border-b border-gray-200">
            <h3 id="unit-converter-history-title" className="m-0 text-sm font-semibold text-gray-800">
              Conversion history
            </h3>
            <IconButton label="Clear conversion history" onClick={clearHistory} size={24}>
              <IconTrash />
            </IconButton>
          </div>
          <ul className="m-0 p-0 list-none">
            {history.map((item) => (
              <li key={item.id} className="flex items-center gap-1 min-w-0 border-b border-gray-100 last:border-b-0">
                <button
                  type="button"
                  className="flex-1 min-w-0 text-left bg-transparent border-0 rounded px-2 py-1.5 cursor-pointer hover:bg-gray-50 text-sm text-gray-800"
                  title="Use this conversion"
                  onClick={() => useHistoryItem(item)}
                >
                  <span className="font-medium inline-block max-w-full [overflow-wrap:anywhere]">
                    {item.inputValue}
                    {item.inputUnit}
                  </span>
                  <span className="mx-2 text-gray-500" aria-hidden>
                    →
                  </span>
                  <span className="sr-only">to</span>
                  <span className="font-medium inline-block max-w-full [overflow-wrap:anywhere]">
                    {item.outputValue}
                    {item.outputUnit}
                  </span>
                </button>
                <IconButton
                  label={`Copy ${item.outputValue}${item.outputUnit}`}
                  size={24}
                  onClick={() => copy(`${item.outputValue}${item.outputUnit}`)}
                >
                  <IconCopy />
                </IconButton>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};
