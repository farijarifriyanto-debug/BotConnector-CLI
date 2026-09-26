import { run as runTui, type TuiInput } from "@botconnector/tui"
import { Global } from "@botconnector/core/global"
import { AppNodeBuilder } from "@botconnector/core/effect/app-node-builder"
import { Effect } from "effect"

export function run(input: TuiInput) {
  return runTui(input).pipe(Effect.provide(AppNodeBuilder.build(Global.node)))
}
