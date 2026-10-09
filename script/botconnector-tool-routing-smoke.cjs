// Verify that the installed npm binary omits schemas only for trivial greetings.
// All coding tools must remain available for normal user instructions.
const assert = require("node:assert/strict")
const fs = require("node:fs")
const os = require("node:os")
const path = require("node:path")
const http = require("node:http")
const { spawn } = require("node:child_process")

const workdir = fs.mkdtempSync(path.join(os.tmpdir(), "bccli-routing-e2e-"))
const key = "bccli-routing-fixture-only"
const requests = []
const server = http.createServer((req, res) => {
  if (req.headers.authorization !== "Bearer " + key) {
    res.writeHead(401).end()
    return
  }
  if (req.method === "GET" && req.url === "/v1/models") {
    res.writeHead(200, { "content-type": "application/json" })
    res.end(JSON.stringify({ data: [{
      id: "routing-e2e-model", name: "Routing E2E fixture",
      context_length: 32768, max_output_tokens: 2048,
      capabilities: { toolcall: true, input: { text: true } },
    }] }))
    return
  }
  if (req.method === "POST" && req.url === "/v1/chat/completions") {
    let body = ""
    req.on("data", chunk => { body += chunk })
    req.on("end", () => {
      const payload = JSON.parse(body)
      requests.push({ payload, bodyLength: body.length })
      res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-cache" })
      res.write('data: ' + JSON.stringify({
        id: "chatcmpl-routing", object: "chat.completion.chunk", created: 1,
        model: "routing-e2e-model",
        choices: [{ index: 0, delta: { content: "TOKEN_ROUTING_OK" }, finish_reason: null }],
      }) + "\n\n")
      res.write('data: ' + JSON.stringify({
        id: "chatcmpl-routing", object: "chat.completion.chunk", created: 1,
        model: "routing-e2e-model",
        choices: [{ index: 0, delta: {}, finish_reason: "stop" }],
      }) + "\n\n")
      res.end("data: [DONE]\n\n")
    })
    return
  }
  res.writeHead(404).end()
})

async function runCli(message, config) {
  const launcher = path.resolve("node_modules/@botconnector/bccli/bin/bccli.js")
  const result = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [
      launcher, "run", "-m", "botconnector/routing-e2e-model", "--format", "json", message,
    ], {
      cwd: workdir,
      timeout: 45_000,
      env: { ...process.env, BOTCONNECTOR_CONFIG: config, BOTCONNECTOR_API_KEY: key },
      stdio: ["ignore", "pipe", "pipe"],
    })
    let stdout = ""
    let stderr = ""
    child.stdout.on("data", chunk => { stdout += chunk })
    child.stderr.on("data", chunk => { stderr += chunk })
    child.once("error", reject)
    child.once("close", code => resolve({ code, stdout, stderr }))
  })
  assert.equal(result.code, 0, "CLI exit: " + result.stderr.slice(0, 700))
  assert.ok(result.stdout.includes("TOKEN_ROUTING_OK"), "model output missing")
  assert.ok(!result.stdout.includes(key) && !result.stderr.includes(key), "fixture secret leaked")
}

server.listen(0, "127.0.0.1", async () => {
  try {
    const address = server.address()
    assert.ok(address && typeof address !== "string")
    const config = path.join(workdir, "botconnector.jsonc")
    fs.writeFileSync(config, JSON.stringify({ provider: { botconnector: {
      npm: "@ai-sdk/openai-compatible", name: "BotConnector Gateway",
      env: ["BOTCONNECTOR_API_KEY"],
      options: { baseURL: "http://127.0.0.1:" + address.port + "/v1" },
      models: {},
    } } }))
    await runCli("hello", config)
    await runCli("Please edit index.ts and run the project tests", config)
    assert.equal(requests.length, 2, "unexpected extra title or retry calls")
    const [greeting, coding] = requests
    assert.equal(greeting.payload.model, "routing-e2e-model")
    assert.equal(coding.payload.model, "routing-e2e-model")
    assert.equal((greeting.payload.tools ?? []).length, 0, "greeting sent redundant tool schemas")
    assert.ok((coding.payload.tools ?? []).length >= 5, "coding request lost its tools")
    assert.ok(coding.bodyLength > greeting.bodyLength + 3_000, "no substantial tool-payload saving")
    console.log("BOTCONNECTOR_TOKEN_ROUTING_E2E_PASS", {
      greetingChars: greeting.bodyLength,
      codingChars: coding.bodyLength,
      codingTools: coding.payload.tools.length,
    })
  } catch (error) {
    console.error("BOTCONNECTOR_TOKEN_ROUTING_E2E_FAIL", error)
    process.exitCode = 1
  } finally {
    server.close()
    fs.rmSync(workdir, { recursive: true, force: true })
  }
})
