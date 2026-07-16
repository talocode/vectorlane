# REST API Reference

VectorLane exposes a REST API on port 3090 (configurable). All endpoints are under the `/v1/vectorlane/` prefix except for the health check.

## Base URL

```
http://localhost:3090
```

## Authentication

v0.1.0 has no authentication. The API is designed for local use only. Do not expose it to the public internet.

## Health Check

### GET /health

Basic health check endpoint.

```
GET /health
```

**Response:**

```json
{
  "status": "ok",
  "version": "0.1.0",
  "uptime": 3600
}
```

### GET /v1/vectorlane/health

Detailed health check with VectorLane-specific information.

```
GET /v1/vectorlane/health
```

**Response:**

```json
{
  "status": "ok",
  "version": "0.1.0",
  "backend": "jsonl",
  "embedding": "local-hash",
  "collections": 3,
  "total_vectors": 150,
  "storage_path": "~/.vectorlane/data",
  "uptime": 3600
}
```

## Diagnostics

### GET /v1/vectorlane/doctor

Run diagnostics and return a health report.

```
GET /v1/vectorlane/doctor
```

**Response:**

```json
{
  "status": "ok",
  "checks": [
    { "name": "node_version", "status": "ok", "message": "Node.js 20.10.0" },
    { "name": "config", "status": "ok", "message": "Configuration valid" },
    { "name": "storage", "status": "ok", "message": "Storage directory accessible" },
    { "name": "backend", "status": "ok", "message": "JSONL backend operational" },
    { "name": "embedding", "status": "ok", "message": "local-hash model loaded" }
  ]
}
```

## Initialization

### POST /v1/vectorlane/init

Initialize VectorLane. Creates default configuration and storage.

```
POST /v1/vectorlane/init
```

**Request Body:**

```json
{
  "backend": "jsonl",
  "embedding": "local-hash",
  "collection": "default"
}
```

**Response:**

```json
{
  "status": "initialized",
  "backend": "jsonl",
  "embedding": "local-hash",
  "storage_path": "~/.vectorlane/data"
}
```

## Collections

### POST /v1/vectorlane/collections

Create a new collection.

```
POST /v1/vectorlane/collections
```

**Request Body:**

```json
{
  "name": "documents",
  "description": "Project documentation"
}
```

**Response:**

```json
{
  "status": "created",
  "name": "documents",
  "description": "Project documentation",
  "created": "2026-07-15T10:00:00Z"
}
```

**Error Responses:**

- `400 Bad Request` — Invalid collection name
- `409 Conflict` — Collection already exists

### GET /v1/vectorlane/collections

List all collections.

```
GET /v1/vectorlane/collections
```

**Response:**

```json
{
  "collections": [
    {
      "name": "default",
      "documents": 12,
      "vectors": 48,
      "size": "1.2 MB",
      "created": "2026-07-15T10:00:00Z",
      "updated": "2026-07-15T14:30:00Z"
    },
    {
      "name": "documents",
      "documents": 5,
      "vectors": 20,
      "size": "0.8 MB",
      "created": "2026-07-15T11:00:00Z",
      "updated": "2026-07-15T14:00:00Z"
    }
  ]
}
```

### GET /v1/vectorlane/collections/:name

Get detailed information about a collection.

```
GET /v1/vectorlane/collections/documents
```

**Response:**

```json
{
  "name": "documents",
  "description": "Project documentation",
  "documents": 5,
  "vectors": 20,
  "dimensions": 256,
  "size": "0.8 MB",
  "created": "2026-07-15T11:00:00Z",
  "updated": "2026-07-15T14:00:00Z"
}
```

**Error Responses:**

- `404 Not Found` — Collection does not exist

### DELETE /v1/vectorlane/collections/:name

Delete a collection and all its data.

```
DELETE /v1/vectorlane/collections/documents
```

**Response:**

```json
{
  "status": "deleted",
  "name": "documents"
}
```

**Error Responses:**

- `404 Not Found` — Collection does not exist

### GET /v1/vectorlane/collections/:name/stats

Get statistics for a collection.

```
GET /v1/vectorlane/collections/documents/stats
```

**Response:**

```json
{
  "name": "documents",
  "documents": 5,
  "vectors": 20,
  "dimensions": 256,
  "size": "0.8 MB",
  "created": "2026-07-15T11:00:00Z",
  "updated": "2026-07-15T14:00:00Z",
  "avg_chunks_per_doc": 4.0,
  "embedding_model": "local-hash"
}
```

## Ingestion

### POST /v1/vectorlane/ingest

Ingest a file from disk.

```
POST /v1/vectorlane/ingest
```

**Request Body:**

```json
{
  "path": "/path/to/document.txt",
  "collection": "default",
  "source": "document.txt",
  "chunk_size": 512,
  "chunk_overlap": 50
}
```

**Response:**

```json
{
  "status": "ingested",
  "id": "doc_abc123",
  "filename": "document.txt",
  "collection": "default",
  "chunks": 4,
  "vectors": 4,
  "size": 1024
}
```

**Error Responses:**

- `400 Bad Request` — Invalid path or parameters
- `404 Not Found` — File not found
- `500 Internal Server Error` — Ingestion failed

### POST /v1/vectorlane/ingest-text

Ingest raw text content.

```
POST /v1/vectorlane/ingest-text
```

