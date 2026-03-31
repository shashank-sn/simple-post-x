/**
 * Unix socket server that lets the standalone MCP process communicate
 * with the running Electron app (e.g. to trigger screen capture).
 */
import * as net from 'net'
import * as fs from 'fs'
import * as path from 'path'
import { app } from 'electron'

export const SOCKET_PATH = path.join(app.getPath('userData'), 'mcp.sock')

let server: net.Server | null = null

export type SocketCommand =
  | { type: 'capture_screenshot'; area?: 'full' | 'region' }
  | { type: 'ping' }

export type SocketResponse =
  | { ok: true; data: string }
  | { ok: false; error: string }

type CommandHandler = (cmd: SocketCommand) => Promise<SocketResponse>

export function startSocketServer(onCommand: CommandHandler): void {
  // Clean up any stale socket file
  if (fs.existsSync(SOCKET_PATH)) {
    fs.unlinkSync(SOCKET_PATH)
  }

  server = net.createServer((socket) => {
    let buffer = ''

    socket.on('data', (chunk) => {
      buffer += chunk.toString()
      // Messages are newline-delimited JSON
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (!line.trim()) continue
        try {
          const cmd = JSON.parse(line) as SocketCommand
          onCommand(cmd).then((response) => {
            socket.write(JSON.stringify(response) + '\n')
          }).catch((err) => {
            socket.write(JSON.stringify({ ok: false, error: String(err) }) + '\n')
          })
        } catch {
          socket.write(JSON.stringify({ ok: false, error: 'Invalid JSON' }) + '\n')
        }
      }
    })

    socket.on('error', () => {/* ignore */})
  })

  server.listen(SOCKET_PATH, () => {
    console.log(`MCP socket server listening at ${SOCKET_PATH}`)
  })

  server.on('error', (err) => {
    console.error('Socket server error:', err)
  })
}

export function stopSocketServer(): void {
  server?.close()
  if (fs.existsSync(SOCKET_PATH)) {
    try { fs.unlinkSync(SOCKET_PATH) } catch { /* ignore */ }
  }
}
