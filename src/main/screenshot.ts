import { desktopCapturer, BrowserWindow, dialog, screen } from 'electron'
import { readFileSync } from 'fs'
import * as path from 'path'

export interface WindowSource {
  id: string
  name: string
  thumbnail: string
  appIconUrl?: string
}

/**
 * Capture the primary display at full resolution.
 * The main window is hidden briefly so it doesn't appear in the screenshot.
 */
export async function captureFullScreen(mainWindow: BrowserWindow): Promise<string> {
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width, height } = primaryDisplay.size
  const scaleFactor = primaryDisplay.scaleFactor

  mainWindow.hide()
  await delay(180)

  try {
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: {
        width: Math.round(width * scaleFactor),
        height: Math.round(height * scaleFactor),
      },
    })

    if (!sources.length) throw new Error('No screen sources found')

    // Pick primary screen source
    const source = sources[0]
    return source.thumbnail.toDataURL()
  } finally {
    mainWindow.show()
  }
}

/**
 * List all open windows with thumbnails for the window picker.
 */
export async function listWindows(): Promise<WindowSource[]> {
  const sources = await desktopCapturer.getSources({
    types: ['window'],
    thumbnailSize: { width: 480, height: 320 },
    fetchWindowIcons: true,
  })

  return sources
    .filter((s) => s.name && s.name.length > 0)
    .map((s) => ({
      id: s.id,
      name: s.name,
      thumbnail: s.thumbnail.toDataURL(),
      appIconUrl: s.appIcon ? s.appIcon.toDataURL() : undefined,
    }))
}

/**
 * Capture a specific window by its source ID at high resolution.
 */
export async function captureWindow(
  sourceId: string,
  mainWindow: BrowserWindow
): Promise<string> {
  const primaryDisplay = screen.getPrimaryDisplay()
  const scaleFactor = primaryDisplay.scaleFactor

  mainWindow.hide()
  await delay(150)

  try {
    const sources = await desktopCapturer.getSources({
      types: ['window'],
      thumbnailSize: {
        width: Math.round(1920 * scaleFactor),
        height: Math.round(1200 * scaleFactor),
      },
    })

    const source = sources.find((s) => s.id === sourceId)
    if (!source) throw new Error('Window source not found')

    return source.thumbnail.toDataURL()
  } finally {
    mainWindow.show()
  }
}

/**
 * Capture full screen (hidden) and return the data URL.
 * Used as the first step of region selection — the renderer
 * then shows this as a full-viewport overlay for the user to drag-select.
 */
export async function captureForRegion(mainWindow: BrowserWindow): Promise<string> {
  return captureFullScreen(mainWindow)
}

/**
 * Open a native file dialog and return the image as a base64 data URL.
 */
export async function openImageFile(): Promise<string | null> {
  const result = await dialog.showOpenDialog({
    title: 'Open Image',
    properties: ['openFile'],
    filters: [
      { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp'] },
    ],
  })

  if (result.canceled || !result.filePaths.length) return null

  const filePath = result.filePaths[0]
  const ext = path.extname(filePath).toLowerCase().replace('.', '')
  const mimeType =
    ext === 'jpg' || ext === 'jpeg'
      ? 'image/jpeg'
      : ext === 'gif'
        ? 'image/gif'
        : ext === 'webp'
          ? 'image/webp'
          : 'image/png'

  const buffer = readFileSync(filePath)
  return `data:${mimeType};base64,${buffer.toString('base64')}`
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
