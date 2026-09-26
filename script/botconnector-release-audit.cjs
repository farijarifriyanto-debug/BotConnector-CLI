const fs = require("fs")

const read = (path) => fs.readFileSync(path, "utf8")
const fail = (message) => {
  console.error("BOTCONNECTOR_RELEASE_AUDIT_FAIL:", message)
  process.exitCode = 1
}

const launcher = read("npm-package/main/bin/botconnector.js")
for (const needle of [
  "env.BOTCONNECTOR_CONFIG = seededConfig",
  "delete env.OPENCODE_CONFIG",
  "delete env.OPENCODE_CONFIG_DIR",
  "delete env.OPENCODE_CONFIG_CONTENT",
]) {
  if (!launcher.includes(needle)) fail(`launcher missing canonical config guard: ${needle}`)
}

const cfg = JSON.parse(read("npm-package/main/default-config/botconnector-cloud.jsonc"))
const gateway = cfg.provider?.botconnector
if (gateway?.name !== "BotConnector Gateway") fail("BotConnector Gateway provider missing")
if (gateway?.options?.baseURL !== "https://api.botconnector.id/v1") fail("BotConnector Gateway URL mismatch")
if (!gateway?.env?.includes("BOTCONNECTOR_API_KEY")) fail("BOTCONNECTOR_API_KEY binding missing")
if (Object.keys(gateway?.models ?? {}).length !== 0) fail("bundled BotConnector Gateway catalog must stay empty")
if (!launcher.includes("provider.models = {}")) fail("launcher does not purge persisted Gateway model snapshots")

const liveProviderSource = read("packages/opencode/src/provider/provider.ts")
if (!liveProviderSource.includes('botconnectorBaseURL.replace(/\\/+$/, "") + "/models"')) {
  fail("BotConnector Gateway does not discover the live /v1/models catalog")
}
if (!liveProviderSource.includes("botconnector.models = {}")) fail("live catalog path does not clear stale model snapshots")
if (!liveProviderSource.includes("botconnector.models = discovered")) fail("live catalog result is not installed")

const ollama = cfg.provider?.ollama
if (ollama?.name !== "Ollama Local") fail("Ollama Local provider missing")
if (ollama?.options?.baseURL !== "http://127.0.0.1:11434/v1") fail("Ollama Local must be loopback-only")
if (Object.keys(ollama?.models ?? {}).some((id) => id.endsWith(":cloud"))) fail("Local config exposes a :cloud model")

if (cfg.permission !== undefined) fail("bundled config must not override upstream OpenCode permissions")
if (launcher.includes('config.permission.edit = "ask"') || launcher.includes('config.permission.bash = "ask"')) {
  fail("launcher still injects BotConnector-specific ask permissions")
}
if (!launcher.includes('delete config.permission')) {
  fail("launcher does not migrate the exact legacy generated permission override")
}

const userFacing = [
  "packages/opencode/src/cli/cmd/serve.ts",
  "packages/opencode/src/cli/cmd/web.ts",
  "packages/opencode/src/cli/cmd/run.ts",
  "packages/opencode/src/cli/cmd/models.ts",
  "packages/opencode/src/cli/cmd/mcp.ts",
  "npm-package/main/package.json",
  "README.md",
]
const forbidden = [
  "start opencode tui",
  "run opencode with a message",
  "starts a headless opencode server",
  "uninstall opencode",
  "opencode mcp add",
  "opencode.local",
  "built on opencode",
]
for (const path of userFacing) {
  const body = read(path).toLowerCase()
  for (const needle of forbidden) {
    if (body.includes(needle)) fail(`${path} contains forbidden user-facing string: ${needle}`)
  }
}

const readme = read("README.md").toLowerCase()
if (readme.includes("opencode.ai")) fail("README leaks upstream product links")

