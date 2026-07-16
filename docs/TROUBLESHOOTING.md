# Troubleshooting

Common issues and solutions for VectorLane.

## Installation Issues

### Command not found: vectorlane

**Symptom:** `vectorlane: command not found`

**Solution:**

```bash
# Check if installed
npm list -g @talocode/vectorlane

# Reinstall if needed
npm install -g @talocode/vectorlane

# Or use npx
npx vectorlane --version
```

### Permission denied

**Symptom:** `EACCES: permission denied`

**Solution:**

```bash
# Fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

# Reinstall
npm install -g @talocode/vectorlane
```

### Python import error

**Symptom:** `ModuleNotFoundError: No module named 'vectorlane'`

**Solution:**

```bash
# Ensure correct Python
python3 -c "import vectorlane"

# Reinstall
pip install --upgrade talocode-vectorlane

# Check virtual environment
which python
pip list | grep vectorlane
```

## Server Issues

### Server won't start

**Symptom:** `vectorlane serve` fails or hangs

**Solution:**

```bash
# Run diagnostics
vectorlane doctor

# Check port availability
lsof -i :3090

# Try different port
vectorlane serve --port 8080

# Check logs
tail -f ~/.vectorlane/logs/vectorlane.log
```

### Port already in use

**Symptom:** `Error: listen EADDRINUSE: address already in use :::3090`

**Solution:**

```bash
# Find process using port
lsof -i :3090

# Kill process
kill -9 <PID>

# Or use different port
vectorlane config set port 8080
vectorlane serve
```

### Connection refused

**Symptom:** `Error: connect ECONNREFUSED 127.0.0.1:3090`

**Solution:**

```bash
# Check if server is running
curl http://localhost:3090/health

# Start server if not running
vectorlane serve

# Check firewall
sudo ufw status
```

## Data Issues

### Collection not found

**Symptom:** `Error: Collection 'xyz' not found`

**Solution:**

```bash
# List collections
vectorlane collection list

# Create collection
vectorlane collection create xyz

# Or check name spelling
vectorlane collection list --format json
```

### No search results

**Symptom:** Search returns empty results

**Solution:**

```bash
# Check collection has data
vectorlane collection stats default

# Lower threshold
vectorlane search "query" --threshold 0.3

# Check data was ingested
vectorlane collection show default

# Try different query
vectorlane search "different keywords"
```

### Ingestion fails

**Symptom:** `vectorlane ingest` returns error

**Solution:**

```bash
# Check file exists
ls -la /path/to/file.txt

# Check file permissions
file /path/to/file.txt

# Try different file
echo "test" > /tmp/test.txt
vectorlane ingest /tmp/test.txt

# Check disk space
df -h ~/.vectorlane
```

## Performance Issues

### Slow ingestion

**Symptom:** Ingestion takes too long

**Solution:**

```bash
# Use local-hash embedding (fastest)
vectorlane config set embedding local-hash

# Increase chunk size
vectorlane config set chunk_size 1024

# Check disk I/O
iostat -x 1

# Use SSD storage
vectorlane config set storage_path /ssd/.vectorlane/data
```

### Slow search

**Symptom:** Search is slow

**Solution:**

```bash
# Use higher threshold
vectorlane search "query" --threshold 0.7

# Reduce limit
vectorlane search "query" --limit 3

# Use smaller collection
vectorlane collection create smaller
# Ingest relevant data only

# Check collection size
vectorlane collection stats default
```

### High memory usage

**Symptom:** VectorLane uses too much memory

**Solution:**

```bash
# Reduce embedding cache size
vectorlane config set embedding_cache_size 1000

# Use SQLite backend (more memory efficient)
vectorlane config set backend sqlite

# Restart server
vectorlane serve
```

## Embedding Issues

### OpenAI API error

**Symptom:** `Error: OpenAI API key not found`

**Solution:**

```bash
# Set API key
vectorlane config set openai_api_key sk-your-key-here

# Or use environment variable
export OPENAI_API_KEY=sk-your-key-here

# Verify key
vectorlane config get openai_api_key
```

### HuggingFace model not found

**Symptom:** `Error: Model not found`

**Solution:**

```bash
# Install transformers
pip install sentence-transformers

# Download model manually
python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

# Check model cache
ls ~/.cache/torch/sentence_transformers/
```

## MCP Issues

### MCP tools not appearing

**Symptom:** AI assistant doesn't see VectorLane tools

**Solution:**

```bash
# Test MCP mode
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | vectorlane mcp

# Check configuration file location
# Claude: ~/.config/claude/mcp.json
# Cursor: Check Cursor settings

# Restart AI assistant after config changes
```

### MCP connection error

**Symptom:** MCP server fails to start

**Solution:**

```bash
# Check vectorlane is in PATH
which vectorlane

# Test MCP directly
vectorlane mcp

# Check stderr output
vectorlane mcp 2>&1
```

## Import Issues

### MemoryLane import fails

**Symptom:** `vectorlane import-memorylane` returns error

**Solution:**

```bash
# Check MemoryLane is installed
memorylane --version

# Check data directory exists
ls ~/.memorylane/data

# Try with explicit path
vectorlane import-memorylane --path ~/.memorylane/data

# Check permissions
ls -la ~/.memorylane/
```

### ContextLane import fails

**Symptom:** `vectorlane import-contextlane` returns error

**Solution:**

```bash
# Check ContextLane is installed
contextlane --version

# Check data directory exists
ls ~/.contextlane/data

# Try with explicit path
vectorlane import-contextlane --path ~/.contextlane/data
```

## Configuration Issues

### Invalid configuration

**Symptom:** `Error: Invalid configuration`

**Solution:**

```bash
# Check configuration
cat ~/.vectorlane/config.json

# Reset configuration
rm ~/.vectorlane/config.json
vectorlane init

# Validate JSON
python3 -c "import json; json.load(open('$HOME/.vectorlane/config.json'))"
```

### Configuration not saving

**Symptom:** Changes to config not persisting

**Solution:**

```bash
# Check file permissions
ls -la ~/.vectorlane/config.json

# Write test
echo '{}' > ~/.vectorlane/config.json

# Use CLI to set values
vectorlane config set port 3090
```

## Debug Mode

Enable verbose logging for debugging:

```bash
# Start with debug logging
vectorlane serve --log-level debug

# Or set in configuration
vectorlane config set log_level debug

# View debug logs
tail -f ~/.vectorlane/logs/vectorlane.log | grep DEBUG
```

## Getting Help

If none of these solutions work:

1. Run diagnostics: `vectorlane doctor --verbose`
2. Check logs: `tail -100 ~/.vectorlane/logs/vectorlane.log`
3. Search issues: [GitHub Issues](https://github.com/talocode/vectorlane/issues)
4. Join Discord: [discord.gg/vectorlane](https://discord.gg/vectorlane)
