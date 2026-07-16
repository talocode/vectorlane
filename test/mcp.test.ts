import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

import { listTools, handleToolCall } from "../src/mcp/tools.js";

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

describe("mcp", () => {
  after(() => {
    cleanupCollections("_demo", "_test_mcp");
  });

  it("verify 12 tools exist", () => {
    const tools = listTools();
    assert.equal(tools.length, 12);
  });

  it("each tool has name, description, inputSchema", () => {
    const tools = listTools();
    for (const tool of tools) {
      assert.equal(typeof tool.name, "string", `${tool.name} should have string name`);
      assert.ok(tool.name.length > 0, `${tool.name} name should not be empty`);
      assert.equal(typeof tool.description, "string", `${tool.name} should have string description`);
      assert.ok(tool.description.length > 0, `${tool.name} description should not be empty`);
      assert.ok(tool.inputSchema != null, `${tool.name} should have inputSchema`);
      assert.equal(tool.inputSchema.type, "object", `${tool.name} inputSchema should be type object`);
      assert.ok(tool.inputSchema.properties != null, `${tool.name} inputSchema should have properties`);
    }
  });

  it("test vectorlane_init handler", async () => {
    const result = await handleToolCall("vectorlane_init", {});
    assert.deepEqual(result, { status: "initialized" });
  });

  it("test vectorlane_demo handler", async () => {
    const result = await handleToolCall("vectorlane_demo", {}) as {
      collection: string;
      documents: number;
      chunks: number;
      vectors: number;
      searchResults: unknown[];
    };
    assert.equal(result.collection, "_demo");
    assert.ok(result.documents >= 1);
    assert.ok(result.chunks >= 1);
    assert.ok(result.vectors >= 1);
    assert.ok(Array.isArray(result.searchResults));
  });
});
