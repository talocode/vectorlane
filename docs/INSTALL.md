# Installation

## System Requirements

- **Node.js**: 18.0.0 or higher (for npm package)
- **Python**: 3.9 or higher (for pip package)
- **Operating System**: Linux, macOS, or Windows
- **RAM**: 512MB minimum, 2GB recommended
- **Disk**: 100MB for installation, additional space for data

## Install via npm (CLI + JavaScript SDK)

```bash
npm install -g @talocode/vectorlane
```

This installs the `vectorlane` CLI globally and makes the JavaScript SDK available for import.

### Verify installation

```bash
vectorlane --version
```

### Local installation (per-project)

```bash
npm install @talocode/vectorlane
```

Then use the CLI via npx:

```bash
npx vectorlane --version
```

## Install via pip (Python SDK)

```bash
pip install talocode-vectorlane
```

### Verify installation

```bash
python -c "import vectorlane; print(vectorlane.__version__)"
```

### Install in a virtual environment (recommended)

```bash
python -m venv venv
source venv/bin/activate   # Linux/macOS
venv\Scripts\activate      # Windows
pip install talocode-vectorlane
```

## Install from source

```bash
git clone https://github.com/talocode/vectorlane.git
cd vectorlane
npm install
npm run build
npm link
```

## Post-installation setup

### Initialize a project

```bash
vectorlane init
```

This creates the default configuration and storage directory at `~/.vectorlane/`.

### Start the server

```bash
vectorlane serve
```

The API server starts on port 3090 by default.

### Run diagnostics

```bash
vectorlane doctor
```

This checks your installation, configuration, and dependencies.

## Configuration

After installation, configure VectorLane via the CLI or by editing `~/.vectorlane/config.json`:

```bash
vectorlane config set port 3090
vectorlane config set backend jsonl
vectorlane config set embedding local-hash
```

## Uninstall

### npm

```bash
npm uninstall -g @talocode/vectorlane
```

### pip

```bash
pip uninstall talocode-vectorlane
```

### Remove data (optional)

```bash
rm -rf ~/.vectorlane
```

## Troubleshooting

If you encounter issues during installation, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md).
