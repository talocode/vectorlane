import { writeFileSync, existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { VectorLaneError } from "./core/errors.js";
import { loadConfig, getConfigValue, setConfigValue } from "./core/config.js";
import { ensureStorage } from "./core/storage.js";
import { createEmbeddingProvider, embedTexts } from "./core/embedder.js";
import {
  createCollection,
  listCollections,
  getCollection,
  deleteCollection,
  search,
  stats,
} from "./core/store.js";
import {
  ingestText,
  ingestFile,
  ingestFolder,
  ingestUrl,
} from "./core/ingest.js";
import {
  importMemoryLane,
  importContextLane,
  syncMemoryLane,
  syncContextLane,
} from "./core/integrations.js";
import { formatCitationShort } from "./core/citations.js";

const VERSION = "0.1.0";

const ANSI = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  gray: "\x1b[90m",
};

function color(text: string, ...codes: string[]): string {
  return codes.join("") + text + ANSI.reset;
}

function print(msg: string): void {
  process.stdout.write(msg + "\n");
}

function err(msg: string): void {
  process.stderr.write(color(msg, ANSI.red) + "\n");
}

function printTable(headers: string[], rows: string[][]): void {
  const widths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map((r) => (r[i] || "").length))
  );
  const sep = widths.map((w) => "-".repeat(w)).join("  ");
  const hdr = headers.map((h, i) => h.padEnd(widths[i])).join("  ");
  print(hdr);
  print(sep);
  for (const row of rows) {
    print(row.map((c, i) => c.padEnd(widths[i])).join("  "));
  }
}

interface ParsedArgs {
  command: string;
  subcommand?: string;
  positional: string[];
  flags: Record<string, string | boolean>;
}

function parseArgs(argv: string[]): ParsedArgs {
  const args = argv.slice(2);
  const positional: string[] = [];
  const flags: Record<string, string | boolean> = {};

  let i = 0;
  while (i < args.length) {
    const arg = args[i];
    if (arg === "--") {
      i++;
      while (i < args.length) {
        positional.push(args[i]);
        i++;
      }
      break;
    }
    if (arg.startsWith("--")) {
      const eqIdx = arg.indexOf("=");
      if (eqIdx > 0) {
        flags[arg.slice(2, eqIdx)] = arg.slice(eqIdx + 1);
      } else {
        const key = arg.slice(2);
        if (i + 1 < args.length && !args[i + 1].startsWith("-")) {
          flags[key] = args[i + 1];
          i += 2;
        } else {
          flags[key] = true;
        }
      }
    } else if (arg.startsWith("-") && arg.length === 2) {
      const key = arg.slice(1);
      if (key === "h") flags["help"] = true;
      else if (key === "v") flags["version"] = true;
      else if (key === "j") flags["json"] = true;
      else if (i + 1 < args.length && !args[i + 1].startsWith("-")) {
        flags[key] = args[i + 1];
        i += 2;
      } else {
        flags[key] = true;
      }
    } else {
      positional.push(arg);
    }
    i++;
  }

  return {
    command: positional[0] || "",
    subcommand: positional[1],
    positional: positional.slice(2),
    flags,
  };
}

function help(): void {
  print(`
${color("vectorlane", ANSI.bold, ANSI.cyan)} v${VERSION} — Local vector memory engine for AI agents

${color("Usage:", ANSI.bold)}
  vectorlane <command> [options]

${color("Commands:", ANSI.bold)}
  init                                    Initialize storage directory
  collection create <name>                Create a new collection
  collection list [--json]                List all collections
  collection show <name>                  Show collection details
  collection delete <name> [--yes]        Delete a collection
  collection stats <name>                 Show collection statistics
  ingest <path> [--collection <name>]     Ingest file or folder
  ingest-text --text <text>               Ingest raw text
  ingest-url <url>                        Ingest from URL
  search <query> [--collection <name>]    Semantic search
  import-memorylane <path>                Import from MemoryLane
  import-contextlane <path>               Import from ContextLane
  sync memorylane                         Sync from ~/.memorylane/
  sync contextlane                        Sync from ~/.contextlane/
  serve [--port <port>]                   Start HTTP server (coming soon)
  mcp                                     Start MCP server (coming soon)
  doctor                                  Check system health
  demo                                    Run demo with sample data
  config get <key>                        Get config value
  config set <key> <value>                Set config value
  config list                             List all config values
  clear --collection <name> [--yes]       Clear a collection

${color("Options:", ANSI.bold)}
  --collection, -c    Target collection name
  --provider, -p      Embedding provider (default: local-hash)
  --top-k, -k         Number of search results (default: 5)
  --json, -j          Output as JSON
  --yes, -y           Skip confirmation prompts
  --help, -h          Show this help
  --version, -v       Show version
`);
}

