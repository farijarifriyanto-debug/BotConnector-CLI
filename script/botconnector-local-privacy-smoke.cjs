const http = require("http")
const path = require("path")
const { spawn } = require("child_process")

let gatewayRequests = 0

const listen = (server, port = 0) =>
  new Promise((resolve, reject) => {
    server.once("error", reject)
    server.listen(port, "127.0.0.1", () => resolve(server.address().port))
  })

const gateway = http.createServer((req, res) => {
  gatewayRequests += 1
  res.writeHead(500, { "content-type": "application/json" })
  res.end(JSON.stringify({ error: { message: "Gateway must not be used by Local mode" } }))
})

const ollama = http.createServer((req, res) => {
  if (req.url === "/api/tags") {
    res.writeHead(200, { "content-type": "application/json" })
    res.end(JSON.stringify({
      models: [
        { name: "local-test", size: 1024 * 1024 },
        { name: "remote-test:cloud", size: 1024 * 1024 },
      ],
    }))
    return
  }
  if (req.url === "/v1/chat/completions" && req.method === "POST") {
    req.resume()
    res.writeHead(200, {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
      connection: "keep-alive",
    })
    const created = Math.floor(Date.now() / 1000)
    res.write(`data: ${JSON.stringify({
      id: "chatcmpl-local",
      object: "chat.completion.chunk",
      created,
      model: "local-test",
      choices: [{ index: 0, delta: { role: "assistant", content: "LOCAL_OK" }, finish_reason: null }],
    })}\n\n`)
    res.write(`data: ${JSON.stringify({
      id: "chatcmpl-local",
      object: "chat.completion.chunk",
      created,
      model: "local-test",
      choices: [{ index: 0, delta: {}, finish_reason: "stop" }],
    })}\n\n`)
    res.end("data: [DONE]\n\n")
    return
  }

  res.writeHead(404)
  res.end()
})

const runCli = (args, env) =>
  new Promise((resolve, reject) => {
    const launcher = path.resolve("node_modules/@botconnector/bccli/bin/bccli.js")
    const child = spawn(process.execPath, [launcher, ...args], {
      env: { ...process.env, ...env },
      stdio: ["ignore", "pipe", "pipe"],
    })
    let stdout = ""
    let stderr = ""
    child.stdout.on("data", (x) => (stdout += x))
    child.stderr.on("data", (x) => (stderr += x))
    child.once("error", reject)
    child.once("close", (code) => resolve({ code, stdout, stderr }))
  })

;(async () => {
  const gatewayPort = await listen(gateway)
  await listen(ollama, 11434)

  const home = process.env.BOTCONNECTOR_MIGRATION_TEST_HOME || process.env.HOME
  const env = {
    HOME: home,
    USERPROFILE: home,
    BOTCONNECTOR_API_KEY: "trap-only",
    BOTCONNECTOR_CONFIG_CONTENT: JSON.stringify({
      provider: {
        botconnector: {
          options: { baseURL: `http://127.0.0.1:${gatewayPort}/v1` },
        },
      },
    }),
  }

  const models = await runCli(["models", "ollama"], env)
  if (models.code !== 0) throw new Error(`models ollama failed: ${models.stderr}`)
  if (!models.stdout.includes("ollama/local-test")) throw new Error("local Ollama model was not discovered")
  if (models.stdout.includes(":cloud")) throw new Error("Local selector exposed a :cloud model")

  const chat = await runCli(["run", "-m", "ollama/local-test", "Reply LOCAL_OK"], env)
  if (chat.code !== 0) throw new Error(`local inference failed: ${chat.stderr}\n${chat.stdout}`)
  if (!chat.stdout.includes("LOCAL_OK")) throw new Error(`local inference response missing: ${chat.stdout}`)
  if (gatewayRequests !== 0) throw new Error(`Local inference contacted BotConnector Gateway ${gatewayRequests} time(s)`)

  console.log("BOTCONNECTOR_LOCAL_PRIVACY_SMOKE_PASS")
})()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => {
    gateway.close()
    ollama.close()
  })
