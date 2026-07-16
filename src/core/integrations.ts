import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, extname } from "node:path";
import { homedir } from "node:os";
import { IngestError, VectorLaneError } from "./errors.js";
import { ingestText } from "./ingest.js";
import { createCollection, getCollection } from "./store.js";

const MEMORYLANE_PATH = join(homedir(), ".memorylane");
const CONTEXTLANE_PATH = join(homedir(), ".contextlane");

export interface ImportResult {
  imported: number;
  collection: string;
  errors: string[];
}

interface ImportInput {
  path: string;
  collection?: string;
}

interface SyncInput {
  collection?: string;
}

function readJsonOrJsonl(filePath: string): unknown[] {
  const ext = extname(filePath).toLowerCase();
  const raw = readFileSync(filePath, "utf-8");

  if (ext === ".jsonl") {
    return raw
      .split("\n")
      .filter((l) => l.trim())
      .map((l) => JSON.parse(l));
  }

  const parsed = JSON.parse(raw);
  if (Array.isArray(parsed)) return parsed;
  if (parsed.data && Array.isArray(parsed.data)) return parsed.data;
  if (parsed.records && Array.isArray(parsed.records)) return parsed.records;
  return [parsed];
}

function readExportSource(sourcePath: string): unknown[] {
  if (!existsSync(sourcePath)) {
    throw new IngestError(`Export path not found: ${sourcePath}`);
  }

  const s = statSync(sourcePath);
  if (s.isFile()) {
    return readJsonOrJsonl(sourcePath);
  }

  if (s.isDirectory()) {
    const entries = readdirSync(sourcePath);
    const jsonFiles = entries.filter(
      (f) => f.endsWith(".json") || f.endsWith(".jsonl")
    );
    const records: unknown[] = [];
    for (const file of jsonFiles) {
      records.push(...readJsonOrJsonl(join(sourcePath, file)));
    }
    return records;
  }

  throw new IngestError(`Unsupported source type: ${sourcePath}`);
}

export async function importMemoryLane(input: ImportInput): Promise<ImportResult> {
  const { path: exportPath, collection: collectionName } = input;
  const records = readExportSource(exportPath);
  const colName = collectionName ?? "memorylane";
  const errors: string[] = [];
  let imported = 0;

  try {
    await createCollection(colName, { description: "Imported from MemoryLane" });
  } catch {
    const existing = await getCollection(colName);
    if (!existing) throw new IngestError(`Failed to create collection "${colName}"`);
  }

  for (const record of records) {
    try {
      const r = record as Record<string, unknown>;
      const text =
        (r.content as string) ||
        (r.text as string) ||
        (r.message as string) ||
        JSON.stringify(r);
      const tags: string[] = [
        ...(Array.isArray(r.tags) ? (r.tags as string[]) : []),
        ...(r.session ? [`session:${r.session}`] : []),
        ...(r.importance ? [`importance:${r.importance}`] : []),
      ];

      await ingestText(text, {
        title: (r.title as string) || (r.id as string) || `memorylane-${imported}`,
        collection: colName,
        tags,
      });
      imported++;
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
    }
  }

  return { imported, collection: colName, errors };
}

export async function importContextLane(input: ImportInput): Promise<ImportResult> {
  const { path: exportPath, collection: collectionName } = input;
  const records = readExportSource(exportPath);
  const colName = collectionName ?? "contextlane";
  const errors: string[] = [];
  let imported = 0;

  try {
    await createCollection(colName, { description: "Imported from ContextLane" });
  } catch {
    const existing = await getCollection(colName);
    if (!existing) throw new IngestError(`Failed to create collection "${colName}"`);
  }

  for (const record of records) {
    try {
      const r = record as Record<string, unknown>;
      const text =
        (r.content as string) ||
        (r.text as string) ||
        (r.data as string) ||
        JSON.stringify(r);
      const tags: string[] = [
        ...(Array.isArray(r.tags) ? (r.tags as string[]) : []),
        ...(r.source ? [`source:${r.source}`] : []),
      ];

      await ingestText(text, {
        title: (r.title as string) || (r.id as string) || `contextlane-${imported}`,
        collection: colName,
        tags,
      });
      imported++;
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
    }
  }

  return { imported, collection: colName, errors };
}

