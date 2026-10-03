import { describe, expect, it } from "vitest";
import { resolveStoredValues } from "../storedValues";

describe("resolveStoredValues", () => {
  it("replaces ${key} with the stored value and keeps unknown keys", () => {
    expect(resolveStoredValues("Hi ${name}, ${ name }!", { name: "Ada" })).toBe("Hi Ada, Ada!");
    expect(resolveStoredValues("${missing} stays", { name: "Ada" })).toBe("${missing} stays");
    expect(resolveStoredValues("empty ${e}", { e: "" })).toBe("empty ");
    expect(resolveStoredValues("no values", undefined)).toBe("no values");
  });
});
