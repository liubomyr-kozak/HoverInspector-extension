/**
 * Utility for injecting scripts into the DOM with version checking
 */

/**
 * Options for script injection
 */
interface ScriptInjectionOptions {
  /** URL to download the script from */
  downloadUrl: string;
  /** Filename of the script (used for identification and version extraction) */
  filename: string;
  /** Optional group prefix to identify scripts of the same group (e.g., 'functions_') */
  groupPrefix?: string;
}

/**
 * Injects a script into the DOM with version checking.
 * If a script with the same filename already exists, it won't be added again.
 * If a script of the same group exists with an older version, it will be replaced.
 * 
 * @param options Script injection options
 * @returns true if script was injected, false if skipped
 */
export function injectScript(options: ScriptInjectionOptions): boolean {
  const { downloadUrl, filename, groupPrefix = '' } = options;

  // Extract version from filename, e.g.: functions_1754242513949.js
  const match = filename.match(/_(\d+)\.js$/);
  const newVersion = match ? Number(match[1]) : 0;

  // Check if script with the same filename is already loaded
  const existingScript = document.querySelector(`script[data-hover-inspector="${filename}"]`);

  // If script already exists — don't add it again
  if (existingScript) {
    return false;
  }

  // If groupPrefix is provided, check for scripts of the same group
  if (groupPrefix) {
    // Find script of the same group (e.g., functions_*)
    const oldScript = [...document.querySelectorAll("script[data-hover-inspector]")].find((s) =>
      (s as any).dataset.hoverInspector?.startsWith(groupPrefix),
    );

    // If an old script of the same group is found — check its version
    if (oldScript) {
      const oldMatch = (oldScript as any).dataset.hoverInspector.match(/_(\d+)\.js$/);
      const oldVersion = oldMatch ? Number(oldMatch[1]) : 0;

      if (newVersion <= oldVersion) {
        return false;
      }

      // Remove old script
      oldScript.remove();
    }
  }

  // Create new script
  const script = document.createElement("script");
  script.src = downloadUrl;
  script.setAttribute("data-hover-inspector", filename);
  script.onload = () => {
  };
  script.onerror = (error) => {
    console.error(`Failed to load script: ${filename}`, error);
  };

  // Append script to document
  (document.head || document.documentElement).appendChild(script);
  return true;
}