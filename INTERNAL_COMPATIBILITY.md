# BotConnector internal compatibility

BotConnector now uses BotConnector-native names for private workspace packages, Effect service tags, internal hostnames, and newly emitted protocol headers.

The following legacy identifiers remain intentionally supported as compatibility aliases:

- Public upstream package names that external integrations may already depend on: `@opencode-ai/plugin`, `@opencode-ai/sdk`, `@opencode-ai/ui`, `@opencode-ai/app`, `@opencode-ai/web`, `@opencode-ai/script`, `@opencode-ai/http-recorder`, `@opencode-ai/console-app`, `@opencode-ai/console-resource`, `@opencode-ai/console-support`, `@opencode-ai/cli`, and `@opencode-ai/slack`.
- Legacy `OPENCODE_*` environment variables for settings that predate the BotConnector namespace. The canonical external namespace is `BOTCONNECTOR_*`; legacy variables are fallback-only.
- Legacy `x-opencode-*` request headers where an older client may still connect to a BotConnector server. New BotConnector clients emit `x-botconnector-*`.
- Legacy compile-time `OPENCODE_VERSION`, `OPENCODE_CHANNEL`, and `OPENCODE_PLUGIN_VERSION` constants. BotConnector builds define the canonical `BOTCONNECTOR_*` equivalents and retain the old constants only as fallback compatibility.

Compatibility aliases must not be used for new BotConnector-owned code. Remove an alias only after all supported clients and integrations have migrated.
