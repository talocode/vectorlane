# talocode-vectorlane

Open-source local vector memory engine for AI agents — Python SDK and CLI.

## Install

```bash
pip install talocode-vectorlane
```

## Quick Start

```python
from talocode_vectorlane import VectorLaneClient

client = VectorLaneClient()
client.init()
client.ingest_text("The quick brown fox jumps over the lazy dog.", title="pangram")
results = client.search("fox")
print(results)
```

## CLI

```bash
vectorlane-py health
vectorlane-py init
vectorlane-py ingest-text --title "note" "Some text to remember."
vectorlane-py search "query"
vectorlane-py demo
```

## License

MIT
