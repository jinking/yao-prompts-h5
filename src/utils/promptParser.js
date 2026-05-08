export function trimQuotes(v) {
  const s = String(v || "").trim()
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) return s.slice(1, -1)
  return s
}

export function parseFrontMatter(md) {
  const text = String(md || "")
  const lines = text.split(/\r?\n/)
  if (lines[0] !== "---") return { meta: {}, body: text }

  let end = -1
  for (let i = 1; i < lines.length; i += 1) {
    if (lines[i] === "---") {
      end = i
      break
    }
  }
  if (end === -1) return { meta: {}, body: text }

  const metaLines = lines.slice(1, end)
  const meta = {}
  for (const line of metaLines) {
    const idx = line.indexOf(":")
    if (idx === -1) continue
    const key = line.slice(0, idx).trim()
    const value = trimQuotes(line.slice(idx + 1))
    if (!key) continue
    meta[key] = value
  }

  if (meta.tags) {
    meta.tags = String(meta.tags)
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
  }

  return { meta, body: lines.slice(end + 1).join("\n") }
}

export function extractIntro(body) {
  const text = String(body || "")
  const start = text.indexOf("## 简介")
  if (start === -1) return ""
  const afterStart = text.slice(start + "## 简介".length)
  const end = afterStart.indexOf("## Prompt")
  const content = end === -1 ? afterStart : afterStart.slice(0, end)
  return content.trim()
}

export function extractPrompt(body) {
  const text = String(body || "")
  const idx = text.indexOf("## Prompt")
  if (idx === -1) return ""

  const after = text.slice(idx + "## Prompt".length)
  const lines = after.split(/\r?\n/)
  let fence = ""
  let fenceLineIndex = -1
  for (let i = 0; i < lines.length; i += 1) {
    const m = lines[i].match(/^`{3,}/)
    if (m) {
      fence = m[0]
      fenceLineIndex = i
      break
    }
  }
  if (!fence) return after.trim()

  const out = []
  for (let i = fenceLineIndex + 1; i < lines.length; i += 1) {
    if (lines[i].startsWith(fence)) break
    out.push(lines[i])
  }
  return out.join("\n").replace(/\s+$/, "")
}

export function parsePromptMarkdown(md) {
  const { meta, body } = parseFrontMatter(md)
  const intro = extractIntro(body)
  const prompt = extractPrompt(body)
  return { meta, intro, prompt, raw: String(md || "") }
}
