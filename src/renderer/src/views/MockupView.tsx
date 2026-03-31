import { useState, useEffect, useCallback, useRef } from 'react'
import { useAppStore } from '@renderer/store/app-store'
import { Button } from '@renderer/components/ui/Button'

interface DeviceInfo {
  id: string
  name: string
  category: string
  icon: string
}

const BG_COLORS = [
  { label: 'Black', value: '#0D0D0D' },
  { label: 'Dark', value: '#1A1A1A' },
  { label: 'Grey', value: '#3A3A3A' },
  { label: 'White', value: '#FFFFFF' },
  { label: 'Warm', value: '#F5E6D3' },
  { label: 'Blue', value: '#0F172A' },
]

const FIT_OPTIONS = [
  { id: 'cover', label: 'Fill' },
  { id: 'contain', label: 'Fit' },
  { id: 'fill', label: 'Stretch' },
] as const

export function MockupView(): JSX.Element {
  const { styledImage, annotatedImage, sourceImage, setMockupImage, setActiveView } = useAppStore()
  const baseImage = styledImage || annotatedImage || sourceImage

  const [devices, setDevices] = useState<DeviceInfo[]>([])
  const [selectedDevice, setSelectedDevice] = useState<string>('iphone')
  const [bgColor, setBgColor] = useState('#1A1A1A')
  const [fit, setFit] = useState<'cover' | 'contain' | 'fill'>('cover')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    window.api.listDevices().then(setDevices)
  }, [])

  const generatePreview = useCallback(async () => {
    if (!baseImage) return
    setIsGenerating(true)
    try {
      const result = await window.api.createMockup({
        imageDataUrl: baseImage,
        deviceId: selectedDevice,
        backgroundColor: bgColor,
        fit,
      })
      setPreviewUrl(result)
    } catch (e) {
      console.error('Mockup generation failed', e)
    } finally {
      setIsGenerating(false)
    }
  }, [baseImage, selectedDevice, bgColor, fit])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(generatePreview, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [generatePreview])

  const handleExport = async (): Promise<void> => {
    const url = previewUrl || baseImage
    if (!url) return
    setMockupImage(url)
    await window.api.savePng(url)
  }

  const handleSaveAndFinish = async (): Promise<void> => {
    const url = previewUrl || baseImage
    if (!url) return
    setMockupImage(url)
    await window.api.savePng(url)
  }

  const handleSkip = (): void => {
    // Save raw image without mockup
    const url = baseImage
    if (url) window.api.savePng(url)
  }

  if (!baseImage) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          No image loaded — go to Capture first
        </p>
      </div>
    )
  }

  const phoneDevices = devices.filter((d) => d.category === 'phone')
  const otherDevices = devices.filter((d) => d.category !== 'phone')

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left device panel */}
      <div
        className="flex flex-col w-44 shrink-0 overflow-y-auto"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRight: '1px solid var(--border-subtle)',
        }}
      >
        {/* Phone devices */}
        {phoneDevices.length > 0 && (
          <>
            <p className="px-3 pt-3 pb-1 text-xs font-medium shrink-0"
               style={{ color: 'var(--text-muted)' }}>Phone</p>
            <div className="px-2 flex flex-col gap-1">
              {phoneDevices.map((d) => (
                <DeviceButton key={d.id} device={d}
                  isSelected={selectedDevice === d.id}
                  onClick={() => setSelectedDevice(d.id)} />
              ))}
            </div>
          </>
        )}

        {/* Other devices */}
        {otherDevices.length > 0 && (
          <>
            <p className="px-3 pt-3 pb-1 text-xs font-medium shrink-0"
               style={{ color: 'var(--text-muted)' }}>Desktop & Browser</p>
            <div className="px-2 flex flex-col gap-1">
              {otherDevices.map((d) => (
                <DeviceButton key={d.id} device={d}
                  isSelected={selectedDevice === d.id}
                  onClick={() => setSelectedDevice(d.id)} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Preview area */}
      <div
        className="flex-1 flex items-center justify-center overflow-hidden relative"
        style={{ backgroundColor: 'var(--bg-base)' }}
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="mockup preview"
            className="max-w-full max-h-full object-contain"
            style={{
              opacity: isGenerating ? 0.5 : 1,
              transition: 'opacity 0.15s',
            }}
          />
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
                 style={{ borderColor: 'var(--border-default)', borderTopColor: 'var(--accent)' }} />
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Generating…</p>
          </div>
        )}
        {isGenerating && previewUrl && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
            <div className="px-3 py-1 rounded-full text-xs"
                 style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)',
                          border: '1px solid var(--border-default)' }}>
              Updating…
            </div>
          </div>
        )}
      </div>

      {/* Right controls */}
      <div
        className="flex flex-col gap-4 p-3 w-44 shrink-0 overflow-y-auto"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderLeft: '1px solid var(--border-subtle)',
        }}
      >
        <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Mockup</p>

        <Button variant="primary" size="md" className="w-full justify-center"
                onClick={handleSaveAndFinish} disabled={isGenerating}>
          Export PNG ↓
        </Button>

        <Button variant="ghost" size="sm" className="w-full justify-center" onClick={handleSkip}>
          Export without mockup
        </Button>

        <div className="h-px" style={{ backgroundColor: 'var(--border-subtle)' }} />

        {/* Fit mode */}
        <div className="flex flex-col gap-1.5">
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Fit</p>
          <div className="flex gap-1">
            {FIT_OPTIONS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFit(f.id)}
                className="flex-1 py-1 rounded text-xs transition-all no-drag"
                style={{
                  backgroundColor: fit === f.id ? 'var(--bg-elevated)' : 'transparent',
                  color: fit === f.id ? 'var(--text-primary)' : 'var(--text-muted)',
                  border: fit === f.id ? '1px solid var(--border-default)' : '1px solid transparent',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Background color */}
        <div className="flex flex-col gap-1.5">
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Background</p>
          <div className="grid grid-cols-3 gap-1.5">
            {BG_COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => setBgColor(c.value)}
                title={c.label}
                className="w-full aspect-square rounded-md transition-all no-drag"
                style={{
                  backgroundColor: c.value,
                  outline: bgColor === c.value ? '2px solid var(--accent)' : '2px solid transparent',
                  outlineOffset: '2px',
                  border: c.value === '#FFFFFF' ? '1px solid var(--border-subtle)' : 'none',
                }}
              />
            ))}
          </div>
          {/* Custom hex */}
          <div className="flex items-center gap-1.5 mt-1">
            <div className="w-5 h-5 rounded shrink-0" style={{ backgroundColor: bgColor,
              border: '1px solid var(--border-default)' }} />
            <input
              type="text"
              value={bgColor}
              onChange={(e) => {
                const v = e.target.value
                if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) setBgColor(v)
              }}
              className="flex-1 bg-transparent text-xs font-mono no-drag outline-none"
              style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)' }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function DeviceButton({ device, isSelected, onClick }: {
  device: DeviceInfo; isSelected: boolean; onClick: () => void
}): JSX.Element {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-2 py-1.5 rounded-md text-left w-full transition-all no-drag"
      style={{
        backgroundColor: isSelected ? 'var(--bg-elevated)' : 'transparent',
        border: isSelected ? '1px solid var(--border-default)' : '1px solid transparent',
        color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
      }}
    >
      <span style={{ fontSize: 14 }}>{device.icon}</span>
      <span style={{ fontSize: 12 }}>{device.name}</span>
    </button>
  )
}
