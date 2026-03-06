import fs from 'fs'
import path from 'path'

export default async function globalTeardown() {
  const seedFile = path.resolve('./tests/.seed.json')
  if (fs.existsSync(seedFile)) {
    fs.unlinkSync(seedFile)
    console.log('\n[Teardown] Cleaned up seed file.')
  }
}
