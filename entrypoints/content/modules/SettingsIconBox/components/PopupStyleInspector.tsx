import React, {useState, useMemo, useRef} from "react";
import copy from "copy-to-clipboard";
import DomNodeManager, {useDomNodeObserver} from "@/entrypoints/core/services/dom/DomNodeManager";
import {IconCaretDownFilled, IconCaretRightFilled} from "@tabler/icons-react";
import {isGradientValue} from "@/entrypoints/shared/utils/isGradientValue";
import {isColorValue} from "@entrypoints/shared/utils/isColorValue.ts";
import {convertPx} from "@entrypoints/shared/utils/convertPx.ts";
import {minifyHex} from "@/entrypoints/shared/utils/minifyHex";
import {isValid} from "@entrypoints/shared/utils/isValid.ts";
import {GROUPS} from "@entrypoints/shared/constant/domNodeStyleGroup.ts";
import {formatBoxShorthand} from "../utils/formatBoxShorthand.ts";
import {generateStyleBlock} from "../utils/generateStyleBlock";
import {formatBorder} from "../utils/formatBorder";

function mergeTextTokens(tokens: any) {
    const merged: any[] = [];
    let buffer = "";

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        if (token.type === "text") {
            buffer += token.value;
        } else {
            if (buffer) {
                merged.push({type: "text", value: buffer});
                buffer = "";
            }
            merged.push(token);
        }
    }
    if (buffer) {
        merged.push({type: "text", value: buffer});
    }
    return merged;
}

function parseCssLine(lineValue) {
    const match = /^([\w-]+)\s*:\s*([^;]+)(;?)/.exec(lineValue);
    if (!match) return [{type: "text", value: lineValue}];

    const [, property, value, semicolon] = match;
    const tokens = [
        {type: "property", value: property},
        {type: "colon", value: ":"},
        {type: "space", value: " "},
    ];

    let lastIndex = 0;
    let matchColor;

    const COLOR_GRADIENT_REGEX = /(linear-gradient\([^)]+\)|radial-gradient\([^)]+\)|repeating-linear-gradient\([^)]+\)|repeating-radial-gradient\([^)]+\)|#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\)|\b(?:transparent|currentColor|inherit|initial|unset|[a-z]{3,})\b|color\(.*?\)|lab\(.*?\)|lch\(.*?\)|oklab\(.*?\)|oklch\(.*?\))/g;

    while ((matchColor = COLOR_GRADIENT_REGEX.exec(value)) !== null) {
        // Перед кольором/градієнтом — звичайний текст
        if (matchColor.index > lastIndex) {
            const text = value.slice(lastIndex, matchColor.index);
            if (text) tokens.push({type: "text", value: text});
        }
        const colorValue = matchColor[0];
        // Який це тип — вирішуємо динамічно
        if (isGradientValue(colorValue)) {
            tokens.push({type: "gradient", value: colorValue});
        } else if (isColorValue(colorValue)) {
            tokens.push({type: "color", value: colorValue});
        } else {
            tokens.push({type: "text", value: colorValue}); // fallback
        }

        lastIndex = matchColor.index + colorValue.length;
    }
    // Якщо щось залишилось в кінці
    if (lastIndex < value.length) {
        tokens.push({type: "text", value: value.slice(lastIndex)});
    }

    if (semicolon) tokens.push({type: "semicolon", value: semicolon});

    return mergeTextTokens(tokens);
}

// Рендеринг по токенах
const renderToken = (token, idx) => {
    switch (token.type) {
        case "property":
            return <span key={idx} className="font-semibold">{token.value}</span>;
        case "colon":
            return token.value; // ":"
        case "space":
            return token.value; // пробіл (може бути "\t" чи декілька пробілів)
        case "semicolon":
            return token.value; // ";"
        case "gradient":
            return (
                <span key={idx} className="inline-flex items-center gap-1">
                    <span
                        className="inline-block w-6 h-3 rounded border border-gray-300 align-middle"
                        style={{backgroundImage: token.value}}
                        title="gradient"
                    />
                    {token.value}
                </span>
            );
        case "color":
            return (
                <span key={idx} className="inline-flex items-center gap-1">
                    <span
                        className="inline-block w-3 h-3 rounded border border-gray-300 align-middle"
                        style={{backgroundColor: token.value}}
                        title={token.value}
                    />
                    {token.value}
                </span>
            );
        case "text":
        default:
            return token.value;
    }
};

const RenderLineWithColor = React.memo(function RenderLineWithColor({lineValue}: {
    lineValue: string;
}) {
    const tokens = useMemo(() => parseCssLine(lineValue), [lineValue]);

    return <span className="text-wrap">{tokens.map(renderToken)}</span>;
});


