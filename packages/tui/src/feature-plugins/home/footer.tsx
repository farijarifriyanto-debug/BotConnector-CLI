import type { TuiPlugin, TuiPluginApi } from "@opencode-ai/plugin/tui"
import type { BuiltinTuiPlugin } from "../builtins"
import { useCommandShortcut } from "../../keymap"

const id = "internal:home-footer"

function View(props: { api: TuiPluginApi }) {
  const commands = useCommandShortcut("command.palette.show")
  const quit = useCommandShortcut("app.exit")
  const theme = () => props.api.theme.current

  return (
    <box
      width="100%"
      paddingTop={1}
      paddingBottom={1}
      paddingLeft={2}
      paddingRight={2}
      flexDirection="row"
      flexShrink={0}
      gap={2}
    >
      <text fg={theme().textMuted}>{commands()} Commands</text>
      <text fg={theme().textMuted}>{quit()} Quit</text>
      <box flexGrow={1} />
      <text fg={theme().textMuted}>{props.api.app.version}</text>
    </box>
  )
}

const tui: TuiPlugin = async (api) => {
  api.slots.register({
    order: 100,
    slots: {
      home_footer() {
        return <View api={api} />
      },
    },
  })
}

const plugin: BuiltinTuiPlugin = {
  id,
  tui,
}

export default plugin
