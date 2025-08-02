import { isProduction, isDevelopment } from "@entrypoints/shared/helpers";
import { sendMessage } from "@entrypoints/features/extension/messaging";
import { DEV_SCRIPT_INJECTED, PROD_SCRIPT_INJECTED, SCRIPT_INJECTION_ERROR } from "@entrypoints/shared/globalEvents";

export interface GenerateCodeResponse {
  success: boolean;
  filePath: string;
  publicUrl: string;
  filename: string;
  downloadUrl: string;
}

export interface ScriptInjectionOptions {
  tabId?: number;
  serverUrl?: string;
}

/**
 * ScriptInjectionService handles injection of generated code from backend
 * Works differently in development and production environments
 */
class ScriptInjectionService {
  private readonly DEFAULT_SERVER_URL = "http://localhost:5500";

  /**
   * Generate code and inject script into page
   */
  public async generateAndInjectCode(options: ScriptInjectionOptions = {}): Promise<void> {
    const { tabId, serverUrl = this.DEFAULT_SERVER_URL } = options;

    try {
      // Step 1: Request code generation from backend
      const codeResponse = await this.generateCode(serverUrl);

      if (!codeResponse.success) {
        throw new Error("Failed to generate code from backend");
      }

      // Step 2: Inject the script based on environment
      if (isProduction()) {
        await this.injectScriptProduction(codeResponse, tabId);
      } else {
        await this.injectScriptDevelopment(codeResponse, tabId);
      }
    } catch (error) {
      console.error("ScriptInjectionService: Error during code generation and injection:", error);

      const errorMessage = error instanceof Error ? error.message : String(error);

      // Notify content script about the error
      if (tabId) {
        try {
          await sendMessage(
            SCRIPT_INJECTION_ERROR,
            {
              error: errorMessage,
              timestamp: Date.now(),
            },
            tabId,
          );
        } catch (messageError) {
          console.error("Failed to send error message to content script:", messageError);
        }
      }

      throw error;
    }
  }

  /**
   * Request code generation from backend server
   */
  private async generateCode(serverUrl: string): Promise<GenerateCodeResponse> {
    const response = await fetch(`${serverUrl}/generate-code`, {
      method: "GET",
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Backend request failed: ${response.status} ${response.statusText}`);
    }

    const data: GenerateCodeResponse = await response.json();

    if (!data.success) {
      throw new Error("Backend returned unsuccessful response");
    }

    return data;
  }

  /**
   * Production script injection using Chrome API
   */
  private async injectScriptProduction(codeResponse: GenerateCodeResponse, tabId?: number): Promise<void> {
    if (!browser?.scripting) {
      throw new Error("Chrome scripting API not available");
    }

    // Determine target tab
    let targetTabId = tabId;
    if (!targetTabId) {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      if (tabs.length === 0) {
        throw new Error("No active tab found");
      }
      targetTabId = tabs[0].id!;
    }

    try {
      // Fetch the generated script content
      const scriptResponse = await fetch(codeResponse.downloadUrl);
      if (!scriptResponse.ok) {
        throw new Error(`Failed to fetch script: ${scriptResponse.status}`);
      }

      const scriptContent = await scriptResponse.text();

      // Inject the script using Chrome's scripting API
      await browser.scripting.executeScript({
        target: { tabId: targetTabId },
        func: this.injectScriptContent,
        args: [scriptContent, codeResponse.filename, false], // false = production mode
      });

      // Notify content script of successful injection
      await sendMessage(
        PROD_SCRIPT_INJECTED,
        {
          filename: codeResponse.filename,
          publicUrl: codeResponse.publicUrl,
          timestamp: Date.now(),
        },
        targetTabId,
      );

      console.log(`ScriptInjectionService: Successfully injected script ${codeResponse.filename} in production`);
    } catch (error) {
      console.error("ScriptInjectionService: Production injection failed:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Production script injection failed: ${errorMessage}`);
    }
  }

