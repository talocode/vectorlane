# Security

VectorLane is designed for local use with security in mind.

## Design Principles

1. **Local by default** — All data stays on your machine
2. **No external calls** — Default embedding model works offline
3. **No authentication** — Designed for single-user local access
4. **Minimal attack surface** — Simple, focused functionality

## Data Storage

### Local Storage

All data is stored locally in `~/.vectorlane/`:

```
~/.vectorlane/
  config.json          # Configuration
  data/                # Vector store data
    collections/       # Collection data
    embeddings/        # Cached embeddings
  logs/                # Application logs
```

### Data Encryption

v0.1.0 does not encrypt data at rest. Data is stored as plain JSONL or SQLite files.

For encrypted storage:

1. Use an encrypted filesystem (e.g., LUKS, FileVault)
2. Use an encrypted container for `~/.vectorlane/`

### Backup Security

When backing up VectorLane data:

```bash
# Encrypted backup
tar czf - ~/.vectorlane | gpg -c > backup.tar.gz.gpg

# Restore
gpg -d backup.tar.gz.gpg | tar xzf - -C ~
```

## Network Security

### Default Configuration

The API server listens on `0.0.0.0:3090` by default, which means:

- Accessible from localhost
- Accessible from other machines on the network

### Restrict to Localhost

To restrict access to localhost only:

```bash
vectorlane serve --host 127.0.0.1
```

Or in configuration:

```json
{
  "host": "127.0.0.1"
}
```

### No Authentication

v0.1.0 has no authentication. Do not expose the API to the public internet.

For production use:

1. Use a reverse proxy with authentication
2. Use firewall rules to restrict access
3. Use VPN for remote access

### CORS

CORS is disabled by default. Enable only if needed:

```bash
vectorlane serve --cors
```

## API Security

### Input Validation

VectorLane validates all input:

- File paths are validated and sanitized
- URLs are validated before fetching
- Text input is size-limited
- Collection names are validated

### Rate Limiting

v0.1.0 has no rate limiting. For production use, add a reverse proxy with rate limiting.

### Error Handling

Error messages do not expose sensitive information:

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An internal error occurred"
  }
}
```

## Embedding Security

### local-hash

The default `local-hash` embedding model is fully offline:

- No network calls
- No data sent to external services
- Deterministic output

### OpenAI

If using OpenAI embeddings:

- Text is sent to OpenAI's API
- OpenAI's privacy policy applies
- Use environment variables for API keys
- Do not commit API keys to version control

**Security recommendations:**

```bash
# Use environment variables
export OPENAI_API_KEY=sk-your-key-here

# Never commit API keys
echo "OPENAI_API_KEY=sk-..." >> .env
echo ".env" >> .gitignore
```

### HuggingFace

If using HuggingFace embeddings:

- Models are downloaded once and cached locally
- Subsequent usage is fully offline
- Model files are stored in `~/.vectorlane/models/`

## MCP Security

### MCP Server

The MCP server runs locally:

- No network exposure by default
- Communication via stdio or local socket
- No authentication required

### MCP Configuration

MCP configuration files may contain sensitive paths:

```bash
# Restrict permissions
chmod 600 ~/.config/claude/mcp.json
```

## File System Security

### Permissions

VectorLane creates files with standard permissions:

- Config files: 644 (world-readable)
- Data files: 644 (world-readable)
- Log files: 644 (world-readable)

To restrict permissions:

```bash
chmod 700 ~/.vectorlane
chmod 600 ~/.vectorlane/config.json
```

### Symlink Attacks

VectorLane resolves symlinks before processing files:

```bash
# This is safe
vectorlane ingest /path/to/file.txt

# Symlinks are resolved
vectorlane ingest /path/to/symlink.txt  # Resolves to actual file
```

### Path Traversal

VectorLane validates file paths:

- No `..` in paths
- No absolute paths outside allowed directories
- Paths are normalized before use

## Logging

### Log Content

Logs do not contain:

- API keys
- Passwords
- Sensitive text content

Logs do contain:

- Timestamps
- Operation types
- Error messages
- Performance metrics

### Log Location

Logs are stored in `~/.vectorlane/logs/`:

```bash
# View logs
tail -f ~/.vectorlane/logs/vectorlane.log

# Clear logs
rm ~/.vectorlane/logs/*.log
```

## Compliance

### GDPR

VectorLane is designed for local use. If you process personal data:

- Data stays on your machine
- No data sent to external services (with local-hash)
- You control data retention
- You can delete data at any time

### SOC 2

For SOC 2 compliance:

- Use encrypted storage
- Implement access controls
- Enable audit logging
- Regular backups

## Vulnerability Reporting

If you discover a security vulnerability:

1. Do not open a public issue
2. Email security@vectorlane.dev
3. Include steps to reproduce
4. Allow reasonable time for response

## Security Checklist

- [ ] API not exposed to public internet
- [ ] Data stored on encrypted filesystem
- [ ] API keys not committed to version control
- [ ] Logs do not contain sensitive data
- [ ] File permissions are restrictive
- [ ] Regular backups are encrypted
