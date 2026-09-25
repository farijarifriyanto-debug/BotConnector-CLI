import { describe, expect, test } from "bun:test"
import { isInternalTranscriptTool, toolDisplayMetadata, webSearchProviderLabel } from "../../src/util/tool-display"

describe("webSearchProviderLabel", () => {
  test("labels known providers", () => {
    expect(webSearchProviderLabel("parallel")).toBe("Parallel Web Search")
    expect(webSearchProviderLabel("exa")).toBe("Exa Web Search")
  })

  for (const [name, provider] of [
    ["undefined", undefined],
    ["null", null],
    ["an object", {}],
    ["an array", []],
    ["a number", 1],
    ["an unexpected string", "other"],
  ] as const) {
    test(`uses the generic label for ${name}`, () => {
      expect(webSearchProviderLabel(provider)).toBe("Web Search")
    })
  }
})

describe("toolDisplayMetadata", () => {
  test("returns structured metadata for non-pending states", () => {
    const structured = { provider: "parallel", numResults: 3 }

    expect(toolDisplayMetadata({ status: "running", structured })).toBe(structured)
    expect(toolDisplayMetadata({ status: "completed", structured })).toBe(structured)
    expect(toolDisplayMetadata({ status: "error", structured })).toBe(structured)
  })

  test("does not expose pending or malformed metadata", () => {
    expect(toolDisplayMetadata({ status: "pending", structured: { provider: "exa" } })).toEqual({})
    expect(toolDisplayMetadata({ status: "completed" })).toEqual({})
    expect(toolDisplayMetadata({ status: "completed", structured: null })).toEqual({})
    expect(toolDisplayMetadata({ status: "completed", structured: [] })).toEqual({})
    expect(toolDisplayMetadata(undefined)).toEqual({})
  })
})


describe("isInternalTranscriptTool", () => {
  test("hides web activity from the main transcript", () => {
    expect(isInternalTranscriptTool("webfetch")).toBe(true)
    expect(isInternalTranscriptTool("websearch")).toBe(true)
    expect(isInternalTranscriptTool("WebFetch")).toBe(true)
    expect(isInternalTranscriptTool("WebSearch")).toBe(true)
  })

  test("keeps user-relevant coding tools visible", () => {
    expect(isInternalTranscriptTool("bash")).toBe(false)
    expect(isInternalTranscriptTool("read")).toBe(false)
    expect(isInternalTranscriptTool("write")).toBe(false)
    expect(isInternalTranscriptTool("edit")).toBe(false)
    expect(isInternalTranscriptTool("task")).toBe(false)
    expect(isInternalTranscriptTool(undefined)).toBe(false)
  })
})
