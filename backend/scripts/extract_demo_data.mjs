/**
 * Extract the React app's synthetic datasets into JSON for the parallel backend.
 *
 * This reads (never writes) the app's TypeScript data modules, evaluates the
 * plain-JS object/array literals they contain, and emits JSON under
 * backend/data/. It exists so the backend ingests the *same* records the UI
 * shows, without duplicating the data by hand.
 *
 * Usage: node backend/scripts/extract_demo_data.mjs
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, '..', '..')
const outDir = resolve(here, '..', 'data')
mkdirSync(outDir, { recursive: true })

/** Evaluate a `export const NAME = <literal>` array from a TS module. */
function extractArray(relPath, exportName) {
  const source = readFileSync(resolve(repoRoot, relPath), 'utf8')
  const js = source
    .replace(/^\s*import\s+type[^\n]*\n/gm, '')
    .replace(/^export\s+/gm, '')
    .replace(/^\s*type\s+\w+[^\n]*\n/gm, '')
    .replace(/interface\s+\w+[^{]*\{[^{}]*\}/gs, '')
    .replace(/^(const\s+\w+)\s*:\s*[^=]+=/gm, '$1 =')
  const factory = new Function(`${js}\nreturn ${exportName};`)
  return factory()
}

const datasets = {
  incidents: extractArray('src/data/crimeIncidents.ts', 'CRIME_INCIDENTS'),
  stations: extractArray('src/data/policeStations.ts', 'POLICE_STATIONS'),
  areas: extractArray('src/data/areas.ts', 'DEMO_AREAS'),
}

for (const [name, rows] of Object.entries(datasets)) {
  writeFileSync(resolve(outDir, `${name}.json`), `${JSON.stringify(rows, null, 2)}\n`)
  console.log(`wrote ${name}.json (${rows.length} rows)`)
}
