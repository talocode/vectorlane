import { createInterface, Interface } from "node:readline";
import { handleToolCall, listTools } from "./tools.js";

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

function respond(id: string | number | null | undefined, result: unknown): void {
  const msg: JsonRpcResponse = { jsonrpc: "2.0", id: id ?? null, result };
  process.stdout.write(JSON.stringify(msg) + "\n");
}

function respondError(
  id: string | number | null | undefined,
  code: number,
  message: string,
  data?: unknown
): void {
  const msg: JsonRpcResponse = {
    jsonrpc: "2.0",
    id: id ?? null,
    error: { code, message, data },
  };
  process.stdout.write(JSON.stringify(msg) + "\n");
}

function log(msg: string): void {
  process.stderr.write(`[mcp] ${msg}\n`);
}

async function handleRequest(req: JsonRpcRequest): Promise<void> {
  const { id, method, params } = req;

  switch (method) {
    case "initialize":
      respond(id, {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: "vectorlane", version: "0.1.0" },
      });
      break;

    case "notifications/initialized":
      break;

    case "tools/list":
      respond(id, { tools: listTools() });
      break;

    case "tools/call": {
      const toolName = (params as Record<string, unknown>)?.name as string;
      const toolArgs =
        ((params as Record<string, unknown>)?.arguments as Record<string, unknown>) ?? {};
      try {
        const result = await handleToolCall(toolName, toolArgs);
        respond(id, {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        });
      } catch (err) {
        respond(id, {
          content: [
            {
              type: "text",
              text: `Error: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
          isError: true,
        });
      }
      break;
    }

    case "ping":
      respond(id, {});
      break;

    default:
      respondError(id, -32601, `Method not found: ${method}`);
      break;
  }
}

export function startMcpServer(): void {
  log("VectorLane MCP server starting");

  const rl: Interface = createInterface({ input: process.stdin });

  rl.on("line", async (line: string) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    let req: JsonRpcRequest;
    try {
      req = JSON.parse(trimmed) as JsonRpcRequest;
    } catch {
      log(`Invalid JSON: ${trimmed.slice(0, 100)}`);
      respondError(null, -32700, "Parse error");
      return;
    }

    if (req.jsonrpc !== "2.0") {
      respondError(req.id ?? null, -32600, "Invalid Request");
      return;
    }

    try {
      await handleRequest(req);
    } catch (err) {
      log(`Error handling ${req.method}: ${err}`);
      respondError(
        req.id ?? null,
        -32603,
        err instanceof Error ? err.message : String(err)
      );
    }
  });

  rl.on("close", () => {
    log("MCP server shutting down");
    process.exit(0);
  });

  log("VectorLane MCP server ready on stdio");
}

if (process.argv[1] && process.argv[1].endsWith("server.ts")) {
  startMcpServer();
}
