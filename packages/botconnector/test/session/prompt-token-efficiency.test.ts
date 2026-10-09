import { describe, expect, test } from "bun:test"

const source = new URL("../../src/session/prompt/default.txt", import.meta.url)

describe("default coding prompt token budget", () => {
  test("keeps the baseline concise without deleting core agent capabilities", async () => {
    const prompt = await Bun.file(source).text()
    expect(prompt.length).toBeLessThan(4_000)
    for (const essential of [
      "software-engineering",
      "Bash",
      "Task",
      "search tools",
      "lint",
      "typecheck",
      "regression tests",
      "tool permissions",
      "untrusted data",
      "secrets",
      "Never commit changes",
    ]) {
      expect(prompt).toContain(essential)
    }
  })

  test("does not repeat large few-shot transcript examples", async () => {
    const prompt = await Bun.file(source).text()
    expect(prompt).not.toContain("<example>")
    expect(prompt.split("You are BotConnector").length).toBe(2)
  })
})
