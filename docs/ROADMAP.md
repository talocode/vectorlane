# Roadmap

VectorLane development roadmap and planned features.

## Current Version: v0.1.0

Released: July 2026

### What's Included

- Core vector store with JSONL backend
- local-hash embedding model (256 dimensions, offline)
- CLI with all core commands
- REST API on port 3090
- MCP integration
- Python and JavaScript/TypeScript SDKs
- Citation tracking
- Multi-source ingestion (text, URLs, files)
- Collection management
- Basic search functionality

## v0.2.0 — Q3 2026

**Theme: Production Readiness**

### Planned Features

- **SQLite backend** — Better performance for larger datasets
- **OpenAI embeddings** — text-embedding-3-small and text-embedding-3-large
- **HuggingFace embeddings** — all-MiniLM-L6-v2 and all-mpnet-base-v2
- **LangChain integration** — VectorLane retriever for LangChain
- **LlamaIndex integration** — VectorLane vector store for LlamaIndex
- **Batch ingestion** — Ingest multiple files at once
- **Import/export** — Export collections to JSON, import from JSON
- **Webhook support** — Event notifications for ingestion and search
- **Rate limiting** — Built-in rate limiting for API

### Target Release

September 2026

## v0.3.0 — Q4 2026

**Theme: Advanced Search**

### Planned Features

- **Hybrid search** — Combine keyword and semantic search
- **Multi-modal embeddings** — Support for image embeddings
- **Reranking** — Result reranking with cross-encoders
- **Query expansion** — Automatic query expansion
- **Faceted search** — Filter by metadata fields
- **Search history** — Track and analyze search patterns
- **Search analytics** — Dashboard for search metrics
- **Custom embedding models** — Support for user-provided models

### Target Release

December 2026

## v0.4.0 — Q1 2027

**Theme: Collaboration**

### Planned Features

- **Web UI** — Browser-based management interface
- **Multi-user support** — User authentication and authorization
- **Shared collections** — Share collections between users
- **Version control** — Track changes to collections
- **Audit logging** — Track who did what and when
- **Role-based access** — Admin, editor, viewer roles
- **Team workspaces** — Organize collections by team

### Target Release

March 2027

## v0.5.0 — Q2 2027

**Theme: Scale**

### Planned Features

- **Distributed mode** — Run VectorLane across multiple machines
- **Sharding** — Automatic data sharding for large datasets
- **Replication** — Data replication for high availability
- **Load balancing** — Distribute requests across instances
- **Monitoring** — Prometheus metrics and Grafana dashboards
- **Alerting** — Configurable alerts for issues
- **Backup/restore** — Automated backup and restore

### Target Release

June 2027

## Future Considerations

These features are under consideration but not yet scheduled:

### Embedding Models

- Cohere embeddings
- Voyage embeddings
- Google Vertex AI embeddings
- AWS Bedrock embeddings
- Custom embedding API support

### Storage Backends

- PostgreSQL with pgvector
- Redis vector search
- Elasticsearch vector search
- Milvus integration
- Pinecone integration

### Integrations

- Slack integration
- Notion integration
- GitHub integration
- Confluence integration
- Custom connector framework

### Advanced Features

- Graph-based relationships between vectors
- Temporal search (search by time)
- Geospatial search
- Multi-language search
- Voice search integration

## Contributing

We welcome contributions! See the [Contributing Guide](CONTRIBUTING.md) for how to get involved.

### Priority Areas

1. **Backend implementations** — New storage backends
2. **Embedding models** — New embedding integrations
3. **Language SDKs** — SDKs for Go, Rust, Java
4. **Testing** — Improve test coverage
5. **Documentation** — Improve and translate docs

## Feedback

We value your feedback! Please share your thoughts:

- **GitHub Issues** — [github.com/talocode/vectorlane/issues](https://github.com/talocode/vectorlane/issues)
- **Discord** — [discord.gg/vectorlane](https://discord.gg/vectorlane)
- **Twitter** — [@vectorlane](https://twitter.com/vectorlane)

## Release Process

VectorLane follows semantic versioning:

- **Major** (x.0.0) — Breaking changes
- **Minor** (0.x.0) — New features, backward compatible
- **Patch** (0.0.x) — Bug fixes, backward compatible

### Release Cadence

- Major releases: Every 12-18 months
- Minor releases: Every 3 months
- Patch releases: As needed

### Beta Program

Join our beta program to test new features early:

```bash
npm install -g @talocode/vectorlane@beta
```
