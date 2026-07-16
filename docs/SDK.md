# SDK Reference

VectorLane provides official SDKs for JavaScript/TypeScript and Python.

## JavaScript/TypeScript SDK

### Installation

```bash
npm install @talocode/vectorlane
```

### Basic Usage

```javascript
import { VectorLane } from '@talocode/vectorlane';

const vl = new VectorLane();
await vl.init();
```

### Constructor Options

```javascript
const vl = new VectorLane({
  port: 3090,           // API server port (default: 3090)
  host: 'localhost',    // API server host (default: localhost)
  timeout: 30000,       // Request timeout in ms (default: 30000)
  retries: 3,           // Number of retries on failure (default: 3)
});
```

### Methods

#### vl.init()

Initialize VectorLane. Creates default configuration and storage if needed.

```javascript
await vl.init();
```

#### vl.ingestText(text, options?)

Ingest raw text into the vector store.

```javascript
const result = await vl.ingestText('Your text content here', {
  collection: 'default',  // Target collection
  source: 'manual',       // Source identifier for citations
  chunkSize: 512,         // Tokens per chunk
  chunkOverlap: 50,       // Overlap between chunks
});
// Returns: { id: string, chunks: number, vectors: number }
```

#### vl.ingestUrl(url, options?)

Fetch and ingest content from a URL.

```javascript
const result = await vl.ingestUrl('https://example.com/article', {
  collection: 'default',
  selector: 'main.content',  // CSS selector for content extraction
  depth: 0,                  // Crawl depth for linked pages
  timeout: 30000,
});
// Returns: { id: string, chunks: number, vectors: number, title: string }
```

#### vl.ingestFile(path, options?)

Ingest a file from disk.

```javascript
const result = await vl.ingestFile('/path/to/document.txt', {
  collection: 'default',
  format: 'auto',          // auto, text, markdown, json
  chunkSize: 512,
  chunkOverlap: 50,
});
// Returns: { id: string, chunks: number, vectors: number, filename: string }
```

#### vl.search(query, options?)

Search the vector store for similar content.

```javascript
const results = await vl.search('machine learning', {
  collection: 'default',  // Collection to search (or undefined for all)
  limit: 5,               // Maximum results
  threshold: 0.5,         // Minimum similarity score (0-1)
});
// Returns: Array<{ id, text, score, citation, metadata }>
```

#### vl.collection.create(name, options?)

Create a new collection.

```javascript
await vl.collection.create('documents', {
  description: 'Project documentation',
  backend: 'jsonl',  // Optional backend override
});
```

#### vl.collection.list()

List all collections.

```javascript
const collections = await vl.collection.list();
// Returns: Array<{ name, documents, vectors, size, created, updated }>
```

#### vl.collection.show(name)

Get detailed information about a collection.

```javascript
const info = await vl.collection.show('documents');
// Returns: { name, description, documents, vectors, dimensions, size, created, updated }
```

#### vl.collection.stats(name)

Get statistics for a collection.

```javascript
const stats = await vl.collection.stats('documents');
// Returns: { name, documents, vectors, dimensions, size, created, updated }
```

#### vl.collection.delete(name)

Delete a collection and all its data.

```javascript
await vl.collection.delete('old-collection');
```

#### vl.doctor()

Run diagnostics.

```javascript
const report = await vl.doctor();
// Returns: { status: 'ok'|'error', checks: Array<{ name, status, message }> }
```

#### vl.demo()

Run the interactive demo.

```javascript
const result = await vl.demo({ collection: 'demo' });
// Returns: { steps: Array<{ name, status, message }> }
```

### Full Example

```javascript
import { VectorLane } from '@talocode/vectorlane';

async function main() {
  const vl = new VectorLane({ port: 3090 });

  // Initialize
  await vl.init();

  // Create a collection
  await vl.collection.create('knowledge', {
    description: 'Project knowledge base',
  });

  // Ingest text
  await vl.ingestText('VectorLane is a local vector memory store for AI agents.', {
    collection: 'knowledge',
    source: 'about',
  });

  // Ingest a URL
  await vl.ingestUrl('https://example.com/docs', {
    collection: 'knowledge',
    selector: 'article',
  });

  // Search
  const results = await vl.search('vector memory', {
    collection: 'knowledge',
    limit: 3,
  });

  for (const result of results) {
    console.log(`Score: ${result.score}`);
    console.log(`Text: ${result.text}`);
    console.log(`Source: ${result.citation.source}`);
    console.log('---');
  }

  // Get stats
  const stats = await vl.collection.stats('knowledge');
  console.log(`Documents: ${stats.documents}, Vectors: ${stats.vectors}`);
}

main().catch(console.error);
```

### TypeScript Types

```typescript
interface VectorLaneOptions {
  port?: number;
  host?: string;
  timeout?: number;
  retries?: number;
}

interface IngestOptions {
  collection?: string;
  source?: string;
  chunkSize?: number;
  chunkOverlap?: number;
}

interface SearchOptions {
  collection?: string;
  limit?: number;
  threshold?: number;
}

interface SearchResult {
  id: string;
  text: string;
  score: number;
  citation: Citation;
  metadata: Record<string, unknown>;
}

interface Citation {
  source: string;
  page?: number;
  offset: number;
  timestamp: string;
}

interface CollectionInfo {
  name: string;
  description?: string;
  documents: number;
  vectors: number;
  dimensions: number;
  size: string;
  created: string;
  updated: string;
}

interface DoctorReport {
  status: 'ok' | 'error';
  checks: DoctorCheck[];
}

interface DoctorCheck {
  name: string;
  status: 'ok' | 'warn' | 'error';
  message: string;
}
```

## Error Handling

Both SDKs throw errors with descriptive messages:

```javascript
try {
  await vl.search('query');
} catch (error) {
  if (error.code === 'ECONNREFUSED') {
    console.error('Server not running. Start with: vectorlane serve');
  } else if (error.code === 'ENOTFOUND') {
    console.error('Collection not found');
  } else {
    console.error('Error:', error.message);
  }
}
```
