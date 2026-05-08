import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

const RAW_BASE = "https://fastly.jsdelivr.net/gh/yaojingang/yao-open-prompts@main";
const CATALOG_URL = `${RAW_BASE}/CATALOG.md`;
const OUTPUT_FILE = './src/data/bundle.json';

async function parseCatalog(md) {
  const lines = md.split(/\r?\n/);
  const items = [];
  let inTable = false;
  for (const line of lines) {
    if (line.startsWith("| 分类 | 子类 | 标题 | 状态 | 主标签 |")) {
      inTable = true;
      continue;
    }
    if (!inTable || !line.startsWith("|") || line.startsWith("| ---")) continue;
    
    const cols = line.trim().replace(/^\||\|$/g, "").split("|").map(c => c.trim());
    if (cols.length < 5) continue;

    const m = cols[2].match(/\[(.+?)\]\((.+?)\)/);
    if (m) {
      items.push({
        title: m[1].trim(),
        path: m[2].trim(),
        category: cols[0],
        subcategory: cols[1],
        mainTag: cols[4]
      });
    }
  }
  return items;
}

async function run() {
  console.log('🚀 Starting data bundle process...');
  
  if (!fs.existsSync('./src/data')) {
    fs.mkdirSync('./src/data', { recursive: true });
  }

  const res = await fetch(CATALOG_URL);
  const md = await res.text();
  const catalog = await parseCatalog(md);
  
  const bundle = {};
  const total = catalog.length;
  
  console.log(`📦 Found ${total} prompts. Fetching content...`);

  for (let i = 0; i < total; i++) {
    const item = catalog[i];
    const id = item.path.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase();
    
    try {
      const contentRes = await fetch(`${RAW_BASE}/${item.path}`);
      const contentMd = await contentRes.text();
      bundle[id] = {
        ...item,
        content: contentMd
      };
      process.stdout.write(`\r进度: ${i + 1}/${total} [${Math.round((i+1)/total*100)}%]`);
    } catch (e) {
      console.error(`\n❌ Failed to fetch: ${item.path}`);
    }
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(bundle, null, 2));
  console.log(`\n✅ Done! Data bundled into ${OUTPUT_FILE}`);
}

run();