export async function syncMemoryLane(
  input?: SyncInput
): Promise<ImportResult> {
  if (!existsSync(MEMORYLANE_PATH)) {
    throw new VectorLaneError("MEMORYLANE_NOT_FOUND", "MemoryLane storage not found at ~/.memorylane. Run \"vectorlane import-memorylane <path>\" to import from a specific export file."
    );
  }

  const entries = readdirSync(MEMORYLANE_PATH);
  const exportFiles = entries.filter(
    (f) => f.endsWith(".json") || f.endsWith(".jsonl")
  );

  if (exportFiles.length === 0) {
    throw new VectorLaneError("MEMORYLANE_EMPTY", "MemoryLane storage found at ~/.memorylane/ but contains no JSON/JSONL export files."
    );
  }

  const records: unknown[] = [];
  for (const file of exportFiles) {
    records.push(...readJsonOrJsonl(join(MEMORYLANE_PATH, file)));
  }

  const colName = input?.collection ?? "memorylane";
  const errors: string[] = [];
  let imported = 0;

  try {
    await createCollection(colName, { description: "Synced from MemoryLane" });
  } catch {
    const existing = await getCollection(colName);
    if (!existing) throw new IngestError(`Failed to create collection "${colName}"`);
  }

  for (const record of records) {
    try {
      const r = record as Record<string, unknown>;
      const text =
        (r.content as string) ||
        (r.text as string) ||
        (r.message as string) ||
        JSON.stringify(r);
      const tags: string[] = [
        ...(Array.isArray(r.tags) ? (r.tags as string[]) : []),
        ...(r.session ? [`session:${r.session}`] : []),
      ];

      await ingestText(text, {
        title: (r.title as string) || `memorylane-${imported}`,
        collection: colName,
        tags,
      });
      imported++;
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
    }
  }

  return { imported, collection: colName, errors };
}

export async function syncContextLane(
  input?: SyncInput
): Promise<ImportResult> {
  if (!existsSync(CONTEXTLANE_PATH)) {
    throw new VectorLaneError("CONTEXTLANE_NOT_FOUND", "ContextLane storage not found at ~/.contextlane. Run \"vectorlane import-contextlane <path>\" to import from a specific export file."
    );
  }

  const entries = readdirSync(CONTEXTLANE_PATH);
  const exportFiles = entries.filter(
    (f) => f.endsWith(".json") || f.endsWith(".jsonl")
  );

  if (exportFiles.length === 0) {
    throw new VectorLaneError("CONTEXTLANE_EMPTY", "ContextLane storage found at ~/.contextlane/ but contains no JSON/JSONL export files."
    );
  }

  const records: unknown[] = [];
  for (const file of exportFiles) {
    records.push(...readJsonOrJsonl(join(CONTEXTLANE_PATH, file)));
  }

  const colName = input?.collection ?? "contextlane";
  const errors: string[] = [];
  let imported = 0;

  try {
    await createCollection(colName, { description: "Synced from ContextLane" });
  } catch {
    const existing = await getCollection(colName);
    if (!existing) throw new IngestError(`Failed to create collection "${colName}"`);
  }

  for (const record of records) {
    try {
      const r = record as Record<string, unknown>;
      const text =
        (r.content as string) ||
        (r.text as string) ||
        (r.data as string) ||
        JSON.stringify(r);
      const tags: string[] = [
        ...(Array.isArray(r.tags) ? (r.tags as string[]) : []),
        ...(r.source ? [`source:${r.source}`] : []),
      ];

      await ingestText(text, {
        title: (r.title as string) || `contextlane-${imported}`,
        collection: colName,
        tags,
      });
      imported++;
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
    }
  }

  return { imported, collection: colName, errors };
}
