# BCCLI

BCCLI is the BotConnector command-line AI client for connecting cloud and local models from one terminal workflow.

## Install

```bash
npm install -g @botconnector/bccli
bccli --version
```

## BotConnector Cloud

The npm launcher seeds the canonical config at `~/.config/botconnector/botconnector-cloud.jsonc`.
Set `BOTCONNECTOR_API_KEY` to use the BotConnector Gateway.

The Cloud model catalog is not pinned in the npm package. On each CLI process start,
BotConnector loads the authenticated live catalog from `GET https://api.botconnector.id/v1/models`.
That endpoint is the source of truth for Cloud model availability; if it is unavailable,
BotConnector does not resurrect stale packaged model IDs.

```bash
export BOTCONNECTOR_API_KEY=...
bccli models botconnector
bccli run -m botconnector/<model> "Hello"
```

## Local Ollama

BotConnector discovers Local Ollama only on loopback (`127.0.0.1` / `localhost`).
Remote Ollama endpoints and model aliases ending in `:cloud` are not presented as Local.

```bash
bccli models ollama
bccli run -m ollama/<local-model> "Hello"
```

## Canonical configuration

Supported BotConnector paths are:

- `~/.config/botconnector/botconnector.jsonc`
- `~/.config/botconnector/botconnector-cloud.jsonc`
- project-local `.botconnector/`

Canonical runtime variables use the `BOTCONNECTOR_*` namespace. Legacy upstream names may remain internally only as compatibility aliases; they are not the supported user-facing configuration surface.

BotConnector keeps the engine's established permission defaults, including guards for external-directory access, doom-loop detection, and sensitive `.env` reads.

## TUI appearance

BotConnector keeps the mature terminal interaction model while presenting its own branding, labels, colors, spacing, and prompt experience.

Recommended terminal font: **Cascadia Mono**. Font selection is controlled by the terminal application, so BotConnector does not modify the user's terminal profile automatically.

## Source

https://github.com/farijarifriyanto-debug/BotConnector-CLI

## Compatibility and end-to-end validation

Prebuilt npm packages currently support **Linux x64** and **Windows x64**. macOS,
ARM, and other platforms require a separately verified build; the npm launcher
should report unsupported platforms instead of appearing to install successfully.

Run `bccli models botconnector` to confirm an authenticated Gateway catalog. A
missing or rejected API key must produce an error, **not** an empty successful
model list. For a real inference smoke test, select a model that is available
on your account via `bccli models botconnector` and run:

```bash
bccli run -m botconnector/<available-model-id> "Reply E2E_OK"
```

Model discovery and inference are not proof of settlement. Validate the Gateway
usage and billing ledgers separately with a dedicated test account before
certifying PAYG or plan quota end-to-end. The Gateway, not placeholder CLI
model cost metadata, is authoritative for charges.

For local privacy tests, use `bccli models ollama`, and verify in a controlled
network trace that local requests never contact the Cloud Gateway. Tests that
only serve mock Ollama data are not a substitute for real local inference.

## Token-efficient operation (without disabling tools)

A new **one-shot** `bccli run` session generates its searchable title locally.
This avoids an additional inference request used exclusively to name the
conversation. All tools, MCP integrations, model options, safety permissions,
vision, streaming and session continuation remain available.

```bash
bccli run -m botconnector/<model> "Fix the failing tests"
# Restore the original AI-generated title, whenever desired:
bccli run --title-mode ai -m botconnector/<model> "Fix the failing tests"
# Force a local title even in an interactive session:
bccli run --title-mode prompt -m botconnector/<model> "Fix the failing tests"
# Choose an exact title (highest precedence):
bccli run --title "Fix failing tests" -m botconnector/<model> "Fix the failing tests"
```

Long, old tool outputs are now **pruned from later model context by default**,
but their original content remains saved in session history; recently relevant
outputs and skill tools are protected. To preserve the old unpruned behavior,
put `{"compaction":{"prune":false}}` in your canonical BotConnector configuration.
Compaction's other settings are unchanged.

`bccli stats` now separates **known local cost** from **Gateway-billed
requests whose actual cost is unavailable to the CLI**. It also reports the
cache-read ratio. Use the BotConnector Workspace ledger for authoritative
Gateway/PAYG billing and title-generation charges. This change does not reduce
the number of tool definitions on full coding requests: automatically removing
tools without a reliable way to re-enable them could silently break tasks.
