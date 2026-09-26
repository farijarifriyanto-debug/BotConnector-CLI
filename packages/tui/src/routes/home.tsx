import { Prompt, type PromptRef } from "../component/prompt"
import { createEffect, createMemo, createSignal, onMount } from "solid-js"
import { useSync } from "../context/sync"
import { Toast } from "../ui/toast"
import { useArgs } from "../context/args"
import { useRouteData } from "../context/route"
import { usePromptRef } from "../context/prompt"
import { useLocal } from "../context/local"
import { usePluginRuntime } from "../plugin/runtime"
import { useEditorContext } from "../context/editor"
import { useTerminalDimensions } from "@opentui/solid"
import { useTuiConfig } from "../config"
import { useTheme } from "../context/theme"
import { HomeSessionDestinationProvider } from "./home/session-destination"

let once = false
const placeholder = {
  normal: [
    "Route this task to the best model",
    "Explain this project and its architecture",
    "Find and fix the blocking issue",
  ],
  shell: ["git status", "pwd", "npm test"],
}

export function Home() {
  const pluginRuntime = usePluginRuntime()
  const sync = useSync()
  const route = useRouteData("home")
  const promptRef = usePromptRef()
  const [ref, setRef] = createSignal<PromptRef | undefined>()
  const args = useArgs()
  const local = useLocal()
  const editor = useEditorContext()
  const dimensions = useTerminalDimensions()
  const tuiConfig = useTuiConfig()
  const { theme } = useTheme()
  const activeModel = createMemo(() => local.model.parsed())
  const connectionLabel = createMemo(() =>
    activeModel().provider.toLowerCase().includes("ollama") ? "LOCAL" : "CLOUD",
  )
  const cloudReady = createMemo(() => sync.data.provider.some((provider) => provider.id === "botconnector"))
  const localReady = createMemo(() =>
    sync.data.provider.some((provider) => provider.id === "ollama" && Object.keys(provider.models).length > 0),
  )
  const promptMaxWidth = createMemo(() => {
    const configured = tuiConfig.prompt?.max_width
    if (configured === "auto") return Math.max(75, Math.floor(dimensions().width * 0.7))
    return configured ?? 75
  })
  let sent = false

  onMount(() => {
    editor.clearSelection()
  })

  const bind = (r: PromptRef | undefined) => {
    setRef(r)
    promptRef.set(r)
    if (once || !r) return
    if (route.prompt) {
      r.set(route.prompt)
      once = true
      return
    }
    if (!args.prompt) return
    r.set({ input: args.prompt, parts: [] })
    once = true
  }

  // Wait for sync and model store to be ready before auto-submitting --prompt
  createEffect(() => {
    const r = ref()
    if (sent) return
    if (!r) return
    if (!sync.ready || !local.model.ready) return
    if (!args.prompt) return
    if (r.current.input !== args.prompt) return
    sent = true
    r.submit()
  })

  return (
    <HomeSessionDestinationProvider>
      <box flexGrow={1} width="100%" paddingLeft={2} paddingRight={2} paddingTop={1}>
        <box flexDirection="row" gap={1} flexShrink={0}>
          <text fg={theme.primary}>BotConnector</text>
          <text fg={theme.textMuted}>·</text>
          <text fg={theme.text}>{activeModel().model}</text>
          <text fg={connectionLabel() === "LOCAL" ? theme.success : theme.info}>{connectionLabel()}</text>
          <text fg={theme.textMuted}>·</text>
          <text fg={cloudReady() ? theme.success : theme.textMuted}>Cloud {cloudReady() ? "ready" : "offline"}</text>
          <text fg={theme.textMuted}>·</text>
          <text fg={localReady() ? theme.success : theme.textMuted}>Local {localReady() ? "ready" : "not detected"}</text>
        </box>

        <box flexGrow={1} minHeight={2} />

        <box width="100%" zIndex={1000} paddingBottom={1} flexShrink={0}>
          <pluginRuntime.Slot name="home_prompt" mode="replace" ref={bind}>
            <Prompt
              ref={bind}
              right={<pluginRuntime.Slot name="home_prompt_right" />}
              placeholders={placeholder}
              hint={<text fg={theme.textMuted}>type a task · ctrl+p commands</text>}
            />
          </pluginRuntime.Slot>
        </box>
        <Toast />
      </box>
      <box width="100%" flexShrink={0}>
        <pluginRuntime.Slot name="home_footer" mode="single_winner" />
      </box>
    </HomeSessionDestinationProvider>
  )
}