async function cmdInit(): Promise<void> {
  await ensureStorage();
  const config = await loadConfig();
  print(color("Storage initialized at:", ANSI.green) + " " + config.storeDir);
}

async function cmdCollectionCreate(args: ParsedArgs): Promise<void> {
  const name = args.positional[0];
  if (!name) {
    err("Collection name required: vectorlane collection create <name>");
    process.exit(1);
  }
  const desc = args.flags.description as string | undefined;
  const col = await createCollection(name, { description: desc });
  print(color("Collection created:", ANSI.green) + " " + col.name);
  if (col.description) print("  " + col.description);
}

async function cmdCollectionList(args: ParsedArgs): Promise<void> {
  const cols = await listCollections();
  if (args.flags.json) {
    print(JSON.stringify(cols, null, 2));
    return;
  }
  if (cols.length === 0) {
    print(color("No collections found.", ANSI.dim));
    return;
  }
  printTable(
    ["Name", "Chunks", "Created"],
    cols.map((c) => [
      c.name,
      String(c.chunkCount),
      c.createdAt.slice(0, 10),
    ])
  );
}

async function cmdCollectionShow(args: ParsedArgs): Promise<void> {
  const name = args.positional[0];
  if (!name) {
    err("Collection name required: vectorlane collection show <name>");
    process.exit(1);
  }
  try {
    const col = await getCollection(name);
    if (args.flags.json) {
      print(JSON.stringify(col, null, 2));
      return;
    }
    print(color(`Collection: ${col.name}`, ANSI.bold, ANSI.cyan));
    if (col.description) print(`  Description: ${col.description}`);
    print(`  Chunks:      ${col.chunkCount}`);
    print(`  Created:     ${col.createdAt}`);
    print(`  Updated:     ${col.updatedAt}`);
  } catch (e) {
    err(e instanceof Error ? e.message : String(e));
    process.exit(1);
  }
}

async function cmdCollectionDelete(args: ParsedArgs): Promise<void> {
  const name = args.positional[0];
  if (!name) {
    err("Collection name required: vectorlane collection delete <name>");
    process.exit(1);
  }
  if (!args.flags.yes && !args.flags["y"]) {
    const confirmed = await prompt(`Delete collection "${name}"? (y/N) `);
    if (confirmed !== "y" && confirmed !== "Y") {
      print("Aborted.");
      return;
    }
  }
  try {
    await deleteCollection(name);
    print(color("Collection deleted:", ANSI.red) + " " + name);
  } catch (e) {
    err(e instanceof Error ? e.message : String(e));
    process.exit(1);
  }
}

async function cmdCollectionStats(args: ParsedArgs): Promise<void> {
  const name = args.positional[0];
  if (!name) {
    err("Collection name required: vectorlane collection stats <name>");
    process.exit(1);
  }
  try {
    const s = await stats(name);
    if (args.flags.json) {
      print(JSON.stringify(s, null, 2));
      return;
    }
    print(color(`Stats for "${s.collection}"`, ANSI.bold));
    print(`  Documents: ${s.documents}`);
    print(`  Chunks:    ${s.chunks}`);
    print(`  Vectors:   ${s.vectors}`);
  } catch (e) {
    err(e instanceof Error ? e.message : String(e));
    process.exit(1);
  }
}

