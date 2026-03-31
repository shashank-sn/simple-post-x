import sharp from 'sharp'

// ── Helpers ──────────────────────────────────────────────────────────────────

function dataUrlToBuffer(dataUrl: string): Buffer {
  const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl
  return Buffer.from(base64, 'base64')
}

function bufferToDataUrl(buffer: Buffer): string {
  return `data:image/png;base64,${buffer.toString('base64')}`
}

/** Hex color → [r, g, b] */
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ]
}

/** Build an SVG background for a gradient or solid fill */
function buildBackgroundSvg(
  width: number,
  height: number,
  spec: { type: string; color?: string; color1?: string; color2?: string; angleDeg?: number }
): Buffer {
  if (spec.type === 'solid') {
    return Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
        <rect width="${width}" height="${height}" fill="${spec.color}"/>
      </svg>`
    )
  }

  // Gradient — convert angle to x1,y1,x2,y2 percentages
  const angle = ((spec.angleDeg ?? 135) * Math.PI) / 180
  const x1 = Math.round(50 - 50 * Math.cos(angle))
  const y1 = Math.round(50 - 50 * Math.sin(angle))
  const x2 = Math.round(50 + 50 * Math.cos(angle))
  const y2 = Math.round(50 + 50 * Math.sin(angle))

  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <defs>
        <linearGradient id="bg" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">
          <stop offset="0%" stop-color="${spec.color1}"/>
          <stop offset="100%" stop-color="${spec.color2}"/>
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#bg)"/>
    </svg>`
  )
}

// ── applyStyle ───────────────────────────────────────────────────────────────

export interface ApplyStyleOptions {
  imageDataUrl: string
  templateSpec: { type: string; color?: string; color1?: string; color2?: string; angleDeg?: number }
  padding: number      // px around the image
  cornerRadius: number // px corner radius on the screenshot
  shadow: boolean      // whether to add a drop shadow
}

export async function applyStyle(opts: ApplyStyleOptions): Promise<string> {
  const { imageDataUrl, templateSpec, padding, cornerRadius, shadow } = opts

  const inputBuffer = dataUrlToBuffer(imageDataUrl)

  // Get image dimensions
  const meta = await sharp(inputBuffer).metadata()
  const imgW = meta.width!
  const imgH = meta.height!

  // Output canvas size
  const totalW = imgW + padding * 2
  const totalH = imgH + padding * 2

  // Step 1: Apply corner radius mask to the screenshot
  let screenshotBuffer: Buffer
  if (cornerRadius > 0) {
    const mask = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${imgW}" height="${imgH}">
        <rect width="${imgW}" height="${imgH}" rx="${cornerRadius}" ry="${cornerRadius}" fill="white"/>
      </svg>`
    )
    screenshotBuffer = await sharp(inputBuffer)
      .composite([{ input: mask, blend: 'dest-in' }])
      .png()
      .toBuffer()
  } else {
    screenshotBuffer = await sharp(inputBuffer).png().toBuffer()
  }

  // Step 2: Build background SVG
  const bgBuffer = buildBackgroundSvg(totalW, totalH, templateSpec)

  // Step 3: Build composite layers
  const layers: sharp.OverlayOptions[] = []

  // Optional shadow: a blurred dark rectangle behind the screenshot
  if (shadow && cornerRadius > 0) {
    const shadowBlur = Math.max(8, Math.round(padding * 0.5))
    const shadowOffset = Math.round(padding * 0.2)
    const shadowSvg = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${totalH}">
        <defs>
          <filter id="blur">
            <feGaussianBlur stdDeviation="${shadowBlur}"/>
          </filter>
        </defs>
        <rect
          x="${padding + shadowOffset}"
          y="${padding + shadowOffset}"
          width="${imgW}"
          height="${imgH}"
          rx="${cornerRadius}"
          ry="${cornerRadius}"
          fill="rgba(0,0,0,0.55)"
          filter="url(#blur)"
        />
      </svg>`
    )
    layers.push({ input: shadowSvg, blend: 'over' })
  }

  // The screenshot itself
  layers.push({
    input: screenshotBuffer,
    left: padding,
    top: padding,
  })

  // Step 4: Composite everything
  const result = await sharp(bgBuffer)
    .composite(layers)
    .png()
    .toBuffer()

  return bufferToDataUrl(result)
}

// ── createMockup ─────────────────────────────────────────────────────────────

export interface CreateMockupOptions {
  imageDataUrl: string
  deviceId: string
  backgroundColor: string
  fit: 'cover' | 'contain' | 'fill'
}

export async function createMockup(
  opts: CreateMockupOptions,
  getDevice: (id: string) => { frameWidth: number; frameHeight: number; screenRegion: { x: number; y: number; width: number; height: number; rx: number }; buildFrameSvg: () => string } | undefined
): Promise<string> {
  const { imageDataUrl, deviceId, backgroundColor, fit } = opts

  const device = getDevice(deviceId)
  if (!device) throw new Error(`Unknown device: ${deviceId}`)

  const { frameWidth, frameHeight, screenRegion, buildFrameSvg } = device
  const inputBuffer = dataUrlToBuffer(imageDataUrl)
  const [bgR, bgG, bgB] = hexToRgb(backgroundColor)

  // Step 1: Resize screenshot to fill screen region
  const resizedScreen = await sharp(inputBuffer)
    .resize(screenRegion.width, screenRegion.height, { fit })
    .png()
    .toBuffer()

  // Step 2: Build device frame from SVG (librsvg renders it with transparency)
  const frameSvgBuffer = Buffer.from(buildFrameSvg())
  const frameBuffer = await sharp(frameSvgBuffer).png().toBuffer()

  // Step 3: Background canvas (solid color, with generous padding around device)
  const PAD = 80
  const totalW = frameWidth + PAD * 2
  const totalH = frameHeight + PAD * 2

  const bgBuffer = await sharp({
    create: {
      width: totalW,
      height: totalH,
      channels: 4,
      background: { r: bgR, g: bgG, b: bgB, alpha: 1 },
    },
  })
    .png()
    .toBuffer()

  // Step 4: Composite — screenshot first (behind frame), then frame on top
  const result = await sharp(bgBuffer)
    .composite([
      {
        input: resizedScreen,
        left: PAD + screenRegion.x,
        top: PAD + screenRegion.y,
        blend: 'over',
      },
      {
        input: frameBuffer,
        left: PAD,
        top: PAD,
        blend: 'over',
      },
    ])
    .png()
    .toBuffer()

  return bufferToDataUrl(result)
}
