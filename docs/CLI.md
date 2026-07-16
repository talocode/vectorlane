# CLI Reference

The VectorLane CLI provides a complete command-line interface for managing your local vector store.

## Global Options

```
vectorlane [command] [options]

Options:
  --version          Show version number
  --help             Show help
  --port <port>      Override API port (default: 3090)
  --verbose          Enable verbose output
  --json             Output in JSON format
```

## Core Commands

### vectorlane init

Initialize a new VectorLane project. Creates the default configuration and storage directories.

```bash
vectorlane init [options]

Options:
  --backend <backend>    Storage backend: jsonl, sqlite, memory (default: jsonl)
  --embedding <model>    Embedding model: local-hash, openai, huggingface (default: local-hash)
  --collection <name>    Default collection name (default: default)
  --force                Overwrite existing configuration
```

**Examples:**

```bash
vectorlane init
vectorlane init --backend sqlite --embedding openai
vectorlane init --collection myproject --force
```

### vectorlane serve

Start the VectorLane API server.

```bash
vectorlane serve [options]

Options:
  --port <port>          Port to listen on (default: 3090)
  --host <host>          Host to bind to (default: 0.0.0.0)
  --cors                 Enable CORS headers
  --log-level <level>    Log level: debug, info, warn, error (default: info)
```

**Examples:**

```bash
vectorlane serve
vectorlane serve --port 8080 --cors
vectorlane serve --host 127.0.0.1 --log-level debug
```

### vectorlane search

Search the vector store for similar content.

```bash
vectorlane search <query> [options]

Arguments:
  query                  Search query text

Options:
  --collection <name>    Collection to search (default: all collections)
  --limit <n>            Maximum results (default: 5)
  --threshold <score>    Minimum similarity score 0-1 (default: 0.5)
  --format <fmt>         Output format: table, json, text (default: table)
```

**Examples:**

```bash
vectorlane search "machine learning"
vectorlane search "API docs" --collection docs --limit 10
vectorlane search "error handling" --threshold 0.7 --format json
```

### vectorlane ingest

Ingest a file into the vector store.

```bash
vectorlane ingest <file> [options]

Arguments:
  file                   Path to file to ingest

Options:
  --collection <name>    Target collection (default: default)
  --chunk-size <n>       Tokens per chunk (default: 512)
  --chunk-overlap <n>    Overlap between chunks (default: 50)
  --format <fmt>         File format: auto, text, markdown, json (default: auto)
```

**Examples:**

```bash
vectorlane ingest document.txt
vectorlane ingest notes.md --collection knowledge
vectorlane ingest data.json --chunk-size 256
```

### vectorlane ingest-text

Ingest raw text directly into the vector store.

```bash
vectorlane ingest-text <text> [options]

Arguments:
  text                   Text content to ingest

Options:
  --collection <name>    Target collection (default: default)
  --source <name>        Source identifier for citation tracking
  --chunk-size <n>       Tokens per chunk (default: 512)
```

**Examples:**

```bash
vectorlane ingest-text "The quick brown fox jumps over the lazy dog."
vectorlane ingest-text "Important note about the project" --collection notes --source "meeting-notes"
```

### vectorlane ingest-url

Ingest content from a URL into the vector store.

```bash
vectorlane ingest-url <url> [options]

Arguments:
  url                    URL to fetch and ingest

Options:
  --collection <name>    Target collection (default: default)
  --selector <css>       CSS selector for content extraction
  --depth <n>            Crawl depth for linked pages (default: 0)
  --timeout <ms>         Request timeout in milliseconds (default: 30000)
```

**Examples:**

```bash
vectorlane ingest-url "https://example.com/article"
vectorlane ingest-url "https://docs.example.com/api" --selector "main.content"
vectorlane ingest-url "https://blog.example.com" --depth 2
```

### vectorlane doctor

Run diagnostics to check your VectorLane installation and configuration.

```bash
vectorlane doctor [options]

Options:
  --fix                  Attempt to fix detected issues
  --verbose              Show detailed diagnostic information
```

**Output:**

```
VectorLane Doctor v0.1.0
========================

[OK] Node.js version: 20.10.0
[OK] VectorLane version: 0.1.0
[OK] Configuration file exists
[OK] Storage directory exists
[OK] Backend: jsonl
[OK] Embedding model: local-hash
[WARN] No collections found. Run 'vectorlane init' to create one.
[OK] API server reachable on port 3090

All checks passed. VectorLane is ready to use.
```

### vectorlane demo

Run an interactive demo session that showcases VectorLane features.

```bash
vectorlane demo [options]

Options:
  --collection <name>    Collection to use for demo (default: demo)
  --skip-init            Skip initialization if already done
```

**What the demo covers:**

1. Initializing a project
2. Creating a collection
3. Ingesting sample text
4. Searching for similar content
5. Viewing collection statistics
6. Citation tracking

