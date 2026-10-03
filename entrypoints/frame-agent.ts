import { runFrameAgent } from "@entrypoints/shared/frameAgent/agent";

/**
 * Injected with scripting.executeScript into all frames of a tab, only while the inspector is open
 * and the page has cross-origin frames. See shared/frameAgent/agent.ts.
 */
export default defineUnlistedScript(() => {
  runFrameAgent();
});
