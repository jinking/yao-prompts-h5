const CATALOG_URL = "https://raw.githubusercontent.com/yaojingang/yao-open-prompts/main/CATALOG.md";

export function parseCatalogMarkdown(md) {
  const lines = String(md || "").split(/\r?\n/)
  const items = []
  let inTable = false
  for (const line of lines) {
    if (line.startsWith("| 分类 | 子类 | 标题 | 状态 | 主标签 |")) {
      inTable = true
      continue
    }
    if (!inTable) continue
    if (!line.startsWith("|")) continue
    if (line.startsWith("| ---")) continue
    const cols = line
      .trim()
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((c) => c.trim())
    if (cols.length < 5) continue

    const category = cols[0]
    const subcategory = cols[1]
    const titleMd = cols[2]
    const status = cols[3]
    const mainTag = cols[4]
    const m = titleMd.match(/\[(.+?)\]\((.+?)\)/)
    if (!m) continue
    const title = m[1].trim()
    const path = m[2].trim()
    const id = path.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase()
    items.push({
      id,
      title,
      category,
      subcategory,
      status,
      mainTag,
      path,
      rawUrl: `https://raw.githubusercontent.com/yaojingang/yao-open-prompts/main/${path}`,
      webUrl: `https://github.com/yaojingang/yao-open-prompts/blob/main/${path}`
    })
  }
  return items
}

export async function fetchCatalog() {
  try {
    const res = await fetch(CATALOG_URL);
    const md = await res.text();
    return parseCatalogMarkdown(md);
  } catch (err) {
    console.error("Failed to fetch catalog:", err);
    return [];
  }
}

export function getCategories(items) {
  const map = {}
  for (const it of items) {
    if (!map[it.category]) map[it.category] = 0
    map[it.category] += 1
  }
  return Object.keys(map).map((k) => ({ name: k, count: map[k] }))
}
