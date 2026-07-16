import { createHash } from "node:crypto";
import type { Citation, ChunkMetadata, ChunkRecord } from "./types.js";
import { buildCitation, buildMetadata, hashContent } from "./metadata.js";

export interface ChunkOptions {
  chunkSize?: number;
  overlap?: number;
  strategy?: "paragraph" | "fixed" | "markdown";
  maxChunks?: number;
  sourceType?: string;
  sourcePath?: string;
  sourceUrl?: string;
  title?: string;
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function splitByParagraphs(text: string): string[] {
  const blocks = text.split(/\n\s*\n/);
  return blocks.map((b) => b.trim()).filter((b) => b.length > 0);
}

function splitByMarkdownHeaders(text: string): string[] {
  const blocks = text.split(/(?=^#{1,6}\s)/m);
  return blocks.map((b) => b.trim()).filter((b) => b.length > 0);
}

function splitIntoSentences(text: string): string[] {
  const sentences = text.split(/(?<=[.!?])\s+/);
  return sentences.filter((s) => s.trim().length > 0);
}

function mergeLines(
  fullText: string,
  startOffset: number,
  endOffset: number
): { lineStart: number; lineEnd: number } {
  const prefix = fullText.slice(0, startOffset);
  const segment = fullText.slice(startOffset, endOffset);
  const lineStart = (prefix.match(/\n/g)?.length ?? 0) + 1;
  const lineEnd = lineStart + (segment.match(/\n/g)?.length ?? 0);
  return { lineStart, lineEnd };
}

function buildChunkTexts(
  blocks: string[],
  fullText: string
): Array<{ text: string; startOffset: number; endOffset: number }> {
  const result: Array<{ text: string; startOffset: number; endOffset: number }> = [];
  let searchFrom = 0;
  for (const block of blocks) {
    const idx = fullText.indexOf(block, searchFrom);
    if (idx === -1) continue;
    result.push({ text: block, startOffset: idx, endOffset: idx + block.length });
    searchFrom = idx + block.length;
  }
  return result;
}

function chunkBlock(block: string, options: { chunkSize: number; overlap: number }): string[] {
  if (block.length <= options.chunkSize) return [block];
  const chunks: string[] = [];
  const sentences = splitIntoSentences(block);
  let current = "";
  for (const sentence of sentences) {
    if (current.length + sentence.length + 1 > options.chunkSize && current.length > 0) {
      chunks.push(current.trim());
      const overlapText = current.slice(-options.overlap);
      current = overlapText + " " + sentence;
    } else {
      current = current ? current + " " + sentence : sentence;
    }
  }
  if (current.trim().length > 0) chunks.push(current.trim());
  return chunks;
}

export function chunkText(text: string, options: ChunkOptions = {}): ChunkRecord[] {
  const chunkSize = options.chunkSize ?? 1000;
  const overlap = options.overlap ?? 150;
  const strategy = options.strategy ?? "paragraph";
  const maxChunks = options.maxChunks ?? Infinity;

  let blocks: string[];
  if (strategy === "markdown") {
    blocks = splitByMarkdownHeaders(text);
  } else {
    blocks = splitByParagraphs(text);
  }
  if (blocks.length === 0 && text.trim().length > 0) {
    blocks = [text.trim()];
  }

  const chunkTexts: Array<{ text: string; startOffset: number; endOffset: number }> = [];
  for (const block of blocks) {
    const subChunks = chunkBlock(block, { chunkSize, overlap });
    const located = buildChunkTexts(subChunks, text);
    for (const loc of located) chunkTexts.push(loc);
    if (chunkTexts.length >= maxChunks) break;
  }
  if (chunkTexts.length > maxChunks) chunkTexts.length = maxChunks;

  const contentHash = hashContent(text);
  const documentId = contentHash.slice(0, 16);

  return chunkTexts.map((ct, index) => {
    const { lineStart, lineEnd } = mergeLines(text, ct.startOffset, ct.endOffset);
    const citation: Citation = buildCitation({
      metadata: {
        sourceType: options.sourceType ?? "unknown",
        sourcePath: options.sourcePath ?? "",
        sourceUrl: options.sourceUrl ?? "",
        title: options.title ?? "",
      },
      chunkIndex: index,
      startOffset: ct.startOffset,
      endOffset: ct.endOffset,
      lineStart,
      lineEnd,
    });
    const metadata: ChunkMetadata = buildMetadata({
      sourceType: options.sourceType ?? "unknown",
      sourcePath: options.sourcePath ?? "",
      sourceUrl: options.sourceUrl ?? "",
      title: options.title ?? "",
      chunkIndex: index,
      startOffset: ct.startOffset,
      endOffset: ct.endOffset,
      lineStart,
      lineEnd,
      tokenEstimate: estimateTokens(ct.text),
      tags: [],
    });

    return {
      id: "",
      collectionId: "",
      documentId,
      chunkIndex: index,
      text: ct.text,
      startOffset: ct.startOffset,
      endOffset: ct.endOffset,
      lineStart,
      lineEnd,
      tokenEstimate: estimateTokens(ct.text),
      metadata,
      citation,
      createdAt: new Date().toISOString(),
    };
  });
}
