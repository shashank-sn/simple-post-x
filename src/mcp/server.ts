#!/usr/bin/env node
/**
 * Simple Post X — MCP Server
 *
 * Runs as a standalone stdio MCP server for Claude Code.
 * Image tools (apply_style, create_mockup, batch_process) work standalone via Sharp.
 * capture_screenshot connects to the running Electron app via Unix socket.
 *
 * Add to Claude Code settings:
 * {
 *   "mcpServers": {
 *     "simple-post-x": {
 *       "command": "node",
 *       "args": ["/path/to/mcp-server.js"]
 *     }
 *   }
 * }
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js'
import * as fs from 'fs'
import * as path from 'path'
import * as net from 'net'
import * as os from 'os'

// ── Resolve Sharp (works both in dev and bundled in app resources) ────────────
let sharp: typeof import('sharp')
try {
  // When running from app bundle, sharp is alongside this script
  sharp = require(path.join(path.dirname(process.execPath), 'node_modules', 'sharp'))
} catch {
  sharp = require('sharp')
}

// ── Socket path (must match Electron's socket-server.ts) ─────────────────────
const SOCKET_PATH = path.join(
  os.homedir(),
  'Library',
  'Application Support',
  'simple-post-x',
  'mcp.sock'
)

// ── Helpers ───────────────────────────────────────────────────────────────────

function dataUrlToBuffer(dataUrl: string): Buffer {
  const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl
  return Buffer.from(base64, 'base64')
}

function bufferToDataUrl(buffer: Buffer): string {
  return `data:image/png;base64,${buffer.toString('base64')}`
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [parseInt(h.substring(0, 2), 16), parseInt(h.substring(2, 4), 16), parseInt(h.substring(4, 6), 16)]
}

/** Try to send a command to the running Electron app via socket */
async function sendToApp(cmd: object): Promise<{ ok: boolean; data?: string; error?: string }> {
  return new Promise((resolve) => {
    if (!fs.existsSync(SOCKET_PATH)) {
      resolve({ ok: false, error: 'Simple Post X app is not running' })
      return
    }

    const socket = net.createConnection(SOCKET_PATH, () => {
      socket.write(JSON.stringify(cmd) + '\n')
    })

    let buffer = ''
    socket.on('data', (chunk) => {
      buffer += chunk.toString()
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      for (const line of lines) {
        if (line.trim()) {
          try {
            resolve(JSON.parse(line))
          } catch {
            resolve({ ok: false, error: 'Invalid response from app' })
          }
          socket.destroy()
        }
      }
    })

    socket.on('error', (err) => resolve({ ok: false, error: err.message }))
    setTimeout(() => resolve({ ok: false, error: 'Connection timed out' }), 5000)
  })
}

// ── Style templates (mirrored from renderer tokens) ──────────────────────────

const TEMPLATES: Record<string, { type: string; color?: string; color1?: string; color2?: string; angleDeg?: number }> = {
  midnight: { type: 'gradient', color1: '#0D0D0D', color2: '#1A1A2E', angleDeg: 135 },
  carbon:   { type: 'gradient', color1: '#111111', color2: '#1C1C1C', angleDeg: 160 },
  obsidian: { type: 'solid',    color: '#0A0A0A' },
  noir:     { type: 'gradient', color1: '#080808', color2: '#161616', angleDeg: 180 },
  slate:    { type: 'gradient', color1: '#0F172A', color2: '#1E293B', angleDeg: 135 },
  storm:    { type: 'gradient', color1: '#111827', color2: '#1F2937', angleDeg: 135 },
  iron:     { type: 'gradient', color1: '#2A2A2A', color2: '#3A3A3A', angleDeg: 135 },
  fog:      { type: 'gradient', color1: '#E8E8E8', color2: '#D4D4D4', angleDeg: 135 },
  paper:    { type: 'gradient', color1: '#F8F6F1', color2: '#EDE9E3', angleDeg: 135 },
  snow:     { type: 'solid',    color: '#FFFFFF' },
  sand:     { type: 'gradient', color1: '#F5E6D3', color2: '#EDD5B8', angleDeg: 135 },
  dusk:     { type: 'gradient', color1: '#1A1A2E', color2: '#16213E', angleDeg: 135 },
  forest:   { type: 'gradient', color1: '#0D1B0D', color2: '#1A2E1A', angleDeg: 135 },
  ember:    { type: 'gradient', color1: '#1C0E07', color2: '#2D1A0A', angleDeg: 135 },
}

