import {
  createCollection,
  listCollections,
  getCollection,
  deleteCollection,
  search,
  stats,
} from "../core/store.js";
import { ingestText, ingestFile, ingestFolder } from "../core/ingest.js";
import {
  importMemoryLane,
  importContextLane,
  syncMemoryLane,
  syncContextLane,
} from "../core/integrations.js";
import { createEmbeddingProvider } from "../core/embedder.js";
import { ensureStorage } from "../core/storage.js";
import { runDoctor, runDemo } from "../sdk/client.js";

export async function handleRoute(
  method: string,
  pathname: string,
  body?: unknown,
  searchParams?: URLSearchParams
): Promise<unknown> {
  const b = (body ?? {}) as Record<string, unknown>;

  if (method === "POST" && pathname === "/v1/vectorlane/init") {
    ensureStorage();
    return { initialized: true };
  }

  if (method === "POST" && pathname === "/v1/vectorlane/collections") {
    return createCollection(b.name as string, { description: b.description as string | undefined });
  }

  if (method === "GET" && pathname === "/v1/vectorlane/collections") {
    return listCollections();
  }

  const collMatch = pathname.match(/^\/v1\/vectorlane\/collections\/([^/]+)$/);
  if (collMatch) {
    const name = decodeURIComponent(collMatch[1]);
    if (method === "GET") return getCollection(name);
    if (method === "DELETE") { await deleteCollection(name); return { deleted: true }; }
  }

  const statsMatch = pathname.match(/^\/v1\/vectorlane\/collections\/([^/]+)\/stats$/);
  if (statsMatch && method === "GET") {
    return stats(decodeURIComponent(statsMatch[1]));
  }

  if (method === "POST" && pathname === "/v1/vectorlane/ingest") {
    const p = b.path as string;
    if (!p) throw new Error("path is required");
    const fs = await import("node:fs/promises");
    const s = await fs.stat(p);
    if (s.isDirectory()) return ingestFolder(p, { collection: b.collection as string | undefined, tags: b.tags as string[] | undefined });
    return ingestFile(p, { collection: b.collection as string | undefined, tags: b.tags as string[] | undefined });
  }

  if (method === "POST" && pathname === "/v1/vectorlane/ingest-text") {
    if (!b.text) throw new Error("text is required");
    return ingestText(b.text as string, { title: b.title as string | undefined, collection: b.collection as string | undefined, tags: b.tags as string[] | undefined });
  }

  if (method === "POST" && pathname === "/v1/vectorlane/ingest-url") {
    if (!b.url) throw new Error("url is required");
    throw new Error("URL ingestion requires async operation. Use ingest-text instead.");
  }

  if (method === "POST" && pathname === "/v1/vectorlane/search") {
    if (!b.query) throw new Error("query is required");
    const collection = (b.collection as string) ?? "default";
    const provider = createEmbeddingProvider(b.provider as string | undefined);
    const embeddings = await provider.embed([b.query as string]);
    return search(collection, embeddings[0], { topK: (b.topK as number) ?? 5 });
  }

  if (method === "POST" && pathname === "/v1/vectorlane/import-memorylane") {
    if (!b.path) throw new Error("path is required");
    return importMemoryLane({ path: b.path as string, collection: b.collection as string | undefined });
  }

  if (method === "POST" && pathname === "/v1/vectorlane/import-contextlane") {
    if (!b.path) throw new Error("path is required");
    return importContextLane({ path: b.path as string, collection: b.collection as string | undefined });
  }

  if (method === "POST" && pathname === "/v1/vectorlane/sync-memorylane") {
    return syncMemoryLane({ collection: b.collection as string | undefined });
  }

  if (method === "POST" && pathname === "/v1/vectorlane/sync-contextlane") {
    return syncContextLane({ collection: b.collection as string | undefined });
  }

  if (method === "POST" && pathname === "/v1/vectorlane/demo") return runDemo();
  if (method === "GET" && pathname === "/v1/vectorlane/doctor") return runDoctor();

  throw new Error(`Unknown route: ${method} ${pathname}`);
}
