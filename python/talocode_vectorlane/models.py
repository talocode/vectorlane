"""Data models for VectorLane."""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any, Optional


@dataclass
class Collection:
    """A named collection of documents and chunks."""

    name: str
    description: str = ""
    document_count: int = 0
    chunk_count: int = 0

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class DocumentRecord:
    """A document stored in a collection."""

    id: str
    title: str = ""
    collection: str = "default"
    chunk_count: int = 0
    created_at: str = ""

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class ChunkRecord:
    """A text chunk derived from a document."""

    id: str
    document_id: str
    text: str
    index: int = 0
    collection: str = "default"

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class SearchResult:
    """A single search result returned from a similarity query."""

    chunk_id: str
    text: str
    score: float
    document_id: str = ""
    title: str = ""
    collection: str = "default"

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class Citation:
    """A citation referencing a specific chunk within a document."""

    document_id: str
    chunk_id: str
    title: str = ""
    text: str = ""
    score: float = 0.0

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)
