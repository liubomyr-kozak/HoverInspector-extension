import React, {useState} from "react";
import DomNodeManagerInstance, {useDomNodeObserver} from "@/entrypoints/core/services/dom/DomNodeManager";
import {
    IconTypography,
    IconLetterCase,
    IconRadiusBottomRight,
    IconPalette,
    IconColorSwatch,
    IconBoxModel2,
    IconBorderStyle2,
    IconArrowsDiagonal2,
    IconShadow,
    IconHash,
    IconTag, 
    IconLineHeight, 
    IconLetterSpacing,
    IconBorderStyle,
    IconPhoto,
    IconPointFilled,
    IconForms,
    IconCheckbox,
    IconSelect,
    IconTextRecognition,
    IconRadio,
    IconTextPlus
} from "@tabler/icons-react";
import { categorizeElement } from "@entrypoints/shared/utils/categorizeElements";
import ContrastChecker from "./ContrastChecker";

import copy from "copy-to-clipboard";

interface BoxSide {
    top: number;
    right: number;
    bottom: number;
    left: number;
}

interface Props {
    selectedElementType: string;
}

const SizeLabel: React.FC<{ value?: string }> = ({value}) => <span className="text-[9px]">{value || 'px'}</span>;

const parseSideValues = (value: string): BoxSide => {
    const [top, right, bottom, left] = value
        .split(' ')
        .map((v) => parseInt(v.replace('px', '')) || 0);

    if (left === undefined) return {top, right: top, bottom: top, left: top};
    if (bottom === undefined) return {top, right, bottom: top, left: right};
    if (right === undefined) return {top, right: top, bottom: top, left: top};
    return {top, right, bottom, left};
};

const NON_VALUE = '—'
const NONE_VALUE = 'none'

const UNITS = ["px", "rem", "em"];

