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

  const currentUrl = window.location.href;
  const currentHostname = window.location.hostname;
  const currentPort = window.location.port;

  if (isRegex) {
    try {
      const regex = new RegExp(pattern);
      if (!regex.test(currentUrl)) {
        return `Regex pattern doesn't match current URL (${currentUrl})`;
      }
      return null;
    } catch {
      return "Invalid regular expression syntax";
    }
  }

  if (exactMatch) {
    const hostnameWithPort = currentPort ? `${currentHostname}:${currentPort}` : currentHostname;
    const baseUrl = `${window.location.protocol}//${hostnameWithPort}`;

    const exactMatches = pattern === currentHostname || pattern === hostnameWithPort || pattern === currentUrl;

    if (!exactMatches) {
      return `Pattern does not exactly match current URL (${currentUrl})`;
    }
    return null;
  }

  // ---- default: domain-only matching ----
  const normalizedPattern = pattern.trim().toLowerCase();
  if (!normalizedPattern) return "Please enter a domain pattern";

  let patternHostPort = normalizedPattern;
  try {
    const u = new URL(normalizedPattern.includes("://") ? normalizedPattern : `http://${normalizedPattern}`);
    patternHostPort = u.host; // host includes port
  } catch {
    // залишаємо raw host
  }

  let [patternHost, patternPort] = patternHostPort.split(":");
  patternHost = (patternHost || "").trim();

  const isWildcard = patternHost.startsWith("*.");
  const baseHost = (isWildcard ? patternHost.slice(2) : patternHost).replace(/^\.+/, "");

  if (!baseHost || baseHost === "*") {
    return "Invalid domain pattern";
  }

  if (patternPort && patternPort !== currentPort) {
    return `Domain pattern doesn't match current URL (${currentHostname})`;
  }

  const h = currentHostname.toLowerCase();
  const matches = isWildcard
    ? h.endsWith(`.${baseHost}`) && h !== baseHost
    : h === baseHost || h.endsWith(`.${baseHost}`);

  if (!matches) {
    return `Domain pattern doesn't match current URL (${currentHostname})`;
  }

  return null;
};
