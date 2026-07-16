# VectorLane

**Searchable local memory for AI agents.**

[![npm version](https://img.shields.io/npm/v/@talocode/vectorlane)](https://www.npmjs.com/package/@talocode/vectorlane)
[![PyPI version](https://img.shields.io/pypi/v/talocode-vectorlane)](https://pypi.org/project/talocode-vectorlane/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

VectorLane is a local vector memory store designed for AI agents. It provides fast, offline-capable semantic search over text, documents, and data using embeddings. No cloud APIs required — everything runs on your machine.

## Features

- **Fully local** — No external API calls, no data leaves your machine
- **Offline embeddings** — Uses `local-hash` (256-dim) by default, with OpenAI/HuggingFace options
- **Multiple backends** — JSONL (default), SQLite, in-memory
- **MCP integration** — Native Model Context Protocol support for AI assistants
- **REST API** — Full HTTP API on port 3090 (configurable)
- **CLI** — Complete command-line interface for all operations
- **SDK** — JavaScript/TypeScript and Python client libraries
- **Citation tracking** — Automatic source attribution for search results
- **Multi-source ingestion** — Text, URLs, files, and bulk imports

## Quick Start

### Install

```bash
# npm
npm install -g @talocode/vectorlane

# pip
pip install talocode-vectorlane
```

### Initialize and Use

```bash
# Start the server
vectorlane serve

# Initialize a project
vectorlane init

# Ingest some text
vectorlane ingest-text "The quick brown fox jumps over the lazy dog."

# Search
vectorlane search "fox"
```

### Or use the SDK

```javascript
import { VectorLane } from '@talocode/vectorlane';

const vl = new VectorLane();
await vl.init();
await vl.ingestText('The quick brown fox jumps over the lazy dog.');
const results = await vl.search('fox');
console.log(results);
```

```python
from vectorlane import VectorLane

vl = VectorLane()
vl.init()
vl.ingest_text("The quick brown fox jumps over the lazy dog.")
results = vl.search("fox")
print(results)
```

## Architecture

```
+-----------+     +-----------+     +-----------+
|  CLI /    |---->|  REST API |---->|  Vector   |
|  SDK      |     |  :3090    |     |  Store    |
+-----------+     +-----------+     +-----------+
                         |                |
                  +------+------+  +------+------+
                  |  Embedding  |  |  Backend    |
                  |  Engine     |  |  (JSONL/   |
                  |  (local/    |  |   SQLite)  |
                  |   openai)   |  +-------------+
                  +-------------+
```

## Installation

See [docs/INSTALL.md](docs/INSTALL.md) for detailed installation instructions.

### Requirements

- Node.js 18+ (for npm package)
- Python 3.9+ (for pip package)
- No external dependencies required for basic usage

### Quick Install

```bash
# npm
npm install -g @talocode/vectorlane

# pip (Python SDK)
pip install talocode-vectorlane
```

## CLI Reference

See [docs/CLI.md](docs/CLI.md) for the full CLI reference.

### Core Commands

| Command | Description |
|---------|-------------|
| `vectorlane init` | Initialize a new VectorLane project |
| `vectorlane serve` | Start the API server |
| `vectorlane search <query>` | Search the vector store |
| `vectorlane ingest <file>` | Ingest a file into the store |
| `vectorlane ingest-text <text>` | Ingest raw text |
| `vectorlane ingest-url <url>` | Ingest content from a URL |
| `vectorlane doctor` | Run diagnostics |
| `vectorlane demo` | Run a demo session |

### Collection Commands

| Command | Description |
|---------|-------------|
| `vectorlane collection create <name>` | Create a new collection |
| `vectorlane collection list` | List all collections |
| `vectorlane collection show <name>` | Show collection details |
| `vectorlane collection stats <name>` | Show collection statistics |
| `vectorlane collection delete <name>` | Delete a collection |

### Configuration Commands

| Command | Description |
|---------|-------------|
| `vectorlane config get <key>` | Get a config value |
| `vectorlane config set <key> <value>` | Set a config value |
| `vectorlane config list` | List all config values |

### Import Commands

| Command | Description |
|---------|-------------|
| `vectorlane import-memorylane` | Import from MemoryLane |
| `vectorlane import-contextlane` | Import from ContextLane |
| `vectorlane sync memorylane` | Sync with MemoryLane |
| `vectorlane sync contextlane` | Sync with ContextLane |

## SDK Reference

See [docs/SDK.md](docs/SDK.md) for the full SDK reference.

### JavaScript/TypeScript

```javascript
import { VectorLane } from '@talocode/vectorlane';

const vl = new VectorLane({ port: 3090 });

// Initialize
await vl.init();

// Create a collection
await vl.collection.create('docs');

// Ingest text
await vl.ingestText('Your text content here', { collection: 'docs' });

// Ingest a URL
await vl.ingestUrl('https://example.com/article', { collection: 'docs' });

// Search
const results = await vl.search('your query', { collection: 'docs', limit: 5 });

// Get stats
const stats = await vl.collection.stats('docs');
```

### Python

```python
from vectorlane import VectorLane

vl = VectorLane(port=3090)

# Initialize
vl.init()

# Create a collection
vl.collection.create("docs")

# Ingest text
vl.ingest_text("Your text content here", collection="docs")

# Ingest a URL
vl.ingest_url("https://example.com/article", collection="docs")

# Search
results = vl.search("your query", collection="docs", limit=5)

# Get stats
stats = vl.collection.stats("docs")
```

## REST API

See [docs/API.md](docs/API.md) for the full API reference.

### Quick Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/v1/vectorlane/init` | Initialize project |
| `POST` | `/v1/vectorlane/collections` | Create collection |
| `GET` | `/v1/vectorlane/collections` | List collections |
| `GET` | `/v1/vectorlane/collections/:name` | Get collection |
| `DELETE` | `/v1/vectorlane/collections/:name` | Delete collection |
| `GET` | `/v1/vectorlane/collections/:name/stats` | Collection stats |
| `POST` | `/v1/vectorlane/ingest` | Ingest file |
| `POST` | `/v1/vectorlane/ingest-text` | Ingest text |
| `POST` | `/v1/vectorlane/ingest-url` | Ingest URL |
| `POST` | `/v1/vectorlane/search` | Search vectors |
| `POST` | `/v1/vectorlane/import-memorylane` | Import MemoryLane |
| `POST` | `/v1/vectorlane/import-contextlane` | Import ContextLane |
| `POST` | `/v1/vectorlane/sync-memorylane` | Sync MemoryLane |
| `POST` | `/v1/vectorlane/sync-contextlane` | Sync ContextLane |
| `POST` | `/v1/vectorlane/demo` | Run demo |

## MCP Integration

See [docs/MCP.md](docs/MCP.md) for MCP configuration.

VectorLane provides native MCP (Model Context Protocol) support. Add to your MCP config:

```json
{
  "mcpServers": {
    "vectorlane": {
      "command": "vectorlane",
      "args": ["mcp"]
    }
  }
}
```

### Available MCP Tools

| Tool | Description |
|------|-------------|
| `vectorlane_init` | Initialize VectorLane |
| `vectorlane_collection_create` | Create a collection |
| `vectorlane_collection_list` | List collections |
| `vectorlane_collection_stats` | Get collection stats |
| `vectorlane_ingest` | Ingest a file |
| `vectorlane_ingest_text` | Ingest text content |
| `vectorlane_search` | Search the vector store |
| `vectorlane_import_memorylane` | Import from MemoryLane |
| `vectorlane_import_contextlane` | Import from ContextLane |
| `vectorlane_doctor` | Run diagnostics |
| `vectorlane_demo` | Run a demo |
| `vectorlane_clear_collection` | Clear a collection |

## Vector Store

See [docs/VECTOR_STORE.md](docs/VECTOR_STORE.md) for backend details.

| Backend | Description | Use Case |
|---------|-------------|----------|
| `jsonl` | JSON Lines file storage (default) | Small to medium datasets |
| `sqlite` | SQLite database | Larger datasets, concurrent access |
| `memory` | In-memory only | Testing, ephemeral data |

## Embeddings

See [docs/EMBEDDINGS.md](docs/EMBEDDINGS.md) for embedding options.

| Model | Dimensions | Description |
|-------|------------|-------------|
| `local-hash` | 256 | Default, fully offline, fast |
| `openai` | 1536 | Requires API key, highest quality |
| `huggingface` | 384 | Local, requires model download |

## Search

See [docs/SEARCH.md](docs/SEARCH.md) for search capabilities.

```bash
vectorlane search "machine learning"
vectorlane search "API docs" --collection docs --limit 10
vectorlane search "error handling" --threshold 0.7
```

## Chunking

See [docs/CHUNKING.md](docs/CHUNKING.md) for chunking strategies.

- **Fixed-size** — Default, 512 tokens per chunk with 50 token overlap
- **Sentence** — Splits on sentence boundaries
- **Paragraph** — Splits on paragraph boundaries
- **Recursive** — Hierarchical splitting with fallbacks

## Citations

See [docs/CITATIONS.md](docs/CITATIONS.md) for citation tracking.

Every search result includes source attribution:

```json
{
  "id": "abc123",
  "text": "The quick brown fox...",
  "score": 0.95,
  "citation": {
    "source": "document.txt",
    "page": 1,
    "offset": 0,
    "timestamp": "2026-07-15T10:30:00Z"
  }
}
```

## Integrations

See [docs/INTEGRATIONS.md](docs/INTEGRATIONS.md) for integration guides.

- **MemoryLane** — Import and sync conversation history
- **ContextLane** — Import and sync context documents
- **MCP-compatible tools** — Works with Claude, Cursor, and other MCP clients
- **LangChain** — VectorLane retriever integration
- **LlamaIndex** — VectorLane vector store integration

## Configuration

Configuration is stored in `~/.vectorlane/config.json`:

```json
{
  "port": 3090,
  "backend": "jsonl",
  "embedding": "local-hash",
  "storage_path": "~/.vectorlane/data",
  "default_collection": "default",
  "chunk_size": 512,
  "chunk_overlap": 50
}
```

```bash
vectorlane config get port
vectorlane config set port 3091
vectorlane config list
```

## Storage

All data is stored locally in `~/.vectorlane/`:

```
~/.vectorlane/
  config.json          # Configuration
  data/                # Vector store data
    collections/       # Collection data
    embeddings/        # Cached embeddings
  logs/                # Application logs
```

## Troubleshooting

See [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) for common issues.

### Quick Fixes

**Server won't start**
```bash
vectorlane doctor
```

**Port in use**
```bash
vectorlane config set port 3091
vectorlane serve
```

**Reset everything**
```bash
vectorlane clear
vectorlane init
```

## Roadmap

See [docs/ROADMAP.md](docs/ROADMAP.md) for the development roadmap.

### v0.1.0 (Current)

- Core vector store with JSONL backend
- local-hash embedding model
- CLI with all core commands
- REST API
- MCP integration
- Python and JavaScript SDKs

### v0.2.0

- SQLite backend
- OpenAI embedding support
- HuggingFace embedding support
- LangChain integration

### v0.3.0

- Hybrid search (keyword + semantic)
- Multi-modal embeddings (images)
- Distributed mode
- Web UI dashboard

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Support

- Documentation: [docs/](docs/)
- Issues: [GitHub Issues](https://github.com/talocode/vectorlane/issues)
- Discord: [Join our Discord](https://discord.gg/vectorlane)
