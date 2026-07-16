# MemoryLane

MemoryLane is a persistent memory layer for AI agents. It remembers past interactions, user preferences, and learned facts across sessions.

## Core Concepts

MemoryLane stores structured memory records that capture:

- **Conversations**: Key exchanges between agent and user
- **Facts**: Learned information about the user, project, or domain
- **Decisions**: Choices made during prior sessions and their reasoning
- **Preferences**: User preferences for style, tools, responses

## How MemoryLane Works

When an agent interacts with a user, MemoryLane:

1. **Captures** significant moments from the conversation
2. **Indexes** them as vector embeddings for semantic retrieval
3. **Retrieves** relevant memories when the agent needs context in future sessions

This creates a continuity layer so agents don't start fresh every time. The agent can query MemoryLane with natural language questions like "What did the user prefer for code style?" and get ranked results.

## Memory Structure

Each memory record contains:

- **Content**: The text of the memory
- **Tags**: Classification labels (e.g., `preference`, `fact`, `decision`)
- **Session**: Which session created this memory
- **Importance**: A score from 0-1 indicating relevance
- **Timestamp**: When the memory was created

## Importing into VectorLane

MemoryLane exports can be imported into VectorLane with:

```bash
vectorlane import-memorylane ~/.memorylane/export.json
vectorlane sync memorylane
```

This creates a VectorLane collection with vectorized memory records, enabling cross-tool semantic search.
