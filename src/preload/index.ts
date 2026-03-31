import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

export interface WindowSource {
  id: string
  name: string
  thumbnail: string
  appIconUrl?: string
}

export interface ApplyStyleOptions {
  imageDataUrl: string
  templateSpec: { type: string; color?: string; color1?: string; color2?: string; angleDeg?: number }
  padding: number
  cornerRadius: number
  shadow: boolean
}

const api = {
  // Permissions
  checkScreenPermission: (): Promise<string> =>
    ipcRenderer.invoke('permissions:check-screen'),
  openScreenPrefs: (): Promise<void> =>
    ipcRenderer.invoke('permissions:open-prefs'),

  // Screenshot capture
  captureFullScreen: (): Promise<string> =>
    ipcRenderer.invoke('screenshot:full-screen'),
  listWindows: (): Promise<WindowSource[]> =>
    ipcRenderer.invoke('screenshot:list-windows'),
  captureWindow: (sourceId: string): Promise<string> =>
    ipcRenderer.invoke('screenshot:capture-window', sourceId),
  captureForRegion: (): Promise<string> =>
    ipcRenderer.invoke('screenshot:capture-for-region'),
  openImageFile: (): Promise<string | null> =>
    ipcRenderer.invoke('screenshot:open-file'),

  // Style
  applyStyle: (opts: ApplyStyleOptions): Promise<string> =>
    ipcRenderer.invoke('style:apply', opts),

  // Mockup
  listDevices: (): Promise<Array<{ id: string; name: string; category: string; icon: string }>> =>
    ipcRenderer.invoke('mockup:list-devices'),
  createMockup: (opts: { imageDataUrl: string; deviceId: string; backgroundColor: string; fit: string }): Promise<string> =>
    ipcRenderer.invoke('mockup:create', opts),

  // Export
  savePng: (dataUrl: string): Promise<string | null> =>
    ipcRenderer.invoke('export:save-png', dataUrl),
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore
  window.electron = electronAPI
  // @ts-ignore
  window.api = api
}
