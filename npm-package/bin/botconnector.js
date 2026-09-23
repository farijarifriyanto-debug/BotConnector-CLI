#!/usr/bin/env node
// Thin launcher: execs the real platform binary that postinstall.js
// downloaded into this same directory, forwarding args/stdio/exit code.

const path = require("path")
const { spawnSync } = require("child_process")

const binName = process.platform === "win32" ? "botconnector.exe" : "botconnector"
const binPath = path.join(__dirname, binName)

const result = spawnSync(binPath, process.argv.slice(2), { stdio: "inherit" })

if (result.error) {
  console.error(`botconnector-cli: failed to launch ${binPath}: ${result.error.message}`)
  console.error("Try reinstalling: npm install -g botconnector-cli")
  process.exit(1)
}

process.exit(result.status ?? 1)
