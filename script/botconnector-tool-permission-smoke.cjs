// Exercise real tool calls through the packaged npm binary. Test files and
// Gateway are isolated. Denials must fail CI, approvals must execute an edit.
const assert = require("node:assert/strict")
const fs = require("node:fs")
const http = require("node:http")
const os = require("node:os")
const path = require("node:path")
const { spawn } = require("node:child_process")

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bccli-permission-e2e-"))
const target = path.join(dir, "protected.txt")
const config = path.join(dir, "botconnector.jsonc")
const token = "permission-smoke-only"

const server = http.createServer((req, res) => {
  if (req.headers.authorization !== "Bearer " + token) {
    res.writeHead(401).end()
    return
  }
  if (req.url === "/v1/models") {
    res.writeHead(200, { "content-type": "application/json" })
    res.end(JSON.stringify({ data: [{
      id: "permission-e2e", context_length: 32768, max_output_tokens: 2048,
      capabilities: { toolcall: true },
    }] }))
    return
  }
  if (req.url !== "/v1/chat/completions") {
    res.writeHead(404).end()
    return
  }
  let body = ""
  req.on("data", (chunk) => (body += chunk))
  req.on("end", () => {
    const request = JSON.parse(body)
    const firstSystem = String(request.messages.find((message) => message.role === "system")?.content ?? "")
    const titleRequest = firstSystem.includes("title generator")
    const continuation = request.messages.some((message) => message.role === "tool")
    res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-cache" })
    const chunk = (delta, finish) => JSON.stringify({
      id: "chatcmpl-permission", object: "chat.completion.chunk",
      created: 1, model: "permission-e2e",
      choices: [{ index: 0, delta, finish_reason: finish }],
    })
    if (titleRequest || continuation) {
      res.write("data: " + chunk({ role: "assistant", content: titleRequest ? "Fixture" : "AFTER_TOOL" }, null) + "\n\n")
      res.write("data: " + chunk({}, "stop") + "\n\n")
    } else {
      const args = { filePath: target, oldString: "STATE=LOCKED", newString: "STATE=OPEN" }
      res.write("data: " + chunk({
        role: "assistant",
        tool_calls: [{ index: 0, id: "call_test_edit", type: "function",
          function: { name: "edit", arguments: JSON.stringify(args) } }],
      }, null) + "\n\n")
      res.write("data: " + chunk({}, "tool_calls") + "\n\n")
    }
    res.end("data: [DONE]\n\n")
  })
})

function execute(args) {
  const launcher = path.resolve("node_modules/@botconnector/bccli/bin/bccli.js")
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [launcher, ...args], {
      cwd: dir, timeout: 45_000,
      // Simulate a CI runner spawning the CLI into a different cwd while PWD is stale.
      // The project root must still be the spawned process cwd, not this inherited value.
      env: { ...process.env, PWD: path.dirname(dir), BOTCONNECTOR_CONFIG: config, BOTCONNECTOR_API_KEY: token },
      stdio: ["ignore", "pipe", "pipe"],
    })
    let stdout = ""
    let stderr = ""
    child.stdout.on("data", (chunk) => (stdout += chunk))
    child.stderr.on("data", (chunk) => (stderr += chunk))
    child.once("error", reject)
    child.once("close", (code) => resolve({ code, stdout, stderr }))
  })
}

server.listen(0, "127.0.0.1", async () => {
  try {
    const address = server.address()
    assert.ok(address && typeof address !== "string")
    fs.writeFileSync(config, JSON.stringify({
      permission: { edit: "ask" },
      provider: { botconnector: {
        npm: "@ai-sdk/openai-compatible",
        name: "BotConnector Gateway",
        env: ["BOTCONNECTOR_API_KEY"],
        options: { baseURL: "http://127.0.0.1:" + address.port + "/v1" },
        models: {},
      } },
    }))

    fs.writeFileSync(target, "STATE=LOCKED\n")
    const denied = await execute([
      "run", "-m", "botconnector/permission-e2e", "--format", "json",
      "Edit protected.txt then confirm.",
    ])
    assert.notEqual(denied.code, 0, "denied edit falsely returned successful exit status")
    assert.equal(fs.readFileSync(target, "utf8"), "STATE=LOCKED\n", "denied edit changed file")
    const events = denied.stdout.split("\n").filter(Boolean).map((line) => JSON.parse(line))
    assert.ok(events.some((event) => event.type === "permission_denied" && event.permission === "edit"))
    assert.ok(!denied.stdout.includes(token) && !denied.stderr.includes(token), "API key leaked")

    const allowed = await execute([
      "run", "-m", "botconnector/permission-e2e",
      "--dangerously-skip-permissions", "Edit protected.txt now.",
    ])
    assert.equal(allowed.code, 0, "approved tool failed: " + allowed.stderr.slice(0, 500))
    assert.equal(fs.readFileSync(target, "utf8"), "STATE=OPEN\n", "approved edit did not execute")
    console.log("BOTCONNECTOR_TOOL_PERMISSION_E2E_PASS")
  } catch (error) {
    console.error("BOTCONNECTOR_TOOL_PERMISSION_E2E_FAIL:", error)
    process.exitCode = 1
  } finally {
    server.close()
    fs.rmSync(dir, { recursive: true, force: true })
  }
})
