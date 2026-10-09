import { describe, expect, test } from "bun:test"
import { resolveSessionTitle } from "@/cli/cmd/run/session-title"

describe("token-efficient session title", () => {
  test("one-shot CLI derives a searchable title without a second model call", () => {
    expect(resolveSessionTitle({ message: "Fix the checkout validation", mode: "auto", interactive: false }))
      .toBe("Fix the checkout validation")
  })

  test("AI title generation is still available when explicitly requested", () => {
    expect(resolveSessionTitle({ message: "Fix the checkout validation", mode: "ai", interactive: false }))
      .toBeUndefined()
  })

  test("interactive and slash commands retain legacy AI title behavior", () => {
    expect(resolveSessionTitle({ message: "Fix checkout", mode: "auto", interactive: true })).toBeUndefined()
    expect(resolveSessionTitle({ message: "Fix checkout", mode: "auto", interactive: false, command: "review" }))
      .toBeUndefined()
  })

  test("explicit names take precedence over optimization settings", () => {
    expect(resolveSessionTitle({ message: "Fix checkout", mode: "ai", interactive: false, explicit: "My task" }))
      .toBe("My task")
    expect(resolveSessionTitle({ message: "Fix checkout", mode: "ai", interactive: false, explicit: "" }))
      .toBe("Fix checkout")
  })

  test("prompt mode works even in interactive mode", () => {
    expect(resolveSessionTitle({ message: "Fix checkout", mode: "prompt", interactive: true }))
      .toBe("Fix checkout")
  })

  test("normalizes whitespace and truncates Unicode without splitting codepoints", () => {
    expect(resolveSessionTitle({ message: "Hello\n    world", mode: "auto", interactive: false }))
      .toBe("Hello world")
    expect(resolveSessionTitle({ message: "😀".repeat(51), mode: "auto", interactive: false }))
      .toBe("😀".repeat(50) + "…")
    expect(resolveSessionTitle({ message: "   ", mode: "auto", interactive: false }))
      .toBeUndefined()
  })

  test("does not persist obvious credentials inside local titles", () => {
    expect(resolveSessionTitle({ message: "api_key=very-secret-key", mode: "auto", interactive: false }))
      .toBe("BotConnector CLI task")
    expect(resolveSessionTitle({ message: "-----BEGIN PRIVATE KEY-----", mode: "auto", interactive: false }))
      .toBe("BotConnector CLI task")
  })
})
