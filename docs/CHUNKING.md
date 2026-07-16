# Chunking

Chunking is the process of splitting long text into smaller pieces for embedding. VectorLane handles chunking automatically during ingestion.

## Why Chunk?

Embedding models have token limits (typically 512-8192 tokens). Long texts must be split into chunks that:

1. Fit within the model's token limit
2. Preserve semantic meaning
3. Allow accurate retrieval of relevant passages

## Chunking Strategies

### Fixed-Size (Default)

Splits text into fixed-size chunks with configurable overlap.

**Configuration:**

```json
{
  "chunk_strategy": "fixed",
  "chunk_size": 512,
  "chunk_overlap": 50
}
```

**CLI:**

```bash
vectorlane ingest document.txt --chunk-size 512 --chunk-overlap 50
```

**How it works:**

1. Tokenize the input text
2. Split into chunks of `chunk_size` tokens
3. Create overlap by `chunk_overlap` tokens between consecutive chunks
4. Each chunk becomes a separate vector

**Example:**

Input text: "The quick brown fox jumps over the lazy dog. The dog barked at the fox."

With `chunk_size=8` and `chunk_overlap=2`:

```
Chunk 1: "The quick brown fox jumps over"
Chunk 2: "over the lazy dog. The dog"
Chunk 3: "The dog barked at the fox."
```

**Pros:**
- Simple and predictable
- Fast processing
- Good for most use cases

**Cons:**
- May split mid-sentence
- Overlap can cause redundancy

### Sentence

Splits text at sentence boundaries.

**Configuration:**

```json
{
  "chunk_strategy": "sentence",
  "chunk_size": 512,
  "chunk_overlap": 0
}
```

**How it works:**

1. Detect sentence boundaries (periods, exclamation marks, question marks)
2. Group sentences into chunks up to `chunk_size` tokens
3. No overlap (sentences are atomic units)

**Example:**

Input: "The quick brown fox jumps over the lazy dog. The dog barked at the fox. The fox ran away."

```
Chunk 1: "The quick brown fox jumps over the lazy dog."
Chunk 2: "The dog barked at the fox."
Chunk 3: "The fox ran away."
```

**Pros:**
- Preserves sentence完整性
- Natural semantic units
- No redundant overlap

**Cons:**
- Variable chunk sizes
- May not fill target chunk size

### Paragraph

Splits text at paragraph boundaries.

**Configuration:**

```json
{
  "chunk_strategy": "paragraph",
  "chunk_size": 1024,
  "chunk_overlap": 0
}
```

**How it works:**

1. Detect paragraph boundaries (double newlines)
2. Each paragraph becomes a chunk
3. If a paragraph exceeds `chunk_size`, apply fixed-size splitting within it

**Example:**

Input:

```
The quick brown fox jumps over the lazy dog.

The dog barked at the fox.

The fox ran away.
```

```
Chunk 1: "The quick brown fox jumps over the lazy dog."
Chunk 2: "The dog barked at the fox."
Chunk 3: "The fox ran away."
```

**Pros:**
- Preserves document structure
- Good for structured documents
- Natural topic boundaries

**Cons:**
- Highly variable chunk sizes
- Requires well-formatted input

### Recursive

Hierarchical splitting with multiple fallback strategies.

**Configuration:**

```json
{
  "chunk_strategy": "recursive",
  "chunk_size": 512,
  "chunk_overlap": 50
}
```

**How it works:**

1. Try to split at paragraph boundaries
2. If chunks still too large, split at sentence boundaries
3. If still too large, split at word boundaries
4. Apply overlap at each level

**Pros:**
- Adaptive to content structure
- Best of all strategies
- Handles mixed content well

**Cons:**
- More complex implementation
- Slightly slower processing

## Configuration

### Global defaults

Set in `~/.vectorlane/config.json`:

```json
{
  "chunk_strategy": "fixed",
  "chunk_size": 512,
  "chunk_overlap": 50
}
```

### Per-ingestion override

```bash
# CLI
vectorlane ingest document.txt --chunk-size 256 --chunk-overlap 25

# API
POST /v1/vectorlane/ingest
{
  "path": "document.txt",
  "chunk_size": 256,
  "chunk_overlap": 25
}

# SDK
await vl.ingestFile('document.txt', {
  chunkSize: 256,
  chunkOverlap: 25
});
```

## Tokenization

VectorLane uses a simple tokenizer for chunking:

- **Whitespace splitting** for basic tokenization
- **Word-level counting** for chunk sizes
- **Character offsets** for citation tracking

For production use with OpenAI or HuggingFace embeddings, the appropriate tokenizer is used automatically.

## Best Practices

### Chunk Size

| Use Case | Recommended Size |
|----------|------------------|
| General text | 512 tokens |
| Code | 256 tokens |
| Technical docs | 512-1024 tokens |
| Conversations | 256 tokens |
| Short notes | 128 tokens |

### Overlap

| Strategy | Recommended Overlap |
|----------|---------------------|
| Fixed-size | 10-20% of chunk size |
| Sentence | 0 (sentences are atomic) |
| Paragraph | 0 (paragraphs are atomic) |
| Recursive | 10-15% of chunk size |

### Examples

**For a technical document:**

```bash
vectorlane ingest architecture.md --chunk-size 512 --chunk-overlap 50
```

**For code snippets:**

```bash
vectorlane ingest main.py --chunk-size 256 --chunk-overlap 25
```

**For conversation logs:**

```bash
vectorlane ingest chat.json --chunk-size 256 --chunk-overlap 0
```

## Debugging Chunks

To see how text will be chunked before ingestion:

```bash
vectorlane ingest document.txt --dry-run --verbose
```

This outputs:

```
Chunking document.txt with strategy: fixed (512 tokens, 50 overlap)
  Chunk 1: 0-512 (512 tokens)
  Chunk 2: 462-974 (512 tokens)
  Chunk 3: 924-1436 (512 tokens)
Total chunks: 3
```
