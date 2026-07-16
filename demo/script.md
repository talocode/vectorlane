# VectorLane Demo Script

**Duration:** 38 seconds
**Format:** Silent terminal-style demo video
**Target:** Developers evaluating local vector memory for AI agents

---

## Segment 1 — Title Card (0:00–0:03)

**Visual:** Dark background. Cyan tagline fades in centered. Gray version text below.

**On-screen text:**
```
▸  Searchable local memory for AI agents

    VectorLane v0.1.0
```

**Message:** Establish product identity and positioning.

---

## Segment 2 — Init (0:03–0:07)

**Visual:** Terminal-style left-aligned. Green prompt + command, then white confirmation.

**On-screen text:**
```
▸ $ vectorlane init

▸ Storage initialized at ~/.vectorlane
```

**Message:** One command to initialize. Zero config.

---

## Segment 3 — Ingest (0:07–0:13)

**Visual:** Green command line, then white result with chunk count.

**On-screen text:**
```
▸ $ vectorlane ingest demo/docs --collection talocode

▸ Ingested 3 documents 43 chunks
```

**Message:** Point it at a folder, get chunks. Automatic processing.

---

## Segment 4 — Embeddings (0:13–0:17)

**Visual:** Centered info card. Cyan heading, gray subtitle.

**On-screen text:**
```
  Embeddings: local-hash 256 dimensions

  Offline. No API key required.
```

**Message:** Runs locally. No cloud dependency. Privacy-first.

---

## Segment 5 — Search (0:17–0:23)

**Visual:** Terminal-style. Green prompt, cyan query with quotes.

**On-screen text:**
```
▸ $ vectorlane search
    "How does GateLane control tools?" --citations
```

**Message:** Natural language queries with citation support.

---

## Segment 6 — Results (0:23–0:31)

**Visual:** Gray "Results" header. Three ranked results appear sequentially with scores and citations.

**On-screen text:**
```
Results

1. GateLane uses a tool-policy registry to control agent tool access
   score: 0.94   cite: docs/gatelane.md L42

2. Tool access is gated by a permission check at runtime
   score: 0.87   cite: src/gate.ts L18

3. Each agent declares tools in lane.json at startup
   score: 0.79   cite: config/lane.json L7
```

**Message:** Ranked results with exact source citations.

---

## Segment 7 — Integrations (0:31–0:35)

**Visual:** Centered. Gray label, white integration names, green import command.

**On-screen text:**
```
  Integrations

  MemoryLane import  |  ContextLane import

  $ vectorlane import-memorylane ./export.json
```

**Message:** Compatible with existing memory systems.

---

## Segment 8 — End Card (0:35–0:38)

**Visual:** Centered. Cyan tagline, green install command.

**On-screen text:**
```
  VectorLane - open-source local vector memory engine

  npm install -g @talocode/vectorlane
```

**Message:** Open source. Install in one command. Start building.

---

## Production Notes

- **Font:** DejaVu Sans Mono (system)
- **Background:** Solid #1C1C1C
- **No audio track**
- **Text timing:** Each element uses ffmpeg `enable` filter for staggered appearance
- **Re-encode:** Segments built individually, concatenated with `-c copy`
