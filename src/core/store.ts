import { createHash, randomUUID } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  ensureStorage,
  getStorageRoot,
  readJSONSync,
  appendJSONSync,
  readCollectionMetaSync,
  writeCollectionMetaSync,
  collectionExistsSync,
  deleteCollectionDirSync,
  readCollectionsSync,
} from "./storage.js";
import { cosineSimilarity } from "./math.js";
import { hashContent } from "./metadata.js";
import type {
  Collection,
  ChunkRecord,
  DocumentRecord,
  EmbeddingRecord,
  SearchResult,
} from "./types.js";

export type { Collection, ChunkRecord, DocumentRecord, EmbeddingRecord, SearchResult };

export interface IngestResult {
  collection: string;
  documentId: string;
  document: { id: string };
  chunksCount: number;
  chunks: ChunkRecord[];
  vectorsCount: number;
  vectors: EmbeddingRecord[];
}

export interface StatsResult {
  collection: string;
  documents: number;
  chunks: number;
  vectors: number;
  description?: string;
  createdAt?: string;
}

function generateId(input: string): string {
  return createHash("sha256").update(input + Date.now().toString()).digest("hex").slice(0, 16);
}

function generateCollectionId(name: string): string {
  return createHash("sha256").update(name).digest("hex").slice(0, 12);
}

function collectionFromJson(data: unknown): Collection {
  const obj = data as Record<string, unknown>;
  return {
    id: obj.id as string,
    name: obj.name as string,
    description: obj.description as string,
    embeddingProvider: obj.embeddingProvider as string,
    embeddingModel: obj.embeddingModel as string,
    vectorDimensions: obj.vectorDimensions as number,
    chunkCount: obj.chunkCount as number,
    createdAt: obj.createdAt as string,
    updatedAt: obj.updatedAt as string,
  };
}

