"""talocode_vectorlane — Python SDK and CLI for VectorLane."""

__version__ = "0.1.0"

from talocode_vectorlane.client import VectorLaneClient
from talocode_vectorlane.models import (
    Citation,
    ChunkRecord,
    Collection,
    DocumentRecord,
    SearchResult,
)

__all__ = [
    "__version__",
    "VectorLaneClient",
    "Citation",
    "ChunkRecord",
    "Collection",
    "DocumentRecord",
    "SearchResult",
]
