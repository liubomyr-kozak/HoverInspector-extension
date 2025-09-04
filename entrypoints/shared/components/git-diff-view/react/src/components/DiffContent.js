/* eslint-disable max-lines */
import { DiffLineType, getSyntaxDiffTemplate, getSyntaxLineTemplate, getPlainDiffTemplate, getPlainLineTemplate, } from "@git-diff-view/core";
import { memoFunc, addContentHighlightBGName, delContentHighlightBGName, diffFontSizeName, getSymbol, NewLineSymbol, } from "../utils";
import * as React from "react";
import { DiffNoNewLine } from "./DiffNoNewLine";
const temp = {};
const formatStringToCamelCase = (str) => {
    if (str.startsWith("--"))
        return str;
    const splitted = str.split("-");
    if (splitted.length === 1)
        return splitted[0];
    return (splitted[0] +
        splitted
            .slice(1)
            .map((word) => word[0].toUpperCase() + word.slice(1))
            .join(""));
};
export const getStyleObjectFromString = memoFunc((str) => {
    if (!str)
        return temp;
    const style = {};
    str.split(";").forEach((el) => {
        const [property, value] = el.split(":");
        if (!property)
            return;
        const formattedProperty = formatStringToCamelCase(property.trim());
        style[formattedProperty] = value.trim();
    });
    return style;
});
const DiffString = ({ rawLine, diffLine, operator, plainLine, enableWrap, enableTemplate, }) => {
    const changes = diffLine === null || diffLine === void 0 ? void 0 : diffLine.changes;
    if (changes === null || changes === void 0 ? void 0 : changes.hasLineChange) {
        const isNewLineSymbolChanged = changes.newLineSymbol;
        if (enableTemplate && !(diffLine === null || diffLine === void 0 ? void 0 : diffLine.plainTemplate) && typeof getPlainDiffTemplate === "function") {
            getPlainDiffTemplate({ diffLine, rawLine, operator });
        }
        if (enableTemplate && (diffLine === null || diffLine === void 0 ? void 0 : diffLine.plainTemplate)) {
            return (React.createElement("span", { className: "diff-line-content-raw" },
                React.createElement("span", { "data-template": true, dangerouslySetInnerHTML: { __html: diffLine.plainTemplate } }),
                isNewLineSymbolChanged === NewLineSymbol.NEWLINE && (React.createElement("span", { "data-no-newline-at-end-of-file-symbol": true, className: enableWrap ? "block !text-red-500" : "inline-block align-middle !text-red-500", style: {
                        width: `var(${diffFontSizeName})`,
                        height: `var(${diffFontSizeName})`,
                    } },
                    React.createElement(DiffNoNewLine, null)))));
        }
        else {
            // TODO remove
            const range = changes.range;
            const str1 = rawLine.slice(0, range.location);
            const str2 = rawLine.slice(range.location, range.location + range.length);
            const str3 = rawLine.slice(range.location + range.length);
            const isLast = str2.includes("\n");
            const _str2 = isLast ? str2.replace("\n", "").replace("\r", "") : str2;
            return (React.createElement("span", { className: "diff-line-content-raw" },
                React.createElement("span", { "data-range-start": range.location, "data-range-end": range.location + range.length },
                    str1,
                    React.createElement("span", { "data-diff-highlight": true, className: "rounded-[0.2em]", style: {
                            backgroundColor: operator === "add" ? `var(${addContentHighlightBGName})` : `var(${delContentHighlightBGName})`,
                        } }, isLast ? (React.createElement(React.Fragment, null,
                        _str2,
                        React.createElement("span", { "data-newline-symbol": true }, getSymbol(isNewLineSymbolChanged)))) : (str2)),
                    str3),
                isNewLineSymbolChanged === NewLineSymbol.NEWLINE && (React.createElement("span", { "data-no-newline-at-end-of-file-symbol": true, className: enableWrap ? "block !text-red-500" : "inline-block align-middle !text-red-500", style: {
                        width: `var(${diffFontSizeName})`,
                        height: `var(${diffFontSizeName})`,
                    } },
                    React.createElement(DiffNoNewLine, null)))));
        }
    }
    if (enableTemplate && plainLine && !(plainLine === null || plainLine === void 0 ? void 0 : plainLine.template)) {
        plainLine.template = getPlainLineTemplate(plainLine.value);
    }
    if (enableTemplate && (plainLine === null || plainLine === void 0 ? void 0 : plainLine.template)) {
        return (React.createElement("span", { className: "diff-line-content-raw" },
            React.createElement("span", { "data-template": true, dangerouslySetInnerHTML: { __html: plainLine.template } })));
    }
    return React.createElement("span", { className: "diff-line-content-raw" }, rawLine);
};
const DiffSyntax = ({ rawLine, diffLine, operator, syntaxLine, enableWrap, enableTemplate, }) => {
    var _a, _b;
    if (!syntaxLine) {
        return (React.createElement(DiffString, { rawLine: rawLine, diffLine: diffLine, operator: operator, enableWrap: enableWrap, enableTemplate: enableTemplate }));
    }
    const changes = diffLine === null || diffLine === void 0 ? void 0 : diffLine.changes;
    if (changes === null || changes === void 0 ? void 0 : changes.hasLineChange) {
        const isNewLineSymbolChanged = changes.newLineSymbol;
        if (enableTemplate && !(diffLine === null || diffLine === void 0 ? void 0 : diffLine.syntaxTemplate) && typeof getSyntaxDiffTemplate === "function") {
            getSyntaxDiffTemplate({ diffLine, syntaxLine, operator });
        }
        if (enableTemplate && (diffLine === null || diffLine === void 0 ? void 0 : diffLine.syntaxTemplate)) {
            return (React.createElement("span", { className: "diff-line-syntax-raw" },
                React.createElement("span", { "data-template": true, dangerouslySetInnerHTML: { __html: diffLine.syntaxTemplate } }),
                isNewLineSymbolChanged === NewLineSymbol.NEWLINE && (React.createElement("span", { "data-no-newline-at-end-of-file-symbol": true, className: enableWrap ? "block !text-red-500" : "inline-block align-middle !text-red-500", style: {
                        width: `var(${diffFontSizeName})`,
                        height: `var(${diffFontSizeName})`,
                    } },
                    React.createElement(DiffNoNewLine, null)))));
        }
        else {
            // TODO remove
            const range = changes.range;
            return (React.createElement("span", { className: "diff-line-syntax-raw" },
                React.createElement("span", { "data-range-start": range.location, "data-range-end": range.location + range.length }, (_a = syntaxLine.nodeList) === null || _a === void 0 ? void 0 : _a.map(({ node, wrapper }, index) => {
                    var _a, _b, _c, _d, _e, _f;
                    if (node.endIndex < range.location || range.location + range.length < node.startIndex) {
                        return (React.createElement("span", { key: index, "data-start": node.startIndex, "data-end": node.endIndex, className: (_b = (_a = wrapper === null || wrapper === void 0 ? void 0 : wrapper.properties) === null || _a === void 0 ? void 0 : _a.className) === null || _b === void 0 ? void 0 : _b.join(" "), style: getStyleObjectFromString(((_c = wrapper === null || wrapper === void 0 ? void 0 : wrapper.properties) === null || _c === void 0 ? void 0 : _c.style) || "") }, node.value));
                    }
                    else {
                        const index1 = range.location - node.startIndex;
                        const index2 = index1 < 0 ? 0 : index1;
                        const str1 = node.value.slice(0, index2);
                        const str2 = node.value.slice(index2, index1 + range.length);
                        const str3 = node.value.slice(index1 + range.length);
                        const isStart = str1.length || range.location === node.startIndex;
                        const isEnd = str3.length || node.endIndex === range.location + range.length - 1;
                        const isLast = str2.includes("\n");
                        const _str2 = isLast ? str2.replace("\n", "").replace("\r", "") : str2;
                        return (React.createElement("span", { key: index, "data-start": node.startIndex, "data-end": node.endIndex, className: (_e = (_d = wrapper === null || wrapper === void 0 ? void 0 : wrapper.properties) === null || _d === void 0 ? void 0 : _d.className) === null || _e === void 0 ? void 0 : _e.join(" "), style: getStyleObjectFromString(((_f = wrapper === null || wrapper === void 0 ? void 0 : wrapper.properties) === null || _f === void 0 ? void 0 : _f.style) || "") },
                            str1,
                            React.createElement("span", { "data-diff-highlight": true, style: {
                                    backgroundColor: operator === "add"
                                        ? `var(${addContentHighlightBGName})`
                                        : `var(${delContentHighlightBGName})`,
                                    borderTopLeftRadius: isStart ? "0.2em" : undefined,
                                    borderBottomLeftRadius: isStart ? "0.2em" : undefined,
                                    borderTopRightRadius: isEnd || isLast ? "0.2em" : undefined,
                                    borderBottomRightRadius: isEnd || isLast ? "0.2em" : undefined,
                                } }, isLast ? (React.createElement(React.Fragment, null,
                                _str2,
                                React.createElement("span", { "data-newline-symbol": true }, getSymbol(isNewLineSymbolChanged)))) : (str2)),
                            str3));
                    }
                })),
                isNewLineSymbolChanged === NewLineSymbol.NEWLINE && (React.createElement("span", { "data-no-newline-at-end-of-file-symbol": true, className: enableWrap ? "block !text-red-500" : "inline-block align-middle !text-red-500", style: {
                        width: `var(${diffFontSizeName})`,
                        height: `var(${diffFontSizeName})`,
                    } },
                    React.createElement(DiffNoNewLine, null)))));
        }
    }
    if (enableTemplate && !syntaxLine.template) {
        syntaxLine.template = getSyntaxLineTemplate(syntaxLine);
    }
    if (enableTemplate && (syntaxLine === null || syntaxLine === void 0 ? void 0 : syntaxLine.template)) {
        return (React.createElement("span", { className: "diff-line-syntax-raw" },
            React.createElement("span", { "data-template": true, dangerouslySetInnerHTML: { __html: syntaxLine.template } })));
    }
    return (React.createElement("span", { className: "diff-line-syntax-raw" }, (_b = syntaxLine === null || syntaxLine === void 0 ? void 0 : syntaxLine.nodeList) === null || _b === void 0 ? void 0 : _b.map(({ node, wrapper }, index) => {
        var _a, _b, _c;
        return (React.createElement("span", { key: index, "data-start": node.startIndex, "data-end": node.endIndex, className: (_b = (_a = wrapper === null || wrapper === void 0 ? void 0 : wrapper.properties) === null || _a === void 0 ? void 0 : _a.className) === null || _b === void 0 ? void 0 : _b.join(" "), style: getStyleObjectFromString(((_c = wrapper === null || wrapper === void 0 ? void 0 : wrapper.properties) === null || _c === void 0 ? void 0 : _c.style) || "") }, node.value));
    })));
};
export const DiffContent = ({ diffLine, diffFile, rawLine, plainLine, syntaxLine, enableWrap, enableHighlight, }) => {
    var _a, _b, _c;
    const isAdded = (diffLine === null || diffLine === void 0 ? void 0 : diffLine.type) === DiffLineType.Add;
    const isDelete = (diffLine === null || diffLine === void 0 ? void 0 : diffLine.type) === DiffLineType.Delete;
    const isMaxLineLengthToIgnoreSyntax = ((_a = syntaxLine === null || syntaxLine === void 0 ? void 0 : syntaxLine.nodeList) === null || _a === void 0 ? void 0 : _a.length) > 150;
    const isEnableTemplate = (_c = (_b = diffFile.getIsEnableTemplate) === null || _b === void 0 ? void 0 : _b.call(diffFile)) !== null && _c !== void 0 ? _c : true;
    return (React.createElement("div", { className: "diff-line-content-item pl-[2.0em]", 
        // data-val={rawLine}
        style: {
            whiteSpace: enableWrap ? "pre-wrap" : "pre",
            wordBreak: enableWrap ? "break-all" : "initial",
        } },
        React.createElement("span", { "data-operator": isAdded ? "+" : isDelete ? "-" : undefined, className: "diff-line-content-operator ml-[-1.5em] inline-block w-[1.5em] select-none indent-[0.2em]" }, isAdded ? "+" : isDelete ? "-" : " "),
        enableHighlight && syntaxLine && !isMaxLineLengthToIgnoreSyntax ? (React.createElement(DiffSyntax, { operator: isAdded ? "add" : isDelete ? "del" : undefined, rawLine: rawLine, diffLine: diffLine, syntaxLine: syntaxLine, enableWrap: enableWrap, enableTemplate: isEnableTemplate })) : (React.createElement(DiffString, { operator: isAdded ? "add" : isDelete ? "del" : undefined, rawLine: rawLine, diffLine: diffLine, plainLine: plainLine, enableWrap: enableWrap, enableTemplate: isEnableTemplate }))));
};
