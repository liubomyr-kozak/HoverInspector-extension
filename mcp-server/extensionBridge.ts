import { randomUUID } from "node:crypto";
import type { IncomingMessage } from "node:http";
import { WebSocketServer, type RawData, type WebSocket } from "ws";

import {
  errorMessage,
  isBridgeHello,
  isBridgeResponse,
  MCP_BRIDGE_MAX_MESSAGE_BYTES,
  MCP_BRIDGE_PROTOCOL,
  parseFrame,
} from "../entrypoints/core/mcp/protocol";
import type { BridgeHello, BridgeMethod, BridgeParams, BridgeRequest } from "../entrypoints/core/mcp/types";

export interface ExtensionBridgeOptions {
  port: number;
  /** Only this extension may connect (chrome-extension://<id>); any extension origin when empty */
  extensionId?: string;
  /** How long a tool call waits for the extension to connect (it retries every few seconds) */
  connectWaitMs?: number;
  requestTimeoutMs?: number;
}

interface Pending {
  resolve: (result: unknown) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

const EXTENSION_ORIGIN = /^(chrome-extension|moz-extension|safari-web-extension):\/\/([^/]+)$/;
const HELLO_TIMEOUT_MS = 5000;

export const NOT_CONNECTED_HINT =
  "Hover Inspector is not connected. In the browser, open Hover Inspector > Automation Scenarios > Settings and " +
  "turn on \"MCP bridge\" (same port as this server), then try again.";

/**
 * Web pages can open WebSockets to 127.0.0.1 too. Only an extension origin may connect, so a page can
 * neither pose as the extension nor read what the agent asks for.
 */
export function isAllowedOrigin(origin: string | undefined, extensionId?: string): boolean {
  const match = origin ? EXTENSION_ORIGIN.exec(origin) : null;
  if (!match) return false;
  return !extensionId || match[2] === extensionId;
}

/**
 * The server's end of the bridge: a WebSocket server on 127.0.0.1 that the extension connects to.
 * Tool calls become requests to the extension; each waits for its response or a timeout.
 */
export class ExtensionBridge {
  private server: WebSocketServer | null = null;
  private extension: WebSocket | null = null;
  private hello: BridgeHello | null = null;
  private startError: string | null = null;
  private readonly pending = new Map<string, Pending>();
  private readonly connectWaiters = new Set<() => void>();

  constructor(private readonly options: ExtensionBridgeOptions) {}

  /** Resolves once listening; when the port is taken the bridge stays down and every call explains why */
  start(): Promise<void> {
    return new Promise((resolve) => {
      const server = new WebSocketServer({
        host: "127.0.0.1",
        port: this.options.port,
        maxPayload: MCP_BRIDGE_MAX_MESSAGE_BYTES,
        verifyClient: ({ origin }: { origin: string }) => isAllowedOrigin(origin, this.options.extensionId),
      });
      server.on("listening", () => {
        this.server = server;
        resolve();
      });
      server.on("error", (error: NodeJS.ErrnoException) => {
        this.startError =
          error.code === "EADDRINUSE"
            ? `Port ${this.options.port} is already in use (another Hover Inspector MCP server?). ` +
              "Close it or start this one with HOVER_INSPECTOR_MCP_PORT set to a free port, and use the same port in the extension."
            : `The bridge could not start: ${error.message}`;
        resolve();
      });
      server.on("connection", (socket: WebSocket, request: IncomingMessage) => this.accept(socket, request));
    });
  }

  get connected(): boolean {
    return this.hello !== null && this.extension !== null;
  }

  get extensionVersion(): string | null {
    return this.hello?.extensionVersion ?? null;
  }

  get port(): number {
    return this.options.port;
  }

  get error(): string | null {
    return this.startError;
  }

  async close(): Promise<void> {
    this.extension?.close();
    await new Promise<void>((resolve) => (this.server ? this.server.close(() => resolve()) : resolve()));
  }

  async call(method: BridgeMethod, params: BridgeParams): Promise<unknown> {
    if (this.startError) throw new Error(this.startError);
    if (!this.connected) await this.waitForExtension();
    const socket = this.extension;
    if (!socket || !this.connected) throw new Error(NOT_CONNECTED_HINT);

    const request: BridgeRequest = { type: "request", id: randomUUID(), method, params };
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(request.id);
        reject(new Error(`The extension did not answer "${method}" in time`));
      }, this.options.requestTimeoutMs ?? 60_000);
      this.pending.set(request.id, { resolve, reject, timer });
      socket.send(JSON.stringify(request));
    });
  }

  private waitForExtension(): Promise<void> {
    return new Promise((resolve) => {
      const done = () => {
        clearTimeout(timer);
        this.connectWaiters.delete(done);
        resolve();
      };
      const timer = setTimeout(done, this.options.connectWaitMs ?? 35_000);
      this.connectWaiters.add(done);
    });
  }

  private accept(socket: WebSocket, request: IncomingMessage) {
    let greeted = false;
    const helloTimer = setTimeout(() => {
      if (!greeted) socket.close(1008, "Expected a hello");
    }, HELLO_TIMEOUT_MS);

    socket.on("message", (data: RawData) => {
      const message = parseFrame(data.toString());
      if (!greeted) {
        if (!isBridgeHello(message) || message.protocol !== MCP_BRIDGE_PROTOCOL) {
          socket.close(1008, `Expected protocol ${MCP_BRIDGE_PROTOCOL}`);
          return;
        }
        greeted = true;
        clearTimeout(helloTimer);
        // The newest connection wins: after an extension reload the old socket may linger for a while
        if (this.extension && this.extension !== socket) this.extension.close(1000, "Replaced by a new connection");
        this.extension = socket;
        this.hello = message;
        process.stderr.write(
          `[hover-inspector-mcp] extension ${message.extensionVersion} connected from ${request.headers.origin}\n`,
        );
        [...this.connectWaiters].forEach((wake) => wake());
        return;
      }
      if (isBridgeResponse(message)) this.settle(message.id, message.ok ? { result: message.result } : { error: message.error });
    });

    socket.on("close", () => {
      clearTimeout(helloTimer);
      if (this.extension !== socket) return;
      this.extension = null;
      this.hello = null;
      for (const [id] of this.pending) this.settle(id, { error: "The extension disconnected" });
    });
    socket.on("error", (error: Error) => process.stderr.write(`[hover-inspector-mcp] socket error: ${errorMessage(error)}\n`));
  }

  private settle(id: string, outcome: { result: unknown } | { error: string }) {
    const pending = this.pending.get(id);
    if (!pending) return;
    this.pending.delete(id);
    clearTimeout(pending.timer);
    if ("error" in outcome) pending.reject(new Error(outcome.error));
    else pending.resolve(outcome.result);
  }
}
