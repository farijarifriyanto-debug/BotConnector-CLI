import { describe, expect, test } from "bun:test"
import { displayStats } from "@/cli/cmd/stats"

function makeStats(gateway: number): Parameters<typeof displayStats>[0] {
  return {
    totalSessions: 1,
    totalMessages: 2,
    totalCost: 0,
    unpricedGatewayMessages: gateway,
    totalTokens: { input: 100, output: 10, reasoning: 0, cache: { read: 900, write: 0 } },
    toolUsage: {},
    modelUsage: {},
    dateRange: { earliest: 0, latest: 0 },
    days: 1,
    costPerDay: 0,
    tokensPerSession: 1010,
    medianTokensPerSession: 1010,
  }
}

describe("CLI billing and token statistics", () => {
  test("does not present missing Gateway pricing as zero-cost inference", () => {
    const logs: string[] = []
    const log = console.log
    try {
      console.log = (...values) => { logs.push(values.join(" ")) }
      displayStats(makeStats(1))
    } finally {
      console.log = log
    }
    const output = logs.join("\n")
    expect(output).toContain("Known Cost (excl. Gateway)")
    expect(output).toContain("Gateway-billed messages")
    expect(output).toContain("Gateway + title charges")
    expect(output).toContain("Not included; see Workspace")
    expect(output).toContain("Cache Read Ratio")
    expect(output).toContain("90.0%")
  })

  test("normal provider usage keeps original total cost labeling", () => {
    const logs: string[] = []
    const log = console.log
    try {
      console.log = (...values) => { logs.push(values.join(" ")) }
      displayStats(makeStats(0))
    } finally {
      console.log = log
    }
    const output = logs.join("\n")
    expect(output).toContain("Total Cost")
    expect(output).not.toContain("Gateway-billed messages")
  })
})
