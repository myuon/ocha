import { mkdirSync, cpSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const webDist = resolve(process.cwd(), '../web/dist')
const apiDistPublic = resolve(process.cwd(), 'dist/public')

if (!existsSync(webDist)) {
  console.error(`Frontend build not found at: ${webDist}\nRun \`npm run build -w apps/web\` first.`)
  process.exit(1)
}

mkdirSync(apiDistPublic, { recursive: true })
cpSync(webDist, apiDistPublic, { recursive: true })
console.log(`Copied frontend build → ${apiDistPublic}`)

