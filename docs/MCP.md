# MCP Integration

VectorLane provides native Model Context Protocol (MCP) support, allowing AI assistants like Claude, Cursor, and others to use VectorLane as a memory backend.

## What is MCP?

Model Context Protocol (MCP) is an open standard that allows AI assistants to connect to external tools and data sources. VectorLane implements MCP to provide AI agents with searchable local memory.

## Setup

### Option 1: CLI-based MCP Server

Add to your MCP configuration file (e.g., `~/.config/claude/mcp.json` or equivalent):

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

### Option 2: HTTP-based MCP Server

Start the VectorLane server with MCP enabled:

```bash
vectorlane serve --mcp
```

Then configure MCP to connect to the HTTP endpoint:

```json
{
  "mcpServers": {
    "vectorlane": {
      "url": "http://localhost:3090/mcp"
    }
  }
}
```

### Option 3: Stdio-based with custom path

If VectorLane is installed in a custom location:

```json
{
  "mcpServers": {
    "vectorlane": {
      "command": "/usr/local/bin/vectorlane",
      "args": ["mcp"],
      "env": {
        "VECTORLANE_PORT": "3090"
      }
    }
  }
}
```

## Available Tools

### vectorlane_init

Initialize VectorLane. Creates default configuration and storage directories.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `backend` | string | No | Storage backend: jsonl, sqlite, memory |
| `embedding` | string | No | Embedding model: local-hash, openai, huggingface |
| `collection` | string | No | Default collection name |

**Example:**

```json
{
  "backend": "jsonl",
  "embedding": "local-hash",
  "collection": "default"
}
```

### vectorlane_collection_create

Create a new collection.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | Yes | Collection name |
| `description` | string | No | Collection description |

**Example:**

```json
{
  "name": "project-docs",
  "description": "Project documentation and notes"
}
```

### vectorlane_collection_list

List all collections.

**Parameters:** None

**Returns:** Array of collection objects with name, document count, vector count, and size.

### vectorlane_collection_stats

Get statistics for a specific collection.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | Yes | Collection name |

### vectorlane_ingest

Ingest a file into the vector store.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `path` | string | Yes | Path to file |
| `collection` | string | No | Target collection |
| `source` | string | No | Source identifier |

**Example:**

```json
{
  "path": "/path/to/document.txt",
  "collection": "docs",
  "source": "project-readme"
}
```

### vectorlane_ingest_text

Ingest raw text content.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `text` | string | Yes | Text content to ingest |
| `collection` | string | No | Target collection |
| `source` | string | No | Source identifier |

**Example:**

```json
{
  "text": "VectorLane is a local vector memory store for AI agents.",
  "collection": "knowledge",
  "source": "about-page"
}
```

### vectorlane_search

Search the vector store for similar content.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | Search query |
| `collection` | string | No | Collection to search |
| `limit` | number | No | Maximum results (default: 5) |
| `threshold` | number | No | Minimum similarity score 0-1 |

**Example:**

```json
{
  "query": "How do I install VectorLane?",
  "collection": "docs",
  "limit": 3
}
```

**Returns:** Array of search results with text, score, citation, and metadata.

### vectorlane_import_memorylane

Import conversation history from MemoryLane.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `collection` | string | No | Target collection |
| `path` | string | No | Path to MemoryLane data |

### vectorlane_import_contextlane

Import context documents from ContextLane.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `collection` | string | No | Target collection |
| `path` | string | No | Path to ContextLane data |

### vectorlane_doctor

Run diagnostics on the VectorLane installation.

**Parameters:** None

**Returns:** Diagnostic report with status of each check.

### vectorlane_demo

Run the interactive demo.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `collection` | string | No | Collection for demo |

### vectorlane_clear_collection

Clear all data from a collection.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | Yes | Collection name |

**Example:**

```json
{
  "name": "temp-data"
}
```

## Workflow Example

Here is a typical workflow using VectorLane with an MCP-compatible AI assistant:

1. **Initialize**: The assistant calls `vectorlane_init` to set up VectorLane
2. **Create Collection**: Call `vectorlane_collection_create` for the project
3. **Ingest Data**: Use `vectorlane_ingest_text` or `vectorlane_ingest` to add documents
4. **Search**: When the user asks a question, call `vectorlane_search` to find relevant context
5. **Response**: The assistant uses search results to provide informed answers

## Troubleshooting

### MCP server not starting

```bash
# Check if vectorlane is installed
vectorlane --version

# Run diagnostics
vectorlane doctor

# Test MCP mode
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | vectorlane mcp
```

### Tools not appearing in AI assistant

1. Verify the MCP configuration file is in the correct location
2. Restart the AI assistant after configuration changes
3. Check that the `vectorlane` command is in your PATH
4. Look for error logs in `~/.vectorlane/logs/`

### Connection refused

If using HTTP-based MCP:

```bash
# Start the server
vectorlane serve --mcp

# Verify it's running
curl http://localhost:3090/health
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VECTORLANE_PORT` | API server port | 3090 |
| `VECTORLANE_HOST` | API server host | localhost |
| `VECTORLANE_STORAGE` | Storage directory | ~/.vectorlane |
| `VECTORLANE_LOG_LEVEL` | Log level | info |