export async function createCollection(
  name: string,
  options?: string | { description?: string; embeddingProvider?: string; embeddingModel?: string; vectorDimensions?: number }
): Promise<Collection> {
  ensureStorage(name);
  const opts = typeof options === "string" ? { description: options } : (options ?? {});
  const providerName = opts.embeddingProvider ?? "local-hash";
  const dimensions = opts.vectorDimensions ?? 256;
  const id = generateCollectionId(name);
  const now = new Date().toISOString();

  const collection: Collection = {
    id,
    name,
    description: opts.description ?? "",
    embeddingProvider: providerName,
    embeddingModel: opts.embeddingModel ?? "local-hash",
    vectorDimensions: dimensions,
    chunkCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  writeCollectionMetaSync(name, collection as unknown as Record<string, unknown>);

  // Add to collections list
  const collectionsListPath = join(getStorageRoot(), "collections.json");
  let names: string[] = [];
  try {
    const raw = readFileSync(collectionsListPath, "utf-8");
    names = JSON.parse(raw);
  } catch {}
  if (!names.includes(name)) {
    names.push(name);
    writeFileSync(collectionsListPath, JSON.stringify(names, null, 2), "utf-8");
  }

  return collection;
}

export async function listCollections(): Promise<Collection[]> {
  ensureStorage();
  const names = readCollectionsSync();
  const collections: Collection[] = [];
  for (const n of names) {
    const meta = readCollectionMetaSync(n);
    if (meta) {
      collections.push(collectionFromJson(meta));
    }
  }
  return collections;
}

export async function getCollection(nameOrId: string): Promise<Collection> {
  const names = readCollectionsSync();
  for (const n of names) {
    const meta = readCollectionMetaSync(n);
    if (!meta) continue;
    const c = collectionFromJson(meta);
    if (c.name === nameOrId || c.id === nameOrId) return c;
  }
  throw new Error(`Collection "${nameOrId}" not found`);
}

export async function deleteCollection(nameOrId: string): Promise<void> {
  deleteCollectionDirSync(nameOrId);
}

export async function addDocument(
  collectionId: string,
  doc: { sourceType: string; sourcePath: string; sourceUrl?: string; title?: string; content: string }
): Promise<DocumentRecord> {
  const contentHash = hashContent(doc.content);
  const id = generateId(doc.sourcePath + contentHash);
  const now = new Date().toISOString();

  const document: DocumentRecord = {
    id,
    collectionId,
    sourceType: doc.sourceType,
    sourcePath: doc.sourcePath,
    sourceUrl: doc.sourceUrl ?? "",
    title: doc.title ?? doc.sourcePath.split("/").pop() ?? doc.sourcePath,
    contentHash,
    chunkCount: 0,
    createdAt: now,
  };

  appendJSONSync<DocumentRecord>(collectionId, "documents.json", [document]);
  return document;
}

export async function addChunks(
  collectionId: string,
  chunks: Array<{
    documentId: string;
    text: string;
    chunkIndex: number;
    startOffset: number;
    endOffset: number;
    lineStart: number;
    lineEnd: number;
    tokenEstimate: number;
    metadata: Record<string, unknown>;
    citation: Record<string, unknown>;
  }>
): Promise<ChunkRecord[]> {
  const now = new Date().toISOString();

  const records: ChunkRecord[] = chunks.map((c) => ({
    id: generateId(collectionId + c.documentId + c.chunkIndex.toString()),
    collectionId,
    documentId: c.documentId,
    chunkIndex: c.chunkIndex,
    text: c.text,
    startOffset: c.startOffset,
    endOffset: c.endOffset,
    lineStart: c.lineStart,
    lineEnd: c.lineEnd,
    tokenEstimate: c.tokenEstimate,
    metadata: c.metadata as unknown as ChunkRecord["metadata"],
    citation: c.citation as unknown as ChunkRecord["citation"],
    createdAt: now,
  }));

  appendJSONSync<ChunkRecord>(collectionId, "chunks.json", records);
  return records;
}

export async function addVectors(
  collectionId: string,
  vectors: EmbeddingRecord[]
): Promise<void> {
  appendJSONSync<EmbeddingRecord>(collectionId, "vectors.json", vectors);
}

export async function search(
  collectionId: string,
  queryEmbedding: number[],
  options?: { topK?: number } | number
): Promise<SearchResult[]> {
  const topK = typeof options === "number" ? options : (options?.topK ?? 5);

  const vectors = readJSONSync<EmbeddingRecord>(collectionId, "vectors.json");
  if (vectors.length === 0) return [];

  const chunks = readJSONSync<ChunkRecord>(collectionId, "chunks.json");
  const chunkMap = new Map<string, ChunkRecord>();
  for (const c of chunks) chunkMap.set(c.id, c);

  const docs = readJSONSync<DocumentRecord>(collectionId, "documents.json");
  const docMap = new Map<string, DocumentRecord>();
  for (const d of docs) docMap.set(d.id, d);

  const scored: Array<{ vector: EmbeddingRecord; score: number }> = [];
  for (const vec of vectors) {
    if (vec.vector.length !== queryEmbedding.length) continue;
    const chunk = chunkMap.get(vec.chunkId);
    if (!chunk) continue;
    const score = cosineSimilarity(queryEmbedding, vec.vector);
    scored.push({ vector: vec, score });
  }

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, topK);

  return top.map((s) => {
    const chunk = chunkMap.get(s.vector.chunkId)!;
    const doc = docMap.get(chunk.documentId) ?? null;
    return {
      chunkId: s.vector.chunkId,
      chunk,
      document: doc,
      score: s.score,
      citation: chunk.citation,
    };
  });
}

export async function stats(collectionId: string): Promise<StatsResult> {
  const docs = readJSONSync<DocumentRecord>(collectionId, "documents.json");
  const chunks = readJSONSync<ChunkRecord>(collectionId, "chunks.json");
  const vectors = readJSONSync<EmbeddingRecord>(collectionId, "vectors.json");
  const meta = readCollectionMetaSync(collectionId);
  return {
    collection: collectionId,
    documents: docs.length,
    chunks: chunks.length,
    vectors: vectors.length,
    description: (meta?.description as string) || undefined,
    createdAt: (meta?.createdAt as string) || undefined,
  };
}

export function incrementCounter(
  collection: string,
  field: "documentCount" | "chunkCount" | "vectorCount",
  amount: number
): void {
  const meta = readCollectionMetaSync(collection);
  if (meta) {
    meta[field] = ((meta[field] as number) ?? 0) + amount;
    meta.updatedAt = new Date().toISOString();
    writeCollectionMetaSync(collection, meta);
  }
}

export function clearCollection(collection: string): void {
  deleteCollectionDirSync(collection);
  ensureStorage(collection);
}
