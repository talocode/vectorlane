"""CLI entry point for VectorLane."""

from __future__ import annotations

import argparse
import json
import sys
from typing import Sequence

from talocode_vectorlane import __version__
from talocode_vectorlane.client import VectorLaneClient


def _print_json(data: object) -> None:
    print(json.dumps(data, indent=2))


def _get_client(args: argparse.Namespace) -> VectorLaneClient:
    return VectorLaneClient(
        base_url=args.base_url,
        auth_token=args.auth_token,
    )


def cmd_health(args: argparse.Namespace) -> int:
    client = _get_client(args)
    _print_json(client.health())
    return 0


def cmd_doctor(args: argparse.Namespace) -> int:
    client = _get_client(args)
    _print_json(client.doctor())
    return 0


def cmd_init(args: argparse.Namespace) -> int:
    client = _get_client(args)
    _print_json(client.init())
    return 0


def cmd_create_collection(args: argparse.Namespace) -> int:
    client = _get_client(args)
    _print_json(client.create_collection(args.name, args.description))
    return 0


def cmd_list(args: argparse.Namespace) -> int:
    client = _get_client(args)
    _print_json(client.list_collections())
    return 0


def cmd_ingest_text(args: argparse.Namespace) -> int:
    client = _get_client(args)
    text = args.text
    if args.text == "-":
        text = sys.stdin.read()
    _print_json(client.ingest_text(text, title=args.title, collection=args.collection))
    return 0


def cmd_search(args: argparse.Namespace) -> int:
    client = _get_client(args)
    results = client.search(args.query, collection=args.collection, top_k=args.top_k)
    _print_json(results)
    return 0


def cmd_demo(args: argparse.Namespace) -> int:
    client = _get_client(args)
    _print_json(client.demo())
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="vectorlane-py",
        description="VectorLane — local vector memory engine for AI agents",
    )
    parser.add_argument(
        "--version",
        action="version",
        version=f"%(prog)s {__version__}",
    )
    parser.add_argument(
        "--base-url",
        default="http://localhost:3090",
        help="VectorLane server URL (default: http://localhost:3090)",
    )
    parser.add_argument(
        "--auth-token",
        default=None,
        help="Bearer token for authenticated requests",
    )

    sub = parser.add_subparsers(dest="command", help="Available commands")

    sub.add_parser("health", help="Check server health")
    sub.add_parser("doctor", help="Run diagnostic checks")
    sub.add_parser("init", help="Initialize the engine")

    p_create = sub.add_parser("create-collection", help="Create a collection")
    p_create.add_argument("name", help="Collection name")
    p_create.add_argument("-d", "--description", default=None, help="Description")

    sub.add_parser("list", help="List collections")

    p_ingest = sub.add_parser("ingest-text", help="Ingest text into a collection")
    p_ingest.add_argument("text", help="Text to ingest (use - for stdin)")
    p_ingest.add_argument("-t", "--title", default=None, help="Document title")
    p_ingest.add_argument("-c", "--collection", default="default", help="Collection name")

    p_search = sub.add_parser("search", help="Search for similar chunks")
    p_search.add_argument("query", help="Search query")
    p_search.add_argument("-c", "--collection", default="default", help="Collection name")
    p_search.add_argument("-k", "--top-k", type=int, default=5, help="Number of results")

    sub.add_parser("demo", help="Run the built-in demo")

    return parser


def main(argv: Sequence[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    if args.command is None:
        parser.print_help()
        return 0

    handlers = {
        "health": cmd_health,
        "doctor": cmd_doctor,
        "init": cmd_init,
        "create-collection": cmd_create_collection,
        "list": cmd_list,
        "ingest-text": cmd_ingest_text,
        "search": cmd_search,
        "demo": cmd_demo,
    }

    handler = handlers.get(args.command)
    if handler is None:
        parser.error(f"Unknown command: {args.command}")

    try:
        return handler(args)
    except RuntimeError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
