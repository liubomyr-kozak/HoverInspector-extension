/**
 * Domain validation utilities for automation scenarios
 */
import { TriggerConfig, TriggerType } from "../types";

/**
 * Validates domain patterns for automation scenario triggers
 * @param pattern - The domain pattern to validate
 * @param isRegex - Whether the pattern should be treated as a regular expression
 * @param exactMatch - Whether to perform exact matching (default: false)
 * @param url - The URL to check (default: the current page)
 * @returns Error message if validation fails, null if valid
 */
export const validateDomainPattern = (
  pattern: string,
  isRegex: boolean,
  exactMatch: boolean = false,
  url?: string,
): string | null => {
  if (!pattern) return null;

  let location: { href: string; hostname: string; port: string };
  if (url === undefined) {
    location = window.location;
  } else {
    try {
      location = new URL(url);
    } catch {
      return `Invalid URL (${url})`;
    }
  }
  const currentUrl = location.href;
  const currentHostname = location.hostname;
  const currentPort = location.port;

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

/**
 * Whether the trigger is an enabled domain trigger that matches the URL
 */
export function isDomainTriggerMatch(trigger: TriggerConfig | null | undefined, url: string): boolean {
  return (
    !!trigger?.enabled &&
    trigger.type === TriggerType.DOMAIN &&
    !!trigger.condition?.domainPattern &&
    validateDomainPattern(
      trigger.condition.domainPattern,
      !!trigger.condition.useRegex,
      !!trigger.condition.exactMatch,
      url,
    ) === null
  );
}

/**
 * Whether an enabled domain trigger matches the URL
 */
export function matchesDomainTrigger(triggers: (TriggerConfig | null)[], url: string): boolean {
  return triggers.some((trigger) => isDomainTriggerMatch(trigger, url));
}
