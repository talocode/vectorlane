# ContextLane

ContextLane is a knowledge ingestion pipeline for AI agents. It fetches, processes, and indexes external content so agents can search over curated knowledge bases.

## What ContextLane Ingests

ContextLane handles diverse content types:

- **Web pages**: Full HTML content extraction with text cleaning
- **Documents**: PDF, Markdown, plain text files
- **API responses**: JSON/JSONL data from external services
- **Code repositories**: Source files with language detection
- **Feeds**: RSS, Atom, and structured data feeds

## Processing Pipeline

For each piece of content, ContextLane:

1. **Fetches** the raw content from source
2. **Extracts** clean text, removing boilerplate and markup
3. **Chunks** the text into optimal segments for embedding
4. **Embeds** each chunk using the configured provider
5. **Stores** vectors with rich metadata for retrieval
6. **Citations** each chunk back to its original source

## Citation Format

ContextLane preserves provenance through structured citations:

```
contextlane:<source_url> (chunk 3 of 12, id: abc123)
```

This allows agents and users to trace any retrieved result back to its original source.

## Integration with VectorLane

ContextLane stores its processed data in a format compatible with VectorLane. Import with:

```bash
vectorlane import-contextlane ~/.contextlane/export.json
vectorlane sync contextlane
```

The imported collection retains all source citations, enabling transparent attribution in search results.
