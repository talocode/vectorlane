import {
  createCollection as coreCreateCollection,
  listCollections as coreListCollections,
  getCollection as coreGetCollection,
  deleteCollection as coreDeleteCollection,
  search as coreSearch,
  stats as coreStats,
  type Collection,
  type SearchResult,
} from "../core/store.js";
import { ingestText, ingestFile, ingestFolder } from "../core/ingest.js";
import {
  importMemoryLane,
  importContextLane,
  syncMemoryLane,
  syncContextLane,
  type ImportResult,
} from "../core/integrations.js";
import { createEmbeddingProvider } from "../core/embedder.js";
import { ensureStorage } from "../core/storage.js";
import { loadConfig } from "../core/config.js";
import { VectorLaneError } from "../core/errors.js";

export interface VectorLaneClientOptions {
  baseUrl?: string;
  authToken?: string;
}

export interface IngestInput {
  path: string;
  collection?: string;
  provider?: string;
  chunkSize?: number;
  overlap?: number;
  tags?: string[];
}

export interface IngestTextInput {
  text: string;
  title?: string;
  collection?: string;
  tags?: string[];
  provider?: string;
}

export interface IngestUrlInput {
  url: string;
  collection?: string;
  provider?: string;
}

export interface SearchInput {
  query: string;
  collection?: string;
  topK?: number;
  citations?: boolean;
  provider?: string;
}

export interface FolderIngestResult {
  summary: { files: number; chunks: number; errors: string[] };
  documents: Collection[];
}

export interface DoctorResult {
  storage: boolean;
  collections: number;
  configLoaded: boolean;
  version: string;
}

export interface DemoResult {
  collection: string;
  documents: number;
  chunks: number;
  vectors: number;
  searchResults: SearchResult[];
}

export class VectorLaneClient {
  private baseUrl?: string;
  private authToken?: string;
  private mode: "local" | "http";

  constructor(options?: VectorLaneClientOptions) {
    this.baseUrl = options?.baseUrl?.replace(/\/$/, "");
    this.authToken = options?.authToken ?? process.env.VECTORLANE_AUTH_TOKEN;
    this.mode = this.baseUrl ? "http" : "local";
  }

