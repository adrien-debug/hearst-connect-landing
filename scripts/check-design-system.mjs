#!/usr/bin/env node
/**
 * Design-system charter enforcement for src/components/connect/**.
 *
 * Blocks the patterns we manually cleaned out, so they don't drift back in:
 *   - inline rgba(...) and hex literals (use TOKENS.colors.*)
 *   - decorative gradients, drop-shadows, blur filters, backdrop-filter
 *   - boxShadow: pointing at a literal string instead of TOKENS.shadow.* /
 *     var(--hc-shadow-*)
 *   - fontFamily: literal mono families (must use TOKENS.fonts.* or MONO const)
 *
 * Exit 1 on violation; prints file:line and the matched fragment.
 *
 * Run: `node scripts/check-design-system.mjs`
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const SCOPE = join(ROOT, 'src/components/connect')

/** Each rule: { id, description, test(line, ctxLines) -> boolean } */
const RULES = [
  {
    id: 'no-rgba',
    description: 'Use TOKENS.colors.accentSubtle / dangerSubtle / etc. — no inline rgba()',
    pattern: /rgba\(/,
  },
  {
    id: 'no-hex-literal',
    description: 'No hex color literals — use TOKENS.colors.*',
    // Match #abc / #abcdef as string values (#1A2 / #1A2B3C). We strip line
    // comments before this runs (see stripComments), so doc references are
    // ignored. CSS var fallbacks `var(--token, #abc)` are allowed — that is a
    // defensive last-resort, not the source of truth.
    pattern: /(['"`:\s])#[0-9a-fA-F]{3}(?![0-9a-fA-F])|(['"`:\s])#[0-9a-fA-F]{6}\b/,
    skipIf: (line) => line.includes('url(#') || /var\(--[^,)]+,\s*#[0-9a-fA-F]{3,6}/.test(line),
  },
  {
    id: 'no-decorative-gradient',
    description: 'No linear/radial gradients in decorative CSS — use a flat token color',
    pattern: /linear-gradient\(|radial-gradient\(/,
    // SVG <linearGradient> JSX tags are fine (chart fills inside <defs>).
    skipIf: (line) => /<linearGradient|<radialGradient/.test(line),
  },
  {
    id: 'no-drop-shadow',
    description: 'No filter: drop-shadow(...) — flat design',
    pattern: /filter:\s*[`'"]?[^`'"]*drop-shadow\(/,
  },
  {
    id: 'no-blur-filter',
    description: 'No filter: blur(...) / backdropFilter — flat design',
    pattern: /filter:\s*[`'"]?[^`'"]*blur\(|backdropFilter|backdrop-filter/,
  },
  {
    id: 'no-literal-box-shadow',
    description: 'boxShadow must reference TOKENS.shadow.* or var(--hc-shadow-*)',
    // Match `boxShadow:` lines whose value is NOT a TOKENS reference / CSS var.
    pattern: /boxShadow:\s*[`'"]/,
    skipIf: (line) =>
      /boxShadow:\s*[`'"][^'"`]*var\(--hc-shadow|boxShadow:\s*TOKENS\.shadow\./.test(line) ||
      /boxShadow:\s*['"]none['"]/.test(line) ||
      /boxShadow:\s*cfg\.shadow/.test(line),
  },
  {
    id: 'no-mono-literal',
    description:
      'fontFamily must use TOKENS.fonts.* / MONO / inherit — no hardcoded font families',
    pattern: /fontFamily:\s*[`'"][^`'"]*(IBM Plex Mono|SF Mono|Menlo|Monaco|Consolas|Courier|monospace|Inter|Helvetica|Arial)/i,
  },
]

const EXCLUDE_FILES = new Set([
  // constants.ts is allowed to define the tokens themselves (rgba/hex would be
  // a problem if re-introduced, but currently it routes everything through CSS
  // vars, so the file is clean).
])

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) walk(full, out)
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full)
  }
  return out
}

const files = walk(SCOPE).filter((f) => !EXCLUDE_FILES.has(relative(ROOT, f)))

/** Remove `// trailing comment` content from a code line before pattern checks
 * so doc references (e.g. `// #a7fb90 brand green`) don't trigger violations.
 * Quoted strings keep their `//` content (we look for the FIRST unquoted `//`). */
function stripComments(line) {
  let inS = false, inD = false, inT = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (!inD && !inT && c === "'" && line[i - 1] !== '\\') inS = !inS
    else if (!inS && !inT && c === '"' && line[i - 1] !== '\\') inD = !inD
    else if (!inS && !inD && c === '`') inT = !inT
    else if (!inS && !inD && !inT && c === '/' && line[i + 1] === '/') return line.slice(0, i)
  }
  return line
}

let violations = 0
for (const file of files) {
  const text = readFileSync(file, 'utf8')
  const lines = text.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]
    if (raw.trim().startsWith('//') || raw.trim().startsWith('*')) continue
    const line = stripComments(raw)

    for (const rule of RULES) {
      if (!rule.pattern.test(line)) continue
      if (rule.skipIf && rule.skipIf(line)) continue

      violations++
      const rel = relative(ROOT, file)
      console.error(
        `\x1b[31m✖\x1b[0m ${rel}:${i + 1}  [${rule.id}]\n  ${raw.trim()}\n  → ${rule.description}\n`
      )
    }
  }
}

if (violations > 0) {
  console.error(
    `\x1b[31m\nDesign-system check failed: ${violations} violation${violations > 1 ? 's' : ''} in src/components/connect/**\x1b[0m`
  )
  process.exit(1)
}

console.log(
  `\x1b[32m✓\x1b[0m design-system check passed (${files.length} files in src/components/connect)`
)