**Request Body:**

```json
{
  "text": "The quick brown fox jumps over the lazy dog. This is a sample text for demonstration.",
  "collection": "default",
  "source": "manual-input",
  "chunk_size": 512,
  "chunk_overlap": 50
}
```

**Response:**

```json
{
  "status": "ingested",
  "id": "txt_xyz789",
  "collection": "default",
  "chunks": 1,
  "vectors": 1,
  "length": 91
}
```

### POST /v1/vectorlane/ingest-url

Fetch and ingest content from a URL.

```
POST /v1/vectorlane/ingest-url
```

**Request Body:**

```json
{
  "url": "https://example.com/article",
  "collection": "default",
  "selector": "main.content",
  "depth": 0,
  "timeout": 30000
}
```

**Response:**

```json
{
  "status": "ingested",
  "id": "url_def456",
  "url": "https://example.com/article",
  "title": "Article Title",
  "collection": "default",
  "chunks": 8,
  "vectors": 8,
  "size": 4096
}
```

**Error Responses:**

- `400 Bad Request` — Invalid URL
- `408 Request Timeout` — Fetch timed out
- `502 Bad Gateway` — Failed to fetch URL content

## Search

### POST /v1/vectorlane/search

Search the vector store for similar content.

```
POST /v1/vectorlane/search
```

**Request Body:**

```json
{
  "query": "machine learning algorithms",
  "collection": "default",
  "limit": 5,
  "threshold": 0.5
}
```

**Response:**

```json
{
  "query": "machine learning algorithms",
  "results": [
    {
      "id": "vec_001",
      "text": "Machine learning is a subset of artificial intelligence...",
      "score": 0.92,
      "collection": "default",
      "citation": {
        "source": "ml-intro.txt",
        "page": 1,
        "offset": 0,
        "timestamp": "2026-07-15T10:00:00Z"
      },
      "metadata": {
        "chunk_index": 0,
        "total_chunks": 5
      }
    },
    {
      "id": "vec_002",
      "text": "Supervised learning uses labeled training data...",
      "score": 0.87,
      "collection": "default",
      "citation": {
        "source": "ml-intro.txt",
        "page": 1,
        "offset": 512,
        "timestamp": "2026-07-15T10:00:00Z"
      },
      "metadata": {
        "chunk_index": 1,
        "total_chunks": 5
      }
    }
  ],
  "total": 2,
  "time_ms": 12
}
```

## Import

### POST /v1/vectorlane/import-memorylane

Import conversation history from MemoryLane.

```
POST /v1/vectorlane/import-memorylane
```

**Request Body:**

```json
{
  "collection": "default",
  "path": "~/.memorylane/data",
  "limit": 100
}
```

**Response:**

```json
{
  "status": "imported",
  "collection": "default",
  "conversations": 45,
  "vectors": 180,
  "skipped": 55
}
```

### POST /v1/vectorlane/import-contextlane

Import context documents from ContextLane.

```
POST /v1/vectorlane/import-contextlane
```

**Request Body:**

```json
{
  "collection": "default",
  "path": "~/.contextlane/data",
  "limit": 50
}
```

**Response:**

```json
{
  "status": "imported",
  "collection": "default",
  "documents": 30,
  "vectors": 120,
  "skipped": 20
}
```

### POST /v1/vectorlane/sync-memorylane

Incremental sync with MemoryLane.

```
POST /v1/vectorlane/sync-memorylane
```

**Request Body:**

```json
{
  "collection": "default",
  "path": "~/.memorylane/data",
  "dry_run": false
}
```

**Response:**

```json
{
  "status": "synced",
  "collection": "default",
  "new": 12,
  "updated": 3,
  "removed": 0
}
```

### POST /v1/vectorlane/sync-contextlane

Incremental sync with ContextLane.

```
POST /v1/vectorlane/sync-contextlane
```

**Request Body:**

```json
{
  "collection": "default",
  "path": "~/.contextlane/data",
  "dry_run": false
}
```

**Response:**

```json
{
  "status": "synced",
  "collection": "default",
  "new": 8,
  "updated": 2,
  "removed": 1
}
```

## Demo

### POST /v1/vectorlane/demo

Run the interactive demo.

```
POST /v1/vectorlane/demo
```

**Request Body:**

```json
{
  "collection": "demo"
}
```

**Response:**

```json
{
  "status": "completed",
  "collection": "demo",
  "steps": [
    { "name": "init", "status": "ok", "message": "Initialized" },
    { "name": "create_collection", "status": "ok", "message": "Created 'demo'" },
    { "name": "ingest", "status": "ok", "message": "Ingested 5 documents" },
    { "name": "search", "status": "ok", "message": "Found 3 results" },
    { "name": "stats", "status": "ok", "message": "5 vectors indexed" }
  ]
}
```

## Error Format

All errors follow a consistent format:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Collection 'nonexistent' not found",
    "details": {
      "collection": "nonexistent"
    }
  }
}
```

## Rate Limiting

v0.1.0 has no rate limiting. The API is designed for local use. If you need rate limiting for a production deployment, use a reverse proxy.

## CORS

CORS is disabled by default. Enable it with:

```bash
vectorlane serve --cors
```

Or in configuration:

```json
{
  "cors": true,
  "cors_origins": ["*"]
}
```
