# Release Notes

## v0.1.0 — First Release

**Release Date:** July 15, 2026

### Overview

VectorLane v0.1.0 is the first official release of VectorLane — a local vector memory store for AI agents. This release provides a complete foundation for building AI agents with searchable local memory.

### Highlights

- **Fully local** — All data stays on your machine, no cloud APIs required
- **Offline embeddings** — Works without internet using local-hash model
- **Complete toolkit** — CLI, REST API, MCP integration, and SDKs
- **Multiple ingestion sources** — Text, URLs, files, and MemoryLane/ContextLane imports
- **Citation tracking** — Automatic source attribution for search results

### What's Included

#### Core System

- Vector store with JSONL backend for persistent storage
- Collection management for organizing data
- Configuration system with sensible defaults
- Diagnostics tool for troubleshooting

#### Embedding Engine

- `local-hash` model (256 dimensions) — Fast, offline, no dependencies
- Embedding cache to avoid redundant computation
- Extensible architecture for future models

#### Data Ingestion

- Ingest text directly from command line or API
- Ingest URLs with automatic content extraction
- Ingest files with format detection (text, markdown, JSON)
- Configurable chunking strategies (fixed, sentence, paragraph, recursive)

#### Search

- Semantic search using cosine similarity
- Configurable thresholds and result limits
- Collection-based filtering
- Multiple output formats

#### Interfaces

- **CLI** — 17 commands for complete management
- **REST API** — 16 endpoints for programmatic access
- **MCP** — 12 tools for AI assistant integration
- **JavaScript SDK** — Full-featured TypeScript client
- **Python SDK** — Pythonic interface with type hints

#### Integrations

- MemoryLane — Import and sync conversation history
- ContextLane — Import and sync context documents
- MCP-compatible tools — Claude, Cursor, and more

### Getting Started

```bash
# Install
npm install -g @talocode/vectorlane

# Initialize
vectorlane init

# Start server
vectorlane serve

# Ingest text
vectorlane ingest-text "Hello, VectorLane!"

# Search
vectorlane search "hello"
```

### System Requirements

- Node.js 18+ (for npm package)
- Python 3.9+ (for pip package)
- 512MB RAM minimum
- 100MB disk space

### Known Limitations

- No authentication (designed for local use)
- No encryption at rest
- JSONL backend only (SQLite coming in v0.2.0)
- Limited to local-hash embeddings (OpenAI/HuggingFace coming in v0.2.0)
- No web UI (coming in v0.4.0)
- No distributed mode (coming in v0.5.0)

### Upgrade Notes

This is the first release — no upgrade path from previous versions.

### Breaking Changes

None — this is the initial release.

### Bug Fixes

None — this is the initial release.

### Contributors

- Talocode team

### Links

- **npm:** https://www.npmjs.com/package/@talocode/vectorlane
- **PyPI:** https://pypi.org/project/talocode-vectorlane/
- **GitHub:** https://github.com/talocode/vectorlane
- **Docs:** https://github.com/talocode/vectorlane/tree/main/docs

### Feedback

We welcome your feedback! Please report issues on [GitHub](https://github.com/talocode/vectorlane/issues).
