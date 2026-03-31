import { ipcMain, BrowserWindow, dialog } from 'electron'
import { checkScreenPermission, openScreenPrivacyPrefs } from './permissions'
import {
  captureFullScreen,
  captureWindow,
  captureForRegion,
  listWindows,
  openImageFile,
} from './screenshot'
import { applyStyle, ApplyStyleOptions, createMockup, CreateMockupOptions } from './image-processor'
import { getDeviceById, DEVICE_DEFINITIONS } from './device-definitions'

export function registerIpcHandlers(mainWindow: BrowserWindow): void {
  // ── MCP ping (status bar health check) ───────────────────────────────────
  ipcMain.handle('mcp:ping', () => 'pong')

  // ── Permissions ──────────────────────────────────────────────────────────
  ipcMain.handle('permissions:check-screen', () => {
    return checkScreenPermission()
  })

  ipcMain.handle('permissions:open-prefs', () => {
    openScreenPrivacyPrefs()
  })

  // ── Screenshot capture ────────────────────────────────────────────────────
  ipcMain.handle('screenshot:full-screen', async () => {
    return captureFullScreen(mainWindow)
  })

  ipcMain.handle('screenshot:list-windows', async () => {
    return listWindows()
  })

  ipcMain.handle('screenshot:capture-window', async (_event, sourceId: string) => {
    return captureWindow(sourceId, mainWindow)
  })

  ipcMain.handle('screenshot:capture-for-region', async () => {
    return captureForRegion(mainWindow)
  })

  ipcMain.handle('screenshot:open-file', async () => {
    return openImageFile()
  })

  // ── Style ─────────────────────────────────────────────────────────────────
  ipcMain.handle('style:apply', async (_event, opts: ApplyStyleOptions) => {
    return applyStyle(opts)
  })

  // ── Mockup ────────────────────────────────────────────────────────────────
  ipcMain.handle('mockup:list-devices', () => {
    return DEVICE_DEFINITIONS.map(({ id, name, category, icon }) => ({ id, name, category, icon }))
  })

  ipcMain.handle('mockup:create', async (_event, opts: CreateMockupOptions) => {
    return createMockup(opts, getDeviceById)
  })

  // ── Export / Save ─────────────────────────────────────────────────────────
  ipcMain.handle('export:save-png', async (_event, dataUrl: string) => {
    const result = await dialog.showSaveDialog({
      title: 'Save Image',
      defaultPath: 'simple-post-x-export.png',
      filters: [{ name: 'PNG Image', extensions: ['png'] }],
    })
    if (result.canceled || !result.filePath) return null

    const base64 = dataUrl.split(',')[1]
    const { writeFileSync } = await import('fs')
    writeFileSync(result.filePath, Buffer.from(base64, 'base64'))
    return result.filePath
  })
}
