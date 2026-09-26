# BotConnector CLI

BotConnector is a local-first AI CLI/TUI for connecting cloud and local models from one terminal workflow.

## Install

```bash
npm install -g botconnector-cli
botconnector --version
```

## BotConnector Cloud

The npm launcher seeds the canonical config at `~/.config/botconnector/botconnector-cloud.jsonc`.
Set `BOTCONNECTOR_API_KEY` to use the BotConnector Gateway.

The Cloud model catalog is not pinned in the npm package. When Cloud models are listed or requested,
BotConnector loads the authenticated live catalog from `GET https://api.botconnector.id/v1/models`.
That endpoint is the source of truth for Cloud model availability; Local-only operations do not contact
the BotConnector Gateway, and if the catalog is unavailable BotConnector does not resurrect stale packaged model IDs.

```bash
export BOTCONNECTOR_API_KEY=...
botconnector models botconnector
botconnector run -m botconnector/<model> "Hello"
```

## Local Ollama

BotConnector discovers Local Ollama only on loopback (`127.0.0.1` / `localhost`).
Remote Ollama endpoints and model aliases ending in `:cloud` are not presented as Local.

```bash
botconnector models ollama
botconnector run -m ollama/<local-model> "Hello"
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
