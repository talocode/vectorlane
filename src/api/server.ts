import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { handleRoute } from "./routes.js";
import { AuthError } from "../core/errors.js";

const PORT = parseInt(process.env.VECTORLANE_PORT ?? "3090", 10);
const REQUIRE_AUTH = process.env.VECTORLANE_REQUIRE_AUTH === "true";
const AUTH_TOKEN = process.env.VECTORLANE_AUTH_TOKEN;

export interface ServerOptions {
  port?: number;
  requireAuth?: boolean;
  authToken?: string;
}

export function createApiServer(options?: ServerOptions) {
  const port = options?.port ?? PORT;
  const needAuth = options?.requireAuth ?? REQUIRE_AUTH;
  const token = options?.authToken ?? AUTH_TOKEN;

  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    res.setHeader("Content-Type", "application/json");

    try {
      const url = new URL(req.url ?? "/", `http://localhost:${port}`);
      const method = req.method ?? "GET";
      const pathname = url.pathname;

      // Health routes - no auth required
      if (pathname === "/health" || pathname === "/v1/vectorlane/health") {
        res.end(JSON.stringify({ ok: true, data: { status: "ok", version: "0.1.0" } }));
        return;
      }

      // Auth check for non-health routes
      if (needAuth) {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          throw new AuthError("Missing or invalid Authorization header");
        }
        const providedToken = authHeader.slice(7);
        if (providedToken !== token) {
          throw new AuthError("Invalid auth token");
        }
      }

      const body = await readBody(req);
      const result = await handleRoute(method, pathname, body, url.searchParams);
      res.end(JSON.stringify({ ok: true, data: result }));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const statusCode = err instanceof AuthError ? 401 : 400;
      res.statusCode = statusCode;
      res.end(JSON.stringify({ ok: false, error: message }));
    }
  });

  return { server, port };
}

export function startServer(options?: ServerOptions): Promise<{ port: number }> {
  return new Promise((resolve) => {
    const { server, port } = createApiServer(options);
    server.listen(port, () => {
      console.error(`VectorLane API server listening on port ${port}`);
      resolve({ port });
    });
  });
}

async function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf-8");
      if (!raw) {
        resolve(undefined);
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        resolve(undefined);
      }
    });
    req.on("error", reject);
  });
}

if (process.argv[1] && process.argv[1].endsWith("server.ts")) {
  startServer().then(() => {
    console.error("VectorLane API server started");
  });
}
