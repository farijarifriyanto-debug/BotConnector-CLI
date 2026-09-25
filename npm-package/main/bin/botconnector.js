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
    if (fs.existsSync(dest)) return
    const src = path.join(__dirname, "..", "default-config", "botconnector-cloud.jsonc")
    if (!fs.existsSync(src)) return
    fs.mkdirSync(configDir, { recursive: true })
    fs.copyFileSync(src, dest)
  } catch {
    // best-effort only
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

seedDefaultConfig()
migrateDefaultConfig()

const binPath = resolveBinary()
const result = spawnSync(binPath, process.argv.slice(2), { stdio: "inherit" })

if (result.error) {
  console.error(`botconnector-cli: failed to launch ${binPath}: ${result.error.message}`)
  process.exit(1)
}

process.exit(result.status ?? 1)
