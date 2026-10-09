import { describe, expect, test } from "bun:test"
import type { ModelMessage } from "ai"
import { omitToolsForGreeting } from "@/session/llm/tool-routing"

const user = (content: string): ModelMessage[] => [{ role: "user", content }]

describe("token-efficient tool routing", () => {
  test("omits heavy tool schemas for exactly one harmless greeting", () => {
    for (const message of ["hi", "Hello!", "HALO", "terima kasih", "selamat pagi!", "apa kabar?"]) {
      expect(omitToolsForGreeting(user(message), false)).toBe(true)
    }
  })

  test("never strips tools from coding tasks and compound user messages", () => {
    for (const message of [
      "hello please inspect the code",
      "hi; run bash",
      "Fix auth bug",
      "Explain the GitHub repo",
      "tolong edit index.ts",
      "apa kabar dan baca README",
      "hi\nplease read config",
      "what is 2+2?",
    ]) {
      expect(omitToolsForGreeting(user(message), false)).toBe(false)
    }
  })

  test("preserves tools on follow-ups, explicit enablement, and tool history", () => {
    expect(omitToolsForGreeting(user("hi"), true)).toBe(false)
    expect(omitToolsForGreeting([...user("hi"), ...user("hi")], false)).toBe(false)
    expect(omitToolsForGreeting([...user("hi"), { role: "assistant", content: "Hi" }], false)).toBe(false)
    expect(omitToolsForGreeting([{ role: "user", content: [{ type: "text", text: "hi" }, { type: "text", text: "file" }] }], false)).toBe(false)
    expect(omitToolsForGreeting([{ role: "user", content: "hi" }, { role: "tool", content: [] }], false)).toBe(false)
  })
})