const PopupStyleInspector = ({selectedElementType}) => {
    const selectedElement = useDomNodeObserver(selectedElementType);
    const [unit, setUnit] = useState("px");
    const [format, setFormat] = useState("css");
    const [expanded, setExpanded] = useState({
        border: false,
        margin: false,
        padding: false,
    });

    const blockRef = useRef(null);

    const convert = (val) => (!val || val === "false") ? "" : convertPx(val, unit);

    const processedLines = useMemo(() => {
        if (!selectedElement || !(selectedElement instanceof Element)) return [];
        const styles = {...DomNodeManager.getStyleByNode(selectedElement)};

        const lines = [
            ...Object.entries(GROUPS).flatMap(([group, keys]) => {
                let section: any[] = [];

                keys.forEach((key) => {
                    if (key === "margin" || key === "padding") {
                        const result = formatBoxShorthand(key, styles, convert, expanded[key]);
                        section = section.concat(...result);
                        return;
                    }

                    if (key === "border") {
                        const borderLines = formatBorder(styles, convert, expanded[key]);
                        section = section.concat(...borderLines);
                        return;
                    }

                    Object.keys(styles).forEach((prop) => {
                        if (prop.startsWith(key)) {
                            const rawVal = styles[prop];
                            const val = typeof rawVal === "string" && rawVal.startsWith("#") ? minifyHex(rawVal) : convert(rawVal);
                            if (val) section.push({type: "line", value: `${prop}: ${val}`});
                        }
                    });
                });

                if (!section.length) return [];

                return [
                    // добавляю /* Box Model */,   /* Typography */ або інші заголовки
                    {type: "comment", value: `\n /* ${group} */`},
                    ...section.filter(isValid),
                ];
            }),
        ];

        return generateStyleBlock(selectedElement, lines, format);
    }, [selectedElement, unit, expanded, format]);

    const toggleExpand = (prop) => setExpanded((prev) => ({...prev, [prop]: !prev[prop]}));
    const renderIcon = (prop) => expanded[prop] ? <IconCaretDownFilled size={12}/> : <IconCaretRightFilled size={12}/>;
    const copyAll = () => copy(processedLines.map((line) => line.value).join("\n"));

    return (
        <div className="p-3 w-full bg-white rounded-md border border-gray-200 shadow">
            <div className="flex justify-between items-center mb-2 flex-wrap">
                <span className="text-sm font-semibold">CSS Output</span>
                <div className="flex gap-1 ml-auto">
                    <select
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        className="text-xs border rounded px-1"
                    >
                        <option value="px">px</option>
                        <option value="rem">rem</option>
                        <option value="em">em</option>
                    </select>
                    <select
                        value={format}
                        onChange={(e) => setFormat(e.target.value)}
                        className="text-xs border rounded px-1"
                    >
                        <option value="css">CSS</option>
                        <option value="scss">SCSS</option>
                        <option value="sass">SASS</option>
                        <option value="styled-literal">Styled literal (string)</option>
                        <option value="styled-object">Styled object</option>
                    </select>
                    <button
                        onClick={copyAll} className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
                        title="Copy all styles"
                    >
                        Copy all
                    </button>
                </div>
            </div>
            {processedLines.length === 0 ? (
                <div className="text-xs text-gray-400 italic">No changed styles detected.</div>
            ) : (
                <pre
                    ref={blockRef}
                    className="bg-gray-50 text-xs font-mono p-2 rounded border border-gray-100"
                >
                      {processedLines.map((line, i) => {
                          // Для shorthand (мають prop) рендеримо заголовок з кнопкою expand
                          if (line.type === "shorthand" && line.prop) {
                              return (
                                  <div
                                      key={i}
                                      className="ml-2 px-1 py-0.5 rounded cursor-pointer hover:bg-yellow-100 text-gray-800 flex items-center"
                                      data-type='shorthand'
                                      onClick={e => {
                                          e.stopPropagation();
                                          copy(line.value.trim());
                                          toggleExpand(line.prop);
                                      }}
                                  >
                                          <span
                                              className="inline-block w-4 text-gray-500 mr-1"
                                              style={{
                                                  marginLeft: "-13px",
                                                  width: '10px;'
                                              }}>
                                            {renderIcon(line.prop)}
                                          </span>
                                      <span className="cursor-pointer hover:bg-yellow-100">{line.value}</span>
                                  </div>
                              );
                          }

                          // Для detail рендеримо тільки якщо expanded[prop]
                          if (line.type === "detail" && line.prop && expanded[line.prop]) {
                              return (
                                  <div
                                      key={i}
                                      data-type='detail'
                                      className="ml-4 px-1 py-0.5 rounded text-gray-800 bg-yellow-50 hover:bg-yellow-100 cursor-pointer"
                                      // detail копіювати теж можна!
                                      onClick={() => copy(line.value.trim())}
                                      title="Click to copy"
                                  >
                                      <RenderLineWithColor lineValue={line.value}/>
                                  </div>
                              );
                          }

                          if (line.type === "wrapper") {
                              return (
                                  <div
                                      key={i}
                                      data-type='wrapper'
                                      className="px-1 py-0.5 rounded text-gray-800 cursor-default"
                                  >
                                      {line.value}
                                  </div>
                              );
                          }


                          return (
                              <div
                                  key={i}
                                  className={`px-1 py-0.5 rounded flex items-center justify-between ${
                                      line.value.trim().startsWith("/*") ? "text-gray-400 cursor-default" : "ml-2 cursor-pointer hover:bg-yellow-100"
                                  }`}
                                  data-type='default'
                                  onClick={() => {
                                      if (!line.value.trim().startsWith("/*")) {
                                          copy(line.value.trim());
                                      }
                                  }}
                                  title={line.value.trim().startsWith("/*") ? "" : "Click to copy"}
                              >
                                  <RenderLineWithColor lineValue={line.value}/>
                              </div>
                          );
                      })}
                </pre>
            )}
        </div>
    );
};

export default PopupStyleInspector;
