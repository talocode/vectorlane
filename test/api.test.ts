import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

import { createApiServer } from "../src/api/server.js";
import type { Server } from "node:http";

const STORAGE = join(homedir(), ".vectorlane");

function cleanupCollections(...names: string[]) {
  const list = join(STORAGE, "collections.json");
  if (existsSync(list)) {
    try {
      const raw = JSON.parse(readFileSync(list, "utf-8")) as string[];
      const filtered = raw.filter((n) => !names.includes(n));
      writeFileSync(list, JSON.stringify(filtered, null, 2), "utf-8");
    } catch {}
  }
  for (const name of names) {
    const dir = join(STORAGE, "collections", name);
    if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
  }
}

let server: Server;
let port: number;
let baseUrl: string;

function setupServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    const s = createApiServer({ port: 0 });
    server = s.server;
    server.listen(0, () => {
      const addr = server.address();
      if (addr && typeof addr === "object") {
        port = addr.port;
        baseUrl = `http://localhost:${port}`;
      }
      resolve();
    });
    server.on("error", reject);
  });
}

function teardownServer(): Promise<void> {
  return new Promise((resolve) => {
    if (server) server.close(() => resolve());
    else resolve();
  });
}

async function api(method: string, path: string, body?: unknown): Promise<{ ok: boolean; data?: unknown; error?: string }> {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return res.json() as Promise<{ ok: boolean; data?: unknown; error?: string }>;
}

describe("api", () => {
  before(async () => {
    await setupServer();
  });

  after(async () => {
    cleanupCollections("_test_api_coll");
    await teardownServer();
  });

  it("GET /health returns ok", async () => {
    const res = await api("GET", "/health");
    assert.equal(res.ok, true);
    const data = res.data as { status: string };
    assert.equal(data.status, "ok");
  });

  it("POST /v1/vectorlane/init works", async () => {
    const res = await api("POST", "/v1/vectorlane/init");
    assert.equal(res.ok, true);
    const data = res.data as { initialized: boolean };
    assert.equal(data.initialized, true);
  });

  it("POST /v1/vectorlane/collections creates collection", async () => {
    const res = await api("POST", "/v1/vectorlane/collections", { name: "_test_api_coll", description: "API test collection" });
    assert.equal(res.ok, true);
    const data = res.data as { name: string; description: string };
    assert.equal(data.name, "_test_api_coll");
    assert.equal(data.description, "API test collection");
  });

  it("GET /v1/vectorlane/collections lists collections", async () => {
    const res = await api("GET", "/v1/vectorlane/collections");
    assert.equal(res.ok, true);
    const data = res.data as Array<{ name: string }>;
    assert.ok(Array.isArray(data));
    const found = data.find((c) => c.name === "_test_api_coll");
    assert.ok(found, "created collection should be listed");
  });

  it("POST /v1/vectorlane/ingest-text ingests text", async () => {
    const res = await api("POST", "/v1/vectorlane/ingest-text", {
      text: "VectorLane API test content for ingestion.",
      collection: "_test_api_coll",
      title: "API Test",
    });
    assert.equal(res.ok, true);
    const data = res.data as { chunksCount: number; vectorsCount: number };
    assert.ok(data.chunksCount >= 1);
    assert.equal(data.vectorsCount, data.chunksCount);
  });

  it("POST /v1/vectorlane/search returns results", async () => {
    const res = await api("POST", "/v1/vectorlane/search", {
      query: "vector search",
      collection: "_test_api_coll",
      topK: 3,
    });
    assert.equal(res.ok, true);
    const data = res.data as Array<{ score: number }>;
    assert.ok(Array.isArray(data));
  });

  it("POST /v1/vectorlane/demo works", async () => {
    const res = await api("POST", "/v1/vectorlane/demo");
    assert.equal(res.ok, true);
    const data = res.data as { collection: string; documents: number; chunks: number };
    assert.equal(data.collection, "_demo");
    assert.ok(data.documents >= 1);
    assert.ok(data.chunks >= 1);
    cleanupCollections("_demo");
  });
});
