import { describe, expect, test } from "bun:test"
import { ProviderPlugins } from "@botconnector/core/plugin/provider"
import { PluginV2 } from "@botconnector/core/plugin"

// This suite previously imported @botconnector/core/plugin/provider/opencode,
// which is not part of the BotConnector product. Keep positive coverage for
// the supported Gateway/OpenAI-compatible adapters and negative coverage for
// the retired OpenCode account plugin. Integration behavior is separately
// tested by provider-gateway and provider-openai-compatible.
describe("BotConnector provider isolation", () => {
  const ids = () => ProviderPlugins.map((plugin) => plugin.id)

  test("registers both supported cloud gateway adapters", () => {
    expect(ids()).toContain(PluginV2.ID.make("gateway"))
    expect(ids()).toContain(PluginV2.ID.make("openai-compatible"))
  })

  test("does not expose the retired OpenCode account plugin", () => {
    expect(ids()).not.toContain(PluginV2.ID.make("opencode"))
  })

  test("does not register any provider adapter twice", () => {
    const registered = ids()
    expect(new Set(registered).size).toBe(registered.length)
  })
})
