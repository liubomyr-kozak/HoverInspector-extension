import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { validateDomainPattern } from "../validationUtils.ts";

// User-friendly constants for boolean parameters
const IS_REGEX = true;
const IS_NOT_REGEX = false;
const EXACT_MATCH = true;
const NON_EXACT_MATCH = false;

// Mock window.location for testing
const mockLocation = {
  hostname: "example.com",
  href: "https://example.com:3000/path?query=value",
  port: "3000",
  protocol: "https:",
};

let originalLocation: Location;

beforeAll(() => {
  originalLocation = window.location;

  Object.defineProperty(window, "location", {
    writable: true,
    value: { ...mockLocation },
  });
});

afterAll(() => {
  Object.defineProperty(window, "location", {
    writable: true,
    value: originalLocation,
  });
});

describe("validateDomainPattern", () => {
  describe("empty pattern", () => {
    it("should return null for empty pattern", () => {
      expect(validateDomainPattern("", IS_NOT_REGEX)).toBeNull();
      expect(validateDomainPattern("", IS_REGEX)).toBeNull();
    });
  });

  describe("regex patterns", () => {
    it("should validate correct regex patterns that match current URL", () => {
      expect(validateDomainPattern(".*example\\.com.*", IS_REGEX)).toBeNull();
      expect(validateDomainPattern("https://.*\\.com.*", IS_REGEX)).toBeNull();
    });

    it("should return error for regex patterns that do not match current URL", () => {
      const result = validateDomainPattern(".*google\\.com.*", IS_REGEX);
      expect(result).toContain("Regex pattern doesn't match current URL");
      expect(result).toContain("https://example.com:3000/path?query=value");
    });

    it("should return error for invalid regex syntax", () => {
      expect(validateDomainPattern("[invalid regex", IS_REGEX)).toBe("Invalid regular expression syntax");
      expect(validateDomainPattern("*+", IS_REGEX)).toBe("Invalid regular expression syntax");
    });
  });

  describe("exact match patterns", () => {
    it("should match exact hostname", () => {
      expect(validateDomainPattern("example.com", IS_NOT_REGEX, EXACT_MATCH)).toBeNull();
    });

    it("should match hostname with port", () => {
      expect(validateDomainPattern("example.com:3000", IS_NOT_REGEX, EXACT_MATCH)).toBeNull();
    });

    it("should match base URL with protocol", () => {
      expect(validateDomainPattern("https://example.com:3000", IS_NOT_REGEX, EXACT_MATCH)).toBeNull();
    });

    it("should match full URL", () => {
      expect(validateDomainPattern("https://example.com:3000/path?query=value", IS_NOT_REGEX, EXACT_MATCH)).toBeNull();
    });

    it("should return error for non-exact matches", () => {
      const result = validateDomainPattern("different.com", IS_NOT_REGEX, EXACT_MATCH);
      expect(result).toContain("Domain pattern doesn't exactly match current URL");
      expect(result).toContain("example.com");
    });
  });

  describe("wildcard patterns", () => {
    it("should match wildcard patterns for subdomains", () => {
      // Mock subdomain
      // @ts-ignore
      window.location.hostname = "sub.example.com";
      expect(validateDomainPattern("*.example.com", IS_NOT_REGEX)).toBeNull();

      // Reset
      // @ts-ignore
      window.location.hostname = "example.com";
    });

    it("should not match wildcard pattern for apex domain", () => {
      const result = validateDomainPattern("*.example.com", IS_NOT_REGEX);
      expect(result).toContain("Domain pattern doesn't match current URL");
    });

    it("should match apex domain without wildcard", () => {
      expect(validateDomainPattern("example.com", IS_NOT_REGEX)).toBeNull();
    });

    it("should match subdomains without wildcard", () => {
      // @ts-ignore
      window.location.hostname = "sub.example.com";
      expect(validateDomainPattern("example.com", IS_NOT_REGEX)).toBeNull();

      // Reset
      // @ts-ignore
      window.location.hostname = "example.com";
    });
  });

  describe("port validation", () => {
    it("should match when pattern specifies correct port", () => {
      expect(validateDomainPattern("example.com:3000", IS_NOT_REGEX)).toBeNull();
    });

    it("should return error when pattern specifies wrong port", () => {
      const result = validateDomainPattern("example.com:8080", IS_NOT_REGEX);
      expect(result).toContain("Domain pattern doesn't match current URL");
    });

    it("should match when pattern does not specify port", () => {
      expect(validateDomainPattern("example.com", IS_NOT_REGEX)).toBeNull();
    });
  });

  describe("URL parsing", () => {
    it("should handle full URL patterns", () => {
      expect(validateDomainPattern("https://example.com:3000/path", IS_NOT_REGEX)).toBeNull();
    });

    it("should handle URL patterns without protocol", () => {
      expect(validateDomainPattern("example.com:3000/path", IS_NOT_REGEX)).toBeNull();
    });

    it("should handle malformed URL patterns gracefully", () => {
      expect(validateDomainPattern("example.com", IS_NOT_REGEX)).toBeNull();
    });
  });

  describe("edge cases", () => {
    it("should return error for whitespace-only pattern", () => {
      expect(validateDomainPattern("   ", IS_NOT_REGEX)).toBe("Please enter a domain pattern");
    });

    it("should return error for invalid domain pattern", () => {
      expect(validateDomainPattern("*.", IS_NOT_REGEX)).toBe("Invalid domain pattern");
      expect(validateDomainPattern("*", IS_NOT_REGEX)).toBe("Invalid domain pattern");
    });

    it("should handle leading dots in patterns", () => {
      expect(validateDomainPattern(".example.com", IS_NOT_REGEX)).toBeNull();
    });

    it("should be case insensitive", () => {
      expect(validateDomainPattern("EXAMPLE.COM", IS_NOT_REGEX)).toBeNull();
      expect(validateDomainPattern("Example.Com", IS_NOT_REGEX)).toBeNull();
    });

    it("should return error for malformed URLs with protocol but missing //", () => {
      expect(validateDomainPattern("http:localhost", IS_NOT_REGEX)).toBe("Invalid domain pattern");
      expect(validateDomainPattern("https:example.com", IS_NOT_REGEX)).toBe("Invalid domain pattern");
    });
  });

  describe("complex scenarios", () => {
    it("should handle multiple subdomains", () => {
      // @ts-ignore
      window.location.hostname = "api.v1.example.com";
      expect(validateDomainPattern("example.com", IS_NOT_REGEX)).toBeNull();
      expect(validateDomainPattern("v1.example.com", IS_NOT_REGEX)).toBeNull();

      // Reset
      // @ts-ignore
      window.location.hostname = "example.com";
    });

    it("should handle different protocols in URL parsing", () => {
      expect(validateDomainPattern("http://example.com:3000", IS_NOT_REGEX)).toBeNull();
      expect(validateDomainPattern("ftp://example.com:3000", IS_NOT_REGEX)).toBeNull();
    });
  });
});
