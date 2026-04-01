import { execSync } from 'child_process'
import { existsSync, mkdirSync } from 'fs'
const args = process.argv.slice(2)
const migrationName = args[0]

if (!migrationName) {
  console.error('Usage: pnpm run migration:generate -- <migration-name>')
  process.exit(1)
}

const migrationDir = '@/src/database/migrations'
if (!existsSync(migrationDir)) {
  mkdirSync(migrationDir, { recursive: true })
  console.log(`Created directory: ${migrationDir}`)
}

try {
  const command = `typeorm-ts-node-commonjs migration:generate -d ./src/database/typeorm-migration.config.ts ./src/database/migrations/${migrationName}`
  console.log(`Executing: ${command}`)

  execSync(command, { stdio: 'inherit' })
  console.log(`Migration "${migrationName}" generated successfully!`)
} catch (error) {
  console.error('Error generating migration:', error.message)
  process.exit(1)
}
