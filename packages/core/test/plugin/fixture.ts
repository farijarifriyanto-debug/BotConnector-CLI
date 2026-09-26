import { AgentV2 } from "@botconnector/core/agent"
import { AISDK } from "@botconnector/core/aisdk"
import { Catalog } from "@botconnector/core/catalog"
import { CommandV2 } from "@botconnector/core/command"
import { Credential } from "@botconnector/core/credential"
import { AppNodeBuilder } from "@botconnector/core/effect/app-node-builder"
import { LayerNodePlatform } from "@botconnector/core/effect/app-node-platform"
import { LayerNode } from "@botconnector/core/effect/layer-node"
import { EventV2 } from "@botconnector/core/event"
import { FileSystem } from "@botconnector/core/filesystem"
import { FSUtil } from "@botconnector/core/fs-util"
import { Integration } from "@botconnector/core/integration"
import { Location } from "@botconnector/core/location"
import { Npm } from "@botconnector/core/npm"
import { PluginV2 } from "@botconnector/core/plugin"
import { Reference } from "@botconnector/core/reference"
import { SkillV2 } from "@botconnector/core/skill"
import { Effect, Layer } from "effect"
import { tempLocationLayer } from "../fixture/location"

const npmLayer = Layer.succeed(
  Npm.Service,
  Npm.Service.of({
    add: () => Effect.succeed({ directory: "", entrypoint: undefined }),
    install: () => Effect.void,
    which: () => Effect.succeed(undefined),
  }),
)

export const PluginTestLayer = AppNodeBuilder.build(
  LayerNode.group([
    FileSystem.node,
    FSUtil.node,
    Location.node,
    Npm.node,
    Credential.node,
    EventV2.node,
    LayerNodePlatform.httpClient,
    PluginV2.node,
    AgentV2.node,
    AISDK.node,
    Catalog.node,
    CommandV2.node,
    Integration.node,
    Reference.node,
    SkillV2.node,
  ]),
  [
    [Location.node, tempLocationLayer],
    [Npm.node, npmLayer],
  ],
)
