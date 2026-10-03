import { useEffect, useState } from "react";

// How often location.href is checked. Content scripts run in an isolated world, so patching
// history.pushState here would not see the page's own SPA navigations.
const URL_POLL_INTERVAL = 500;

/**
 * Returns the current page URL and re-renders when it changes,
 * including SPA navigations (pushState/replaceState), back/forward and hash changes.
 */
export const useCurrentUrl = (): string => {
  const [url, setUrl] = useState(() => window.location.href);

  useEffect(() => {
    const check = () => {
      const href = window.location.href;
      setUrl((prev) => (prev === href ? prev : href));
    };

    window.addEventListener("popstate", check);
    window.addEventListener("hashchange", check);
    const navigation = (window as any).navigation as EventTarget | undefined;
    navigation?.addEventListener?.("navigatesuccess", check);
    const interval = setInterval(check, URL_POLL_INTERVAL);

    return () => {
      window.removeEventListener("popstate", check);
      window.removeEventListener("hashchange", check);
      navigation?.removeEventListener?.("navigatesuccess", check);
      clearInterval(interval);
    };
  }, []);

  return url;
};
