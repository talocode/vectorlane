# Search

VectorLane provides semantic search over your ingested content using vector similarity.

## Basic Search

### CLI

```bash
vectorlane search "machine learning algorithms"
```

### SDK

```javascript
const results = await vl.search('machine learning algorithms');
```

```python
results = vl.search("machine learning algorithms")
```

### API

```bash
curl -X POST http://localhost:3090/v1/vectorlane/search \
  -H "Content-Type: application/json" \
  -d '{"query": "machine learning algorithms"}'
```

## Search Options

### Collection Filter

Search within a specific collection:

```bash
vectorlane search "API docs" --collection docs
```

```javascript
const results = await vl.search('API docs', { collection: 'docs' });
```

### Limit

Maximum number of results:

```bash
vectorlane search "error handling" --limit 10
```

### Threshold

Minimum similarity score (0-1):

```bash
vectorlane search "exact match" --threshold 0.8
```

### Full Options

```bash
vectorlane search "query" \
  --collection docs \
  --limit 5 \
  --threshold 0.5 \
  --format json
```

```javascript
const results = await vl.search('query', {
  collection: 'docs',
  limit: 5,
  threshold: 0.5,
});
```

## Search Results

Each search result contains:

```json
{
  "id": "vec_abc123",
  "text": "The matched text content or chunk",
  "score": 0.92,
  "collection": "docs",
  "citation": {
    "source": "document.txt",
    "page": 1,
    "offset": 0,
    "timestamp": "2026-07-15T10:30:00Z"
  },
  "metadata": {
    "chunk_index": 0,
    "total_chunks": 5
  }
}
```

### Score Interpretation

| Score | Meaning |
|-------|---------|
| 0.9 - 1.0 | Very high similarity |
| 0.7 - 0.9 | High similarity |
| 0.5 - 0.7 | Moderate similarity |
| 0.3 - 0.5 | Low similarity |
| 0.0 - 0.3 | Very low similarity |

### Threshold Guidelines

| Use Case | Recommended Threshold |
|----------|----------------------|
| Exact matching | 0.9 |
| Topic search | 0.7 |
| Broad discovery | 0.5 |
| Exploratory | 0.3 |

## Similarity Metrics

VectorLane uses cosine similarity by default.

### Cosine Similarity

Measures the angle between vectors. Best for text similarity.

```
score = dot(a, b) / (||a|| * ||b||)
```

Range: -1 to 1 (typically 0 to 1 for embeddings)

### Configuration

```json
{
  "similarity_metric": "cosine"
}
```

## Advanced Search

### Multi-collection Search

Search across all collections by omitting the collection parameter:

```bash
vectorlane search "query"
```

Or search multiple specific collections:

```bash
# Search each collection and combine results
for col in docs code notes; do
  vectorlane search "query" --collection $col --format json
done
```

### Fuzzy Search

VectorLane's semantic search naturally handles:

- Synonyms ("happy" matches "joyful")
- Paraphrases ("big" matches "large")
- Related concepts ("car" matches "automobile")

### Exact Match

For exact text matching, use a high threshold:

```bash
vectorlane search "exact phrase here" --threshold 0.95
```

## Performance

### Search Speed

| Vectors | Time |
|---------|------|
| 1,000 | < 10ms |
| 10,000 | < 50ms |
| 100,000 | < 200ms |
| 1,000,000 | < 1s |

### Optimization Tips

1. **Use collections** — Smaller collections search faster
2. **Set threshold** — Higher thresholds skip low-scoring vectors
3. **Limit results** — Fewer results = faster response
4. **Use appropriate dimensions** — Lower = faster

## Output Formats

### Table (default)

```
Results for "machine learning":
  Score   Text                                    Source
  0.92    Machine learning is a subset of AI...   ml-intro.txt
  0.87    Supervised learning uses labeled...     ml-intro.txt
  0.75    Neural networks are computing...        neural-nets.txt
```

### JSON

```json
{
  "query": "machine learning",
  "results": [...],
  "total": 3,
  "time_ms": 12
}
```

### Text

```
[0.92] Machine learning is a subset of AI... (ml-intro.txt)
[0.87] Supervised learning uses labeled... (ml-intro.txt)
[0.75] Neural networks are computing... (neural-nets.txt)
```

## Troubleshooting

### No results found

- Lower the threshold: `--threshold 0.3`
- Check collection exists: `vectorlane collection list`
- Verify data ingested: `vectorlane collection stats <name>`
- Try a broader query

### Slow search

- Reduce result limit
- Increase threshold
- Use a smaller collection
- Switch to a faster embedding model

### Low quality results

- Try a different embedding model
- Adjust chunk size for better granularity
- Use more descriptive queries
- Add more diverse training data
