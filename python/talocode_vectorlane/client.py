"""HTTP client for the VectorLane API. Uses only stdlib."""

from __future__ import annotations

import json
import urllib.error
import urllib.request
from typing import Any, Optional


class VectorLaneClient:
    """Lightweight client that talks to a local VectorLane server.

    Default port is 3090. All methods return parsed JSON as dicts/lists.
    """

    def __init__(
        self,
        base_url: str = "http://localhost:3090",
        auth_token: Optional[str] = None,
        timeout: int = 30,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.auth_token = auth_token
        self.timeout = timeout

    def _url(self, path: str) -> str:
        return f"{self.base_url}{path}"

    def _request(
        self,
        method: str,
        path: str,
        data: Optional[dict[str, Any]] = None,
    ) -> Any:
        url = self._url(path)
        body: Optional[bytes] = None
        headers: dict[str, str] = {
            "Accept": "application/json",
            "User-Agent": "talocode-vectorlane/0.1.0",
        }

        if data is not None:
            body = json.dumps(data).encode("utf-8")
            headers["Content-Type"] = "application/json"

        if self.auth_token:
            headers["Authorization"] = f"Bearer {self.auth_token}"

        req = urllib.request.Request(
            url,
            data=body,
            headers=headers,
            method=method,
        )

        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                raw = resp.read().decode("utf-8")
                if not raw:
                    return {}
                return json.loads(raw)
        except urllib.error.HTTPError as exc:
            body_text = ""
            try:
                body_text = exc.read().decode("utf-8")
            except Exception:
                pass
            raise RuntimeError(
                f"HTTP {exc.code} {exc.reason}: {body_text}"
            ) from exc
        except urllib.error.URLError as exc:
            raise RuntimeError(
                f"Cannot connect to VectorLane at {url}: {exc.reason}"
            ) from exc

    def _get(self, path: str) -> Any:
        return self._request("GET", path)

    def _post(self, path: str, data: Optional[dict[str, Any]] = None) -> Any:
        return self._request("POST", path, data)

    # -- API methods --------------------------------------------------------

    def health(self) -> dict:
        """Check server health."""
        return self._get("/health")

    def doctor(self) -> dict:
        """Run diagnostic checks."""
        return self._get("/doctor")

    def init(self) -> dict:
        """Initialize the VectorLane engine and default collections."""
        return self._post("/init")

    def create_collection(
        self,
        name: str,
        description: Optional[str] = None,
    ) -> dict:
        """Create a new collection."""
        payload: dict[str, Any] = {"name": name}
        if description is not None:
            payload["description"] = description
        return self._post("/collections", payload)

    def list_collections(self) -> list:
        """List all collections."""
        return self._get("/collections")

    def ingest_text(
        self,
        text: str,
        title: Optional[str] = None,
        collection: str = "default",
    ) -> dict:
        """Ingest raw text into a collection."""
        payload: dict[str, Any] = {
            "text": text,
            "collection": collection,
        }
        if title is not None:
            payload["title"] = title
        return self._post("/ingest/text", payload)

    def search(
        self,
        query: str,
        collection: str = "default",
        top_k: int = 5,
    ) -> list:
        """Search for similar chunks."""
        payload: dict[str, Any] = {
            "query": query,
            "collection": collection,
            "top_k": top_k,
        }
        return self._post("/search", payload)

    def import_memorylane(
        self,
        path: str,
        collection: str = "memory",
    ) -> dict:
        """Import a MemoryLane file into the given collection."""
        payload: dict[str, Any] = {
            "path": path,
            "collection": collection,
        }
        return self._post("/import/memorylane", payload)

    def import_contextlane(
        self,
        path: str,
        collection: str = "context",
    ) -> dict:
        """Import a ContextLane file into the given collection."""
        payload: dict[str, Any] = {
            "path": path,
            "collection": collection,
        }
        return self._post("/import/contextlane", payload)

    def demo(self) -> dict:
        """Run the built-in demo workflow."""
        return self._post("/demo")
