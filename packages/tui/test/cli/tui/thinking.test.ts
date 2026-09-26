import { describe, expect, test } from "bun:test"
import { reasoningSummary, splitEmbeddedThinking } from "../../../src/context/thinking"

describe("reasoningSummary", () => {
  test("extracts a leading summary title and leaves markdown body", () => {
    expect(reasoningSummary("**Continuing Quality Review**\n\nDetails.\n\n**Next section**\n\nMore.")).toEqual({
      title: "Continuing Quality Review",
      body: "Details.\n\n**Next section**\n\nMore.",
    })
  })

  test("extracts a completed title before its streamed body arrives", () => {
    expect(reasoningSummary("**Continuing Quality Review**")).toEqual({
      title: "Continuing Quality Review",
      body: "",
    })
  })

  test("preserves markdown-significant indentation in the extracted body", () => {
    expect(reasoningSummary("**Continuing Quality Review**\n\n    const value = true\n")).toEqual({
      title: "Continuing Quality Review",
      body: "    const value = true",
    })
  })

  test("does not consume ordinary leading bold content", () => {
    expect(reasoningSummary("**Important:** keep this in the body.")).toEqual({
      title: null,
      body: "**Important:** keep this in the body.",
    })
  })

  test("leaves content without a leading title in its body", () => {
    expect(reasoningSummary("Details only.")).toEqual({ title: null, body: "Details only." })
  })
})

describe("splitEmbeddedThinking", () => {
  test("extracts DeepSeek-style think markup into a separate disclosure", () => {
    expect(splitEmbeddedThinking("<think>inspect files\nthen test</think>Final answer")).toEqual({
      hasThinking: true,
      reasoning: "inspect files\nthen test",
      answer: "Final answer",
      closed: true,
    })
  })

  test("keeps an in-progress think block out of normal answer text", () => {
    expect(splitEmbeddedThinking("<think>still reasoning")).toEqual({
      hasThinking: true,
      reasoning: "still reasoning",
      answer: "",
      closed: false,
    })
  })

  test("leaves ordinary answers unchanged", () => {
    expect(splitEmbeddedThinking("Normal answer")).toEqual({
      hasThinking: false,
      reasoning: "",
      answer: "Normal answer",
      closed: true,
    })
  })
})
