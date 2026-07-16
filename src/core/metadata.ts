import { createHash } from "node:crypto";
import type { Citation, ChunkMetadata } from "./types.js";

export function buildCitation(chunk: {
  metadata?: { sourceType?: string; sourcePath?: string; sourceUrl?: string; title?: string };
  chunkIndex?: number;
  startOffset?: number;
  endOffset?: number;
  lineStart?: number;
  lineEnd?: number;
}): Citation {
  return {
    sourceType: chunk.metadata?.sourceType ?? "unknown",
    sourcePath: chunk.metadata?.sourcePath ?? "",
    sourceUrl: chunk.metadata?.sourceUrl ?? "",
    title: chunk.metadata?.title ?? "",
    chunkIndex: chunk.chunkIndex ?? 0,
    startOffset: chunk.startOffset ?? 0,
    endOffset: chunk.endOffset ?? 0,
    lineStart: chunk.lineStart ?? 1,
    lineEnd: chunk.lineEnd ?? 1,
  };
}

export function buildMetadata(options: {
  sourceType?: string;
  sourcePath?: string;
  sourceUrl?: string;
  title?: string;
  chunkIndex?: number;
  startOffset?: number;
  endOffset?: number;
  lineStart?: number;
  lineEnd?: number;
  tokenEstimate?: number;
  tags?: string[];
}): ChunkMetadata {
  return {
    sourceType: options.sourceType ?? "unknown",
    sourcePath: options.sourcePath ?? "",
    sourceUrl: options.sourceUrl ?? "",
    title: options.title ?? "",
    chunkIndex: options.chunkIndex ?? 0,
    startOffset: options.startOffset ?? 0,
    endOffset: options.endOffset ?? 0,
    lineStart: options.lineStart ?? 1,
    lineEnd: options.lineEnd ?? 1,
    tokenEstimate: options.tokenEstimate ?? 0,
    tags: options.tags ?? [],
  };
}

export function hashContent(text: string): string {
  return createHash("sha256").update(text, "utf-8").digest("hex");
}
