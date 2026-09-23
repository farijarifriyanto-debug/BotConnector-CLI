#!/usr/bin/env node
// Downloads the pre-built botconnector binary for this platform from the
// project's GitHub Releases and installs it into ../bin/, since we don't
// publish per-platform optionalDependencies packages the way opencode's own
// upstream build does -- this is a much simpler single-package + postinstall
// download, matching a common pattern for small CLI tools.

const fs = require("fs")
const path = require("path")
const https = require("https")
const { execFileSync } = require("child_process")

const REPO = "farijarifriyanto-debug/BotConnector-CLI"
const VERSION = require("../package.json").version
const BIN_DIR = path.join(__dirname, "..", "bin")

const PLATFORM_MAP = {
  win32: { asset: "botconnector-windows-x64.zip", binName: "botconnector.exe" },
  linux: { asset: "botconnector-linux-x64.tar.gz", binName: "botconnector" },
}

function fail(message) {
  console.error(`botconnector-cli: ${message}`)
  process.exit(1)
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest)
    const req = https.get(url, { headers: { "User-Agent": "botconnector-cli-postinstall" } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close()
        fs.unlinkSync(dest)
        download(res.headers.location, dest).then(resolve, reject)
        return
      }
      if (res.statusCode !== 200) {
        file.close()
        reject(new Error(`HTTP ${res.statusCode} downloading ${url}`))
        return
      }
      res.pipe(file)
      file.on("finish", () => file.close(resolve))
    })
    req.on("error", reject)
  })
}

async function main() {
  const platform = PLATFORM_MAP[process.platform]
  if (!platform) {
    fail(
      `unsupported platform "${process.platform}". Windows and Linux (x64) are the only prebuilt targets right now.`,
    )
  }

  fs.mkdirSync(BIN_DIR, { recursive: true })
  const archivePath = path.join(BIN_DIR, platform.asset)
  const url = `https://github.com/${REPO}/releases/download/v${VERSION}/${platform.asset}`

  console.log(`botconnector-cli: downloading ${url}`)
  await download(url, archivePath)

  if (platform.asset.endsWith(".zip")) {
    execFileSync("powershell.exe", [
      "-NoProfile",
      "-NonInteractive",
      "-Command",
      `Expand-Archive -Path '${archivePath}' -DestinationPath '${BIN_DIR}' -Force`,
    ])
  } else {
    execFileSync("tar", ["-xzf", archivePath, "-C", BIN_DIR])
  }
  fs.unlinkSync(archivePath)

  const binPath = path.join(BIN_DIR, platform.binName)
  if (!fs.existsSync(binPath)) fail(`expected binary not found after extraction: ${binPath}`)
  if (process.platform !== "win32") fs.chmodSync(binPath, 0o755)

  console.log(`botconnector-cli: installed ${binPath}`)
}

main().catch((err) => fail(err.message))
