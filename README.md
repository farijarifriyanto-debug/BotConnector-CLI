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

BotConnector does not override OpenCode permission defaults. The upstream permission model applies, including its normal guards for external-directory access, doom-loop detection, and sensitive `.env` reads.

## TUI appearance

BotConnector keeps the OpenCode interaction model and customizes only the TUI presentation: branding, labels, colors, spacing, and prompt placeholder.

Recommended terminal font: **Cascadia Mono**. Font selection is controlled by the terminal application, so BotConnector does not modify the user's terminal profile automatically.

## Source

https://github.com/farijarifriyanto-debug/BotConnector-CLI
