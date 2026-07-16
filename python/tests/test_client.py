"""Tests for VectorLaneClient with mocked HTTP."""

from __future__ import annotations

import json
import unittest
from typing import Any
from unittest.mock import MagicMock, patch

from talocode_vectorlane.client import VectorLaneClient


def _mock_response(data: Any, status: int = 200) -> MagicMock:
    """Create a mock urllib response."""
    body = json.dumps(data).encode("utf-8")
    resp = MagicMock()
    resp.read.return_value = body
    resp.__enter__ = lambda s: s
    resp.__exit__ = MagicMock(return_value=False)
    resp.status = status
    resp.getcode.return_value = status
    return resp


class TestVectorLaneClient(unittest.TestCase):
    def setUp(self) -> None:
        self.client = VectorLaneClient(base_url="http://test:3090")

    @patch("urllib.request.urlopen")
    def test_health(self, mock_urlopen: MagicMock) -> None:
        mock_urlopen.return_value = _mock_response({"status": "ok"})
        result = self.client.health()
        self.assertEqual(result["status"], "ok")
        mock_urlopen.assert_called_once()
        req = mock_urlopen.call_args[0][0]
        self.assertEqual(req.full_url, "http://test:3090/health")
        self.assertEqual(req.method, "GET")

    @patch("urllib.request.urlopen")
    def test_init(self, mock_urlopen: MagicMock) -> None:
        mock_urlopen.return_value = _mock_response({"ok": True})
        result = self.client.init()
        self.assertTrue(result["ok"])
        req = mock_urlopen.call_args[0][0]
        self.assertEqual(req.method, "POST")

    @patch("urllib.request.urlopen")
    def test_create_collection(self, mock_urlopen: MagicMock) -> None:
        mock_urlopen.return_value = _mock_response({"name": "notes"})
        result = self.client.create_collection("notes", description="My notes")
        self.assertEqual(result["name"], "notes")
        req = mock_urlopen.call_args[0][0]
        body = json.loads(req.data.decode("utf-8"))
        self.assertEqual(body["name"], "notes")
        self.assertEqual(body["description"], "My notes")

    @patch("urllib.request.urlopen")
    def test_list_collections(self, mock_urlopen: MagicMock) -> None:
        collections = [{"name": "default"}, {"name": "memory"}]
        mock_urlopen.return_value = _mock_response(collections)
        result = self.client.list_collections()
        self.assertEqual(len(result), 2)
        self.assertEqual(result[0]["name"], "default")

    @patch("urllib.request.urlopen")
    def test_ingest_text(self, mock_urlopen: MagicMock) -> None:
        mock_urlopen.return_value = _mock_response({"document_id": "doc-1", "chunks": 3})
        result = self.client.ingest_text("Hello world", title="greeting", collection="notes")
        self.assertEqual(result["document_id"], "doc-1")
        req = mock_urlopen.call_args[0][0]
        body = json.loads(req.data.decode("utf-8"))
        self.assertEqual(body["text"], "Hello world")
        self.assertEqual(body["title"], "greeting")
        self.assertEqual(body["collection"], "notes")

    @patch("urllib.request.urlopen")
    def test_search(self, mock_urlopen: MagicMock) -> None:
        results = [
            {"chunk_id": "c1", "text": "hello", "score": 0.95},
            {"chunk_id": "c2", "text": "world", "score": 0.80},
        ]
        mock_urlopen.return_value = _mock_response(results)
        result = self.client.search("hello", collection="default", top_k=2)
        self.assertEqual(len(result), 2)
        self.assertEqual(result[0]["score"], 0.95)
        req = mock_urlopen.call_args[0][0]
        body = json.loads(req.data.decode("utf-8"))
        self.assertEqual(body["query"], "hello")
        self.assertEqual(body["top_k"], 2)

    @patch("urllib.request.urlopen")
    def test_import_memorylane(self, mock_urlopen: MagicMock) -> None:
        mock_urlopen.return_value = _mock_response({"imported": 10})
        result = self.client.import_memorylane("/path/to/file.md", collection="mem")
        self.assertEqual(result["imported"], 10)
        req = mock_urlopen.call_args[0][0]
        body = json.loads(req.data.decode("utf-8"))
        self.assertEqual(body["path"], "/path/to/file.md")

    @patch("urllib.request.urlopen")
    def test_import_contextlane(self, mock_urlopen: MagicMock) -> None:
        mock_urlopen.return_value = _mock_response({"imported": 5})
        result = self.client.import_contextlane("/path/to/ctx.md")
        self.assertEqual(result["imported"], 5)

    @patch("urllib.request.urlopen")
    def test_demo(self, mock_urlopen: MagicMock) -> None:
        mock_urlopen.return_value = _mock_response({"demo": "complete"})
        result = self.client.demo()
        self.assertEqual(result["demo"], "complete")

    @patch("urllib.request.urlopen")
    def test_auth_token(self, mock_urlopen: MagicMock) -> None:
        client = VectorLaneClient(
            base_url="http://test:3090",
            auth_token="secret-token",
        )
        mock_urlopen.return_value = _mock_response({"ok": True})
        client.health()
        req = mock_urlopen.call_args[0][0]
        self.assertEqual(req.get_header("Authorization"), "Bearer secret-token")

    @patch("urllib.request.urlopen")
    def test_url_trailing_slash(self, mock_urlopen: MagicMock) -> None:
        client = VectorLaneClient(base_url="http://test:3090/")
        mock_urlopen.return_value = _mock_response({"ok": True})
        client.health()
        req = mock_urlopen.call_args[0][0]
        self.assertEqual(req.full_url, "http://test:3090/health")


if __name__ == "__main__":
    unittest.main()
