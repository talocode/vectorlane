import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { existsSync, rmSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

import { ingestText, ingestFile, ingestFolder } from "../src/core/ingest.js";
import { ensureStorage } from "../src/core/storage.js";
import { stats, deleteCollection, getCollection } from "../src/core/store.js";

const COLLECTION = "_test_ingest";
const TEMP_DIR = join(homedir(), ".vectorlane", "_test_ingest_tmp");
const STORAGE = join(homedir(), ".vectorlane");

function cleanupCollections() {
  for (const name of [COLLECTION, "_test_ingest_file_md", "_test_ingest_file_txt", "_test_ingest_folder"]) {
    const dir = join(STORAGE, "collections", name);
    if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
  }
  const list = join(STORAGE, "collections.json");
  if (existsSync(list)) {
    try {
      const raw = JSON.parse(readFileSync(list, "utf-8")) as string[];
      const filtered = raw.filter((n) => !n.startsWith("_test_ingest"));
      writeFileSync(list, JSON.stringify(filtered, null, 2), "utf-8");
    } catch {}
  }
}

function cleanupTempDir() {
  if (existsSync(TEMP_DIR)) rmSync(TEMP_DIR, { recursive: true, force: true });
}

describe("ingest", () => {
  before(() => {
    cleanupCollections();
    cleanupTempDir();
    ensureStorage();
    mkdirSync(TEMP_DIR, { recursive: true });
    mkdirSync(join(TEMP_DIR, "subdir"), { recursive: true });
    writeFileSync(join(TEMP_DIR, "readme.md"), "# Hello\n\nThis is a test markdown file with some content.\n", "utf-8");
    writeFileSync(join(TEMP_DIR, "notes.txt"), "These are plain text notes for testing ingestion.\n", "utf-8");
    writeFileSync(join(TEMP_DIR, "subdir", "deep.txt"), "Nested file content for folder ingestion.\n", "utf-8");
  });

  after(() => {
    cleanupCollections();
    cleanupTempDir();
  });

  it("ingestText: creates document, chunks, vectors", async () => {
    const result = await ingestText("This is a test text for ingestion into VectorLane.", { collection: COLLECTION });
    assert.equal(result.collection, COLLECTION);
    assert.equal(typeof result.documentId, "string");
    assert.ok(result.chunksCount >= 1, "should produce at least 1 chunk");
    assert.equal(result.vectorsCount, result.chunksCount, "vectors count should match chunks count");

    const col = await getCollection(COLLECTION);
    const s = await stats(col.id);
    assert.ok(s.documents >= 1);
    assert.ok(s.chunks >= 1);
    assert.ok(s.vectors >= 1);
  });

  it("ingestFile: reads .md file and ingests", async () => {
    const mdPath = join(TEMP_DIR, "readme.md");
    const result = await ingestFile(mdPath, { collection: "_test_ingest_file_md" });
    assert.ok(result.chunksCount >= 1);
    assert.equal(result.vectorsCount, result.chunksCount);
  });

  it("ingestFile: reads .txt file and ingests", async () => {
    const txtPath = join(TEMP_DIR, "notes.txt");
    const result = await ingestFile(txtPath, { collection: "_test_ingest_file_txt" });
    assert.ok(result.chunksCount >= 1);
    assert.equal(result.vectorsCount, result.chunksCount);
  });

  it("ingestFolder: ingests multiple files", async () => {
    const result = await ingestFolder(TEMP_DIR, { collection: "_test_ingest_folder" });
    assert.ok(result.summary.files >= 1, "should process at least 1 file");
    assert.ok(result.summary.chunks >= 1, "should produce at least 1 chunk");
    assert.equal(result.summary.errors.length, 0, "should have no errors");
  });
});