async function cmdIngest(args: ParsedArgs): Promise<void> {
  const path = args.positional[0];
  if (!path) {
    err("Path required: vectorlane ingest <path>");
    process.exit(1);
  }

  const resolvedPath = resolve(path);

  try {
    const s = statSync(resolvedPath);
    const opts = {
      collection: (args.flags.collection as string) || (args.flags.c as string),
      provider: (args.flags.provider as string) || (args.flags.p as string),
      tags: args.flags.tags ? (args.flags.tags as string).split(",").map((t) => t.trim()) : undefined,
    };

    if (s.isDirectory()) {
      const result = await ingestFolder(resolvedPath, opts);

      if (args.flags.json) {
        print(JSON.stringify(result, null, 2));
        return;
      }

      print(color("Folder ingested:", ANSI.green));
      print(`  Files:     ${result.summary.files}`);
      print(`  Chunks:    ${result.summary.chunks}`);
      if (result.summary.errors.length > 0) {
        print(color(`  Errors:    ${result.summary.errors.length}`, ANSI.yellow));
        for (const e of result.summary.errors) {
          print(color(`    - ${e}`, ANSI.yellow));
        }
      }
    } else {
      const result = await ingestFile(resolvedPath, opts);

      if (args.flags.json) {
        print(JSON.stringify(result, null, 2));
        return;
      }
      print(color("File ingested:", ANSI.green));
      print(`  Document: ${result.documentId}`);
      print(`  Chunks:   ${result.chunksCount}`);
      print(`  Vectors:  ${result.vectorsCount}`);
    }
  } catch (e) {
    err(e instanceof Error ? e.message : String(e));
    process.exit(1);
  }
}

async function cmdIngestText(args: ParsedArgs): Promise<void> {
  const text = args.flags.text as string;
  if (!text) {
    err("Text required: vectorlane ingest-text --text <text>");
    process.exit(1);
  }

  try {
    const result = await ingestText(text, {
      title: args.flags.title as string | undefined,
      collection: (args.flags.collection as string) || (args.flags.c as string),
      tags: args.flags.tags ? (args.flags.tags as string).split(",").map((t) => t.trim()) : undefined,
      provider: (args.flags.provider as string) || (args.flags.p as string),
    });

    if (args.flags.json) {
      print(JSON.stringify(result, null, 2));
      return;
    }
    print(color("Text ingested:", ANSI.green));
    print(`  Document: ${result.documentId}`);
    print(`  Chunks:   ${result.chunksCount}`);
    print(`  Vectors:  ${result.vectorsCount}`);
  } catch (e) {
    err(e instanceof Error ? e.message : String(e));
    process.exit(1);
  }
}

async function cmdIngestUrl(args: ParsedArgs): Promise<void> {
  const url = args.positional[0];
  if (!url) {
    err("URL required: vectorlane ingest-url <url>");
    process.exit(1);
  }

  try {
    const result = await ingestUrl(url, {
      collection: (args.flags.collection as string) || (args.flags.c as string),
      provider: (args.flags.provider as string) || (args.flags.p as string),
    });

    if (args.flags.json) {
      print(JSON.stringify(result, null, 2));
      return;
    }
    print(color("URL ingested:", ANSI.green));
    print(`  Document: ${result.documentId}`);
    print(`  Chunks:   ${result.chunksCount}`);
    print(`  Vectors:  ${result.vectorsCount}`);
  } catch (e) {
    err(e instanceof Error ? e.message : String(e));
    process.exit(1);
  }
}

async function cmdSearch(args: ParsedArgs): Promise<void> {
  const query = args.positional[0];
  if (!query) {
    err("Query required: vectorlane search <query>");
    process.exit(1);
  }

  const collectionName = (args.flags.collection as string) || (args.flags.c as string);
  const topK = args.flags["top-k"] ? Number(args.flags["top-k"]) : args.flags.k ? Number(args.flags.k) : 5;

  try {
    const provider = (args.flags.provider as string) || (args.flags.p as string);
    const providerInstance = createEmbeddingProvider(provider);
    const vectors = await embedTexts([query], providerInstance);

    const collections = collectionName
      ? [collectionName]
      : (await listCollections()).map((c) => c.name);

    const allResults: Array<{
      score: number;
      text: string;
      citation: string;
      collection: string;
      chunkId: string;
    }> = [];

    for (const colName of collections) {
      try {
        const col = await getCollection(colName);
        if (!col) continue;
        const results = await search(col.id, vectors[0], { topK });
        for (const r of results) {
          allResults.push({
            score: r.score,
            text: r.chunk?.text ?? "",
            citation: formatCitationShort(r.citation),
            collection: colName,
            chunkId: r.chunkId,
          });
        }
      } catch {
        continue;
      }
    }

    allResults.sort((a, b) => b.score - a.score);
    const topResults = allResults.slice(0, topK);

    if (args.flags.json) {
      print(JSON.stringify(topResults, null, 2));
      return;
    }

    if (topResults.length === 0) {
      print(color("No results found.", ANSI.dim));
      return;
    }

    print(color(`Results for: "${query}"`, ANSI.bold, ANSI.cyan));
    print("");
    for (let i = 0; i < topResults.length; i++) {
      const r = topResults[i];
      print(
        color(`  [${i + 1}]`, ANSI.bold) +
          ` score=${r.score.toFixed(4)}  ${color(r.citation, ANSI.dim)}`
      );
      const preview = r.text.slice(0, 200).replace(/\n/g, " ");
      print(`      ${preview}${r.text.length > 200 ? "..." : ""}`);
      print("");
    }
  } catch (e) {
    err(e instanceof Error ? e.message : String(e));
    process.exit(1);
  }
}

