export const camelCase = (str) => str.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
