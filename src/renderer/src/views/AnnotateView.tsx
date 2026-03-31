import { useRef, useEffect, useState } from 'react'
import { useAppStore } from '@renderer/store/app-store'
import { AnnotationCanvas, AnnotationCanvasHandle } from '@renderer/components/canvas/AnnotationCanvas'
import { AnnotationToolStrip } from '@renderer/components/panels/AnnotationToolStrip'
import { Button } from '@renderer/components/ui/Button'

export function AnnotateView(): JSX.Element {
  const { sourceImage, setAnnotatedImage, setActiveView, setActiveAnnotationTool } = useAppStore()
  const canvasRef = useRef<AnnotationCanvasHandle>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 })

  // Measure available canvas area on mount and resize
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        })
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Keyboard shortcuts for tools
  useEffect(() => {
    const map: Record<string, string> = {
      v: 'select', d: 'draw', a: 'arrow',
      r: 'rectangle', e: 'ellipse', t: 'text',
      h: 'highlight', b: 'blur',
    }
    const handleKey = (evt: KeyboardEvent): void => {
      if (evt.target instanceof HTMLInputElement) return
      const tool = map[evt.key.toLowerCase()]
      if (tool) setActiveAnnotationTool(tool as any)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [setActiveAnnotationTool])

  const handleExport = (): void => {
    const dataUrl = canvasRef.current?.exportImage()
    if (!dataUrl) return
    setAnnotatedImage(dataUrl)
    setActiveView('style')
  }

  const handleSkip = (): void => {
    // Skip annotation — use source image as-is
    setAnnotatedImage(sourceImage)
    setActiveView('style')
  }

  if (!sourceImage) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          No image loaded — go to Capture first
        </p>
      </div>
    )
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left tool strip */}
      <AnnotationToolStrip />

      {/* Canvas area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden flex items-center justify-center"
        style={{ backgroundColor: 'var(--bg-base)' }}
      >
        <AnnotationCanvas
          ref={canvasRef}
          containerWidth={containerSize.width}
          containerHeight={containerSize.height}
        />
      </div>

      {/* Right panel */}
      <div
        className="flex flex-col gap-3 p-3 w-44 shrink-0"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderLeft: '1px solid var(--border-subtle)',
        }}
      >
        <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
          Annotate
        </p>

        <Button
          variant="primary"
          size="md"
          className="w-full justify-center"
          onClick={handleExport}
        >
          Next: Style →
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center"
          onClick={handleSkip}
        >
          Skip
        </Button>

        <div className="h-px" style={{ backgroundColor: 'var(--border-subtle)' }} />

        {/* Tool hint */}
        <div>
          <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
            Shortcuts
          </p>
          {[
            ['V', 'Select'],
            ['A', 'Arrow'],
            ['R', 'Rect'],
            ['D', 'Draw'],
            ['T', 'Text'],
            ['H', 'Highlight'],
            ['B', 'Blur'],
          ].map(([key, label]) => (
            <div key={key} className="flex items-center justify-between py-0.5">
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{label}</span>
              <kbd
                className="px-1.5 py-0.5 rounded"
                style={{
                  fontSize: '10px',
                  backgroundColor: 'var(--bg-elevated)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-default)',
                  fontFamily: 'monospace',
                }}
              >
                {key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
