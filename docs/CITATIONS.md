# Citations

VectorLane automatically tracks the source of every ingested piece of content, enabling citation and attribution for search results.

## How Citations Work

When you ingest content, VectorLane records:

1. **Source** — Where the content came from (filename, URL, etc.)
2. **Position** — Where within the source (page, offset, line)
3. **Timestamp** — When it was ingested

This information is attached to every vector and returned with search results.

## Citation Format

Every search result includes a citation object:

```json
{
  "id": "vec_abc123",
  "text": "The matched text content",
  "score": 0.92,
  "citation": {
    "source": "document.txt",
    "page": 1,
    "offset": 0,
    "length": 512,
    "timestamp": "2026-07-15T10:30:00Z"
  }
}
```

### Citation Fields

| Field | Type | Description |
|-------|------|-------------|
| `source` | string | Source identifier (filename, URL, etc.) |
| `page` | number | Page number (if applicable) |
| `offset` | number | Character offset within the source |
| `length` | number | Length of the original content |
| `timestamp` | string | ISO 8601 timestamp of ingestion |

## Setting Source Identifiers

### CLI

```bash
vectorlane ingest-text "Important note" --source "meeting-2026-07-15"
vectorlane ingest document.txt --source "docs/architecture.txt"
vectorlane ingest-url "https://example.com/article" --source "web/article-123"
```

### SDK

```javascript
await vl.ingestText('Important note', { source: 'meeting-2026-07-15' });
await vl.ingestFile('document.txt', { source: 'docs/architecture.txt' });
await vl.ingestUrl('https://example.com/article', { source: 'web/article-123' });
```

### API

```bash
POST /v1/vectorlane/ingest-text
{
  "text": "Important note",
  "source": "meeting-2026-07-15"
}
```

## Source Naming Conventions

Use consistent naming for sources:

| Source Type | Convention | Example |
|-------------|------------|---------|
| Files | Relative path | `docs/readme.txt` |
| URLs | Domain + path | `example.com/article` |
| Manual | Descriptive tag | `meeting-notes-2026-07-15` |
| Imports | Tool name | `memorylane-conversation-123` |

## Citation Tracking

### Viewing Citations

Citations are returned with every search result:

```bash
vectorlane search "machine learning" --format json
```

```json
{
  "results": [
    {
      "text": "Machine learning is a subset of AI...",
      "score": 0.92,
      "citation": {
        "source": "ml-intro.txt",
        "offset": 0,
        "timestamp": "2026-07-15T10:30:00Z"
      }
    }
  ]
}
```

### Citation Aggregation

View all citations for a collection:

```bash
vectorlane collection show docs --format json
```

```json
{
  "name": "docs",
  "citations": [
    { "source": "readme.txt", "count": 5 },
    { "source": "architecture.txt", "count": 8 },
    { "source": "api-reference.txt", "count": 12 }
  ]
}
```

## Use Cases

### Knowledge Base

Track which documents contributed to answers:

```javascript
const results = await vl.search('How do I configure VectorLane?');
for (const result of results) {
  console.log(`Answer: ${result.text}`);
  console.log(`Source: ${result.citation.source}`);
}
```

### Research

Track sources for academic citations:

```javascript
const results = await vl.search('quantum computing applications');
for (const result of results) {
  console.log(`Found: ${result.text}`);
  console.log(`Source: ${result.citation.source}`);
  console.log(`Ingested: ${result.citation.timestamp}`);
}
```

### Audit Trail

Track when content was added:

```javascript
const stats = await vl.collection.stats('knowledge');
console.log(`Last updated: ${stats.updated}`);
```

## Citation Metadata

### Custom Metadata

Add custom metadata to citations:

```bash
vectorlane ingest document.txt \
  --source "docs/readme.txt" \
  --metadata '{"author": "John", "version": "1.0"}'
```

```javascript
await vl.ingestFile('document.txt', {
  source: 'docs/readme.txt',
  metadata: { author: 'John', version: '1.0' },
});
```

### Metadata Fields

| Field | Type | Description |
|-------|------|-------------|
| `author` | string | Content author |
| `version` | string | Content version |
| `tags` | array | Content tags |
| `category` | string | Content category |
| `custom` | object | Any custom data |

## Best Practices

1. **Use descriptive sources** — Make sources meaningful and searchable
2. **Be consistent** — Use the same naming convention across projects
3. **Include timestamps** — For time-sensitive content
4. **Add metadata** — For additional context
5. **Review citations** — Periodically check citation accuracy

## Limitations

- Citations are immutable once created
- No automatic source deduplication
- Source names must be unique within a collection
- Maximum source name length: 256 characters
