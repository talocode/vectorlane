# Vector Store

VectorLane uses a pluggable vector store architecture with multiple backend options.

## Backends

### JSONL (Default)

JSON Lines file-based storage. Each vector is stored as a JSON object on a single line.

**Configuration:**

```json
{
  "backend": "jsonl",
  "storage_path": "~/.vectorlane/data"
}
```

**Pros:**
- Simple, no dependencies
- Human-readable data format
- Easy to backup and inspect
- Fast for small to medium datasets

**Cons:**
- Slower for very large datasets (millions of vectors)
- No concurrent write support
- Full file scan for operations

**Best for:** Personal projects, small teams, datasets under 100K vectors.

**Data structure:**

```
~/.vectorlane/data/
  collections/
    default/
      vectors.jsonl       # Vector data
      index.json          # Collection metadata
      citations.jsonl     # Citation data
  embeddings/
    cache.json            # Embedding cache
```

### SQLite

SQLite-based storage for larger datasets and concurrent access.

**Configuration:**

```json
{
  "backend": "sqlite",
  "storage_path": "~/.vectorlane/data"
}
```

**Pros:**
- ACID transactions
- Concurrent read support
- Better performance at scale
- Indexed queries

**Cons:**
- Requires SQLite (usually pre-installed)
- Less portable than JSONL
- Slightly more complex setup

**Best for:** Production use, larger datasets, concurrent access scenarios.

**Data structure:**

```
~/.vectorlane/data/
  vectorlane.db           # SQLite database
  collections/
    default/
      index.json          # Collection metadata
```

### Memory

In-memory only storage. Data is lost when the server stops.

**Configuration:**

```json
{
  "backend": "memory"
}
```

**Pros:**
- Fastest possible performance
- No disk I/O
- Perfect for testing

**Cons:**
- Data not persisted
- Lost on restart
- Limited by available RAM

**Best for:** Testing, benchmarks, ephemeral data.

## Vector Format

Each stored vector contains:

```json
{
  "id": "vec_abc123",
  "collection": "default",
  "text": "The original text content or chunk",
  "embedding": [0.12, -0.45, 0.78, ...],
  "dimensions": 256,
  "metadata": {
    "source": "document.txt",
    "chunk_index": 0,
    "total_chunks": 5,
    "offset": 0,
    "length": 512
  },
  "citation": {
    "source": "document.txt",
    "page": 1,
    "offset": 0,
    "timestamp": "2026-07-15T10:30:00Z"
  },
  "created": "2026-07-15T10:30:00Z",
  "updated": "2026-07-15T10:30:00Z"
}
```

## Collection Structure

A collection groups related vectors together:

```json
{
  "name": "documents",
  "description": "Project documentation",
  "backend": "jsonl",
  "dimensions": 256,
  "embedding_model": "local-hash",
  "created": "2026-07-15T10:00:00Z",
  "updated": "2026-07-15T14:30:00Z",
  "stats": {
    "documents": 5,
    "vectors": 20,
    "size": 819200
  }
}
```

## Indexing

Vectors are indexed for fast similarity search. The indexing strategy depends on the backend:

### JSONL Backend

- Linear scan with optional pre-filtering
- Cosine similarity calculation
- Results sorted by score

### SQLite Backend

- Indexed by collection and ID
- Indexed by timestamp for time-range queries
- Cosine similarity with early termination

## Similarity Metrics

VectorLane supports the following similarity metrics:

| Metric | Description | Range |
|--------|-------------|-------|
| `cosine` | Cosine similarity (default) | -1 to 1 |
| `euclidean` | Euclidean distance | 0 to infinity |
| `dot` | Dot product | -infinity to infinity |

**Configuration:**

```json
{
  "similarity_metric": "cosine"
}
```

## Storage Management

### Check storage usage

```bash
vectorlane collection stats <collection>
```

### Compact storage (SQLite only)

```bash
vectorlane config set backend sqlite
vectorlane doctor --fix
```

### Backup

```bash
# JSONL
cp -r ~/.vectorlane/data/collections/ ~/vectorlane-backup/

# SQLite
cp ~/.vectorlane/data/vectorlane.db ~/vectorlane-backup/
```

### Migration between backends

There is no automatic migration. To switch backends:

1. Export data from current backend
2. Reconfigure VectorLane with new backend
3. Re-import data

```bash
# Export from JSONL
vectorlane collection list --format json > collections.json

# Reconfigure
vectorlane config set backend sqlite

# Re-import
vectorlane import-memorylane --collection default
```

## Performance Considerations

### Vector Dimensions

Higher dimensions = more memory and slower search:

| Model | Dimensions | Memory per Vector |
|-------|------------|-------------------|
| local-hash | 256 | 1 KB |
| huggingface | 384 | 1.5 KB |
| openai | 1536 | 6 KB |

### Dataset Size Guidelines

| Vectors | Recommended Backend |
|---------|---------------------|
| < 10K | jsonl |
| 10K - 100K | jsonl or sqlite |
| 100K - 1M | sqlite |
| > 1M | sqlite (future: distributed) |

### Optimization Tips

1. **Use collections wisely** — Separate unrelated data into different collections
2. **Tune chunk size** — Larger chunks = fewer vectors but less precise search
3. **Set appropriate thresholds** — Higher thresholds = faster, more precise results
4. **Cache embeddings** — Enable embedding cache for repeated content
