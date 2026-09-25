#!/usr/bin/env node
// No postinstall/download step: npm installs exactly one of the
// optionalDependencies platform packages (matched by "os"/"cpu" in each
// package.json), and this launcher just execs whichever binary landed
// in node_modules. If neither installed (unsupported platform, or npm
// skipped optional deps), we say so clearly instead of failing silently.

const fs = require("fs")
const os = require("os")
const path = require("path")
const { spawnSync } = require("child_process")

const PLATFORM_PACKAGES = {
  win32: { pkg: "botconnector-cli-win32-x64", binName: "botconnector.exe" },
  linux: { pkg: "botconnector-cli-linux-x64", binName: "botconnector" },
}

// Seed the BotConnector Gateway provider config on first run. BotConnector
// keeps its own config under ~/.config/botconnector. The seed is copied once;
// a narrow migration below only updates fields that exactly match our old
// generated defaults, preserving user changes.
function seedDefaultConfig() {
  try {
    const configDir = path.join(os.homedir(), ".config", "botconnector")
    const dest = path.join(configDir, "botconnector-cloud.jsonc")
    if (!fs.existsSync(dest)) {
      const src = path.join(__dirname, "..", "default-config", "botconnector-cloud.jsonc")
      if (fs.existsSync(src)) {
        fs.mkdirSync(configDir, { recursive: true })
        fs.copyFileSync(src, dest)
      }
    }
    return dest
  } catch {
    return undefined
  }
}

function migrateDefaultConfig() {
  try {
    const dest = path.join(os.homedir(), ".config", "botconnector", "botconnector-cloud.jsonc")
    if (!fs.existsSync(dest)) return

    const raw = fs.readFileSync(dest, "utf8")
    const config = JSON.parse(raw)
    const provider = config?.provider?.botconnector
    if (!provider || typeof provider !== "object") return

    let changed = false
    if (provider.name === "BotConnector Cloud") {
      provider.name = "BotConnector Gateway"
      changed = true
    }

    const options = provider.options
    if (
      options &&
      typeof options === "object" &&
      options.apiKey === "{env:BOTCONNECTOR_API_KEY}"
    ) {
      delete options.apiKey
      changed = true
    }

    if (!Array.isArray(provider.env)) {
      provider.env = ["BOTCONNECTOR_API_KEY"]
      changed = true
    } else if (!provider.env.includes("BOTCONNECTOR_API_KEY")) {
      provider.env.push("BOTCONNECTOR_API_KEY")
      changed = true
    }

    // Older generated configs could contain an empty Gateway model map.
    // Add only missing canonical models from the bundled default so custom
    // user models and overrides remain untouched.
    const bundledPath = path.join(__dirname, "..", "default-config", "botconnector-cloud.jsonc")
    if (fs.existsSync(bundledPath)) {
      const bundled = JSON.parse(fs.readFileSync(bundledPath, "utf8"))
      const canonicalModels = bundled?.provider?.botconnector?.models
      if (canonicalModels && typeof canonicalModels === "object") {
        provider.models ??= {}
        for (const [modelID, model] of Object.entries(canonicalModels)) {
          if (provider.models[modelID] !== undefined) continue
          provider.models[modelID] = model
          changed = true
        }
      }
    }

    // 0.1.8-0.1.11 injected an exact { edit: "ask", bash: "ask" }
    // permission block into generated configs. Remove only that proven legacy
    // shape so existing users regain upstream OpenCode defaults without
    // clobbering any custom permission policy.
    const permission = config.permission
    if (
      permission &&
      typeof permission === "object" &&
      !Array.isArray(permission) &&
      Object.keys(permission).length === 2 &&
      permission.edit === "ask" &&
      permission.bash === "ask"
    ) {
      delete config.permission
      changed = true
    }

    config.provider ??= {}
    if (!config.provider.ollama) {
      config.provider.ollama = {
        npm: "@ai-sdk/openai-compatible",
        name: "Ollama Local",
        options: { baseURL: "http://127.0.0.1:11434/v1" },
        models: {},
      }
      changed = true
    }

    if (changed) fs.writeFileSync(dest, JSON.stringify(config, null, 2) + "\n")
  } catch {
    // Never block the CLI for a best-effort migration. JSONC/user-customized
    // files that are not valid JSON are left untouched.
  }
}

function resolveBinary() {
  const entry = PLATFORM_PACKAGES[process.platform]
  if (!entry) {
    console.error(
      `botconnector-cli: unsupported platform "${process.platform}". Windows and Linux (x64) are the only prebuilt targets right now.`,
    )
    process.exit(1)
  }
  try {
    const pkgJsonPath = require.resolve(`${entry.pkg}/package.json`)
    return path.join(path.dirname(pkgJsonPath), entry.binName)
  } catch {
    console.error(
      `botconnector-cli: could not find ${entry.pkg} in node_modules.\n` +
        `This usually means optional dependencies were skipped during install.\n` +
        `Try: npm install botconnector-cli --include=optional`,
    )
    process.exit(1)
  }
}

const seededConfig = seedDefaultConfig()
migrateDefaultConfig()

const binPath = resolveBinary()
const env = { ...process.env }

// BotConnector owns config resolution. Legacy OpenCode config variables from
// older installs must never silently override BotConnector's canonical config.
delete env.OPENCODE_CONFIG
delete env.OPENCODE_CONFIG_DIR
delete env.OPENCODE_CONFIG_CONTENT

if (!env.BOTCONNECTOR_CONFIG && seededConfig && fs.existsSync(seededConfig)) {
  env.BOTCONNECTOR_CONFIG = seededConfig
}

// Canonical BotConnector server envs. Legacy aliases are only an internal
// compatibility bridge for the embedded runtime.
if (env.BOTCONNECTOR_SERVER_USERNAME && !env.OPENCODE_SERVER_USERNAME) {
  env.OPENCODE_SERVER_USERNAME = env.BOTCONNECTOR_SERVER_USERNAME
}
if (env.BOTCONNECTOR_SERVER_PASSWORD && !env.OPENCODE_SERVER_PASSWORD) {
  env.OPENCODE_SERVER_PASSWORD = env.BOTCONNECTOR_SERVER_PASSWORD
}

const result = spawnSync(binPath, process.argv.slice(2), { stdio: "inherit", env })

if (result.error) {
  console.error(`botconnector-cli: failed to launch ${binPath}: ${result.error.message}`)
  process.exit(1)
}

process.exit(result.status ?? 1)
