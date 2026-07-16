# Embeddings

Embeddings are numerical representations of text that capture semantic meaning. VectorLane supports multiple embedding models.

## Supported Models

### local-hash (Default)

A lightweight, offline embedding model using locality-sensitive hashing (LSH).

**Configuration:**

```json
{
  "embedding": "local-hash"
}
```

**Properties:**

| Property | Value |
|----------|-------|
| Dimensions | 256 |
| Speed | Fast |
| Quality | Good for deduplication and basic similarity |
| Offline | Yes |
| Dependencies | None |

**How it works:**

1. Tokenize input text
2. Generate n-gram hashes
3. Create a 256-dimensional hash vector
4. Use cosine similarity for comparison

**Best for:**
- Offline environments
- Quick prototyping
- Deduplication
- Basic similarity search

**Limitations:**
- Not as semantically rich as neural embeddings
- May miss nuanced meaning
- Best for exact or near-exact matches

### openai

OpenAI's text embedding models.

**Configuration:**

```json
{
  "embedding": "openai",
  "openai_api_key": "sk-...",
  "openai_model": "text-embedding-3-small"
}
```

**Properties:**

| Property | Value |
|----------|-------|
| Dimensions | 1536 (small) or 3072 (large) |
| Speed | Moderate |
| Quality | High |
| Offline | No |
| Dependencies | OpenAI API key |

**Supported models:**

| Model | Dimensions | Price (per 1M tokens) |
|-------|------------|----------------------|
| text-embedding-3-small | 1536 | $0.02 |
| text-embedding-3-large | 3072 | $0.13 |
| text-embedding-ada-002 | 1536 | $0.10 |

**Setup:**

```bash
# Set API key
vectorlane config set openai_api_key sk-your-key-here

# Or use environment variable
export OPENAI_API_KEY=sk-your-key-here

# Select model
vectorlane config set embedding openai
vectorlane config set openai_model text-embedding-3-small
```

**Best for:**
- High-quality semantic search
- Production deployments
- Complex queries
- Multi-language support

### huggingface

Local embedding models from Hugging Face.

**Configuration:**

```json
{
  "embedding": "huggingface",
  "huggingface_model": "all-MiniLM-L6-v2"
}
```

**Properties:**

| Property | Value |
|----------|-------|
| Dimensions | 384 |
| Speed | Moderate |
| Quality | Good |
| Offline | Yes (after model download) |
| Dependencies | Python, transformers library |

**Supported models:**

| Model | Dimensions | Size |
|-------|------------|------|
| all-MiniLM-L6-v2 | 384 | 80 MB |
| all-mpnet-base-v2 | 768 | 420 MB |
| paraphrase-multilingual-MiniLM-L12-v2 | 384 | 470 MB |

**Setup:**

```bash
# Install Python dependencies
pip install sentence-transformers

# Select model
vectorlane config set embedding huggingface
vectorlane config set huggingface_model all-MiniLM-L6-v2
```

**Best for:**
- Offline environments
- Good quality without API costs
- Multi-language support
- Privacy-sensitive data

## Configuration

### Global default

Set in `~/.vectorlane/config.json`:

```json
{
  "embedding": "local-hash"
}
```

### Per-collection override

```json
{
  "collections": {
    "docs": {
      "embedding": "openai"
    },
    "code": {
      "embedding": "local-hash"
    }
  }
}
```

### Per-ingestion override

```bash
# CLI
vectorlane ingest document.txt --embedding openai

# API
POST /v1/vectorlane/ingest
{
  "path": "document.txt",
  "embedding": "openai"
}
```

## Embedding Cache

VectorLane caches embeddings to avoid redundant API calls.

**Configuration:**

```json
{
  "embedding_cache": true,
  "embedding_cache_size": 10000
}
```

**Cache location:**

```
~/.vectorlane/data/embeddings/cache.json
```

**Cache behavior:**

- Same text produces same embedding (deterministic)
- Cache is checked before calling embedding API
- Cache is persistent across restarts
- Can be cleared with `vectorlane clear --cache`

## Dimensions Comparison

| Model | Dimensions | Memory per Vector | Search Speed |
|-------|------------|-------------------|--------------|
| local-hash | 256 | 1 KB | Fast |
| huggingface (MiniLM) | 384 | 1.5 KB | Moderate |
| openai (small) | 1536 | 6 KB | Slower |
| openai (large) | 3072 | 12 KB | Slowest |

## Choosing a Model

### Use local-hash when:

- You need offline operation
- You want fast startup and ingestion
- You're doing basic similarity or deduplication
- You have no API budget

### Use openai when:

- You need high-quality semantic search
- You have an OpenAI API key
- You're working with complex queries
- You need multi-language support

### Use huggingface when:

- You need offline operation with good quality
- You can install Python dependencies
- You want a balance of speed and quality
- You need multi-language support

## Custom Embedding Models

v0.1.0 supports only the built-in models. Future versions will support custom embedding functions.

To request support for a new model, open an issue on GitHub.
