# BotConnector compact TUI design sources

The compact transcript presentation is implemented on top of BotConnector's existing Solid/OpenTUI engine. No external agent engine is embedded.

Design references evaluated before implementation:

- MoCode-TUI (MIT): compact status line, message/tool progression, command palette patterns.
- TermIDE (MIT): OpenTUI terminal-first layout and progressive-disclosure patterns.
- Hunk (MIT): review-first compact chrome and expandable output/diff interaction patterns.

BotConnector keeps its own routing, model catalog, Cloud/Local behavior, sessions, permissions, MCP, attachments, tools, and existing keymap. The references above are design/interaction references rather than vendored source.