  /**
   * Development script injection using direct DOM manipulation
   */
  private async injectScriptDevelopment(codeResponse: GenerateCodeResponse, tabId?: number): Promise<void> {
    // Determine target tab
    let targetTabId = tabId;
    if (!targetTabId) {
      // In development, we can simulate tab targeting or use a different approach
      console.log("ScriptInjectionService: Development mode - simulating script injection");
    }

    try {
      // In development, we can either:
      // 1. Use Chrome scripting API if available (for browser extensions)
      // 2. Send the script URL to content script for direct injection

      if (targetTabId && browser?.scripting) {
        // Use Chrome scripting API with URL injection for development
        await browser.scripting.executeScript({
          target: { tabId: targetTabId },
          func: this.injectScriptContent,
          args: [codeResponse.downloadUrl, codeResponse.filename, true], // true = development mode
        });

        // Notify content script of successful injection
        await sendMessage(
          DEV_SCRIPT_INJECTED,
          {
            scriptUrl: codeResponse.downloadUrl,
            filename: codeResponse.filename,
            publicUrl: codeResponse.publicUrl,
            timestamp: Date.now(),
          },
          targetTabId,
        );
      } else if (targetTabId && browser?.tabs) {
        // Send script URL to content script for injection
        await sendMessage(
          DEV_SCRIPT_INJECTED,
          {
            scriptUrl: codeResponse.downloadUrl,
            filename: codeResponse.filename,
            publicUrl: codeResponse.publicUrl,
            timestamp: Date.now(),
          },
          targetTabId,
        );
      } else {
        debugger;
        this.injectScriptContent(codeResponse.downloadUrl, codeResponse.filename, true);
      }

      console.log(`ScriptInjectionService: Successfully processed script ${codeResponse.filename} in development`);
    } catch (error) {
      console.error("ScriptInjectionService: Development injection failed:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Development script injection failed: ${errorMessage}`);
    }
  }

  /**
   * Function to be injected into page context (used by Chrome scripting API)
   */
  private injectScriptContent(scriptContentOrUrl: string, filename: string, isDevelopmentMode: boolean = false): void {
    try {
      // Remove any existing script with the same filename
      const existingScript = document.querySelector(`script[data-hover-inspector="${filename}"]`);
      if (existingScript) {
        existingScript.remove();
      }

      // Create and inject new script
      const script = document.createElement("script");
      script.type = "text/javascript";
      script.setAttribute("data-hover-inspector", filename);

      if (isDevelopmentMode) {
        // Development mode: use src attribute for external script
        script.src = scriptContentOrUrl;
        console.log(`Injected script: ${filename} from ${scriptContentOrUrl}`);
      } else {
        // Production mode: inject script content directly
        script.textContent = scriptContentOrUrl;
        console.log(`Injected script: ${filename}`);
      }

      // Add to document head
      (document.head || document.documentElement).appendChild(script);
    } catch (error) {
      console.error(`Failed to inject script ${filename}:`, error);
      throw error;
    }
  }

  /**
   * Remove previously injected script
   */
  public async removeInjectedScript(filename: string, tabId?: number): Promise<void> {
    if (isProduction() && browser?.scripting) {
      let targetTabId = tabId;
      if (!targetTabId) {
        const tabs = await browser.tabs.query({ active: true, currentWindow: true });
        if (tabs.length > 0) {
          targetTabId = tabs[0].id!;
        }
      }

      if (targetTabId) {
        try {
          await browser.scripting.executeScript({
            target: { tabId: targetTabId },
            func: (filename: string) => {
              const script = document.querySelector(`script[data-hover-inspector="${filename}"]`);
              if (script) {
                script.remove();
                console.log(`Removed script: ${filename}`);
              }
            },
            args: [filename],
          });
        } catch (error) {
          console.error("Failed to remove script:", error);
        }
      }
    } else {
      console.log(`ScriptInjectionService: [DEV] Would remove script: ${filename}`);
    }
  }
}

export default new ScriptInjectionService();
