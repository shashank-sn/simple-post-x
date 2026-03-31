import { useState, useEffect } from 'react'
import { useAppStore } from '@renderer/store/app-store'
import { Button } from '@renderer/components/ui/Button'

interface WindowSource {
  id: string
  name: string
  thumbnail: string
  appIconUrl?: string
}

type CaptureMode = 'idle' | 'loading' | 'window-picker' | 'region-select'

export function CaptureView(): JSX.Element {
  const { setSourceImage, setActiveView } = useAppStore()
  const [mode, setMode] = useState<CaptureMode>('idle')
  const [error, setError] = useState<string | null>(null)
  const [windows, setWindows] = useState<WindowSource[]>([])
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown')

  // Check screen permission on mount
  useEffect(() => {
    window.api.checkScreenPermission().then(setPermissionStatus)
  }, [])

  const onCaptureDone = (dataUrl: string): void => {
    setSourceImage(dataUrl)
    setActiveView('annotate')
    setMode('idle')
    setError(null)
  }

  const handleFullScreen = async (): Promise<void> => {
    setMode('loading')
    setError(null)
    try {
      const dataUrl = await window.api.captureFullScreen()
      onCaptureDone(dataUrl)
    } catch (e: unknown) {
      setError('Screen capture failed. Check screen recording permission.')
      setMode('idle')
    }
  }

  const handleWindowPicker = async (): Promise<void> => {
    setMode('loading')
    setError(null)
    try {
      const list = await window.api.listWindows()
      setWindows(list)
      setMode('window-picker')
    } catch (e: unknown) {
      setError('Could not list windows.')
      setMode('idle')
    }
  }

  const handleCaptureWindow = async (sourceId: string): Promise<void> => {
    setMode('loading')
    setError(null)
    try {
      const dataUrl = await window.api.captureWindow(sourceId)
      onCaptureDone(dataUrl)
    } catch (e: unknown) {
      setError('Window capture failed.')
      setMode('idle')
    }
  }

  const handleRegion = async (): Promise<void> => {
    setMode('loading')
    setError(null)
    try {
      const fullScreenDataUrl = await window.api.captureForRegion()
      // Store full screenshot then switch to region select mode
      setSourceImage(fullScreenDataUrl)
      setMode('region-select')
    } catch (e: unknown) {
      setError('Region capture failed.')
      setMode('idle')
    }
  }

  const handleOpenFile = async (): Promise<void> => {
    setError(null)
    try {
      const dataUrl = await window.api.openImageFile()
      if (dataUrl) onCaptureDone(dataUrl)
    } catch (e: unknown) {
      setError('Could not open image.')
    }
  }

  const handleOpenPermissions = (): void => {
    window.api.openScreenPrefs()
  }

  // ── Region selection overlay ─────────────────────────────────────────────
  if (mode === 'region-select') {
    return <RegionSelectOverlay onDone={onCaptureDone} onCancel={() => setMode('idle')} />
  }

  // ── Window picker ────────────────────────────────────────────────────────
  if (mode === 'window-picker') {
    return (
      <div className="flex flex-col h-full">
        <div
          className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Select a Window
          </span>
          <Button variant="ghost" size="sm" onClick={() => setMode('idle')}>
            Cancel
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-3 gap-3">
            {windows.map((w) => (
              <button
                key={w.id}
                onClick={() => handleCaptureWindow(w.id)}
                className="group flex flex-col gap-2 rounded-lg overflow-hidden transition-all duration-150 text-left no-drag"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-default)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)'
                }}
              >
                <div
                  className="w-full aspect-video overflow-hidden"
                  style={{ backgroundColor: 'var(--bg-elevated)' }}
                >
                  <img
                    src={w.thumbnail}
                    alt={w.name}
                    className="w-full h-full object-cover"
                    style={{ opacity: 0.85 }}
                  />
                </div>
                <div className="px-2 pb-2 flex items-center gap-1.5">
                  {w.appIconUrl && (
                    <img src={w.appIconUrl} alt="" className="w-4 h-4 object-contain shrink-0" />
                  )}
                  <span
                    className="text-xs truncate"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {w.name}
                  </span>
                </div>
              </button>
            ))}
          </div>
          {windows.length === 0 && (
            <div className="flex items-center justify-center h-40">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                No windows found
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Main capture screen ──────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center justify-center h-full gap-8">
      {/* Permission warning */}
      {permissionStatus !== 'granted' && permissionStatus !== 'unknown' && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-lg max-w-sm"
          style={{
            backgroundColor: 'rgba(201,162,39,0.10)',
            border: '1px solid var(--accent-border)',
          }}
        >
          <span style={{ color: 'var(--accent)' }}>⚠</span>
          <div className="flex-1">
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Screen Recording permission required.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleOpenPermissions}
            style={{ color: 'var(--accent)' }}>
            Fix →
          </Button>
        </div>
      )}

      {/* Icon + title */}
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl"
          style={{
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
          }}
        >
          ⌘
        </div>
        <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          Simple Post X
        </h1>
        <p className="text-sm text-center max-w-xs" style={{ color: 'var(--text-secondary)' }}>
          Capture, annotate, style and create mockups — all in one place.
        </p>
      </div>

      {/* Capture buttons */}
      <div className="flex flex-col gap-3 w-64">
        <Button
          variant="primary"
          size="lg"
          className="w-full justify-center"
          onClick={handleFullScreen}
          disabled={mode === 'loading'}
        >
          {mode === 'loading' ? 'Capturing…' : 'Capture Full Screen'}
          <span className="text-xs opacity-60 ml-auto">⌘⇧3</span>
        </Button>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="md"
            className="justify-center"
            onClick={handleWindowPicker}
            disabled={mode === 'loading'}
          >
            Window
          </Button>
          <Button
            variant="outline"
            size="md"
            className="justify-center"
            onClick={handleRegion}
            disabled={mode === 'loading'}
          >
            Region
          </Button>
        </div>

        <div className="flex items-center gap-3 my-1">
          <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border-subtle)' }} />
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>or</span>
          <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border-subtle)' }} />
        </div>

        <Button
          variant="outline"
          size="lg"
          className="w-full justify-center"
          onClick={handleOpenFile}
          disabled={mode === 'loading'}
        >
          Open Image…
        </Button>
      </div>

      {error && (
        <p className="text-xs max-w-xs text-center" style={{ color: '#E05252' }}>
          {error}
        </p>
      )}
    </div>
  )
}