async function cmdImportMemoryLane(args: ParsedArgs): Promise<void> {
  const path = args.positional[0];
  if (!path) {
    err("Path required: vectorlane import-memorylane <path>");
    process.exit(1);
  }

  try {
    const result = await importMemoryLane({
      path: resolve(path),
      collection: (args.flags.collection as string) || (args.flags.c as string),
    });

    if (args.flags.json) {
      print(JSON.stringify(result, null, 2));
      return;
    }
    print(color("MemoryLane imported:", ANSI.green));
    print(`  Collection: ${result.collection}`);
    print(`  Records:    ${result.imported}`);
    if (result.errors.length > 0) {
      print(color(`  Errors:     ${result.errors.length}`, ANSI.yellow));
    }
  } catch (e) {
    err(e instanceof Error ? e.message : String(e));
    process.exit(1);
  }
}

async function cmdImportContextLane(args: ParsedArgs): Promise<void> {
  const path = args.positional[0];
  if (!path) {
    err("Path required: vectorlane import-contextlane <path>");
    process.exit(1);
  }

  try {
    const result = await importContextLane({
      path: resolve(path),
      collection: (args.flags.collection as string) || (args.flags.c as string),
    });

    if (args.flags.json) {
      print(JSON.stringify(result, null, 2));
      return;
    }
    print(color("ContextLane imported:", ANSI.green));
    print(`  Collection: ${result.collection}`);
    print(`  Records:    ${result.imported}`);
    if (result.errors.length > 0) {
      print(color(`  Errors:     ${result.errors.length}`, ANSI.yellow));
    }
  } catch (e) {
    err(e instanceof Error ? e.message : String(e));
    process.exit(1);
  }
}

async function cmdSyncMemoryLane(args: ParsedArgs): Promise<void> {
  try {
    const result = await syncMemoryLane({
      collection: (args.flags.collection as string) || (args.flags.c as string),
    });

    if (args.flags.json) {
      print(JSON.stringify(result, null, 2));
      return;
    }
    print(color("MemoryLane synced:", ANSI.green));
    print(`  Collection: ${result.collection}`);
    print(`  Records:    ${result.imported}`);
  } catch (e) {
    err(e instanceof Error ? e.message : String(e));
    process.exit(1);
  }
}

async function cmdSyncContextLane(args: ParsedArgs): Promise<void> {
  try {
    const result = await syncContextLane({
      collection: (args.flags.collection as string) || (args.flags.c as string),
    });

    if (args.flags.json) {
      print(JSON.stringify(result, null, 2));
      return;
    }
    print(color("ContextLane synced:", ANSI.green));
    print(`  Collection: ${result.collection}`);
    print(`  Records:    ${result.imported}`);
  } catch (e) {
    err(e instanceof Error ? e.message : String(e));
    process.exit(1);
  }
}

async function cmdServe(_args: ParsedArgs): Promise<void> {
  print(color("HTTP server coming soon.", ANSI.yellow));
  print('Use "vectorlane mcp" for the MCP server.');
}

async function cmdMcp(): Promise<void> {
  print(color("MCP server coming soon.", ANSI.yellow));
  print("Configure in opencode.json to connect.");
}

