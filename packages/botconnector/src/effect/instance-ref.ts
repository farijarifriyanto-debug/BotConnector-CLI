import { Context } from "effect"
import type { InstanceContext } from "@/project/instance-context"
import type { WorkspaceV2 } from "@botconnector/core/workspace"

export const InstanceRef = Context.Reference<InstanceContext | undefined>("~botconnector/InstanceRef", {
  defaultValue: () => undefined,
})

export const WorkspaceRef = Context.Reference<WorkspaceV2.ID | undefined>("~botconnector/WorkspaceRef", {
  defaultValue: () => undefined,
})