  private async http<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (this.authToken) headers["Authorization"] = `Bearer ${this.authToken}`;
    const res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const json = (await res.json()) as { ok: boolean; data?: T; error?: string };
    if (!json.ok) throw new VectorLaneError(json.error ?? "HTTP request failed", "HTTP_ERROR");
    return json.data as T;
  }

  async init(): Promise<void> {
    if (this.mode === "local") {
      ensureStorage();
    } else {
      await this.http("POST", "/v1/vectorlane/init");
    }
  }

  async createCollection(input: { name: string; description?: string }): Promise<Collection> {
    if (this.mode === "local") {
      return coreCreateCollection(input.name, { description: input.description });
    }
    return this.http<Collection>("POST", "/v1/vectorlane/collections", input);
  }

  async listCollections(): Promise<Collection[]> {
    if (this.mode === "local") return coreListCollections();
    return this.http<Collection[]>("GET", "/v1/vectorlane/collections");
  }

  async getCollection(name: string): Promise<Collection> {
    if (this.mode === "local") return coreGetCollection(name);
    return this.http<Collection>("GET", `/v1/vectorlane/collections/${encodeURIComponent(name)}`);
  }

  async deleteCollection(name: string): Promise<void> {
    if (this.mode === "local") { await coreDeleteCollection(name); return; }
    await this.http<void>("DELETE", `/v1/vectorlane/collections/${encodeURIComponent(name)}`);
  }

  async ingest(input: IngestInput): Promise<unknown> {
    if (this.mode === "local") {
      const fs = await import("node:fs/promises");
      const s = await fs.stat(input.path);
      if (s.isDirectory()) return ingestFolder(input.path, { collection: input.collection, tags: input.tags });
      return ingestFile(input.path, { collection: input.collection, tags: input.tags });
    }
    return this.http("POST", "/v1/vectorlane/ingest", input);
  }

  async ingestText(input: IngestTextInput): Promise<import("../core/ingest.js").IngestResult> {
    if (this.mode === "local") return ingestText(input.text, { collection: input.collection, tags: input.tags, title: input.title });
    return this.http<import("../core/ingest.js").IngestResult>("POST", "/v1/vectorlane/ingest-text", input);
  }

  async ingestUrl(input: IngestUrlInput): Promise<unknown> {
    if (this.mode === "local") throw new VectorLaneError("URL ingestion not supported in local mode.", "NOT_SUPPORTED");
    return this.http("POST", "/v1/vectorlane/ingest-url", input);
  }

  async search(input: SearchInput): Promise<SearchResult[]> {
    if (this.mode === "local") {
      const collection = input.collection ?? "default";
      const provider = createEmbeddingProvider(input.provider);
      const embeddings = await provider.embed([input.query]);
      return coreSearch(collection, embeddings[0], { topK: input.topK ?? 5 });
    }
    return this.http<SearchResult[]>("POST", "/v1/vectorlane/search", input);
  }

  async importMemoryLane(input: { path: string; collection?: string }): Promise<ImportResult> {
    if (this.mode === "local") return importMemoryLane({ path: input.path, collection: input.collection });
    return this.http<ImportResult>("POST", "/v1/vectorlane/import-memorylane", input);
  }

  async importContextLane(input: { path: string; collection?: string }): Promise<ImportResult> {
    if (this.mode === "local") return importContextLane({ path: input.path, collection: input.collection });
    return this.http<ImportResult>("POST", "/v1/vectorlane/import-contextlane", input);
  }

  async syncMemoryLane(input: { collection?: string }): Promise<ImportResult> {
    if (this.mode === "local") return syncMemoryLane(input);
    return this.http<ImportResult>("POST", "/v1/vectorlane/sync-memorylane", input);
  }

  async syncContextLane(input: { collection?: string }): Promise<ImportResult> {
    if (this.mode === "local") return syncContextLane(input);
    return this.http<ImportResult>("POST", "/v1/vectorlane/sync-contextlane", input);
  }

  async stats(collection: string): Promise<import("../core/store.js").StatsResult> {
    if (this.mode === "local") return coreStats(collection);
    return this.http<import("../core/store.js").StatsResult>("GET", "/v1/vectorlane/collections/" + encodeURIComponent(collection) + "/stats");
  }

  async doctor(): Promise<DoctorResult> {
    if (this.mode === "local") return runDoctor();
    return this.http<DoctorResult>("GET", "/v1/vectorlane/doctor");
  }

  async demo(): Promise<DemoResult> {
    if (this.mode === "local") return runDemo();
    return this.http<DemoResult>("POST", "/v1/vectorlane/demo");
  }
}

export async function runDoctor(): Promise<DoctorResult> {
  let storageOk = false;
  try { ensureStorage(); storageOk = true; } catch {}
  const config = await loadConfig();
  const collections = await coreListCollections();
  return { storage: storageOk, collections: collections.length, configLoaded: !!config, version: "0.1.0" };
}

export async function runDemo(): Promise<DemoResult> {
  const collectionName = "_demo";
  try { await coreDeleteCollection(collectionName); } catch {}
  await coreCreateCollection(collectionName, { description: "Demo collection" });

  const sampleTexts = [
    "VectorLane is an open-source local vector memory engine for AI agents.",
    "It provides document ingestion, chunking, embedding, and semantic search capabilities.",
    "The SDK supports both local and HTTP modes for flexible integration.",
    "Citations are automatically generated for search results to trace sources.",
    "VectorLane stores everything locally for privacy and fast access.",
  ];

  let totalChunks = 0;
  for (const text of sampleTexts) {
    const result = await ingestText(text, { collection: collectionName, title: text.slice(0, 40) });
    totalChunks += result.chunksCount;
  }

  const provider = createEmbeddingProvider();
  const queryEmbeddings = await provider.embed(["vector search"]);
  const searchResults = await coreSearch(collectionName, queryEmbeddings[0], { topK: 3 });

  return { collection: collectionName, documents: sampleTexts.length, chunks: totalChunks, vectors: totalChunks, searchResults };
}
