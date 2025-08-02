import { isProduction } from "@entrypoints/shared/helpers";
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
 * Simple script injection service
 * Development: External script with src attribute
 * Production: Inline script content
 */
class ScriptInjectionService {
  private readonly DEFAULT_SERVER_URL = "http://localhost:5500";

  /**
   * Main entry point - generate and inject script
   */
  public async generateAndInjectCode(options: ScriptInjectionOptions = {}): Promise<void> {
    const { tabId, serverUrl = this.DEFAULT_SERVER_URL } = options;

    try {
      const codeResponse = await this.generateCode(serverUrl);
      const targetTabId = await this.getTargetTab(tabId);
      
      await this.injectScript(codeResponse, targetTabId);
      await this.notifySuccess(codeResponse, targetTabId);
    } catch (error) {
      await this.handleError(error, tabId);
      throw error;
    }
  }

  /**
   * Remove script by filename
   */
  public async removeScript(filename: string, tabId?: number): Promise<void> {
    const targetTabId = await this.getTargetTab(tabId);
    
    if (browser?.scripting && targetTabId) {
      await browser.scripting.executeScript({
        target: { tabId: targetTabId },
        func: (filename: string) => {
          const script = document.querySelector(`script[data-hover-inspector="${filename}"]`);
          script?.remove();
        },
        args: [filename],
      });
    }
  }

  // Private helper methods
  private async generateCode(serverUrl: string): Promise<GenerateCodeResponse> {
    const response = await fetch(`${serverUrl}/generate-code`, {
      method: "GET",
      headers: { accept: "application/json", "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Backend request failed: ${response.status}`);
    }

    const data: GenerateCodeResponse = await response.json();
    if (!data.success) {
      throw new Error("Backend returned unsuccessful response");
    }

    return data;
  }

  private async getTargetTab(tabId?: number): Promise<number> {
    if (tabId) return tabId;
    
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    if (tabs.length === 0) throw new Error("No active tab found");
    
    return tabs[0].id!;
  }

  private async injectScript(codeResponse: GenerateCodeResponse, tabId: number): Promise<void> {
    if (!browser?.scripting) {
      throw new Error("Chrome scripting API not available");
    }

    if (isProduction()) {
      // Production: fetch content and inject inline
      const scriptContent = await this.fetchScriptContent(codeResponse.downloadUrl);
      await browser.scripting.executeScript({
        target: { tabId },
        func: this.createInlineScript,
        args: [scriptContent, codeResponse.filename],
      });
    } else {
      // Development: inject with src attribute
      await browser.scripting.executeScript({
        target: { tabId },
        func: this.createExternalScript,
        args: [codeResponse.downloadUrl, codeResponse.filename],
      });
    }
  }

  private async fetchScriptContent(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch script: ${response.status}`);
    return response.text();
  }

  private createInlineScript(content: string, filename: string): void {
    this.removeExistingScript(filename);
    const script = document.createElement("script");
    script.setAttribute("data-hover-inspector", filename);
    script.textContent = content;
    document.head.appendChild(script);
  }

  private createExternalScript(url: string, filename: string): void {
    this.removeExistingScript(filename);
    const script = document.createElement("script");
    script.setAttribute("data-hover-inspector", filename);
    script.src = url;
    document.head.appendChild(script);
  }

  private removeExistingScript(filename: string): void {
    const existing = document.querySelector(`script[data-hover-inspector="${filename}"]`);
    existing?.remove();
  }

  private async notifySuccess(codeResponse: GenerateCodeResponse, tabId: number): Promise<void> {
    const event = isProduction() ? PROD_SCRIPT_INJECTED : DEV_SCRIPT_INJECTED;
    await sendMessage(event, {
      filename: codeResponse.filename,
      publicUrl: codeResponse.publicUrl,
      scriptUrl: codeResponse.downloadUrl,
      timestamp: Date.now(),
    }, tabId);
  }

  private async handleError(error: unknown, tabId?: number): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("ScriptInjectionService:", errorMessage);

    if (tabId) {
      try {
        await sendMessage(SCRIPT_INJECTION_ERROR, {
          error: errorMessage,
          timestamp: Date.now(),
        }, tabId);
      } catch (messageError) {
        console.error("Failed to send error message:", messageError);
      }
    }
  }
}

export default new ScriptInjectionService();