const models = read("packages/opencode/src/cli/cmd/models.ts")
if (!models.includes('.filter((id) => !id.startsWith("opencode"))')) {
  fail("default model listing does not hide upstream provider namespace")
}

const provider = read("packages/opencode/src/provider/provider.ts")
if (!provider.includes('name.endsWith(":cloud")')) fail("Local Ollama does not reject :cloud aliases")
if (!provider.includes('["127.0.0.1", "localhost", "::1"]')) fail("Local Ollama discovery is not loopback-gated")
if (!provider.includes("botconnectorLocalSizeBytes")) fail("Local model memory warning metadata missing")

const run = read("packages/opencode/src/cli/cmd/run.ts")
if (run.includes('emit("tool_use", { part })')) fail("JSON output still exposes raw tool parts")
if (run.includes('JSON.stringify({\n                type,\n                timestamp: Date.now(),\n                sessionID,')) {
  fail("JSON output still exposes sessionID")
}
if (!run.includes('emit("error", { error: formatRunError(')) fail("JSON errors are not sanitized")

const index = read("packages/opencode/src/index.ts")
if (index.includes(".command(GithubCommand)") || index.includes(".command(ConsoleCommand)")) {
  fail("upstream-only account/github commands are exposed in the BotConnector CLI")
}

const footer = read("packages/opencode/src/cli/cmd/run/footer.command.tsx")
if (!footer.includes('.filter((provider) => !provider.id.startsWith("opencode"))')) {
  fail("TUI model selector exposes the upstream provider namespace")
}
if (!footer.includes('provider.id === "ollama"') || !footer.includes('"Local"')) {
  fail("TUI model selector does not identify Ollama as Local")
}

const rootAgents = read("AGENTS.md")
if (rootAgents.includes("# BotConnector Agent Operating Contract")) fail("root AGENTS.md still overrides upstream OpenCode agent behavior")
if (!rootAgents.includes("The default branch in this repo is `dev`.")) fail("root AGENTS.md is not restored to the upstream OpenCode baseline")
const initializeTemplate = read("packages/opencode/src/command/template/initialize.txt")
if (!initializeTemplate.includes("future OpenCode sessions")) fail("AGENTS.md initialize template is not restored to upstream OpenCode behavior")
if (initializeTemplate.includes("future BotConnector sessions")) fail("initialize template still contains BotConnector-specific agent behavior")

const homeRoute = read("packages/tui/src/routes/home.tsx")
if (!homeRoute.includes("CLOUD + LOCAL AI ROUTER")) {
  fail("TUI home is missing BotConnector product identity")
}
const sessionRoute = read("packages/tui/src/routes/session/index.tsx")
if (!homeRoute.includes("CLOUD + LOCAL AI ROUTER")) fail("minimal BotConnector home identity missing")
if (homeRoute.includes('name="home_bottom"')) fail("default home still renders the rotating tips/dashboard area")
const botconnectorTheme = read("packages/tui/src/theme/assets/botconnector.json")
if (!botconnectorTheme.includes('"darkStep9": "#22d3ee"')) fail("BotConnector primary brand color is not cyan")
if (!botconnectorTheme.includes('"darkSecondary": "#60a5fa"')) fail("BotConnector tool/activity color is not blue")
if (!botconnectorTheme.includes('"darkOrange": "#fbbf24"')) fail("BotConnector warning color is not amber")
const readmeBody = read("README.md")
if (!readmeBody.includes("Cascadia Mono")) fail("recommended BotConnector terminal font is not documented")
if (!sessionRoute.includes('kv.signal<"auto" | "hide">("sidebar", "auto")')) fail("session sidebar behavior is not restored to upstream OpenCode")
if (!sessionRoute.includes('if (sidebar() === "auto" && wide()) return true')) fail("wide-terminal sidebar behavior is not restored to upstream OpenCode")
if (!sessionRoute.includes('const showThinking = createMemo(() => true)')) fail("thinking visibility is not restored to upstream OpenCode")
if (!sessionRoute.includes('kv.signal("tool_details_visibility", true)')) fail("tool details are not restored to upstream OpenCode")
if (!sessionRoute.includes('kv.signal("assistant_metadata_visibility", true)')) fail("assistant metadata is not restored to upstream OpenCode")