## Collection Commands

### vectorlane collection create

Create a new collection.

```bash
vectorlane collection create <name> [options]

Arguments:
  name                   Collection name

Options:
  --description <text>   Collection description
  --backend <backend>    Backend override for this collection
```

**Examples:**

```bash
vectorlane collection create documents
vectorlane collection create code --description "Source code snippets"
```

### vectorlane collection list

List all collections.

```bash
vectorlane collection list [options]

Options:
  --format <fmt>         Output format: table, json (default: table)
  --verbose              Show detailed information
```

**Output:**

```
Collections:
  NAME          DOCUMENTS   VECTORS   SIZE
  default       12          48        1.2 MB
  documents     5           20        0.8 MB
  code          8           32        1.5 MB
```

### vectorlane collection show

Show detailed information about a collection.

```bash
vectorlane collection show <name> [options]

Arguments:
  name                   Collection name

Options:
  --format <fmt>         Output format: table, json (default: table)
```

### vectorlane collection stats

Show statistics for a collection.

```bash
vectorlane collection stats <name> [options]

Arguments:
  name                   Collection name

Options:
  --format <fmt>         Output format: table, json (default: table)
```

**Output:**

```
Collection: documents
  Documents:    5
  Vectors:      20
  Dimensions:   256
  Size:         0.8 MB
  Created:      2026-07-15T10:00:00Z
  Last updated: 2026-07-15T14:30:00Z
```

### vectorlane collection delete

Delete a collection and all its data.

```bash
vectorlane collection delete <name> [options]

Arguments:
  name                   Collection name

Options:
  --force                Skip confirmation prompt
```

**Examples:**

```bash
vectorlane collection delete old-data
vectorlane collection delete temp --force
```

## Configuration Commands

### vectorlane config get

Get a configuration value.

```bash
vectorlane config get <key>

Arguments:
  key                    Configuration key

Keys:
  port                   API server port (default: 3090)
  backend                Storage backend (default: jsonl)
  embedding              Embedding model (default: local-hash)
  storage_path           Data storage path
  default_collection     Default collection name
  chunk_size             Tokens per chunk (default: 512)
  chunk_overlap          Chunk overlap tokens (default: 50)
  log_level              Log level (default: info)
```

**Examples:**

```bash
vectorlane config get port
vectorlane config get backend
vectorlane config get embedding
```

### vectorlane config set

Set a configuration value.

```bash
vectorlane config set <key> <value>

Arguments:
  key                    Configuration key
  value                  Value to set
```

**Examples:**

```bash
vectorlane config set port 8080
vectorlane config set backend sqlite
vectorlane config set embedding openai
vectorlane config set chunk_size 256
```

### vectorlane config list

List all configuration values.

```bash
vectorlane config list [options]

Options:
  --format <fmt>         Output format: table, json, env (default: table)
```

**Output:**

```
Configuration:
  port              3090
  backend           jsonl
  embedding         local-hash
  storage_path      ~/.vectorlane/data
  default_collection default
  chunk_size        512
  chunk_overlap     50
  log_level         info
```

## Import Commands

### vectorlane import-memorylane

Import conversation history from MemoryLane.

```bash
vectorlane import-memorylane [options]

Options:
  --collection <name>    Target collection (default: default)
  --path <path>          Path to MemoryLane data directory
  --limit <n>            Maximum conversations to import
  --format <fmt>         Output format: table, json (default: table)
```

### vectorlane import-contextlane

Import context documents from ContextLane.

```bash
vectorlane import-contextlane [options]

Options:
  --collection <name>    Target collection (default: default)
  --path <path>          Path to ContextLane data directory
  --limit <n>            Maximum documents to import
  --format <fmt>         Output format: table, json (default: table)
```

### vectorlane sync memorylane

Sync with MemoryLane (incremental import).

```bash
vectorlane sync memorylane [options]

Options:
  --collection <name>    Target collection (default: default)
  --path <path>          Path to MemoryLane data directory
  --dry-run              Show what would be synced without making changes
```

### vectorlane sync contextlane

Sync with ContextLane (incremental import).

```bash
vectorlane sync contextlane [options]

Options:
  --collection <name>    Target collection (default: default)
  --path <path>          Path to ContextLane data directory
  --dry-run              Show what would be synced without making changes
```

## Utility Commands

### vectorlane clear

Clear all data and reset VectorLane.

```bash
vectorlane clear [options]

Options:
  --all                  Clear everything including configuration
  --collections          Clear all collections only
  --force                Skip confirmation prompt
```

**Examples:**

```bash
vectorlane clear --collections
vectorlane clear --all --force
```

## Exit Codes

| Code | Description |
|------|-------------|
| 0 | Success |
| 1 | General error |
| 2 | Invalid arguments |
| 3 | Connection error |
| 4 | Not found |
| 5 | Permission denied |
