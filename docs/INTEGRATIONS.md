# Integrations

VectorLane integrates with various tools and platforms to enhance AI agent capabilities.

## MemoryLane

MemoryLane is a conversation history manager. VectorLane can import and sync conversation data.

### Import from MemoryLane

```bash
# One-time import
vectorlane import-memorylane --collection conversations

# With path specification
vectorlane import-memorylane --path ~/.memorylane/data --collection conversations

# Limit import
vectorlane import-memorylane --limit 100 --collection conversations
```

### Sync with MemoryLane

```bash
# Incremental sync
vectorlane sync memorylane --collection conversations

# Dry run (preview changes)
vectorlane sync memorylane --collection conversations --dry-run
```

### SDK Usage

```javascript
// Import
await vl.importMemoryLane({ collection: 'conversations' });

// Sync
await vl.syncMemoryLane({ collection: 'conversations', dryRun: false });
```

### What Gets Imported

- Conversation messages
- Timestamps
- Speaker information
- Conversation metadata

## ContextLane

ContextLane manages context documents for AI agents. VectorLane can import and sync context data.

### Import from ContextLane

```bash
# One-time import
vectorlane import-contextlane --collection context

# With path specification
vectorlane import-contextlane --path ~/.contextlane/data --collection context

# Limit import
vectorlane import-contextlane --limit 50 --collection context
```

### Sync with ContextLane

```bash
# Incremental sync
vectorlane sync contextlane --collection context

# Dry run (preview changes)
vectorlane sync contextlane --collection context --dry-run
```

### SDK Usage

```javascript
// Import
await vl.importContextLane({ collection: 'context' });

// Sync
await vl.syncContextLane({ collection: 'context', dryRun: false });
```

### What Gets Imported

- Context documents
- Document metadata
- Version history
- Tags and categories

## MCP-Compatible Tools

VectorLane works with any MCP-compatible AI assistant.

### Claude

Add to `~/.config/claude/mcp.json`:

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

### Cursor

Add to Cursor MCP settings:

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

### Other MCP Clients

VectorLane works with any MCP client. Configure the MCP server as:

```json
{
  "command": "vectorlane",
  "args": ["mcp"]
}
```

## LangChain

VectorLane provides a LangChain retriever integration.

### Installation

```bash
pip install langchain vectorlane
```

### Usage

```python
from langchain.vectorstores import VectorLane
from langchain.embeddings import HuggingFaceEmbeddings

# Initialize VectorLane retriever
vectorstore = VectorLane(
    collection="documents",
    embedding_function=HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
)

# Create retriever
retriever = vectorstore.as_retriever(search_kwargs={"k": 5})

# Use in chain
docs = retriever.get_relevant_documents("machine learning")
```

### Configuration

```python
from langchain.vectorstores import VectorLane

vectorstore = VectorLane(
    collection="documents",
    host="localhost",
    port=3090,
)
```

## LlamaIndex

VectorLane provides a LlamaIndex vector store integration.

### Installation

```bash
pip install llama-index vectorlane
```

### Usage

```python
from llama_index.vector_stores import VectorLaneVectorStore
from llama_index import VectorStoreIndex

# Initialize VectorLane vector store
vector_store = VectorLaneVectorStore(
    collection="documents",
    host="localhost",
    port=3090,
)

# Create index
index = VectorStoreIndex.from_vector_store(vector_store)

# Query
query_engine = index.as_query_engine()
response = query_engine.query("machine learning algorithms")
```

## Custom Integrations

### REST API

Use the REST API to integrate with any language or tool:

```bash
# Ingest
curl -X POST http://localhost:3090/v1/vectorlane/ingest-text \
  -H "Content-Type: application/json" \
  -d '{"text": "Your content", "collection": "default"}'

# Search
curl -X POST http://localhost:3090/v1/vectorlane/search \
  -H "Content-Type: application/json" \
  -d '{"query": "your query", "collection": "default"}'
```

### WebSocket (Future)

v0.2.0 will add WebSocket support for real-time updates.

## Webhook Integration

VectorLane can send webhooks on events:

### Configuration

```json
{
  "webhooks": {
    "ingest": "https://your-server.com/webhook/ingest",
    "search": "https://your-server.com/webhook/search",
    "delete": "https://your-server.com/webhook/delete"
  }
}
```

### Webhook Payload

```json
{
  "event": "ingest",
  "timestamp": "2026-07-15T10:30:00Z",
  "data": {
    "collection": "default",
    "id": "vec_abc123",
    "source": "document.txt"
  }
}
```

## Docker

### Dockerfile

```dockerfile
FROM node:20-slim

RUN npm install -g @talocode/vectorlane

EXPOSE 3090

CMD ["vectorlane", "serve"]
```

### Docker Compose

```yaml
version: '3.8'
services:
  vectorlane:
    build: .
    ports:
      - "3090:3090"
    volumes:
      - vectorlane-data:/root/.vectorlane
    environment:
      - VECTORLANE_PORT=3090

volumes:
  vectorlane-data:
```

### Run

```bash
docker-compose up -d
```

## Kubernetes

### Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: vectorlane
spec:
  replicas: 1
  selector:
    matchLabels:
      app: vectorlane
  template:
    metadata:
      labels:
        app: vectorlane
    spec:
      containers:
      - name: vectorlane
        image: vectorlane/vectorlane:latest
        ports:
        - containerPort: 3090
        volumeMounts:
        - name: data
          mountPath: /root/.vectorlane
      volumes:
      - name: data
        persistentVolumeClaim:
          claimName: vectorlane-data
```

## Community Integrations

- **VS Code Extension** — Search codebase from VS Code (community)
- **Neovim Plugin** — VectorLane search in Neovim (community)
- **Emacs Package** — VectorLane integration for Emacs (community)

See the [integrations directory](https://github.com/talocode/vectorlane/tree/main/integrations) for more.
