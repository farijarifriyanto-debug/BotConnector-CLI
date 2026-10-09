// Exercise the PUBLISHED npm launcher, authenticated model discovery, and an
// actual Chat Completions streaming request against a local protocol fixture.
// A mock provider proves wiring, NOT real BotConnector billing/availability.
const assert = require("node:assert/strict")
const fs = require("node:fs")
const http = require("node:http")
const os = require("node:os")
const path = require("node:path")
const { spawn } = require("node:child_process")

const workdir = fs.mkdtempSync(path.join(os.tmpdir(), "bccli-gateway-e2e-"))
const key = "bccli-gateway-smoke-only"
let catalogRequests = 0
let completionRequests = 0
let promptSeen = false
let unauthorized = 0

const server = http.createServer((req, res) => {
  if (req.headers.authorization !== "Bearer " + key) {
    unauthorized += 1
    res.writeHead(401, { "content-type": "application/json" })
    res.end('{"error":{"message":"unauthorized"}}')
    return
  }

  if (req.url === "/v1/models" && req.method === "GET") {
    catalogRequests += 1
    res.writeHead(200, { "content-type": "application/json" })
    res.end(JSON.stringify({
      object: "list",
      data: [{
        id: "gateway-e2e-model", name: "Gateway E2E fixture",
        context_length: 32768, max_output_tokens: 2048,
        capabilities: { toolcall: true, input: { text: true } },
      }],
    }))
    return
  }

  if (req.url === "/v1/chat/completions" && req.method === "POST") {
    let input = ""
    req.on("data", (chunk) => (input += chunk))
    req.on("end", () => {
      completionRequests += 1
      try {
        const request = JSON.parse(input)
        promptSeen = request.model === "gateway-e2e-model" && JSON.stringify(request.messages).includes("E2E_REQUEST")
      } catch {
        promptSeen = false
      }
      res.writeHead(200, {
        "content-type": "text/event-stream",
        "cache-control": "no-cache",
        connection: "keep-alive",
      })
      const chunk = (value, finish) => JSON.stringify({
        id: "chatcmpl-bccli-e2e",
        object: "chat.completion.chunk",
        created: 1,
        model: "gateway-e2e-model",
        choices: [{ index: 0, delta: value ? { content: value } : {}, finish_reason: finish }],
      })
      res.write("data: " + chunk("GATEWAY_", null) + "\n\n")
      res.write("data: " + chunk("E2E_OK", null) + "\n\n")
      res.write("data: " + chunk("", "stop") + "\n\n")
      res.end("data: [DONE]\n\n")
    })
    return
  }

  res.writeHead(404).end()
})

server.listen(0, "127.0.0.1", async () => {
  try {
    const address = server.address()
    assert.ok(address && typeof address !== "string")
    const config = path.join(workdir, "botconnector.jsonc")
    fs.writeFileSync(config, JSON.stringify({
      provider: {
        botconnector: {
          npm: "@ai-sdk/openai-compatible",
          name: "BotConnector Gateway",
          env: ["BOTCONNECTOR_API_KEY"],
          options: { baseURL: "http://127.0.0.1:" + address.port + "/v1" },
          models: {},
        },
      },
    }))
    const launcher = path.resolve("node_modules/@botconnector/bccli/bin/bccli.js")
    const result = await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [
        launcher, "run", "-m", "botconnector/gateway-e2e-model",
        "--format", "json", "E2E_REQUEST",
      ], {
        cwd: workdir,
        env: { ...process.env, BOTCONNECTOR_CONFIG: config, BOTCONNECTOR_API_KEY: key },
        stdio: ["ignore", "pipe", "pipe"],
      })
      let stdout = ""
      let stderr = ""
      child.stdout.on("data", (data) => (stdout += data))
      child.stderr.on("data", (data) => (stderr += data))
      child.once("error", reject)
      child.once("close", (code) => resolve({ code, stdout, stderr }))
    })
    assert.equal(result.code, 0, "CLI failed: " + result.stderr.slice(0, 500))
    assert.ok(catalogRequests > 0, "CLI did not fetch authorized model catalog")
    assert.equal(completionRequests, 1, "CLI must make exactly one test inference request")
    assert.equal(unauthorized, 0, "CLI sent an unauthorized request")
    assert.ok(promptSeen, "model ID/prompt did not reach Chat Completions")
    const events = result.stdout.split("\n").filter(Boolean).map((line) => JSON.parse(line))
    const answer = events.filter((event) => event.type === "text").map((event) => event.text).join("")
    assert.equal(answer, "GATEWAY_E2E_OK")
    assert.ok(events.some((event) => event.type === "step_finish"), "stream never completed")
    assert.ok(!result.stdout.includes(key) && !result.stderr.includes(key), "secret leaked in output")
    assert.ok(events.every((event) => !("sessionID" in event)), "raw session IDs leaked in JSON output")
    console.log("BOTCONNECTOR_GATEWAY_INFERENCE_E2E_PASS")
  } catch (error) {
    console.error("BOTCONNECTOR_GATEWAY_INFERENCE_E2E_FAIL:", error)
    process.exitCode = 1
  } finally {
    server.close()
    fs.rmSync(workdir, { recursive: true, force: true })
  }
})