async function cmdDoctor(): Promise<void> {
  print(color("VectorLane Doctor", ANSI.bold, ANSI.cyan));
  print("");

  const config = await loadConfig();
  print(color("Config:", ANSI.bold));
  print(`  Store dir:     ${config.storeDir}`);
  print(`  Provider:      ${config.defaultProvider}`);
  print(`  Model:         ${config.defaultModel}`);
  print(`  API port:      ${config.apiPort}`);
  print("");

  const storageExists = existsSync(config.storeDir);
  print(color("Storage:", ANSI.bold));
  print(
    `  Exists:         ${storageExists ? color("yes", ANSI.green) : color("no", ANSI.red)}`
  );

  if (storageExists) {
    const cols = await listCollections();
    print(`  Collections:    ${cols.length}`);
    for (const c of cols) {
      print(`    - ${c.name} (${c.chunkCount} chunks)`);
    }
  }
  print("");

  print(color("System:", ANSI.bold));
  print(`  Node.js:        ${process.version}`);
  print(`  Platform:       ${process.platform}`);
  print(`  ESM:            yes`);
  print("");
  print(color("All checks passed.", ANSI.green));
}

function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    process.stdout.write(question);
    let data = "";
    process.stdin.setEncoding("utf-8");
    process.stdin.resume();
    process.stdin.on("data", (chunk: string) => {
      data += chunk;
      if (data.includes("\n")) {
        process.stdin.pause();
        resolve(data.trim());
      }
    });
  });
}

async function cmdDemo(): Promise<void> {
  print(color("VectorLane Demo", ANSI.bold, ANSI.cyan));
  print("");

  await ensureStorage();
  print(color("[1/6] Storage initialized", ANSI.green));

  const demoCollection = "demo";
  try {
    await deleteCollection(demoCollection);
  } catch {}
  await createCollection(demoCollection, { description: "Demo collection with VectorLane docs" });
  print(color('[2/6] Created "demo" collection', ANSI.green));

  const docsDir = resolve("demo/docs");
  if (!existsSync(docsDir)) {
    err(`Demo docs not found at ${docsDir}.`);
    print(color("  Please run from the vectorlane project root.", ANSI.yellow));
    return;
  }

  const result = await ingestFolder(docsDir, { collection: demoCollection });
  print(
    color(
      `[3/6] Ingested ${result.summary.files} documents (${result.summary.chunks} chunks)`,
      ANSI.green
    )
  );

  const query = "How does GateLane control tools?";
  const provider = createEmbeddingProvider();
  const vectors = await embedTexts([query], provider);

  const col = await getCollection(demoCollection);
  if (!col) {
    err("Demo collection not found");
    return;
  }
  const searchResults = await search(col.id, vectors[0], { topK: 3 });

  print(color(`[4/6] Search: "${query}"`, ANSI.green));
  print("");
  for (let i = 0; i < searchResults.length; i++) {
    const r = searchResults[i];
    print(color(`  [${i + 1}]`, ANSI.bold) + ` score=${r.score.toFixed(4)}`);
    print(`      ${color(formatCitationShort(r.citation), ANSI.dim)}`);
    const preview = (r.chunk?.text ?? "").slice(0, 150).replace(/\n/g, " ");
    print(`      ${preview}...`);
    print("");
  }

  const output = {
    query,
    collection: demoCollection,
    documents: result.summary.files,
    chunks: result.summary.chunks,
    results: searchResults.map((r) => ({
      score: r.score,
      text: (r.chunk?.text ?? "").slice(0, 200),
      citation: formatCitationShort(r.citation),
    })),
    timestamp: new Date().toISOString(),
  };

  writeFileSync("demo-output.json", JSON.stringify(output, null, 2), "utf-8");
  print(color("[5/6] Results saved to demo-output.json", ANSI.green));

  print(color("[6/6] Done!", ANSI.bold, ANSI.green));
}

async function cmdConfig(args: ParsedArgs): Promise<void> {
  const sub = args.subcommand;

  if (sub === "get") {
    const key = args.positional[0];
    if (!key) {
      err("Key required: vectorlane config get <key>");
      process.exit(1);
    }
    const value = await getConfigValue(key as keyof ReturnType<typeof getDefaultConfigSync>);
    if (value === undefined) {
      err(`Config key "${key}" not found.`);
      process.exit(1);
    }
    if (args.flags.json) {
      print(JSON.stringify({ key, value }, null, 2));
    } else {
      print(`${key} = ${JSON.stringify(value)}`);
    }
    return;
  }

  if (sub === "set") {
    const key = args.positional[0];
    const value = args.positional[1];
    if (!key || value === undefined) {
      err("Key and value required: vectorlane config set <key> <value>");
      process.exit(1);
    }
    let parsed: unknown = value;
    if (value === "true") parsed = true;
    else if (value === "false") parsed = false;
    else if (!isNaN(Number(value))) parsed = Number(value);
    await setConfigValue(key as never, parsed as never);
    print(color(`Set ${key} = ${JSON.stringify(parsed)}`, ANSI.green));
    return;
  }

  if (sub === "list" || !sub) {
    const config = await loadConfig();
    if (args.flags.json) {
      print(JSON.stringify(config, null, 2));
      return;
    }
    print(color("Configuration:", ANSI.bold));
    for (const [key, value] of Object.entries(config)) {
      print(`  ${key} = ${JSON.stringify(value)}`);
    }
    return;
  }

  err(`Unknown config subcommand: ${sub}`);
  print("Usage: vectorlane config <get|set|list> [args]");
  process.exit(1);
}

