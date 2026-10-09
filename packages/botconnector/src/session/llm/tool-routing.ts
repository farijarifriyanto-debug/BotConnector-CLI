import type { ModelMessage } from "ai"

const GREETINGS = new Set([
  "hi",
  "hey",
  "hello",
  "halo",
  "hai",
  "thanks",
  "thank you",
  "terima kasih",
  "makasih",
  "apa kabar",
  "good morning",
  "good evening",
  "selamat pagi",
  "selamat siang",
  "selamat malam",
])

/** Avoid shipping the entire coding-tool schema for an unambiguous greeting only. */
export function omitToolsForGreeting(messages: ModelMessage[], explicitlyEnabled: boolean): boolean {
  if (explicitlyEnabled) return false
  if (messages.some((message) => message.role === "assistant" || message.role === "tool")) return false
  const users = messages.filter((message) => message.role === "user")
  if (users.length !== 1) return false
  const content = users[0].content
  const text = typeof content === "string"
    ? content
    : Array.isArray(content) && content.length === 1 && content[0]?.type === "text"
      ? content[0].text
      : undefined
  if (!text) return false
  return GREETINGS.has(text.trim().toLowerCase().replace(/[.!?？。؟،]+$/gu, "").trim())
}
