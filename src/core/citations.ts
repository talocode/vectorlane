import type { Citation } from "./types.js";

export function formatCitation(citation: Citation): string {
  const parts: string[] = [];
  if (citation.sourcePath) {
    parts.push(citation.sourcePath);
  } else if (citation.title) {
    parts.push(citation.title);
  }
  if (citation.lineStart > 0 && citation.lineEnd > 0) {
    if (citation.lineStart === citation.lineEnd) {
      parts.push(`L${citation.lineStart}`);
    } else {
      parts.push(`L${citation.lineStart}-L${citation.lineEnd}`);
    }
  }
  return parts.join("#") || "unknown";
}

export function formatCitationShort(citation: Citation): string {
  if (citation.sourcePath) {
    const filename = citation.sourcePath.split("/").pop() ?? citation.sourcePath;
    if (citation.lineStart > 0 && citation.lineEnd > 0) {
      if (citation.lineStart === citation.lineEnd) {
        return `${filename}:${citation.lineStart}`;
      }
      return `${filename}:${citation.lineStart}-${citation.lineEnd}`;
    }
    return filename;
  }
  if (citation.title) {
    return citation.title;
  }
  return "unknown";
}

export function parseCitationLine(text: string): { lineStart: number; lineEnd: number } | null {
  const match = text.match(/L(\d+)(?:-L(\d+))?/);
  if (!match) {
    return null;
  }
  const lineStart = parseInt(match[1], 10);
  const lineEnd = match[2] ? parseInt(match[2], 10) : lineStart;
  return { lineStart, lineEnd };
}
