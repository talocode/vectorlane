# Python SDK

The VectorLane Python SDK provides a Pythonic interface to the VectorLane vector store.

## Installation

```bash
pip install talocode-vectorlane
```

### Requirements

- Python 3.9 or higher
- No external dependencies for basic usage

### Optional Dependencies

For OpenAI embeddings:

```bash
pip install talocode-vectorlane[openai]
```

For HuggingFace embeddings:

```bash
pip install talocode-vectorlane[huggingface]
```

## Quick Start

```python
from vectorlane import VectorLane

# Initialize
vl = VectorLane()
vl.init()

# Ingest text
vl.ingest_text("The quick brown fox jumps over the lazy dog.")

# Search
results = vl.search("fox")
print(results)
```

## Constructor

```python
vl = VectorLane(
    port=3090,           # API server port
    host="localhost",    # API server host
    timeout=30000,       # Request timeout in ms
    retries=3,           # Number of retries
)
```

## Methods

### init()

Initialize VectorLane. Creates default configuration and storage if needed.

```python
vl.init()
```

### ingest_text(text, **kwargs)

Ingest raw text into the vector store.

```python
result = vl.ingest_text(
    "Your text content here",
    collection="default",
    source="manual-input",
    chunk_size=512,
    chunk_overlap=50,
)
# Returns: {"id": "txt_xyz789", "chunks": 1, "vectors": 1}
```

### ingest_url(url, **kwargs)

Fetch and ingest content from a URL.

```python
result = vl.ingest_url(
    "https://example.com/article",
    collection="default",
    selector="main.content",
    depth=0,
    timeout=30000,
)
# Returns: {"id": "url_def456", "title": "Article", "chunks": 8, "vectors": 8}
```

### ingest_file(path, **kwargs)

Ingest a file from disk.

```python
result = vl.ingest_file(
    "/path/to/document.txt",
    collection="default",
    format="auto",
    chunk_size=512,
    chunk_overlap=50,
)
# Returns: {"id": "doc_abc123", "filename": "document.txt", "chunks": 4, "vectors": 4}
```

### search(query, **kwargs)

Search the vector store for similar content.

```python
results = vl.search(
    "machine learning",
    collection="default",
    limit=5,
    threshold=0.5,
)
# Returns: list of dicts with id, text, score, citation, metadata
```

### collection.create(name, **kwargs)

Create a new collection.

```python
vl.collection.create(
    "documents",
    description="Project documentation",
)
```

### collection.list()

List all collections.

```python
collections = vl.collection.list()
# Returns: [{"name": "default", "documents": 12, "vectors": 48, ...}]
```

### collection.show(name)

Get detailed information about a collection.

```python
info = vl.collection.show("documents")
# Returns: {"name": "documents", "documents": 5, "vectors": 20, ...}
```

### collection.stats(name)

Get statistics for a collection.

```python
stats = vl.collection.stats("documents")
# Returns: {"name": "documents", "documents": 5, "vectors": 20, ...}
```

### collection.delete(name)

Delete a collection and all its data.

```python
vl.collection.delete("old-collection")
```

### doctor()

Run diagnostics.

```python
report = vl.doctor()
# Returns: {"status": "ok", "checks": [...]}
```

### demo()

Run the interactive demo.

```python
result = vl.demo(collection="demo")
# Returns: {"status": "completed", "steps": [...]}
```

## Context Manager

The Python SDK supports context managers:

```python
from vectorlane import VectorLane

with VectorLane() as vl:
    vl.init()
    vl.ingest_text("Hello, world!")
    results = vl.search("hello")
```

## Error Handling

```python
from vectorlane import VectorLane, VectorLaneError, ConnectionError, NotFoundError

try:
    vl = VectorLane()
    vl.init()
    results = vl.search("query")
except ConnectionError:
    print("Server not running. Start with: vectorlane serve")
except NotFoundError:
    print("Collection not found")
except VectorLaneError as e:
    print(f"VectorLane error: {e}")
```

## Async Support (Future)

v0.2.0 will add async support:

```python
import asyncio
from vectorlane import AsyncVectorLane

async def main():
    async with AsyncVectorLane() as vl:
        await vl.init()
        await vl.ingest_text("Hello, world!")
        results = await vl.search("hello")
        print(results)

asyncio.run(main())
```

## Type Hints

The Python SDK includes full type hints:

```python
from vectorlane import VectorLane
from vectorlane.types import SearchResult, CollectionInfo, DoctorReport

vl: VectorLane = VectorLane()
results: list[SearchResult] = vl.search("query")
info: CollectionInfo = vl.collection.show("docs")
report: DoctorReport = vl.doctor()
```

## Pandas Integration

Convert search results to pandas DataFrame:

```python
import pandas as pd
from vectorlane import VectorLane

vl = VectorLane()
vl.init()

results = vl.search("machine learning")
df = pd.DataFrame(results)
print(df[["text", "score", "citation"]])
```

## Testing

```python
import pytest
from vectorlane import VectorLane

@pytest.fixture
def vl():
    vl = VectorLane(backend="memory")
    vl.init()
    yield vl
    vl.clear()

def test_ingest_and_search(vl):
    vl.ingest_text("Test content")
    results = vl.search("test")
    assert len(results) > 0
    assert results[0]["score"] > 0.5
```

## Examples

### Knowledge Base

```python
from vectorlane import VectorLane

vl = VectorLane()
vl.init()

# Create collection
vl.collection.create("knowledge", description="Project knowledge base")

# Ingest documents
vl.ingest_file("docs/architecture.txt", collection="knowledge", source="architecture")
vl.ingest_file("docs/api.txt", collection="knowledge", source="api")
vl.ingest_url("https://example.com/docs", collection="knowledge", source="web-docs")

# Search
results = vl.search("How do I configure the API?", collection="knowledge")
for r in results:
    print(f"[{r['score']:.2f}] {r['text'][:100]}...")
    print(f"  Source: {r['citation']['source']}")
```

### Conversation Memory

```python
from vectorlane import VectorLane

vl = VectorLane()
vl.init()

# Import from MemoryLane
vl.import_memorylane(collection="conversations")

# Search conversations
results = vl.search("What did we discuss about the API?", collection="conversations")
for r in results:
    print(f"[{r['score']:.2f}] {r['text'][:100]}...")
```

### Code Search

```python
from vectorlane import VectorLane

vl = VectorLane()
vl.init()

# Ingest code files
import glob
for f in glob.glob("**/*.py", recursive=True):
    vl.ingest_file(f, collection="code", source=f)

# Search code
results = vl.search("function that parses JSON", collection="code")
for r in results:
    print(f"[{r['score']:.2f}] {r['citation']['source']}")
    print(f"  {r['text'][:200]}...")
```

## API Reference

For the complete API reference, see the [SDK documentation](SDK.md).
