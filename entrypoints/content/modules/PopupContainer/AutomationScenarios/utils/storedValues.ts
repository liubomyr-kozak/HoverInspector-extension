/**
 * Values stored by "get text" steps, used by later steps as ${key}
 */

/**
 * Replaces ${key} with the values stored by get text steps; unknown keys are kept as they are
 */
export function resolveStoredValues(value: string, storedValues: Record<string, string> = {}): string {
  return value.replace(/\$\{([^}]+)\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(storedValues, key.trim()) ? storedValues[key.trim()] : match,
  );
}