const promptComponent = read("packages/tui/src/component/prompt/index.tsx")
if (!promptComponent.includes("Ask BotConnector…")) {
  fail("TUI prompt still uses generic upstream home copy")
}

const providerSource = read("packages/opencode/src/provider/provider.ts")
if (!providerSource.includes('(providerID === "botconnector" ? 32_768 : 0)')) {
  fail("BotConnector Gateway models without metadata have no bounded context fallback")
}
if (!providerSource.includes('(providerID === "botconnector" ? 8_192 : 0)')) {
  fail("BotConnector Gateway models without metadata have no bounded output fallback")
}

const tuiLocal = read("packages/tui/src/context/local.tsx")
if (!tuiLocal.includes('!providerID.startsWith("opencode")')) {
  fail("TUI model state does not reject upstream OpenCode providers")
}
if (!tuiLocal.includes('item.id === "botconnector"') || !tuiLocal.includes('item.id === "ollama"')) {
  fail("TUI fallback does not prioritize BotConnector then Ollama")
}
const tuiModelDialog = read("packages/tui/src/component/dialog-model.tsx")
if (!tuiModelDialog.includes('!provider.id.startsWith("opencode")')) {
  fail("TUI model dialog still exposes upstream OpenCode providers")
}

const acp = read("packages/opencode/src/acp/service.ts")
if (acp.includes('providers[ProviderV2.ID.make("opencode")]')) {
  fail("ACP startup can still default to the OpenCode/Zen provider")
}
if (!acp.includes('providers[ProviderV2.ID.make("botconnector")]')) {
  fail("ACP startup does not prefer the BotConnector provider")
}
if (!acp.includes('.filter(([providerID]) => !providerID.startsWith("opencode"))')) {
  fail("ACP fallback model selection does not exclude upstream OpenCode providers")
}

const readTool = read("packages/opencode/src/tool/read.ts")
if (readTool.includes('output += `\\n\\n<system-reminder>')) {
  fail("Read tool still appends internal instruction content to user-visible output")
}

const agent = read("packages/opencode/src/cli/cmd/agent.ts")
if (!agent.includes("default: all")) fail("agent creation no longer matches upstream OpenCode permission behavior")
if (agent.includes("SAFE_DEFAULT_PERMISSIONS")) fail("BotConnector-specific permission defaults still override upstream OpenCode")
if (!agent.includes("initialValues: AVAILABLE_PERMISSIONS")) fail("interactive agent permission picker is not restored to upstream OpenCode")

const uninstall = read("packages/opencode/src/cli/cmd/uninstall.ts")
for (const legacy of ["uninstall -g opencode-ai", "uninstall opencode"]) {
  if (uninstall.includes(legacy)) fail(`uninstall still targets upstream package: ${legacy}`)
}

const boundaryFiles = [
  "packages/opencode/src/installation/index.ts",
  "packages/tui/src/app.tsx",
  "packages/tui/src/component/dialog-provider.tsx",
  "packages/tui/src/component/error-component.tsx",
  "packages/tui/src/util/error.ts",
  "packages/tui/src/component/dialog-retry-action.tsx",
  "packages/opencode/src/session/retry.ts",
  "packages/opencode/src/share/share-next.ts",
  "packages/opencode/src/mcp/oauth-provider.ts",
  "packages/opencode/src/provider/provider.ts",
  "README.md",
]
const boundaryForbidden = [
  "https://opencode.ai",
  "https://opncd.ai",
  "github.com/anomalyco/opencode",
  "anomalyco/tap",
  "OpenCode Go",
  "OpenCode Zen",
  "opencode.json",
  "opencode crashed",
]
for (const path of boundaryFiles) {
  const body = read(path)
  for (const needle of boundaryForbidden) {
    if (body.includes(needle)) fail(`${path} crosses BotConnector product boundary: ${needle}`)
  }
}

