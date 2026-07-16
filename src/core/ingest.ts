import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { extname, join } from "node:path";
import {
  createCollection,
  addDocument,
  addChunks,
  addVectors,
  getCollection,
} from "./store.js";
import type { Collection } from "./types.js";
import { chunkText } from "./chunker.js";
import { createEmbeddingProvider, embedTexts } from "./embedder.js";
import { IngestError } from "./errors.js";
import { hashContent } from "./metadata.js";

export interface IngestOptions {
  collection?: string;
  provider?: string;
  model?: string;
  tags?: string[];
  title?: string;
}

export interface FolderIngestResult {
  summary: { files: number; chunks: number; errors: string[] };
  documents: Collection[];
}

export interface IngestResult {
  collection: string;
  documentId: string;
  chunksCount: number;
  vectorsCount: number;
}

const SUPPORTED_EXTENSIONS = new Set([
  ".txt", ".md", ".ts", ".js", ".json", ".yaml", ".yml",
  ".py", ".go", ".rs", ".java", ".c", ".cpp", ".h",
  ".html", ".css", ".xml", ".csv", ".sh",
]);

function extractTextFromHtml(raw: string): string {
  return raw
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTextFromFile(raw: string, ext: string): string {
  switch (ext) {
    case ".txt":
    case ".md":
    case ".csv":
    case ".ts":
    case ".js":
    case ".py":
    case ".go":
    case ".rs":
    case ".java":
    case ".c":
    case ".cpp":
    case ".h":
    case ".yaml":
    case ".yml":
    case ".sh":
    case ".css":
    case ".xml":
      return raw;
    case ".json": {
      try {
        const parsed = JSON.parse(raw);
        if (typeof parsed === "string") return parsed;
        if (parsed.content) return String(parsed.content);
        if (parsed.text) return String(parsed.text);
        return JSON.stringify(parsed, null, 2);
      } catch {
        return raw;
      }
    }
    case ".html":
      return extractTextFromHtml(raw);
    default:
      return raw;
  }
}

export async function ingestText(
  text: string,
  options?: IngestOptions
): Promise<IngestResult> {
  if (!text || text.trim().length === 0) {
    throw new IngestError("Cannot ingest empty text");
  }

  const collectionName = options?.collection ?? "default";
  const provider = options?.provider ?? "local-hash";
  const providerInstance = createEmbeddingProvider(provider, options?.model);

  let collection: Collection;
  try {
    collection = await createCollection(collectionName);
  } catch {
    const existing = await getCollection(collectionName);
    if (existing) {
      collection = existing;
    } else {
      throw new IngestError(`Failed to create or get collection "${collectionName}"`);
    }
  }

  const chunkRecords = chunkText(text);
  if (chunkRecords.length === 0) {
    throw new IngestError("No chunks produced from text");
  }

  const doc = await addDocument(collection.id, {
    sourceType: "text",
    sourcePath: options?.title ?? "text-input",
    title: options?.title,
    content: text,
  });

  const storedChunks = await addChunks(collection.id, chunkRecords.map((c) => ({
    documentId: doc.id,
    text: c.text,
    chunkIndex: c.chunkIndex,
    startOffset: c.startOffset,
    endOffset: c.endOffset,
    lineStart: c.lineStart,
    lineEnd: c.lineEnd,
    tokenEstimate: c.tokenEstimate,
    metadata: c.metadata as unknown as Record<string, unknown>,
    citation: c.citation as unknown as Record<string, unknown>,
  })));

  const embeddings = await embedTexts(
    storedChunks.map((c) => c.text),
    providerInstance
  );

  await addVectors(collection.id, storedChunks.map((c, i) => ({
    chunkId: c.id,
    collectionId: collection.id,
    vector: embeddings[i],
    createdAt: new Date().toISOString(),
  })));

  return {
    collection: collectionName,
    documentId: doc.id,
    chunksCount: storedChunks.length,
    vectorsCount: embeddings.length,
  };
}

export async function ingestFile(
  filePath: string,
  options?: IngestOptions
): Promise<IngestResult> {
  if (!existsSync(filePath)) {
    throw new IngestError(`File not found: ${filePath}`);
  }

  const ext = extname(filePath).toLowerCase();
  if (!SUPPORTED_EXTENSIONS.has(ext)) {
    throw new IngestError(
      `Unsupported file type "${ext}". Supported: ${[...SUPPORTED_EXTENSIONS].join(", ")}`
    );
  }

  try {
    const raw = readFileSync(filePath, "utf-8");
    const text = extractTextFromFile(raw, ext);
    if (!text || text.trim().length === 0) {
      throw new IngestError(`File is empty: ${filePath}`);
    }
    return ingestText(text, {
      ...options,
      title: options?.title ?? filePath.split("/").pop()?.replace(ext, "") ?? filePath,
    });
  } catch (err) {
    if (err instanceof IngestError) throw err;
    throw new IngestError(`Failed to ingest file ${filePath}: ${(err as Error).message}`);
  }
}

function findSupportedFiles(dir: string): string[] {
  const results: string[] = [];
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findSupportedFiles(fullPath));
    } else if (SUPPORTED_EXTENSIONS.has(extname(entry.name).toLowerCase())) {
      results.push(fullPath);
    }
  }
  return results;
}

export async function ingestFolder(
  folderPath: string,
  options?: IngestOptions
): Promise<FolderIngestResult> {
  if (!existsSync(folderPath)) {
    throw new IngestError(`Folder not found: ${folderPath}`);
  }

  const files = findSupportedFiles(folderPath);
  const documents: Collection[] = [];
  const errors: string[] = [];
  let totalChunks = 0;

  for (const file of files) {
    try {
      const result = await ingestFile(file, options);
      totalChunks += result.chunksCount;
      const col = await getCollection(result.collection);
      if (col && !documents.find((d) => d.name === col.name)) {
        documents.push(col);
      }
    } catch (err) {
      errors.push(`${file}: ${(err as Error).message}`);
    }
  }

  return {
    summary: {
      files: documents.length,
      chunks: totalChunks,
      errors,
    },
    documents,
  };
}

export async function ingestUrl(
  url: string,
  options?: IngestOptions
): Promise<IngestResult> {
  let text: string;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new IngestError(
        `Failed to fetch URL: ${res.status} ${res.statusText}. For complex URL content, use ContextLane (contextlane) for richer ingestion.`
      );
    }
    text = await res.text();
  } catch (err) {
    if (err instanceof IngestError) throw err;
    throw new IngestError(
      `Failed to fetch URL: ${(err as Error).message}. ` +
        `For complex URL content, use ContextLane (contextlane) for richer ingestion.`
    );
  }

  if (!text || text.trim().length === 0) {
    throw new IngestError("URL returned empty content");
  }

  const htmlText = extractTextFromHtml(text);

  return ingestText(htmlText, {
    ...options,
    title: options?.title ?? url,
  });
}
