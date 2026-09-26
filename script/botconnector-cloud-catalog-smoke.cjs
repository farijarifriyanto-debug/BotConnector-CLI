const fs = require("fs")
const http = require("http")
const os = require("os")
const path = require("path")
const { spawn } = require("child_process")

const fail = (message) => {
  console.error("BOTCONNECTOR_CLOUD_CATALOG_SMOKE_FAIL:", message)
  process.exitCode = 1
}

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "botconnector-cloud-catalog-"))
const configPath = path.join(dir, "botconnector.jsonc")
let sawAuthorizedCatalogRequest = false

const server = http.createServer((req, res) => {
  if (req.url !== "/v1/models") {
    res.writeHead(404).end()
    return
  }
  if (req.headers.authorization !== "Bearer catalog-smoke-key") {
    res.writeHead(401, { "content-type": "application/json" })
    res.end(JSON.stringify({ error: { message: "unauthorized" } }))
    return
  }

  sawAuthorizedCatalogRequest = true
  res.writeHead(200, { "content-type": "application/json" })
  res.end(JSON.stringify({
    object: "list",
    data: [
      { id: "live-model-a" },
      { id: "live-model-b", name: "Live Model B", context_length: 65536, max_output_tokens: 4096 }
    ]
  }))
})

server.listen(0, "127.0.0.1", async () => {
  try {
    const address = server.address()
    if (!address || typeof address === "string") throw new Error("mock server did not bind")

    fs.writeFileSync(configPath, JSON.stringify({
      provider: {
        botconnector: {
          npm: "@ai-sdk/openai-compatible",
          name: "BotConnector Gateway",
          env: ["BOTCONNECTOR_API_KEY"],
          options: { baseURL: `http://127.0.0.1:${address.port}/v1` },
          models: { "stale-config-model": { name: "STALE CONFIG MODEL" } }
        }
      }
    }, null, 2) + "\n")

    const command = process.platform === "win32" ? "npx.cmd" : "npx"
    const child = spawn(command, ["--no-install", "botconnector", "models", "botconnector"], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        BOTCONNECTOR_CONFIG: configPath,
        BOTCONNECTOR_API_KEY: "catalog-smoke-key"
      },
      stdio: ["ignore", "pipe", "pipe"]
    })

    let stdout = ""
    let stderr = ""
    child.stdout.on("data", (chunk) => (stdout += chunk))
    child.stderr.on("data", (chunk) => (stderr += chunk))

    const code = await new Promise((resolve, reject) => {
      child.once("error", reject)
      child.once("close", resolve)
    })

    if (code !== 0) fail(`CLI exited with ${code}: ${stderr || stdout}`)
    if (!sawAuthorizedCatalogRequest) fail("CLI did not request the authenticated live model catalog")
    if (!stdout.includes("botconnector/live-model-a")) fail("live-model-a missing from CLI model list")
    if (!stdout.includes("botconnector/live-model-b")) fail("live-model-b missing from CLI model list")
    if (stdout.includes("stale-config-model")) fail("stale config model leaked into CLI model list")
    if (!process.exitCode) console.log("BOTCONNECTOR_CLOUD_CATALOG_SMOKE_PASS")
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error))
  } finally {
    server.close()
    fs.rmSync(dir, { recursive: true, force: true })
  }
})
