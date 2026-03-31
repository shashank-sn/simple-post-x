/// <reference types="vite/client" />

interface WindowSource {
  id: string
  name: string
  thumbnail: string
  appIconUrl?: string
}

interface ApplyStyleOptions {
  imageDataUrl: string
  templateSpec: { type: string; color?: string; color1?: string; color2?: string; angleDeg?: number }
  padding: number
  cornerRadius: number
  shadow: boolean
}

interface Window {
  api: {
    checkScreenPermission: () => Promise<string>
    openScreenPrefs: () => Promise<void>
    captureFullScreen: () => Promise<string>
    listWindows: () => Promise<WindowSource[]>
    captureWindow: (sourceId: string) => Promise<string>
    captureForRegion: () => Promise<string>
    openImageFile: () => Promise<string | null>
    applyStyle: (opts: ApplyStyleOptions) => Promise<string>
    listDevices: () => Promise<Array<{ id: string; name: string; category: string; icon: string }>>
    createMockup: (opts: { imageDataUrl: string; deviceId: string; backgroundColor: string; fit: string }) => Promise<string>
    savePng: (dataUrl: string) => Promise<string | null>
  }
}
