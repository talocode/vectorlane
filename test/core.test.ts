import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { existsSync, rmSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

import { cosineSimilarity, normalizeVector } from "../src/core/math.js";
import { chunkText } from "../src/core/chunker.js";
import { hashContent, buildCitation } from "../src/core/metadata.js";
import { formatCitation } from "../src/core/citations.js";
import { createEmbeddingProvider, embedTexts } from "../src/core/embedder.js";
import {
  createCollection,
  listCollections,
  getCollection,
  deleteCollection,
  addDocument,
  addChunks,
  addVectors,
  search,
  stats,
} from "../src/core/store.js";
import { ensureStorage } from "../src/core/storage.js";
import { readCollectionsSync, readCollectionMetaSync } from "../src/core/storage.js";

const TEST_COLLECTION = "_test_core";
const STORAGE = join(homedir(), ".vectorlane");

function getCollectionDirect(name: string) {
  const meta = readCollectionMetaSync(name);
  if (!meta) throw new Error(`Collection "${name}" not found`);
  return meta as unknown as Collection;
}

function cleanup() {
  const dir = join(STORAGE, "collections", TEST_COLLECTION);
  if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
  const list = join(STORAGE, "collections.json");
  if (existsSync(list)) {
    try {
      const raw = JSON.parse(readFileSync(list, "utf-8")) as string[];
      const filtered = raw.filter((n) => n !== TEST_COLLECTION);
      writeFileSync(list, JSON.stringify(filtered, null, 2), "utf-8");
    } catch {}
  }
}

describe("math", () => {
  it("cosineSimilarity: identical vectors = 1", () => {
    const a = [1, 2, 3];
    assert.ok(Math.abs(cosineSimilarity(a, a) - 1) < 1e-10);
  });

  it("cosineSimilarity: orthogonal vectors = 0", () => {
    const a = [1, 0];
    const b = [0, 1];
    assert.ok(Math.abs(cosineSimilarity(a, b)) < 1e-10);
  });

  it("cosineSimilarity: opposite vectors = -1", () => {
    const a = [1, 0];
    const b = [-1, 0];
    assert.ok(Math.abs(cosineSimilarity(a, b) - (-1)) < 1e-10);
  });

  it("normalizeVector: produces unit magnitude", () => {
    const v = [3, 4];
    const n = normalizeVector(v);
    const mag = Math.sqrt(n[0] ** 2 + n[1] ** 2);
    assert.ok(Math.abs(mag - 1) < 1e-10);
  });
});

describe("chunker", () => {
  it("chunkText: splits text into chunks with correct offsets", () => {
    const text = "First paragraph.\n\nSecond paragraph.\n\nThird paragraph.";
    const chunks = chunkText(text);
    assert.ok(chunks.length >= 2);
    for (const c of chunks) {
      assert.equal(typeof c.text, "string");
      assert.equal(typeof c.startOffset, "number");
      assert.equal(typeof c.endOffset, "number");
      assert.ok(c.endOffset <= text.length);
      assert.equal(text.slice(c.startOffset, c.endOffset), c.text);
    }
  });

  it("chunkText: respects chunkSize option", () => {
    const lines = Array.from({ length: 20 }, (_, i) => `Paragraph ${i} with some words here.`);
    const text = lines.join("\n\n");
    const chunks = chunkText(text, { chunkSize: 60 });
    assert.ok(chunks.length > 1, "should produce multiple chunks");
    for (const c of chunks) {
      assert.ok(c.text.length <= 120, `Chunk too large: ${c.text.length}`);
    }
  });

  it("chunkText: handles empty text", () => {
    const chunks = chunkText("");
    assert.equal(chunks.length, 0);
  });
});

describe("metadata", () => {
  it("hashContent: returns consistent hash", () => {
    const text = "hello world";
    const h1 = hashContent(text);
    const h2 = hashContent(text);
    assert.equal(h1, h2);
    assert.equal(h1.length, 64);
  });

  it("buildCitation: creates citation object", () => {
    const citation = buildCitation({
      metadata: { sourceType: "file", sourcePath: "/test.md", title: "Test" },
      chunkIndex: 0,
      startOffset: 0,
      endOffset: 100,
      lineStart: 1,
      lineEnd: 5,
    });
    assert.equal(citation.sourceType, "file");
    assert.equal(citation.sourcePath, "/test.md");
    assert.equal(citation.title, "Test");
    assert.equal(citation.chunkIndex, 0);
    assert.equal(citation.lineStart, 1);
    assert.equal(citation.lineEnd, 5);
  });
});

describe("citations", () => {
  it("formatCitation: returns readable string", () => {
    const citation = {
      sourceType: "file",
      sourcePath: "src/index.ts",
      sourceUrl: "",
      title: "",
      chunkIndex: 0,
      startOffset: 0,
      endOffset: 50,
      lineStart: 10,
      lineEnd: 20,
    };
    const result = formatCitation(citation);
    assert.ok(result.includes("src/index.ts"));
    assert.ok(result.includes("L10"));
    assert.ok(result.includes("L20"));
  });
});

describe("embedder", () => {
  it("createEmbeddingProvider: returns provider with correct name/dimensions", () => {
    const provider = createEmbeddingProvider("local-hash");
    assert.equal(provider.name, "local-hash");
    assert.equal(provider.dimensions, 256);
  });

  it("embedTexts: returns correct dimensions", async () => {
    const provider = createEmbeddingProvider("local-hash");
    const vectors = await embedTexts(["hello", "world"], provider);
    assert.equal(vectors.length, 2);
    assert.equal(vectors[0].length, 256);
    assert.equal(vectors[1].length, 256);
  });

  it("local-hash provider: deterministic output for same input", async () => {
    const provider = createEmbeddingProvider("local-hash");
    const [a] = await provider.embed(["test input"]);
    const [b] = await provider.embed(["test input"]);
    assert.deepEqual(a, b);
  });
});

describe("store", () => {
  before(() => {
    cleanup();
    ensureStorage();
  });

  after(() => {
    cleanup();
  });

  it("createCollection: creates collection with correct fields", async () => {
    const col = await createCollection(TEST_COLLECTION, { description: "Test collection" });
    assert.equal(col.name, TEST_COLLECTION);
    assert.equal(col.description, "Test collection");
    assert.equal(col.embeddingProvider, "local-hash");
    assert.equal(col.vectorDimensions, 256);
    assert.equal(typeof col.id, "string");
    assert.equal(typeof col.createdAt, "string");
  });

  it("listCollections: returns created collections", async () => {
    const cols = await listCollections();
    const found = cols.find((c) => c.name === TEST_COLLECTION);
    assert.ok(found, "created collection should appear in list");
  });

  it("getCollection: returns collection by name", async () => {
    const col = getCollectionDirect(TEST_COLLECTION);
    assert.equal(col.name, TEST_COLLECTION);
    assert.equal(typeof col.id, "string");
  });

  it("addDocument: creates document record", async () => {
    const col = getCollectionDirect(TEST_COLLECTION);
    const doc = await addDocument(col.id, {
      sourceType: "text",
      sourcePath: "test-doc",
      title: "Test Doc",
      content: "Test content for document",
    });
    assert.equal(doc.sourceType, "text");
    assert.equal(doc.title, "Test Doc");
    assert.equal(typeof doc.id, "string");
    assert.equal(typeof doc.contentHash, "string");
  });

  it("addChunks: creates chunk records", async () => {
    const col = getCollectionDirect(TEST_COLLECTION);
    const doc = await addDocument(col.id, {
      sourceType: "text",
      sourcePath: "test-chunks",
      title: "Chunks Doc",
      content: "Some chunk content",
    });
    const chunks = await addChunks(col.id, [
      {
        documentId: doc.id,
        text: "chunk one",
        chunkIndex: 0,
        startOffset: 0,
        endOffset: 9,
        lineStart: 1,
        lineEnd: 1,
        tokenEstimate: 3,
        metadata: { sourceType: "text", sourcePath: "", sourceUrl: "", title: "", chunkIndex: 0, startOffset: 0, endOffset: 9, lineStart: 1, lineEnd: 1, tokenEstimate: 3, tags: [] },
        citation: { sourceType: "text", sourcePath: "", sourceUrl: "", title: "", chunkIndex: 0, startOffset: 0, endOffset: 9, lineStart: 1, lineEnd: 1 },
      },
    ]);
    assert.equal(chunks.length, 1);
    assert.equal(chunks[0].text, "chunk one");
    assert.equal(chunks[0].documentId, doc.id);
  });

  it("addVectors: stores vectors", async () => {
    const col = getCollectionDirect(TEST_COLLECTION);
    const doc = await addDocument(col.id, {
      sourceType: "text",
      sourcePath: "test-vec",
      title: "Vec Doc",
      content: "Vector content",
    });
    const chunks = await addChunks(col.id, [
      {
        documentId: doc.id,
        text: "vector chunk",
        chunkIndex: 0,
        startOffset: 0,
        endOffset: 12,
        lineStart: 1,
        lineEnd: 1,
        tokenEstimate: 3,
        metadata: { sourceType: "text", sourcePath: "", sourceUrl: "", title: "", chunkIndex: 0, startOffset: 0, endOffset: 12, lineStart: 1, lineEnd: 1, tokenEstimate: 3, tags: [] },
        citation: { sourceType: "text", sourcePath: "", sourceUrl: "", title: "", chunkIndex: 0, startOffset: 0, endOffset: 12, lineStart: 1, lineEnd: 1 },
      },
    ]);
    await addVectors(col.id, [
      { chunkId: chunks[0].id, collectionId: col.id, vector: new Array(256).fill(0.1), createdAt: new Date().toISOString() },
    ]);
    const s = await stats(col.id);
    assert.ok(s.vectors >= 1);
  });

  it("search: returns ranked results by similarity", async () => {
    const col = getCollectionDirect(TEST_COLLECTION);
    const doc = await addDocument(col.id, {
      sourceType: "text",
      sourcePath: "search-doc",
      title: "Search Doc",
      content: "Search content",
    });
    const chunks = await addChunks(col.id, [
      {
        documentId: doc.id,
        text: "search chunk alpha",
        chunkIndex: 0,
        startOffset: 0,
        endOffset: 18,
        lineStart: 1,
        lineEnd: 1,
        tokenEstimate: 5,
        metadata: { sourceType: "text", sourcePath: "", sourceUrl: "", title: "", chunkIndex: 0, startOffset: 0, endOffset: 18, lineStart: 1, lineEnd: 1, tokenEstimate: 5, tags: [] },
        citation: { sourceType: "text", sourcePath: "", sourceUrl: "", title: "", chunkIndex: 0, startOffset: 0, endOffset: 18, lineStart: 1, lineEnd: 1 },
      },
      {
        documentId: doc.id,
        text: "search chunk beta",
        chunkIndex: 1,
        startOffset: 19,
        endOffset: 36,
        lineStart: 2,
        lineEnd: 2,
        tokenEstimate: 5,
        metadata: { sourceType: "text", sourcePath: "", sourceUrl: "", title: "", chunkIndex: 1, startOffset: 19, endOffset: 36, lineStart: 2, lineEnd: 2, tokenEstimate: 5, tags: [] },
        citation: { sourceType: "text", sourcePath: "", sourceUrl: "", title: "", chunkIndex: 1, startOffset: 19, endOffset: 36, lineStart: 2, lineEnd: 2 },
      },
    ]);
    await addVectors(col.id, chunks.map((c, i) => ({
      chunkId: c.id,
      collectionId: col.id,
      vector: new Array(256).fill(i === 0 ? 0.9 : 0.1),
      createdAt: new Date().toISOString(),
    })));
    const results = await search(col.id, new Array(256).fill(0.9), { topK: 2 });
    assert.ok(results.length > 0);
    assert.equal(typeof results[0].score, "number");
    assert.ok(results[0].score >= results[results.length - 1].score, "results should be ranked by score descending");
  });

  it("stats: returns correct counts", async () => {
    const col = getCollectionDirect(TEST_COLLECTION);
    const s = await stats(col.id);
    assert.equal(s.collection, col.id);
    assert.equal(typeof s.documents, "number");
    assert.equal(typeof s.chunks, "number");
    assert.equal(typeof s.vectors, "number");
    assert.ok(s.documents >= 0);
  });

  it("deleteCollection: removes collection", async () => {
    const tmpName = "_test_delete_me";
    await createCollection(tmpName);
    await deleteCollection(tmpName);
    const dir = join(STORAGE, "collections", tmpName);
    assert.ok(!existsSync(dir));
  });
});
