import { DEFAULT_STYLES_TO_SKIP, DEFAULT_VALUES_TO_SKIP } from "./constants";

/**
 * Оптимізована структура вузла знімка
 */
export interface SnapshotNode {
  readonly id: string;
  readonly path: readonly string[];
  readonly tag: string;
  readonly elementId?: string;
  readonly classes: readonly string[];
  readonly attributes: Readonly<Record<string, string>>;
  readonly bounds: Readonly<{
    top: number;
    left: number;
    width: number;
    height: number;
  }>;
  readonly styles: Readonly<Record<string, string>>;
  readonly text?: string;
  readonly children: readonly SnapshotNode[];
}

/**
 * Основна структура CSS знімка
 */
export interface CSSSnapshot {
  readonly id: string;
  readonly timestamp: number;
  readonly url: string;
  readonly title: string;
  readonly elementCount: number;
  readonly root: SnapshotNode;
  readonly metadata?: Readonly<{
    userAgent?: string;
    viewport?: { width: number; height: number };
    colorScheme?: string;
    optimized?: boolean; // Indicates if the snapshot was created with optimization
  }>;
}

/**
 * Результат побудови дерева знімка
 */
export interface SnapshotBuildResult {
  readonly tree: SnapshotNode;
  readonly stats: Readonly<{
    totalNodes: number;
    skippedNodes: number;
    processTime: number;
  }>;
}

/**
 * Зміна у позиції елемента
 */
export interface PositionChange {
  readonly property: "top" | "left" | "width" | "height";
  readonly before: number;
  readonly after: number;
  readonly delta: number;
  readonly percentage: number;
}

/**
 * Тип зміни при порівнянні
 */
export enum ChangeType {
  ADDED = "added",
  REMOVED = "removed",
  MODIFIED = "modified",
  UNCHANGED = "unchanged",
}

/**
 * Зміна у властивості CSS
 */
export interface StyleChange {
  readonly property: string;
  readonly before: string | null;
  readonly after: string | null;
  readonly type: ChangeType;
}

/**
 * Порівняння елементів
 */
export interface ElementComparison {
  readonly path: string;
  readonly type: ChangeType;
  readonly styleChanges: readonly StyleChange[];
  readonly positionChanges: readonly PositionChange[];
  readonly moved: boolean;
}

/**
 * Результат порівняння знімків
 */
export interface ComparisonResult {
  readonly elements: readonly ElementComparison[];
  readonly summary: Readonly<{
    added: number;
    removed: number;
    modified: number;
    moved: number;
  }>;
}

/**
 * Опції для побудови знімка
 */
export interface SnapshotOptions {
  readonly maxElements?: number;
  readonly skipInvisible?: boolean;
  readonly includeText?: boolean;
  readonly includeUnchanged?: boolean; // Включати елементи без змін
  readonly styleFilter?: (property: string, value: string) => boolean;
}

/**
 * Перевіряє, чи слід пропустити властивість
 */
export const shouldSkipProperty = (property: string): boolean => {
  return DEFAULT_STYLES_TO_SKIP.some((skip) => property.includes(skip));
};

/**
 * Перевіряє, чи є значення значенням за замовчуванням
 */
export const isDefaultValue = (value: string | null): boolean => {
  if (!value) return true;
  return (DEFAULT_VALUES_TO_SKIP as readonly string[]).includes(value);
};

/**
 * Створює стабільний ID для елемента
 */
export const createElementId = (element: Element, index: number): string => {
  const parts = [
    element.tagName.toLowerCase(),
    element.id || "",
    Array.from(element.classList).sort().join("-"),
    index.toString(),
  ];

  const hash = parts
    .join(":")
    .split("")
    .reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);

  return `el-${Math.abs(hash).toString(36)}`;
};
