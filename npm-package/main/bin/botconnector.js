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

// Seed the "BotConnector Cloud" provider config on first run. opencode has
// no concept of a package-bundled default config -- everything comes from
// ~/.config/opencode/*.jsonc -- so this copies our bundled file there once
// if it doesn't already exist. Never overwrites a file the user may have
// edited, and never fails the CLI launch if this can't be done.
function seedDefaultConfig() {
  try {
    const configDir = path.join(os.homedir(), ".config", "opencode")
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

const binPath = resolveBinary()
const result = spawnSync(binPath, process.argv.slice(2), { stdio: "inherit" })

if (result.error) {
  console.error(`botconnector-cli: failed to launch ${binPath}: ${result.error.message}`)
  process.exit(1)
}

process.exit(result.status ?? 1)
