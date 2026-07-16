# Changelog

All notable changes to VectorLane will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-07-15

### Added

#### Core

- Vector store with JSONL backend
- Collection management (create, list, show, delete, stats)
- Citation tracking for search results
- Local storage at `~/.vectorlane/`
- Configuration management via CLI and config file

#### Embeddings

- `local-hash` embedding model (256 dimensions, offline)
- Embedding cache for repeated content

#### Ingestion

- Text ingestion via CLI and API
- URL ingestion with content extraction
- File ingestion with format detection
- Configurable chunking (fixed-size, sentence, paragraph, recursive)
- Chunk size and overlap configuration

#### Search

- Semantic search using cosine similarity
- Configurable similarity threshold
- Collection-based filtering
- Result limiting
- Multiple output formats (table, json, text)

#### CLI

- `vectorlane init` — Initialize project
- `vectorlane serve` — Start API server
- `vectorlane search` — Search vector store
- `vectorlane ingest` — Ingest files
- `vectorlane ingest-text` — Ingest text
- `vectorlane ingest-url` — Ingest URLs
- `vectorlane collection` — Collection management
- `vectorlane config` — Configuration management
- `vectorlane doctor` — Diagnostics
- `vectorlane demo` — Interactive demo
- `vectorlane import-memorylane` — Import from MemoryLane
- `vectorlane import-contextlane` — Import from ContextLane
- `vectorlane sync memorylane` — Sync with MemoryLane
- `vectorlane sync contextlane` — Sync with ContextLane
- `vectorlane clear` — Clear data

#### API

- REST API on port 3090 (configurable)
- Health check endpoints (`/health`, `/v1/vectorlane/health`)
- Diagnostics endpoint (`/v1/vectorlane/doctor`)
- Collection CRUD operations
- Ingestion endpoints (text, URL, file)
- Search endpoint
- Import/sync endpoints
- Demo endpoint

#### MCP

- MCP server mode (`vectorlane mcp`)
- 12 MCP tools for AI assistant integration
- Stdio and HTTP transport support

#### SDK

- JavaScript/TypeScript SDK (`@talocode/vectorlane`)
- Python SDK (`talocode-vectorlane`)
- Full API coverage for CLI and API operations
- TypeScript type definitions
- Error handling classes
- Context manager support (Python)

#### Documentation

- README with quick start and overview
- Installation guide
- CLI reference
- SDK reference
- API reference
- MCP integration guide
- Vector store documentation
- Chunking documentation
- Embeddings documentation
- Search documentation
- Citations documentation
- Integrations documentation
- Python SDK documentation
- Security documentation
- Troubleshooting guide
- Roadmap

### Changed

- Initial release, no previous versions

### Deprecated

- None

### Removed

- None

### Fixed

- None

### Security

- Local-only design (no external API calls by default)
- Input validation for all API endpoints
- Path traversal protection
- No sensitive data in logs
