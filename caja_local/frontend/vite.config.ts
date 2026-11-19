import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { exec } from 'child_process'

const BACKUP_DIR = path.join(os.homedir(), 'Documents', 'NEXUS RESPALDOS')
const MAX_BACKUPS = 10

function ensureDir() {
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true })
}

function listBackups() {
  ensureDir()
  return fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('NEXUS_BACKUP_') && f.endsWith('.json'))
    .map(f => ({ name: f, time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime() }))
    .sort((a, b) => b.time - a.time)
}

// Middleware compartido por `vite dev` y `vite preview`
function attachBackupApi(middlewares: any) {
  middlewares.use('/api/backup', (req: any, res: any) => {
    res.setHeader('Content-Type', 'application/json')
    try {
      if (req.method === 'GET') {
        const files = listBackups()
        if (req.url && req.url.startsWith('/latest')) {
          if (files.length === 0) { res.statusCode = 404; res.end('{"success":false}'); return }
          res.end(fs.readFileSync(path.join(BACKUP_DIR, files[0].name)))
        } else {
          res.end(JSON.stringify({ success: true, folder: BACKUP_DIR, files }))
        }
        return
      }
      if (req.method !== 'POST') { res.statusCode = 405; res.end('{"success":false}'); return }

      const chunks: Buffer[] = []
      req.on('data', (c: Buffer) => chunks.push(c))
      req.on('end', () => {
        try {
          const body = Buffer.concat(chunks).toString('utf8')
          JSON.parse(body) // valida que sea JSON antes de escribir
          ensureDir()
          const stamp = new Date().toISOString().replace(/[:.]/g, '-')
          const tmp = path.join(BACKUP_DIR, `.tmp_${stamp}`)
          const final = path.join(BACKUP_DIR, `NEXUS_BACKUP_${stamp}.json`)
          fs.writeFileSync(tmp, body)
          fs.renameSync(tmp, final) // escritura atómica
          for (const f of listBackups().slice(MAX_BACKUPS)) fs.unlinkSync(path.join(BACKUP_DIR, f.name))
          res.end(JSON.stringify({ success: true, message: 'Respaldo guardado', file: final }))
        } catch (err) {
          res.statusCode = 500
          res.end(JSON.stringify({ success: false, error: (err as Error).message }))
        }
      })
    } catch (err) {
      res.statusCode = 500
      res.end(JSON.stringify({ success: false, error: (err as Error).message }))
    }
  })

  middlewares.use('/api/open-folder', (_req: any, res: any) => {
    ensureDir()
    exec(`explorer "${BACKUP_DIR}"`)
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ success: true, folder: BACKUP_DIR }))
  })
}

const backupPlugin = () => ({
  name: 'nexus-backup-plugin',
  configureServer(server: any) { attachBackupApi(server.middlewares) },
  configurePreviewServer(server: any) { attachBackupApi(server.middlewares) },
})

export default defineConfig({
  base: './',
  plugins: [react(), backupPlugin()],
  server: { host: true },
  preview: { host: true },
})