const installation = read("packages/opencode/src/installation/index.ts")
if (!installation.includes("npm install -g botconnector-cli@")) fail("curl upgrade path does not point users to BotConnector npm")
if (!installation.includes('"farijarifriyanto-debug/tap"')) fail("Homebrew upgrade does not use the BotConnector tap")

const providerHeaders = read("packages/opencode/src/provider/provider.ts")
for (const required of ['"https://botconnector.id/"', '"X-Title": "BotConnector"', '"X-BILLING-INVOKE-ORIGIN": "BotConnector"']) {
  if (!providerHeaders.includes(required)) fail(`provider identity missing: ${required}`)
}

const mcpOauth = read("packages/opencode/src/mcp/oauth-provider.ts")
if (!mcpOauth.includes('client_name: "BotConnector"') || !mcpOauth.includes('client_uri: "https://botconnector.id"')) {
  fail("MCP OAuth client identity is not BotConnector")
}

const rootPackage = JSON.parse(read("package.json"))
if (rootPackage.name !== "botconnector-cli-workspace") fail("root workspace still uses upstream product name")
if (rootPackage.repository?.url !== "https://github.com/farijarifriyanto-debug/BotConnector-CLI") {
  fail("root package repository metadata does not point to BotConnector")
}

const upstreamWorkflowGuards = {
  ".github/workflows/pr-management.yml": "github.repository == 'anomalyco/opencode'",
  ".github/workflows/review.yml": "github.repository == 'anomalyco/opencode'",
  ".github/workflows/triage.yml": "github.repository == 'anomalyco/opencode'",
  ".github/workflows/duplicate-issues.yml": "github.repository == 'anomalyco/opencode'",
  ".github/workflows/opencode.yml": "github.repository == 'anomalyco/opencode'",
}
for (const [path, guard] of Object.entries(upstreamWorkflowGuards)) {
  if (!read(path).includes(guard)) fail(`${path} can run upstream AI automation in the BotConnector repository`)
}

const issueTemplate = read(".github/ISSUE_TEMPLATE/bug-report.yml")
if (!issueTemplate.includes("id: botconnector-version") || issueTemplate.includes("label: OpenCode version")) {
  fail("bug report template still exposes upstream product version fields")
}

const tuiMigration = read("packages/opencode/src/config/tui-migrate.ts")
if (tuiMigration.includes("https://opencode.ai/tui.json")) fail("TUI migration writes upstream schema URLs")

const tuiApp = read("packages/tui/src/app.tsx")
if (tuiApp.includes("DialogConsoleOrg") || tuiApp.includes('"console.org.switch"')) {
  fail("TUI still exposes inherited upstream console organization switching")
}

const accountCli = read("packages/opencode/src/cli/cmd/account.ts")
if (!accountCli.includes('defaultConsoleUrl = "https://app.botconnector.id"')) {
  fail("account flow default is not BotConnector")
}
const accountService = read("packages/opencode/src/account/account.ts")
if (!accountService.includes('const clientId = "botconnector-cli"')) fail("account OAuth client id is not BotConnector")

const shareSource = read("packages/opencode/src/share/share-next.ts")
if (!shareSource.includes("Legacy upstream sharing endpoints are disabled in BotConnector")) {
  fail("share path does not block legacy upstream origins")
}

const botconnectorThemeSource = read("packages/tui/src/theme/assets/botconnector.json")
if (botconnectorThemeSource.includes("opencode.ai/theme.json")) fail("BotConnector theme still references upstream schema")

if (process.exitCode) process.exit(process.exitCode)
console.log("BOTCONNECTOR_RELEASE_AUDIT_PASS")
