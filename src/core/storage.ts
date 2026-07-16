import { mkdirSync, existsSync, readFileSync, writeFileSync, readdirSync, unlinkSync, rmdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const STORAGE_ROOT = join(homedir(), ".vectorlane");

export function getStorageRoot(): string {
  return STORAGE_ROOT;
}

export function ensureStorage(collection?: string): string {
  if (!existsSync(STORAGE_ROOT)) {
    mkdirSync(STORAGE_ROOT, { recursive: true });
  }
  if (!existsSync(join(STORAGE_ROOT, "collections"))) {
    mkdirSync(join(STORAGE_ROOT, "collections"), { recursive: true });
  }
  if (collection) {
    const dir = join(STORAGE_ROOT, "collections", collection);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }
  return STORAGE_ROOT;
}

export function getCollectionsPath(): string {
  return join(STORAGE_ROOT, "collections.json");
}

export function getCollectionDir(id: string): string {
  return join(STORAGE_ROOT, "collections", id);
}

export function getCollectionJsonPath(id: string): string {
  return join(getCollectionDir(id), "collection.json");
}

export function readCollectionsSync(): string[] {
  const path = getCollectionsPath();
  if (!existsSync(path)) return [];
  try {
    const raw = readFileSync(path, "utf-8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((item: unknown) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && "id" in item) return (item as { id: string }).id;
        return String(item);
      });
    }
    return [];
  } catch {
    return [];
  }
}

export function readCollectionMetaSync(collection: string): Record<string, unknown> | null {
  const dir = join(STORAGE_ROOT, "collections", collection);
  const file = join(dir, "collection.json");
  if (!existsSync(file)) {
    const metaFile = join(dir, "_meta.json");
    if (existsSync(metaFile)) {
      const raw = readFileSync(metaFile, "utf-8");
      return JSON.parse(raw);
    }
    return null;
  }
  const raw = readFileSync(file, "utf-8");
  return JSON.parse(raw);
}

export function writeCollectionMetaSync(collection: string, meta: Record<string, unknown>): void {
  const dir = join(STORAGE_ROOT, "collections", collection);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  const file = join(dir, "collection.json");
  writeFileSync(file, JSON.stringify(meta, null, 2), "utf-8");
}

export function collectionExistsSync(name: string): boolean {
  const dir = join(STORAGE_ROOT, "collections", name);
  return existsSync(dir);
}

export function deleteCollectionDirSync(name: string): void {
  const dir = join(STORAGE_ROOT, "collections", name);
  if (!existsSync(dir)) return;
  rmrfSync(dir);
}

function rmrfSync(dir: string): void {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      rmrfSync(full);
    } else {
      unlinkSync(full);
    }
  }
  rmdirSync(dir);
}

export function readJSONSync<T>(collection: string, filename: string): T[] {
  const dir = join(STORAGE_ROOT, "collections", collection);
  const file = join(dir, filename);
  if (!existsSync(file)) return [];
  const raw = readFileSync(file, "utf-8");
  return JSON.parse(raw) as T[];
}

export function writeJSONSync<T>(collection: string, filename: string, data: T[]): void {
  const dir = join(STORAGE_ROOT, "collections", collection);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  const file = join(dir, filename);
  writeFileSync(file, JSON.stringify(data, null, 2), "utf-8");
}

export function appendJSONSync<T>(collection: string, filename: string, items: T[]): T[] {
  const existing = readJSONSync<T>(collection, filename);
  const merged = [...existing, ...items];
  writeJSONSync(collection, filename, merged);
  return merged;
}
