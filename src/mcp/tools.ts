import {
  createCollection,
  listCollections,
  deleteCollection,
  search,
  stats,
  clearCollection,
} from "../core/store.js";
import { ingestText, ingestFile, ingestFolder } from "../core/ingest.js";
import { importMemoryLane, importContextLane } from "../core/integrations.js";
import { createEmbeddingProvider } from "../core/embedder.js";
import { ensureStorage } from "../core/storage.js";
import { runDoctor, runDemo } from "../sdk/client.js";

export interface McpTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export function listTools(): McpTool[] {
  return [
    { name: "vectorlane_init", description: "Initialize VectorLane storage directory", inputSchema: { type: "object", properties: {} } },
    { name: "vectorlane_collection_create", description: "Create a new vector collection", inputSchema: { type: "object", properties: { name: { type: "string" }, description: { type: "string" } }, required: ["name"] } },
    { name: "vectorlane_collection_list", description: "List all vector collections", inputSchema: { type: "object", properties: {} } },
    { name: "vectorlane_collection_stats", description: "Get statistics for a collection", inputSchema: { type: "object", properties: { collection: { type: "string" } }, required: ["collection"] } },
    { name: "vectorlane_ingest", description: "Ingest a file or folder into a collection", inputSchema: { type: "object", properties: { path: { type: "string" }, collection: { type: "string" }, tags: { type: "array", items: { type: "string" } } }, required: ["path"] } },
    { name: "vectorlane_ingest_text", description: "Ingest raw text into a collection", inputSchema: { type: "object", properties: { text: { type: "string" }, title: { type: "string" }, collection: { type: "string" }, tags: { type: "array", items: { type: "string" } } }, required: ["text"] } },
    { name: "vectorlane_search", description: "Semantic search in a collection", inputSchema: { type: "object", properties: { query: { type: "string" }, collection: { type: "string" }, topK: { type: "number" } }, required: ["query"] } },
    { name: "vectorlane_import_memorylane", description: "Import from MemoryLane", inputSchema: { type: "object", properties: { path: { type: "string" }, collection: { type: "string" } }, required: ["path"] } },
    { name: "vectorlane_import_contextlane", description: "Import from ContextLane", inputSchema: { type: "object", properties: { path: { type: "string" }, collection: { type: "string" } }, required: ["path"] } },
    { name: "vectorlane_doctor", description: "Run health checks on VectorLane installation", inputSchema: { type: "object", properties: {} } },
    { name: "vectorlane_demo", description: "Run the VectorLane demo with sample data", inputSchema: { type: "object", properties: {} } },
    { name: "vectorlane_clear_collection", description: "Clear all data in a collection", inputSchema: { type: "object", properties: { collection: { type: "string" }, confirm: { type: "boolean" } }, required: ["collection", "confirm"] } },
  ];
}

export async function handleToolCall(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case "vectorlane_init": ensureStorage(); return { status: "initialized" };
    case "vectorlane_collection_create": return createCollection(args.name as string, { description: args.description as string | undefined });
    case "vectorlane_collection_list": return listCollections();
    case "vectorlane_collection_stats": return stats(args.collection as string);
    case "vectorlane_ingest": {
      const p = args.path as string;
      const fs = await import("node:fs/promises");
      const s = await fs.stat(p);
      if (s.isDirectory()) return ingestFolder(p, { collection: args.collection as string | undefined, tags: args.tags as string[] | undefined });
      return ingestFile(p, { collection: args.collection as string | undefined, tags: args.tags as string[] | undefined });
    }
    case "vectorlane_ingest_text": return ingestText(args.text as string, { title: args.title as string | undefined, collection: args.collection as string | undefined, tags: args.tags as string[] | undefined });
    case "vectorlane_search": {
      const collection = (args.collection as string) ?? "default";
      const provider = createEmbeddingProvider();
      const embeddings = await provider.embed([args.query as string]);
      return search(collection, embeddings[0], { topK: (args.topK as number) ?? 5 });
    }
    case "vectorlane_import_memorylane": return importMemoryLane({ path: args.path as string, collection: args.collection as string | undefined });
    case "vectorlane_import_contextlane": return importContextLane({ path: args.path as string, collection: args.collection as string | undefined });
    case "vectorlane_doctor": return runDoctor();
    case "vectorlane_demo": return runDemo();
    case "vectorlane_clear_collection": {
      if (args.confirm !== true) throw new Error("Deletion not confirmed.");
      await clearCollection(args.collection as string);
      await createCollection(args.collection as string);
      return { status: "cleared", collection: args.collection };
    }
    default: throw new Error(`Unknown tool: ${name}`);
  }
}
