// Preserve a searchable session title without an additional model invocation
// for one-shot CLI prompts. AI-generated titles remain available explicitly.
export type TitleMode = "auto" | "ai" | "prompt"

export function resolveSessionTitle(input: {
  explicit?: string
  message: string
  mode: TitleMode
  interactive: boolean
  command?: string
}): string | undefined {
  if (input.explicit !== undefined && input.explicit !== "") return input.explicit
  if (input.mode === "ai") return undefined
  if (input.mode === "auto" && (input.interactive || input.command)) return undefined

  const cleaned = input.message
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  if (!cleaned) return undefined
  // Avoid embedding long code, private key material, or pasted credentials in titles.
  if (/(?:sk-|ghp_|github_pat_|AIza|-----BEGIN |bearer\s+\S+|(?:api[_ -]?key|password|secret|token)\s*[:=])/i.test(cleaned)) {
    return "BotConnector CLI task"
  }
  const truncated = Array.from(cleaned).slice(0, 50).join("")
  return truncated + (Array.from(cleaned).length > 50 ? "…" : "")
}
