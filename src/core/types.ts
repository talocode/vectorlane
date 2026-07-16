export interface Citation {
  sourceType: string;
  sourcePath: string;
  sourceUrl: string;
  title: string;
  chunkIndex: number;
  startOffset: number;
  endOffset: number;
  lineStart: number;
  lineEnd: number;
}

export interface ChunkMetadata {
  sourceType: string;
  sourcePath: string;
  sourceUrl: string;
  title: string;
  chunkIndex: number;
  startOffset: number;
  endOffset: number;
  lineStart: number;
  lineEnd: number;
  tokenEstimate: number;
  tags: string[];
}

export interface ChunkRecord {
  id: string;
  collectionId: string;
  documentId: string;
  chunkIndex: number;
  text: string;
  startOffset: number;
  endOffset: number;
  lineStart: number;
  lineEnd: number;
  tokenEstimate: number;
  metadata: ChunkMetadata;
  citation: Citation;
  createdAt: string;
}

export interface DocumentRecord {
  id: string;
  collectionId: string;
  sourceType: string;
  sourcePath: string;
  sourceUrl: string;
  title: string;
  contentHash: string;
  chunkCount: number;
  createdAt: string;
}

export interface Collection {
  id: string;
  name: string;
  description: string;
  embeddingProvider: string;
  embeddingModel: string;
  vectorDimensions: number;
  chunkCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SearchResult {
  chunkId: string;
  chunk: ChunkRecord;
  document: DocumentRecord | null;
  score: number;
  citation: Citation;
}

export interface SearchFilter {
  sourceType?: string;
  tag?: string;
  documentId?: string;
}

export interface EmbeddingRecord {
  chunkId: string;
  collectionId: string;
  vector: number[];
  createdAt: string;
}

export interface VectorLaneConfig {
  defaultCollection: string;
  defaultProvider: string;
  defaultModel: string;
  storeDir: string;
  apiPort: number;
  requireAuth: boolean;
  authToken: string;
}