// ── Region Select Overlay ──────────────────────────────────────────────────

interface RegionSelectProps {
  onDone: (dataUrl: string) => void
  onCancel: () => void
}

function RegionSelectOverlay({ onDone, onCancel }: RegionSelectProps): JSX.Element {
  const { sourceImage } = useAppStore()
  const [start, setStart] = useState<{ x: number; y: number } | null>(null)
  const [current, setCurrent] = useState<{ x: number; y: number } | null>(null)
  const [dragging, setDragging] = useState(false)

  const getRect = (): { x: number; y: number; w: number; h: number } | null => {
    if (!start || !current) return null
    return {
      x: Math.min(start.x, current.x),
      y: Math.min(start.y, current.y),
      w: Math.abs(current.x - start.x),
      h: Math.abs(current.y - start.y),
    }
  }

  const handleMouseDown = (e: React.MouseEvent): void => {
    setStart({ x: e.clientX, y: e.clientY })
    setCurrent({ x: e.clientX, y: e.clientY })
    setDragging(true)
  }

  const handleMouseMove = (e: React.MouseEvent): void => {
    if (!dragging) return
    setCurrent({ x: e.clientX, y: e.clientY })
  }

  const handleMouseUp = async (): Promise<void> => {
    setDragging(false)
    const rect = getRect()
    if (!rect || rect.w < 10 || rect.h < 10 || !sourceImage) return

    // Crop the full screenshot using a canvas
    const canvas = document.createElement('canvas')
    const img = new Image()
    img.src = sourceImage

    await new Promise<void>((resolve) => {
      img.onload = () => resolve()
    })

    // Account for device pixel ratio
    const dpr = window.devicePixelRatio || 1
    const scaleX = (img.naturalWidth / window.innerWidth) * dpr
    const scaleY = (img.naturalHeight / window.innerHeight) * dpr

    canvas.width = Math.round(rect.w * scaleX / dpr)
    canvas.height = Math.round(rect.h * scaleY / dpr)

    const ctx = canvas.getContext('2d')!
    ctx.drawImage(
      img,
      rect.x * scaleX / dpr,
      rect.y * scaleY / dpr,
      rect.w * scaleX / dpr,
      rect.h * scaleY / dpr,
      0, 0,
      canvas.width,
      canvas.height
    )

    onDone(canvas.toDataURL('image/png'))
  }

  const rect = getRect()

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{ cursor: 'crosshair' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Full screenshot background */}
      {sourceImage && (
        <img
          src={sourceImage}
          alt="screen"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: 0.6 }}
          draggable={false}
        />
      )}

      {/* Dark overlay */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      />

      {/* Selection rectangle */}
      {rect && rect.w > 0 && rect.h > 0 && (
        <>
          {/* Clear window showing the actual screenshot */}
          <div
            className="absolute"
            style={{
              left: rect.x,
              top: rect.y,
              width: rect.w,
              height: rect.h,
              outline: '2px solid var(--accent)',
              boxShadow: '0 0 0 1px rgba(201,162,39,0.3)',
            }}
          >
            {sourceImage && (
              <img
                src={sourceImage}
                alt=""
                className="absolute object-cover"
                draggable={false}
                style={{
                  width: `${(window.innerWidth / rect.w) * 100}%`,
                  height: `${(window.innerHeight / rect.h) * 100}%`,
                  left: `${-(rect.x / rect.w) * 100}%`,
                  top: `${-(rect.y / rect.h) * 100}%`,
                  opacity: 1,
                }}
              />
            )}
          </div>

          {/* Size label */}
          <div
            className="absolute px-2 py-0.5 rounded text-xs font-mono pointer-events-none"
            style={{
              left: rect.x,
              top: rect.y - 26,
              backgroundColor: 'var(--accent)',
              color: 'var(--text-inverse)',
              fontSize: '11px',
            }}
          >
            {rect.w} × {rect.h}
          </div>
        </>
      )}

      {/* Hint */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg text-sm pointer-events-none"
        style={{
          backgroundColor: 'rgba(0,0,0,0.7)',
          color: 'var(--text-secondary)',
          backdropFilter: 'blur(8px)',
        }}
      >
        Drag to select region &nbsp;·&nbsp;
        <button
          className="pointer-events-auto"
          style={{ color: 'var(--accent)' }}
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