export const BoxModelVisualizer: React.FC<Props> = ({selectedElementType}) => {
    const [unit, setUnit] = useState("px");
    const selectedElement = useDomNodeObserver(selectedElementType);

    if (!selectedElement) return <div>Element not found</div>;

    const style = DomNodeManagerInstance.getStyleByNode(selectedElement) as any;
    const rect = selectedElement.getBoundingClientRect();

    const padding = parseSideValues(style.padding || '0');
    const margin = parseSideValues(style.margin || '0');
    const border = style.border || {type: 'none'};
    const borderRadius = style['border-radius'] || '0px';
    const fontSize = style['font-size'] || NON_VALUE;
    const fontFamily = style['font-family'] || NON_VALUE;
    const color = style['color'] || NON_VALUE;
    const backgroundColor = style['background-color'] || NON_VALUE;
    const boxShadow = style['box-shadow'] || NON_VALUE;
    const className = style.className || NON_VALUE;
    const Id = style.id || NON_VALUE;
    const tag = style.tag || NON_VALUE;
    const lineHeight = style['line-height'] || NON_VALUE;
    const letterSpacing = style['letter-spacing'] || NON_VALUE;
    const backgroundImage = style['background-image'] || NON_VALUE;

    const convert = (value: number) => {
        switch (unit) {
            case "rem":
                return (
                    <>
                        {(value / 16).toFixed(2)}
                        <SizeLabel value="rem"/>
                    </>
                );
            case "em":
                return (
                    <>
                        {(value / 16).toFixed(2)}
                        <SizeLabel value="em"/>
                    </>
                );
            default:
                return (
                    <>
                        {value}
                        <SizeLabel value="px"/>
                    </>
                );
        }
    };


    return (
        <div className="inline-block text-xs font-mono w-full">
            <div
                className="relative w-full overflow-hidden"
                style={{height: '180px', backgroundColor: '#fff'}}
            >

                <div
                    className="absolute inset-0 bg-orange-200 text-orange-800"
                    style={{padding: '36px'}}
                >
                    <div className="absolute top-1 left-1">margin</div>
                    <div className="absolute left-1/2 -translate-x-1/2 top-0">
                        {convert(margin.top)}
                    </div>
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-0">
                        {convert(margin.bottom)}
                    </div>
                    <div className="absolute top-1/2 -translate-y-1/2 left-0">
                        {convert(margin.left)}
                    </div>
                    <div className="absolute top-1/2 -translate-y-1/2 right-0">
                        {convert(margin.right)}
                    </div>

                    <div
                        className="w-full h-full bg-yellow-200 relative text-yellow-800"
                        style={{padding: '36px'}}
                    >
                        <div className="absolute left-0 top-0">
                            padding
                        </div>
                        <div className="absolute left-1/2 -translate-x-1/2 top-0">
                            {convert(padding.top)}
                        </div>
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-0">
                            {convert(padding.bottom)}
                        </div>
                        <div className="absolute top-1/2 -translate-y-1/2 left-0">
                            {convert(padding.left)}
                        </div>
                        <div className="absolute top-1/2 -translate-y-1/2 right-0">
                            {convert(padding.right)}
                        </div>

                        <div className="w-full h-full bg-white flex items-center justify-center text-black">
                            {convert(Math.round(rect.width))} × {convert(Math.round(rect.height))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="inline-block text-xs font-mono w-full pt-4">
                <div className="flex justify-end mb-2">
                    <select className="border rounded px-1 py-0.5" value={unit}
                            onChange={(e) => setUnit(e.target.value)}>
                        {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                </div>

                <div className="mt-4 space-y-2 text-left text-sm">
                    <div className="flex items-center gap-2">
                        <IconTag size={16}/>
                        <strong>Tag:</strong> {tag}
                    </div>
                    <div className="flex items-start gap-2">
                        <IconHash size={16}/>
                        <strong>Id:</strong> {Id}
                    </div>
                    <div className="flex items-start gap-2">
                        <IconPointFilled size={16}/>
                        <strong>Class:</strong> {className}
                    </div>
                </div>

                <div className="mt-4 space-y-2 text-left text-sm">
                    <div>
                        <div className="flex items-start gap-2">
                            <IconBoxModel2 size={16}/>
                            <strong>Margin:</strong>
                        </div>
                        <div
                            className="ml-6">top {convert(margin.top)}<br/>right {convert(margin.right)}<br/>bottom {convert(margin.bottom)}<br/>left {convert(margin.left)}
                        </div>
                    </div>

                    <div>
                        <div className="flex items-start gap-2">
                            <IconBoxModel2 size={16}/>
                            <strong>Padding:</strong>
                        </div>
                        <div
                            className="ml-6">top {convert(padding.top)}<br/>right {convert(padding.right)}<br/>bottom {convert(padding.bottom)}<br/>left {convert(padding.left)}
                        </div>
                    </div>
                    {border.type !== 'none' && (
                        <div className="flex items-start gap-2">
                            <IconBorderStyle2 size={16}/>
                            <strong>Border:</strong> {border.right.width} {border.right.style} {border.right.color}
                        </div>
                    )}
                    <div>
                        <div className="flex items-start gap-2">
                            <IconArrowsDiagonal2 size={16}/>
                            <strong>Width / Height:</strong>
                        </div>
                        <div className="ml-6">Width: {convert(rect.width)}<br/>Height: {convert(rect.height)}</div>
                    </div>
                </div>

                <div className="mt-4 space-y-2 text-left text-sm">
                    <div className="flex items-start gap-2">
                        <IconTypography size={16}/>
                        <strong>Font size:</strong> {fontSize}
                    </div>
                    <div className="flex items-start gap-2">
                        <IconLetterCase size={16}/>
                        <strong>Font family:</strong> {fontFamily}
                    </div>
                    <div className="flex items-start gap-2">
                        <IconLineHeight size={16}/>
                        <strong>Line height:</strong> {lineHeight}
                    </div>
                    <div className="flex items-start gap-2">
                        <IconLetterSpacing size={16}/>
                        <strong>Letter spacing:</strong> {letterSpacing}
                    </div>
                    <div className="flex items-start gap-2">
                        <IconRadiusBottomRight size={16}/>
                        <strong>Border radius:</strong> {borderRadius}
                    </div>
                    {border.type !== 'none' && (
                        <div className="flex items-start gap-2">
                            <IconBorderStyle size={16}/>
                            <strong>Border:</strong>
                            <span className="flex gap-1 items-center">
                                {border.right.width} {border.right.style}
                                <span className="w-4 h-4 border rounded" style={{backgroundColor: border.right.color}}/>
                            </span>
                        </div>
                    )}
                </div>

                <div className="mt-4 space-y-2 text-left text-sm">
                    <div className="flex items-center gap-2">
                        <IconColorSwatch size={16}/>
                        <strong>Text color:</strong>
                        {color !== NON_VALUE && (
                            <span className="inline-block w-4 h-4 rounded border ml-1"
                                  style={{backgroundColor: color}}/>)}
                        <span>{color}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <IconPalette size={16}/>
                        <strong>Background:</strong>
                        {backgroundColor !== NON_VALUE && (
                            <span className="inline-block w-4 h-4 rounded border ml-1"
                                  style={{backgroundColor: backgroundColor}}/>)
                        }
                        <span>{backgroundColor}</span>
                    </div>
                    <div className="flex flex-col items-start gap-2">
                        <div className="flex items-center gap-2">
                            <IconPhoto size={16}/>
                            <strong>Background image:</strong>
                            {backgroundImage === NONE_VALUE && <span>{NON_VALUE}</span>}
                        </div>
                        {backgroundImage !== NONE_VALUE && (
                            <div className="ml-2 flex flex-col items-center gap-1">
                                <pre
                                    className="whitespace-pre-wrap break-words max-w-full text-xs bg-gray-100 p-2 rounded">
                                    {backgroundImage}
                                </pre>
                                <div
                                    className="w-20 h-20 rounded bg-white"
                                    style={{backgroundImage, backgroundSize: 'cover', backgroundRepeat: 'no-repeat'}}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Contrast Checker Section */}
                {color !== NON_VALUE && backgroundColor !== NON_VALUE && (
                    <ContrastChecker 
                        initialForegroundColor={color} 
                        initialBackgroundColor={backgroundColor}
                    />
                )}
                
                {/* All Borders Section */}
                {border && border.type !== 'none' && (
                    <div className="mt-4 space-y-2 text-left text-sm">
                        <div className="flex flex-col items-start gap-2">
                            <div className="flex items-center gap-2">
                                <IconBorderStyle2 size={16}/>
                                <strong>All Borders:</strong>
                            </div>
                            <div className="ml-6 space-y-3">
                                {/* Top Border */}
                                <div className="flex items-center gap-2">
                                    <strong className="w-14">Top:</strong>
                                    <span className="flex gap-1 items-center">
                                        {border.top.width} {border.top.style}
                                        <span className="w-4 h-4 border rounded" style={{backgroundColor: border.top.color}}/>
                                    </span>
                                </div>
                                
                                {/* Right Border */}
                                <div className="flex items-center gap-2">
                                    <strong className="w-14">Right:</strong>
                                    <span className="flex gap-1 items-center">
                                        {border.right.width} {border.right.style}
                                        <span className="w-4 h-4 border rounded" style={{backgroundColor: border.right.color}}/>
                                    </span>
                                </div>
                                
                                {/* Bottom Border */}
                                <div className="flex items-center gap-2">
                                    <strong className="w-14">Bottom:</strong>
                                    <span className="flex gap-1 items-center">
                                        {border.bottom.width} {border.bottom.style}
                                        <span className="w-4 h-4 border rounded" style={{backgroundColor: border.bottom.color}}/>
                                    </span>
                                </div>
                                
                                {/* Left Border */}
                                <div className="flex items-center gap-2">
                                    <strong className="w-14">Left:</strong>
                                    <span className="flex gap-1 items-center">
                                        {border.left.width} {border.left.style}
                                        <span className="w-4 h-4 border rounded" style={{backgroundColor: border.left.color}}/>
                                    </span>
                                </div>
                                
                                {/* Visual representation */}
                                <div className="mt-2">
                                    <div 
                                        className="w-24 h-24 bg-white mx-auto"
                                        style={{
                                            borderTop: `${border.top.width} ${border.top.style} ${border.top.color}`,
                                            borderRight: `${border.right.width} ${border.right.style} ${border.right.color}`,
                                            borderBottom: `${border.bottom.width} ${border.bottom.style} ${border.bottom.color}`,
                                            borderLeft: `${border.left.width} ${border.left.style} ${border.left.color}`
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-4 space-y-2 text-left text-sm">
                    <div className="flex flex-col items-start gap-2">
                        <div className="flex items-center gap-2">
                            <IconShadow size={16}/>
                            <strong>Box shadow:</strong>

                            {boxShadow === NONE_VALUE && <span>{NON_VALUE}</span>}
                        </div>
                        {boxShadow !== NONE_VALUE && (
                            <div className="flex flex-col gap-2 ml-6 items-center">
                                <pre
                                    className="whitespace-pre-wrap break-words max-w-full text-xs bg-gray-100 p-2 rounded relative z-10">
                                    {boxShadow}
                                </pre>
                                <div
                                    className="w-20 h-20 rounded bg-white relative z-0"
                                    style={{boxShadow}}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
export default BoxModelVisualizer;