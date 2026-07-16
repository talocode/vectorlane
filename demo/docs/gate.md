# GateLane

GateLane is the access control layer for AI agent tool usage. It decides which tools an agent can invoke, under what conditions, and with what constraints.

## How GateLane Controls Tools

GateLane maintains a ruleset that specifies:

- **Allow lists**: Tools the agent may always use
- **Deny lists**: Tools that are never permitted
- **Conditional rules**: Tools allowed only when specific criteria are met (time of day, user role, session context)
- **Rate limits**: Maximum invocations per time window

When an agent attempts to call a tool, GateLane intercepts the request, evaluates it against the active policy, and either approves or rejects the call. Approved calls are forwarded to the tool backend; rejected calls return a clear error to the agent.

## Policy Configuration

Policies are defined in YAML or JSON and loaded at startup. Example:

```yaml
rules:
  - tool: "file_read"
    action: allow
  - tool: "file_write"
    action: allow
    conditions:
      - path: "/tmp/**"
  - tool: "exec"
    action: deny
```

## Integration with VectorLane

GateLane stores policy evaluation logs in VectorLane for audit trails. Each decision is vectorized with metadata including the tool name, agent session, timestamp, and outcome. This enables semantic search over historical access decisions for compliance and debugging.
