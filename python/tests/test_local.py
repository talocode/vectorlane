"""Tests for local functionality: models, CLI arg parsing, etc."""

from __future__ import annotations

import argparse
import json
import unittest

from talocode_vectorlane import __version__
from talocode_vectorlane.cli import build_parser
from talocode_vectorlane.models import (
    Citation,
    ChunkRecord,
    Collection,
    DocumentRecord,
    SearchResult,
)


class TestModels(unittest.TestCase):
    def test_collection_to_dict(self) -> None:
        c = Collection(name="notes", description="My notes", document_count=3, chunk_count=12)
        d = c.to_dict()
        self.assertEqual(d["name"], "notes")
        self.assertEqual(d["chunk_count"], 12)

    def test_document_record_to_dict(self) -> None:
        doc = DocumentRecord(id="d1", title="Hello", collection="default")
        d = doc.to_dict()
        self.assertEqual(d["id"], "d1")
        self.assertEqual(d["collection"], "default")

    def test_chunk_record_to_dict(self) -> None:
        chunk = ChunkRecord(id="c1", document_id="d1", text="hello world", index=0)
        d = chunk.to_dict()
        self.assertEqual(d["text"], "hello world")

    def test_search_result_to_dict(self) -> None:
        sr = SearchResult(chunk_id="c1", text="hello", score=0.95, document_id="d1")
        d = sr.to_dict()
        self.assertAlmostEqual(d["score"], 0.95)

    def test_citation_to_dict(self) -> None:
        cit = Citation(document_id="d1", chunk_id="c1", title="Doc", text="excerpt", score=0.88)
        d = cit.to_dict()
        self.assertEqual(d["title"], "Doc")

    def test_model_defaults(self) -> None:
        c = Collection(name="empty")
        self.assertEqual(c.document_count, 0)
        self.assertEqual(c.description, "")

        sr = SearchResult(chunk_id="x", text="y", score=0.0)
        self.assertEqual(sr.title, "")


class TestVersion(unittest.TestCase):
    def test_version_exists(self) -> None:
        self.assertIsInstance(__version__, str)
        parts = __version__.split(".")
        self.assertEqual(len(parts), 3)


class TestCLIParser(unittest.TestCase):
    def test_version_flag(self) -> None:
        parser = build_parser()
        with self.assertRaises(SystemExit) as ctx:
            parser.parse_args(["--version"])
        self.assertEqual(ctx.exception.code, 0)

    def test_health_command(self) -> None:
        parser = build_parser()
        args = parser.parse_args(["health"])
        self.assertEqual(args.command, "health")

    def test_doctor_command(self) -> None:
        parser = build_parser()
        args = parser.parse_args(["doctor"])
        self.assertEqual(args.command, "doctor")

    def test_init_command(self) -> None:
        parser = build_parser()
        args = parser.parse_args(["init"])
        self.assertEqual(args.command, "init")

    def test_create_collection_command(self) -> None:
        parser = build_parser()
        args = parser.parse_args(["create-collection", "notes", "-d", "My notes"])
        self.assertEqual(args.command, "create-collection")
        self.assertEqual(args.name, "notes")
        self.assertEqual(args.description, "My notes")

    def test_list_command(self) -> None:
        parser = build_parser()
        args = parser.parse_args(["list"])
        self.assertEqual(args.command, "list")

    def test_ingest_text_command(self) -> None:
        parser = build_parser()
        args = parser.parse_args(["ingest-text", "hello world", "-t", "greeting", "-c", "notes"])
        self.assertEqual(args.command, "ingest-text")
        self.assertEqual(args.text, "hello world")
        self.assertEqual(args.title, "greeting")
        self.assertEqual(args.collection, "notes")

    def test_search_command(self) -> None:
        parser = build_parser()
        args = parser.parse_args(["search", "hello", "-c", "notes", "-k", "10"])
        self.assertEqual(args.command, "search")
        self.assertEqual(args.query, "hello")
        self.assertEqual(args.collection, "notes")
        self.assertEqual(args.top_k, 10)

    def test_demo_command(self) -> None:
        parser = build_parser()
        args = parser.parse_args(["demo"])
        self.assertEqual(args.command, "demo")

    def test_no_command(self) -> None:
        parser = build_parser()
        args = parser.parse_args([])
        self.assertIsNone(args.command)


class TestModelSerialization(unittest.TestCase):
    """Verify models survive round-trip through JSON."""

    def test_search_result_round_trip(self) -> None:
        sr = SearchResult(chunk_id="c1", text="hello", score=0.95, title="Doc")
        d = sr.to_dict()
        j = json.dumps(d)
        d2 = json.loads(j)
        self.assertEqual(d2["chunk_id"], "c1")
        self.assertAlmostEqual(d2["score"], 0.95)

    def test_collection_round_trip(self) -> None:
        c = Collection(name="test", description="A test collection", document_count=5, chunk_count=20)
        d = c.to_dict()
        j = json.dumps(d)
        d2 = json.loads(j)
        self.assertEqual(d2["name"], "test")
        self.assertEqual(d2["chunk_count"], 20)

    def test_citation_round_trip(self) -> None:
        cit = Citation(document_id="d1", chunk_id="c1", text="excerpt", score=0.88)
        d = cit.to_dict()
        j = json.dumps(d)
        d2 = json.loads(j)
        self.assertEqual(d2["document_id"], "d1")


if __name__ == "__main__":
    unittest.main()
