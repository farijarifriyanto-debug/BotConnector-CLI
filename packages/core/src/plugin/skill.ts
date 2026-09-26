/// <reference path="../markdown.d.ts" />

export * as SkillPlugin from "./skill"

import { define } from "./internal"
import { Effect } from "effect"
import { AbsolutePath } from "../schema"
import { SkillV2 } from "../skill"
import customizeBotConnectorContent from "./skill/customize-botconnector.md" with { type: "text" }

export const CustomizeBotConnectorContent = customizeBotConnectorContent
export const CustomizeOpencodeContent = CustomizeBotConnectorContent

export const Plugin = define({
  id: "skill",
  effect: Effect.fn(function* (ctx) {
    yield* ctx.skill.transform((draft) => {
      draft.source(
        SkillV2.EmbeddedSource.make({
          type: "embedded",
          skill: SkillV2.Info.make({
            name: "customize-botconnector",
            description:
              "Use ONLY when the user is editing or creating BotConnector's own configuration: botconnector.json, botconnector.jsonc, files under .botconnector/, or files under ~/.config/botconnector/. Also use when creating or fixing BotConnector agents, subagents, commands, skills, plugins, MCP servers, or permission rules. Do not use for the user's own application code, or for any project that is not configuring BotConnector itself.",
            location: AbsolutePath.make("/builtin/customize-botconnector.md"),
            content: CustomizeBotConnectorContent,
          }),
        }),
      )
    })
  }),
})
