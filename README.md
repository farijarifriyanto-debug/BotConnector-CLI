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

Dangerous mutation/shell permissions are not silently auto-approved by the bundled defaults.

## Source

https://github.com/farijarifriyanto-debug/BotConnector-CLI
