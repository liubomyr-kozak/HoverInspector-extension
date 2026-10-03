import { useEffect, useRef, useState } from "react";
import ExtensionStorageManager from "@entrypoints/core/services/storage/ExtensionStorageManager.ts";

const SERVER_VISIBILITY_KEY = "automation_server_visibility";

// Whether a key event comes from a field the user types in (events from the shadow root are retargeted)
const isTypingTarget = (event: KeyboardEvent) => {
  const target = (event.composedPath?.()[0] || event.target) as HTMLElement | null;
  if (!target || !(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
};

/**
 * Custom hook to handle the 'S' key press for showing the Server tab:
 * holding S for 2 seconds (outside of text fields) shows it, or hides it when it is shown
 * @returns {boolean} Whether the Server tab should be visible
 */
export const useServerTabVisibility = (): {
  isServerTabVisible: boolean;
  setServerTabVisible: (visible: boolean) => void;
} => {
  const [isServerTabVisible, setIsServerTabVisible] = useState(false);
  const visibleRef = useRef(false);
  visibleRef.current = isServerTabVisible;
  const keyPressTimer = useRef<NodeJS.Timeout | null>(null);
  const keyPressStartTime = useRef<number | null>(null);
  const KEY_PRESS_DURATION = 2000; // 2 seconds in milliseconds

  // Load server tab visibility from storage
  useEffect(() => {
    const loadServerTabVisibility = async () => {
      try {
        const visibility = await ExtensionStorageManager.getAutomationScenario(SERVER_VISIBILITY_KEY);

        if (visibility && visibility.visible) {
          setIsServerTabVisible(true);
        }
      } catch (error) {
        console.error("Error loading server tab visibility:", error);
      }
    };

    loadServerTabVisibility();
  }, []);

  // Save server tab visibility to storage
  const setServerTabVisible = async (visible: boolean) => {
    try {
      await ExtensionStorageManager.saveAutomationScenario({
        id: SERVER_VISIBILITY_KEY,
        scenario: { visible },
      });
      setIsServerTabVisible(visible);
    } catch (error) {
      console.error("Error saving server tab visibility:", error);
    }
  };

  // Set up key event listeners
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if 'S' key is pressed

      if (event.key?.toLowerCase() === "s" && !isTypingTarget(event)) {
        // Prevent starting a new timer if one is already running
        if (keyPressStartTime.current === null) {
          keyPressStartTime.current = Date.now();

          // Start a timer to check duration
          keyPressTimer.current = setTimeout(() => {
            // If the key has been pressed for the required duration, show (or hide) the server tab
            setServerTabVisible(!visibleRef.current);

            // Reset tracking variables
            keyPressStartTime.current = null;
            keyPressTimer.current = null;
          }, KEY_PRESS_DURATION);
        }
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      // Check if 'S' key is released
      if (event.key?.toLowerCase() === "s") {
        // Clear the timer
        if (keyPressTimer.current) {
          clearTimeout(keyPressTimer.current);
          keyPressTimer.current = null;
        }

        // Reset the start time
        keyPressStartTime.current = null;
      }
    };

    // Add event listeners
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // Clean up event listeners on unmount
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);

      if (keyPressTimer.current) {
        clearTimeout(keyPressTimer.current);
      }
    };
  }, []);

  return { isServerTabVisible, setServerTabVisible };
};