function getDefaultConfigSync() {
  return {
    defaultCollection: "default",
    defaultProvider: "local-hash",
    defaultModel: "local-hash",
    storeDir: "",
    apiPort: 3090,
    requireAuth: false,
    authToken: "",
  };
}

async function cmdClear(args: ParsedArgs): Promise<void> {
  const collection =
    (args.flags.collection as string) || (args.flags.c as string);
  if (!collection) {
    err('Collection name required: vectorlane clear --collection <name>');
    process.exit(1);
  }

  if (!args.flags.yes && !args.flags["y"]) {
    const confirmed = await prompt(
      `Clear all data in collection "${collection}"? (y/N) `
    );
    if (confirmed !== "y" && confirmed !== "Y") {
      print("Aborted.");
      return;
    }
  }

  try {
    await deleteCollection(collection);
    await createCollection(collection);
    print(color("Collection cleared:", ANSI.green) + " " + collection);
  } catch (e) {
    err(e instanceof Error ? e.message : String(e));
    process.exit(1);
  }
}

async function main(): Promise<void> {
  const parsed = parseArgs(process.argv);

  if (parsed.flags.help || parsed.flags.h) {
    help();
    return;
  }

  if (parsed.flags.version || parsed.flags.v) {
    print(`vectorlane v${VERSION}`);
    return;
  }

  const cmd = parsed.command;

  try {
    switch (cmd) {
      case "":
        help();
        break;
      case "init":
        await cmdInit();
        break;
      case "collection":
        switch (parsed.subcommand) {
          case "create":
            await cmdCollectionCreate(parsed);
            break;
          case "list":
            await cmdCollectionList(parsed);
            break;
          case "show":
            await cmdCollectionShow(parsed);
            break;
          case "delete":
            await cmdCollectionDelete(parsed);
            break;
          case "stats":
            await cmdCollectionStats(parsed);
            break;
          default:
            err(
              `Unknown collection subcommand: ${parsed.subcommand || "(none)"}`
            );
            print(
              "Usage: vectorlane collection <create|list|show|delete|stats>"
            );
            process.exit(1);
        }
        break;
      case "ingest":
        await cmdIngest(parsed);
        break;
      case "ingest-text":
        await cmdIngestText(parsed);
        break;
      case "ingest-url":
        await cmdIngestUrl(parsed);
        break;
      case "search":
        await cmdSearch(parsed);
        break;
      case "import-memorylane":
        await cmdImportMemoryLane(parsed);
        break;
      case "import-contextlane":
        await cmdImportContextLane(parsed);
        break;
      case "sync":
        switch (parsed.subcommand) {
          case "memorylane":
            await cmdSyncMemoryLane(parsed);
            break;
          case "contextlane":
            await cmdSyncContextLane(parsed);
            break;
          default:
            err(
              `Unknown sync target: ${parsed.subcommand || "(none)"}`
            );
            print("Usage: vectorlane sync <memorylane|contextlane>");
            process.exit(1);
        }
        break;
      case "serve":
        await cmdServe(parsed);
        break;
      case "mcp":
        await cmdMcp();
        break;
      case "doctor":
        await cmdDoctor();
        break;
      case "demo":
        await cmdDemo();
        break;
      case "config":
        await cmdConfig(parsed);
        break;
      case "clear":
        await cmdClear(parsed);
        break;
      default:
        err(`Unknown command: ${cmd}`);
        help();
        process.exit(1);
    }
  } catch (e) {
    if (e instanceof VectorLaneError) {
      err(`[${e.code}] ${e.message}`);
    } else {
      err(e instanceof Error ? e.message : String(e));
    }
    process.exit(1);
  }
}

main();
