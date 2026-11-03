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
      expect(validateDomainPattern("https://example.com:3000", IS_NOT_REGEX, EXACT_MATCH)).toContain(
        "Pattern does not exactly match current URL",
      );
    });

    it("should match full URL", () => {
      expect(validateDomainPattern("https://example.com:3000/path?query=value", IS_NOT_REGEX, EXACT_MATCH)).toBeNull();
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

  describe("regex patterns with path", () => {
    it("should match regex including path", () => {
      const result = validateDomainPattern(".*example\\.com:3000/path.*", IS_REGEX);
      expect(result).toBeNull();
    });

    it("should not match regex if path differs", () => {
      const result = validateDomainPattern(".*example\\.com:3000/other.*", IS_REGEX);
      expect(result).toContain("Regex pattern doesn't match current URL");
    });
  });

  describe("exact match with path", () => {
    it("should fail if only domain is provided but URL has path", () => {
      const result = validateDomainPattern("https://example.com:3000", IS_NOT_REGEX, EXACT_MATCH);
      expect(result).toContain("Pattern does not exactly match current URL");
    });

    it("should succeed if full URL including path is provided", () => {
      const result = validateDomainPattern("https://example.com:3000/path?query=value", IS_NOT_REGEX, EXACT_MATCH);
      expect(result).toBeNull();
    });
  });

  describe("non-exact match with path", () => {
    it("should ignore path and match by hostname only", () => {
      const result = validateDomainPattern("example.com/path", IS_NOT_REGEX, NON_EXACT_MATCH);
      expect(result).toBeNull(); // the path is dropped, only the host matches
    });
  });

  describe("malformed URL patterns", () => {
    it("should return error for http:localhost without //", () => {
      const result = validateDomainPattern("http:localhost", IS_NOT_REGEX);
      expect(result).toBe("Domain pattern doesn't match current URL (example.com)");
    });

    it("should return error for https:example.com without //", () => {
      const result = validateDomainPattern("https:example.com", IS_NOT_REGEX);
      expect(result).toBe("Domain pattern doesn't match current URL (example.com)");
    });
  });

  describe("wildcard with path", () => {
    it("should match subdomain even if path is included", () => {
      // @ts-ignore
      window.location.hostname = "sub.example.com";
      const result = validateDomainPattern("*.example.com/path", IS_NOT_REGEX);
      expect(result).toBeNull();

      // reset
      // @ts-ignore
      window.location.hostname = "example.com";
    });
  });

  describe("hash-based URLs validation", () => {
    const hashUrlMockLocation = {
      hostname: "localhost",
      href: "http://localhost:4401/#app/v1/users/7416/edit?tab=advanced&id=6128&timestamp=1756419219774",
      port: "4401",
      protocol: "http:",
    };

    beforeAll(() => {
      Object.defineProperty(window, "location", {
        writable: true,
        value: { ...hashUrlMockLocation },
      });
    });

    afterAll(() => {
      // Reset to original mock location
      Object.defineProperty(window, "location", {
        writable: true,
        value: { ...mockLocation },
      });
    });

    it("should validate exact match with hash URL", () => {
      expect(validateDomainPattern("localhost", IS_NOT_REGEX, EXACT_MATCH)).toBeNull();
      expect(validateDomainPattern("localhost:4401", IS_NOT_REGEX, EXACT_MATCH)).toBeNull();
      expect(
        validateDomainPattern(
          "http://localhost:4401/#app/v1/users/7416/edit?tab=advanced&id=6128&timestamp=1756419219774",
          IS_NOT_REGEX,
          EXACT_MATCH,
        ),
      ).toBeNull();
    });

    it("should fail exact match with incorrect hash URL", () => {
      const result = validateDomainPattern("http://localhost:4401", IS_NOT_REGEX, EXACT_MATCH);
      expect(result).toContain("Pattern does not exactly match current URL");
    });

    it("should validate regex patterns matching hash URLs", () => {
      expect(validateDomainPattern(".*localhost:4401.*#app.*", IS_REGEX)).toBeNull();
      expect(validateDomainPattern("http://localhost:4401/#.*users.*", IS_REGEX)).toBeNull();
      expect(validateDomainPattern(".*#app/v1/users/\\d+/edit.*", IS_REGEX)).toBeNull();
      expect(validateDomainPattern(".*tab=advanced.*", IS_REGEX)).toBeNull();
    });

    it("should fail regex patterns that don't match hash URLs", () => {
      const result = validateDomainPattern(".*#dashboard.*", IS_REGEX);
      expect(result).toContain("Regex pattern doesn't match current URL");
    });

    it("should validate domain-only patterns with hash URLs", () => {
      expect(validateDomainPattern("localhost", IS_NOT_REGEX)).toBeNull();
      expect(validateDomainPattern("localhost:4401", IS_NOT_REGEX)).toBeNull();
    });

    it("should handle different hash URL patterns", () => {
      // Test with different hash URL patterns from the issue
      const hashUrls = [
        "http://localhost:4401/#portal/v2/tasks/alex_dev/history?tab=advanced&id=6712&timestamp=1756419219582",
        "http://localhost:4401/#api/beta/tasks/payment-system/view?tab=main&id=8978&timestamp=1756419219393",
        "http://localhost:4401/#projects/ui-components/tasks/4455/comments/6016?filter=recent&status=active&assignee=me",
        "http://localhost:4401/#shop/category/electronics/product/5297?color=red&size=large",
        "http://localhost:4401/#dashboard/user/mike_admin/profile/settings?tab=security&theme=dark",
      ];

      hashUrls.forEach((url) => {
        // @ts-ignore
        window.location.href = url;

        // Should match localhost domain
        expect(validateDomainPattern("localhost", IS_NOT_REGEX)).toBeNull();
        expect(validateDomainPattern("localhost:4401", IS_NOT_REGEX)).toBeNull();

        // Should match with regex patterns
        expect(validateDomainPattern(".*localhost:4401.*#.*", IS_REGEX)).toBeNull();
        expect(validateDomainPattern("http://localhost:4401/#.*", IS_REGEX)).toBeNull();
      });

      // Reset to original hash URL
      // @ts-ignore
      window.location.href = hashUrlMockLocation.href;
    });

    it("should validate specific hash route patterns with regex", () => {
      const testCases = [
        {
          url: "http://localhost:4401/#api/v1/users?page=1&limit=10&sort=name",
          pattern: ".*#api/v1/users\\?.*",
          shouldMatch: true,
        },
        {
          url: "http://localhost:4401/#dashboard/user/john_designer/profile/settings?tab=security&theme=dark",
          pattern: ".*#dashboard/user/.*/profile/settings.*",
          shouldMatch: true,
        },
        {
          url: "http://localhost:4401/#resource/123/book/456/user",
          pattern: ".*#resource/\\d+/book/\\d+/user.*",
          shouldMatch: true,
        },
        {
          url: "http://localhost:4401/#shop/category/electronics/product/4996?color=red&size=large",
          pattern: ".*#shop/category/.*/product/\\d+.*",
          shouldMatch: true,
        },
      ];

      testCases.forEach(({ url, pattern, shouldMatch }) => {
        // @ts-ignore
        window.location.href = url;

        const result = validateDomainPattern(pattern, IS_REGEX);
        if (shouldMatch) {
          expect(result).toBeNull();
        } else {
          expect(result).toContain("Regex pattern doesn't match current URL");
        }
      });

      // Reset to original hash URL
      // @ts-ignore
      window.location.href = hashUrlMockLocation.href;
    });
  });

  describe("path-based URLs validation (localhost:4402)", () => {
    const pathUrlMockLocation = {
      hostname: "localhost",
      href: "http://localhost:4402/api/stable/tasks/lisa_dev/view?tab=main&id=9767&timestamp=1756419771827",
      port: "4402",
      protocol: "http:",
    };

    beforeAll(() => {
      Object.defineProperty(window, "location", {
        writable: true,
        value: { ...pathUrlMockLocation },
      });
    });

    afterAll(() => {
      // Reset to original mock location
      Object.defineProperty(window, "location", {
        writable: true,
        value: { ...mockLocation },
      });
    });

    it("should validate exact match with path-based URL", () => {
      expect(validateDomainPattern("localhost", IS_NOT_REGEX, EXACT_MATCH)).toBeNull();
      expect(validateDomainPattern("localhost:4402", IS_NOT_REGEX, EXACT_MATCH)).toBeNull();
      expect(
        validateDomainPattern(
          "http://localhost:4402/api/stable/tasks/lisa_dev/view?tab=main&id=9767&timestamp=1756419771827",
          IS_NOT_REGEX,
          EXACT_MATCH,
        ),
      ).toBeNull();
    });

    it("should fail exact match with incorrect path-based URL", () => {
      const result = validateDomainPattern("http://localhost:4402", IS_NOT_REGEX, EXACT_MATCH);
      expect(result).toContain("Pattern does not exactly match current URL");
    });

    it("should validate regex patterns matching path-based URLs", () => {
      expect(validateDomainPattern(".*localhost:4402.*", IS_REGEX)).toBeNull();
      expect(validateDomainPattern("http://localhost:4402/api/stable/.*", IS_REGEX)).toBeNull();
      expect(validateDomainPattern(".*api/stable/tasks/.*/view.*", IS_REGEX)).toBeNull();
      expect(validateDomainPattern(".*tab=main.*", IS_REGEX)).toBeNull();
    });

    it("should fail regex patterns that don't match path-based URLs", () => {
      const result = validateDomainPattern(".*#dashboard.*", IS_REGEX);
      expect(result).toContain("Regex pattern doesn't match current URL");
    });

    it("should validate domain-only patterns with path-based URLs", () => {
      expect(validateDomainPattern("localhost", IS_NOT_REGEX)).toBeNull();
      expect(validateDomainPattern("localhost:4402", IS_NOT_REGEX)).toBeNull();
    });

    it("should handle different path-based URL patterns from issue", () => {
      // Test with different path-based URL patterns from the issue
      const pathUrls = [
        "http://localhost:4402/api/stable/tasks/lisa_dev/view?tab=main&id=9767&timestamp=1756419771827",
        "http://localhost:4402/api/stable/reports/6628/history?tab=main&id=5477&timestamp=1756419771570",
        "http://localhost:4402/projects/payment-system/tasks/3137/comments/7636?filter=recent&status=active&assignee=me",
        "http://localhost:4402/dashboard/user/lisa_dev/profile/settings?tab=security&theme=dark",
        "http://localhost:4402/shop/category/electronics/product/1006?color=red&size=large",
        "http://localhost:4402/shop/category/electronics/product/4052?color=red&size=large",
        "http://localhost:4402/api/v1/users?page=1&limit=10&sort=name",
        "http://localhost:4402/resource/123/book/456/user",
      ];

      pathUrls.forEach((url) => {
        // @ts-ignore
        window.location.href = url;

        // Should match localhost domain
        expect(validateDomainPattern("localhost", IS_NOT_REGEX)).toBeNull();
        expect(validateDomainPattern("localhost:4402", IS_NOT_REGEX)).toBeNull();

        // Should match with regex patterns
        expect(validateDomainPattern(".*localhost:4402.*", IS_REGEX)).toBeNull();
        expect(validateDomainPattern("http://localhost:4402/.*", IS_REGEX)).toBeNull();
      });

      // Reset to original path URL
      // @ts-ignore
      window.location.href = pathUrlMockLocation.href;
    });

    it("should validate specific path route patterns with regex", () => {
      const testCases = [
        {
          url: "http://localhost:4402/api/stable/tasks/lisa_dev/view?tab=main&id=9767&timestamp=1756419771827",
          pattern: ".*api/stable/tasks/.*/view.*",
          shouldMatch: true,
        },
        {
          url: "http://localhost:4402/api/stable/reports/6628/history?tab=main&id=5477&timestamp=1756419771570",
          pattern: ".*api/stable/reports/\\d+/history.*",
          shouldMatch: true,
        },
        {
          url: "http://localhost:4402/projects/payment-system/tasks/3137/comments/7636?filter=recent&status=active&assignee=me",
          pattern: ".*projects/.*/tasks/\\d+/comments/.*",
          shouldMatch: true,
        },
        {
          url: "http://localhost:4402/dashboard/user/lisa_dev/profile/settings?tab=security&theme=dark",
          pattern: ".*dashboard/user/.*/profile/settings.*",
          shouldMatch: true,
        },
        {
          url: "http://localhost:4402/shop/category/electronics/product/1006?color=red&size=large",
          pattern: ".*shop/category/.*/product/\\d+.*",
          shouldMatch: true,
        },
        {
          url: "http://localhost:4402/api/v1/users?page=1&limit=10&sort=name",
          pattern: ".*api/v1/users\\?.*",
          shouldMatch: true,
        },
        {
          url: "http://localhost:4402/resource/123/book/456/user",
          pattern: ".*resource/\\d+/book/\\d+/user.*",
          shouldMatch: true,
        },
      ];

      testCases.forEach(({ url, pattern, shouldMatch }) => {
        // @ts-ignore
        window.location.href = url;

        const result = validateDomainPattern(pattern, IS_REGEX);
        if (shouldMatch) {
          expect(result).toBeNull();
        } else {
          expect(result).toContain("Regex pattern doesn't match current URL");
        }
      });

      // Reset to original path URL
      // @ts-ignore
      window.location.href = pathUrlMockLocation.href;
    });

    it("should validate exact URL matches for all issue URLs", () => {
      const exactUrls = [
        "http://localhost:4402/api/stable/tasks/lisa_dev/view?tab=main&id=9767&timestamp=1756419771827",
        "http://localhost:4402/api/stable/reports/6628/history?tab=main&id=5477&timestamp=1756419771570",
        "http://localhost:4402/projects/payment-system/tasks/3137/comments/7636?filter=recent&status=active&assignee=me",
        "http://localhost:4402/dashboard/user/lisa_dev/profile/settings?tab=security&theme=dark",
        "http://localhost:4402/shop/category/electronics/product/1006?color=red&size=large",
        "http://localhost:4402/shop/category/electronics/product/4052?color=red&size=large",
        "http://localhost:4402/api/v1/users?page=1&limit=10&sort=name",
        "http://localhost:4402/resource/123/book/456/user",
      ];

      exactUrls.forEach((url) => {
        // @ts-ignore
        window.location.href = url;

        // Should match exact URL
        expect(validateDomainPattern(url, IS_NOT_REGEX, EXACT_MATCH)).toBeNull();

        // Should fail partial URL match in exact mode
        expect(validateDomainPattern("http://localhost:4402", IS_NOT_REGEX, EXACT_MATCH)).toContain(
          "Pattern does not exactly match current URL",
        );
      });

      // Reset to original path URL
      // @ts-ignore
      window.location.href = pathUrlMockLocation.href;
    });
  });
});
