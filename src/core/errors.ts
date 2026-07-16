export class VectorLaneError extends Error {
  public readonly code: string;
  public readonly details: Record<string, unknown>;

  constructor(code: string, message: string, details: Record<string, unknown> = {}) {
    super(message);
    this.name = "VectorLaneError";
    this.code = code;
    this.details = details;
  }
}

export class CollectionNotFoundError extends VectorLaneError {
  constructor(nameOrId: string) {
    super("COLLECTION_NOT_FOUND", `Collection not found: ${nameOrId}`, { nameOrId });
    this.name = "CollectionNotFoundError";
  }
}

export class DocumentNotFoundError extends VectorLaneError {
  constructor(documentId: string) {
    super("DOCUMENT_NOT_FOUND", `Document not found: ${documentId}`, { documentId });
    this.name = "DocumentNotFoundError";
  }
}

export class ChunkNotFoundError extends VectorLaneError {
  constructor(chunkId: string) {
    super("CHUNK_NOT_FOUND", `Chunk not found: ${chunkId}`, { chunkId });
    this.name = "ChunkNotFoundError";
  }
}

export class EmbeddingError extends VectorLaneError {
  constructor(message: string, details: Record<string, unknown> = {}) {
    super("EMBEDDING_ERROR", message, details);
    this.name = "EmbeddingError";
  }
}

export class SearchError extends VectorLaneError {
  constructor(message: string, details: Record<string, unknown> = {}) {
    super("SEARCH_ERROR", message, details);
    this.name = "SearchError";
  }
}

export class IngestError extends VectorLaneError {
  constructor(message: string, details: Record<string, unknown> = {}) {
    super("INGEST_ERROR", message, details);
    this.name = "IngestError";
  }
}

export class ConfigError extends VectorLaneError {
  constructor(message: string, details: Record<string, unknown> = {}) {
    super("CONFIG_ERROR", message, details);
    this.name = "ConfigError";
  }
}

export class AuthError extends VectorLaneError {
  constructor(message: string = "Authentication required") {
    super("AUTH_ERROR", message);
    this.name = "AuthError";
  }
}

export class IntegrationError extends VectorLaneError {
  constructor(integration: string, message: string, details: Record<string, unknown> = {}) {
    super("INTEGRATION_ERROR", `${integration}: ${message}`, { integration, ...details });
    this.name = "IntegrationError";
  }
}
