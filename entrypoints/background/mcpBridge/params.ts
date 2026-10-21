import type { BridgeParams } from "@entrypoints/core/mcp/types";

/**
 * Readers for request parameters. The MCP server validates them with its tool schemas, but the socket
 * is a trust boundary, so the extension checks every value again before using it.
 */

export function requireString(params: BridgeParams, key: string): string {
  const value = params[key];
  if (typeof value !== "string" || value.trim() === "") throw new Error(`"${key}" must be a non-empty string`);
  return value;
}

export function optionalString(params: BridgeParams, key: string): string | undefined {
  const value = params[key];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") throw new Error(`"${key}" must be a string`);
  return value;
}

export function optionalNumber(params: BridgeParams, key: string): number | undefined {
  const value = params[key];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`"${key}" must be a number`);
  return value;
}

export function optionalBoolean(params: BridgeParams, key: string): boolean | undefined {
  const value = params[key];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "boolean") throw new Error(`"${key}" must be true or false`);
  return value;
}

export function optionalTabId(params: BridgeParams): number | undefined {
  const value = optionalNumber(params, "tabId");
  if (value !== undefined && (!Number.isInteger(value) || value < 0)) throw new Error(`"tabId" must be a tab id`);
  return value;
}