function buildBgSvg(w: number, h: number, spec: typeof TEMPLATES[string]): Buffer {
  if (spec.type === 'solid') {
    return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="${spec.color}"/></svg>`)
  }
  const angle = ((spec.angleDeg ?? 135) * Math.PI) / 180
  const x1 = Math.round(50 - 50 * Math.cos(angle))
  const y1 = Math.round(50 - 50 * Math.sin(angle))
  const x2 = Math.round(50 + 50 * Math.cos(angle))
  const y2 = Math.round(50 + 50 * Math.sin(angle))
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
      <defs><linearGradient id="g" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">
        <stop offset="0%" stop-color="${spec.color1}"/>
        <stop offset="100%" stop-color="${spec.color2}"/>
      </linearGradient></defs>
      <rect width="${w}" height="${h}" fill="url(#g)"/>
    </svg>`
  )
}

// ── Tool implementations ──────────────────────────────────────────────────────

async function toolApplyStyle(args: {
  image_path: string
  template: string
  padding?: number
  corner_radius?: number
  shadow?: boolean
  output_path?: string
}): Promise<string> {
  const { image_path, template, padding = 60, corner_radius = 12, shadow = true, output_path } = args
  const spec = TEMPLATES[template]
  if (!spec) throw new Error(`Unknown template "${template}". Available: ${Object.keys(TEMPLATES).join(', ')}`)

  const inputBuffer = fs.readFileSync(image_path)
  const meta = await sharp(inputBuffer).metadata()
  const imgW = meta.width!, imgH = meta.height!
  const totalW = imgW + padding * 2, totalH = imgH + padding * 2

  let screenshotBuffer: Buffer
  if (corner_radius > 0) {
    const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${imgW}" height="${imgH}"><rect width="${imgW}" height="${imgH}" rx="${corner_radius}" ry="${corner_radius}" fill="white"/></svg>`)
    screenshotBuffer = await sharp(inputBuffer).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer()
  } else {
    screenshotBuffer = await sharp(inputBuffer).png().toBuffer()
  }

  const bgBuffer = buildBgSvg(totalW, totalH, spec)
  const layers: import('sharp').OverlayOptions[] = []

  if (shadow && corner_radius > 0) {
    const sb = Math.max(8, Math.round(padding * 0.5)), so = Math.round(padding * 0.2)
    const shadowSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${totalH}"><defs><filter id="b"><feGaussianBlur stdDeviation="${sb}"/></filter></defs><rect x="${padding + so}" y="${padding + so}" width="${imgW}" height="${imgH}" rx="${corner_radius}" fill="rgba(0,0,0,0.55)" filter="url(#b)"/></svg>`)
    layers.push({ input: shadowSvg, blend: 'over' })
  }
  layers.push({ input: screenshotBuffer, left: padding, top: padding })

  const result = await sharp(bgBuffer).composite(layers).png().toBuffer()

  const outPath = output_path || image_path.replace(/(\.[^.]+)$/, '_styled.png')
  fs.writeFileSync(outPath, result)
  return `Saved styled image to: ${outPath}`
}

async function toolCaptureScreenshot(args: { output_path?: string }): Promise<string> {
  const response = await sendToApp({ type: 'capture_screenshot' })
  if (!response.ok) throw new Error(response.error || 'Capture failed')

  const buffer = dataUrlToBuffer(response.data!)
  const outPath = args.output_path || path.join(os.homedir(), 'Desktop', `screenshot_${Date.now()}.png`)
  fs.writeFileSync(outPath, buffer)
  return `Screenshot saved to: ${outPath}`
}

async function toolBatchProcess(args: {
  input_folder: string
  operation: 'apply_style'
  template?: string
  padding?: number
  corner_radius?: number
  output_folder?: string
}): Promise<string> {
  const { input_folder, operation, template = 'midnight', padding = 60, corner_radius = 12, output_folder } = args

  if (!fs.existsSync(input_folder)) throw new Error(`Input folder not found: ${input_folder}`)

  const outDir = output_folder || path.join(input_folder, 'output')
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

  const files = fs.readdirSync(input_folder).filter((f) =>
    /\.(png|jpg|jpeg|webp)$/i.test(f)
  )

  if (files.length === 0) return 'No image files found in folder'

  let processed = 0
  const errors: string[] = []

  for (const file of files) {
    const inputPath = path.join(input_folder, file)
    const outName = file.replace(/(\.[^.]+)$/, '_styled.png')
    const outPath = path.join(outDir, outName)
    try {
      if (operation === 'apply_style') {
        await toolApplyStyle({ image_path: inputPath, template, padding, corner_radius, output_path: outPath })
        processed++
      }
    } catch (err) {
      errors.push(`${file}: ${err}`)
    }
  }

  const summary = `Processed ${processed}/${files.length} files → ${outDir}`
  return errors.length > 0 ? `${summary}\nErrors:\n${errors.join('\n')}` : summary
}

// ── MCP Server setup ──────────────────────────────────────────────────────────

const TOOLS: Tool[] = [
  {
    name: 'capture_screenshot',
    description: 'Capture a screenshot using the running Simple Post X app. The app must be open.',
    inputSchema: {
      type: 'object',
      properties: {
        output_path: { type: 'string', description: 'Where to save the PNG (default: Desktop)' },
      },
    },
  },
  {
    name: 'apply_style',
    description: 'Apply a background style template to a screenshot. Works standalone without the app.',
    inputSchema: {
      type: 'object',
      required: ['image_path', 'template'],
      properties: {
        image_path: { type: 'string', description: 'Path to input PNG/JPG' },
        template: {
          type: 'string',
          enum: Object.keys(TEMPLATES),
          description: 'Background template name',
        },
        padding: { type: 'number', description: 'Padding around image in px (default: 60)' },
        corner_radius: { type: 'number', description: 'Corner radius in px (default: 12)' },
        shadow: { type: 'boolean', description: 'Add drop shadow (default: true)' },
        output_path: { type: 'string', description: 'Output file path (default: input_styled.png)' },
      },
    },
  },
  {
    name: 'batch_process',
    description: 'Apply a style to all images in a folder. Works standalone without the app.',
    inputSchema: {
      type: 'object',
      required: ['input_folder', 'operation'],
      properties: {
        input_folder: { type: 'string', description: 'Folder containing images to process' },
        operation: { type: 'string', enum: ['apply_style'], description: 'Operation to apply' },
        template: { type: 'string', enum: Object.keys(TEMPLATES), description: 'Style template (default: midnight)' },
        padding: { type: 'number', description: 'Padding in px (default: 60)' },
        corner_radius: { type: 'number', description: 'Corner radius in px (default: 12)' },
        output_folder: { type: 'string', description: 'Output folder (default: input_folder/output)' },
      },
    },
  },
  {
    name: 'list_templates',
    description: 'List all available style templates',
    inputSchema: { type: 'object', properties: {} },
  },
]

async function main(): Promise<void> {
  const server = new Server(
    { name: 'simple-post-x', version: '0.1.0' },
    { capabilities: { tools: {} } }
  )

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }))

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params
    try {
      let result: string
      if (name === 'capture_screenshot') result = await toolCaptureScreenshot(args as any)
      else if (name === 'apply_style') result = await toolApplyStyle(args as any)
      else if (name === 'batch_process') result = await toolBatchProcess(args as any)
      else if (name === 'list_templates') result = Object.keys(TEMPLATES).join(', ')
      else throw new Error(`Unknown tool: ${name}`)

      return { content: [{ type: 'text', text: result }] }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      return { content: [{ type: 'text', text: `Error: ${msg}` }], isError: true }
    }
  })

  const transport = new StdioServerTransport()
  await server.connect(transport)
}

main().catch(console.error)
