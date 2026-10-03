/**
 * What changed on one element between two snapshots, as short lists for the details popup: classes added
 * and removed, attributes, inline styles, size and position, and computed styles. Snapshots store computed
 * styles only where they differ from the browser default, so a missing value reads as "default".
 */

export interface ElementLike {
  id?: string | null;
  classes?: readonly string[];
  attributes?: Readonly<Record<string, string>>;
  inlineStyles?: Readonly<Record<string, string>>;
  styles?: Readonly<Record<string, string>>;
  bounds?: Readonly<{ top: number; left: number; width: number; height: number }>;
}

export interface ValueChange {
  name: string;
  /** Undefined: not set in A (the browser default for styles) */
  before?: string;
  /** Undefined: not set in B */
  after?: string;
}

export interface ElementChanges {
  classesAdded: string[];
  classesRemoved: string[];
  attributes: ValueChange[];
  inlineStyles: ValueChange[];
  /** Width, height, top and left in px */
  box: ValueChange[];
  styles: ValueChange[];
  /** Computed styles equal in both, for the "unchanged" list */
  unchangedStyles: Array<[string, string]>;
  total: number;
}

/**
 * Logical and derived properties that always mirror another computed property (block-size = height,
 * transform-origin follows the size). Listing them would repeat the same change several times.
 */
export const DERIVED_STYLE_PROPERTY =
  /^(?:(?:min-|max-)?(?:block|inline)-size|(?:margin|padding|inset|border)-(?:block|inline)(?:-.+)?|perspective-origin|transform-origin)$/;

/** Properties that follow `color` unless set on their own; the `color` change already says it */
const CURRENT_COLOR_FOLLOWERS = new Set([
  "-webkit-text-fill-color",
  "-webkit-text-stroke-color",
  "caret-color",
  "column-rule-color",
  "outline-color",
  "text-decoration-color",
  "text-emphasis-color",
]);

const diffMaps = (
  before: Readonly<Record<string, string>> = {},
  after: Readonly<Record<string, string>> = {},
  skip: (name: string) => boolean = () => false,
): ValueChange[] =>
  [...new Set([...Object.keys(before), ...Object.keys(after)])]
    .filter((name) => !skip(name) && before[name] !== after[name])
    .sort()
    .map((name) => ({ name, before: before[name], after: after[name] }));

const BOX_KEYS = ["width", "height", "top", "left"] as const;

export const diffElement = (before: ElementLike | null, after: ElementLike | null): ElementChanges => {
  const classesA = new Set(before?.classes ?? []);
  const classesB = new Set(after?.classes ?? []);
  const classesAdded = [...classesB].filter((c) => !classesA.has(c));
  const classesRemoved = [...classesA].filter((c) => !classesB.has(c));

  // id, class and style have their own sections
  const attrs = (el: ElementLike | null) => {
    const { class: _class, style: _style, ...rest } = el?.attributes ?? {};
    return el?.id ? { ...rest, id: el.id } : rest;
  };
  const attributes = diffMaps(attrs(before), attrs(after));
  const inlineStyles = diffMaps(before?.inlineStyles, after?.inlineStyles);

  const box =
    before?.bounds && after?.bounds
      ? BOX_KEYS.filter((k) => Math.round(before.bounds![k]) !== Math.round(after.bounds![k])).map((k) => ({
          name: k,
          before: `${Math.round(before.bounds![k])}px`,
          after: `${Math.round(after.bounds![k])}px`,
        }))
      : [];

  const colorChanged = (before?.styles?.color ?? "") !== (after?.styles?.color ?? "");
  const styles = diffMaps(
    before?.styles,
    after?.styles,
    (name) => DERIVED_STYLE_PROPERTY.test(name) || (colorChanged && CURRENT_COLOR_FOLLOWERS.has(name)),
  );
  const changedNames = new Set(styles.map((s) => s.name));
  const unchangedStyles = Object.entries(before?.styles ?? {})
    .filter(([name, value]) => !changedNames.has(name) && after?.styles?.[name] === value && !DERIVED_STYLE_PROPERTY.test(name))
    .sort(([a], [b]) => a.localeCompare(b));

  return {
    classesAdded,
    classesRemoved,
    attributes,
    inlineStyles,
    box,
    styles,
    unchangedStyles,
    total: classesAdded.length + classesRemoved.length + attributes.length + inlineStyles.length + box.length + styles.length,
  };
};
