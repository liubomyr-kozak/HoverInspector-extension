/**
 * Domain validation utilities for automation scenarios
 */

/**
 * Validates domain patterns for automation scenario triggers
 * @param pattern - The domain pattern to validate
 * @param isRegex - Whether the pattern should be treated as a regular expression
 * @param exactMatch - Whether to perform exact matching (default: false)
 * @returns Error message if validation fails, null if valid
 */
export const validateDomainPattern = (
  pattern: string,
  isRegex: boolean,
  exactMatch: boolean = false,
): string | null => {
  if (!pattern) return null;

  if (isRegex) {
    try {
      // Test if the regex matches the current URL (full URL for regex patterns)
      const currentUrl = window.location.href;
      const regex = new RegExp(pattern);
      if (!regex.test(currentUrl)) {
        return `Regex pattern doesn't match current URL (${currentUrl})`;
      }
    } catch (error) {
      return "Invalid regular expression syntax";
    }
  } else {
    const currentHostname = window.location.hostname;
    const currentUrl = window.location.href;
    const currentPort = window.location.port;

    if (exactMatch) {
      // For exact match, compare against specific URL components
      const hostnameWithPort = currentPort ? `${currentHostname}:${currentPort}` : currentHostname;
      const baseUrl = `${window.location.protocol}//${hostnameWithPort}`;

      // Check exact matches against different URL formats
      const exactMatches =
        pattern === currentHostname || // hostname only
        pattern === hostnameWithPort || // hostname:port
        pattern === baseUrl || // protocol://hostname:port
        pattern === currentUrl; // full URL with path

      if (!exactMatches) {
        return `Domain pattern doesn't exactly match current URL (${currentHostname})`;
      }
    } else {
      // Non-exact match: robust domain pattern matching with optional wildcard and port support
      const normalizedPattern = pattern.trim().toLowerCase();
      if (!normalizedPattern) return "Please enter a domain pattern";

      const h = currentHostname.toLowerCase();

      // Try to parse pattern as URL to extract host:port, otherwise treat as raw host pattern
      let patternHostPort = normalizedPattern;

      try {
        // Check for malformed URLs like "http:localhost" (missing "//")
        if (normalizedPattern.includes(":") && !normalizedPattern.includes("://") && !normalizedPattern.includes("/")) {
          throw new Error("Malformed URL - protocol without proper separator");
        }

        const u = new URL(normalizedPattern);
        if (u.host) {
          patternHostPort = u.host; // host includes port if present
        } else {
          // URL parsing succeeded but returned empty host, fall through to try with http prefix
          throw new Error("Empty host, try with http prefix");
        }
      } catch (e) {
        // Check if this is our intentional malformed URL detection
        if (e instanceof Error && e.message === "Malformed URL - protocol without proper separator") {
          return "Invalid domain pattern";
        }

        if (normalizedPattern.includes("/")) {
          // Likely missing protocol but contains path; assume http to parse
          try {
            const u2 = new URL(`http://${normalizedPattern}`);
            patternHostPort = u2.host;
          } catch (e2) {
            // fall through with raw pattern - keep patternHostPort as normalizedPattern
            patternHostPort = normalizedPattern;
          }
        }
        // If no "/" in pattern, keep it as is (already set to normalizedPattern)
      }

      let [patternHost, patternPort] = patternHostPort.split(":");
      patternHost = (patternHost || "").trim();

      // Support wildcard patterns like *.example.com and leading dot .example.com
      const isWildcard = patternHost.startsWith("*.");
      const baseHost = (isWildcard ? patternHost.slice(2) : patternHost).replace(/^\.+/, "");

      if (!baseHost || baseHost === "*") {
        return "Invalid domain pattern";
      }

      // Port check: if pattern specifies a port, it must match current port
      if (patternPort && patternPort !== currentPort) {
        return `Domain pattern doesn't match current URL (${currentHostname})`;
      }

      // Host matching
      const matches = isWildcard
        ? h.endsWith(`.${baseHost}`) && h !== baseHost // wildcard must match a subdomain, not the apex itself
        : h === baseHost || h.endsWith(`.${baseHost}`); // match apex or any of its subdomains

      if (!matches) {
        return `Domain pattern doesn't match current URL (${currentHostname})`;
      }
    }
  }

  return null;
};
