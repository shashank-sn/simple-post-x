import { useState, useEffect, useCallback, useRef } from 'react'
import { useAppStore } from '@renderer/store/app-store'
import { Button } from '@renderer/components/ui/Button'
import { STYLE_TEMPLATES, StyleTemplate } from '@renderer/tokens/style-templates'

const DEFAULT_PADDING = 60
const DEFAULT_RADIUS = 12
const DEFAULT_SHADOW = true

export function StyleView(): JSX.Element {
  const { annotatedImage, sourceImage, setStyledImage, setActiveView } = useAppStore()
  const baseImage = annotatedImage || sourceImage

  const [selectedTemplate, setSelectedTemplate] = useState<StyleTemplate>(STYLE_TEMPLATES[0])
  const [padding, setPadding] = useState(DEFAULT_PADDING)
  const [cornerRadius, setCornerRadius] = useState(DEFAULT_RADIUS)
  const [shadow, setShadow] = useState(DEFAULT_SHADOW)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const generatePreview = useCallback(async () => {
    if (!baseImage) return
    setIsGenerating(true)
    try {
      const result = await window.api.applyStyle({
        imageDataUrl: baseImage,
        templateSpec: selectedTemplate.spec,
        padding,
        cornerRadius,
        shadow,
      })
      setPreviewUrl(result)
    } catch (e) {
      console.error('Style preview failed', e)
    } finally {
      setIsGenerating(false)
    }
  }, [baseImage, selectedTemplate, padding, cornerRadius, shadow])

  // Debounced preview regeneration on any setting change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(generatePreview, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [generatePreview])

  const handleNext = async (): Promise<void> => {
    const url = previewUrl || baseImage
    if (!url) return
    setStyledImage(url)
    setActiveView('mockup')
  }

  const handleExportNow = async (): Promise<void> => {
    const url = previewUrl || baseImage
    if (!url) return
    await window.api.savePng(url)
  }

  const handleSkip = (): void => {
    setStyledImage(baseImage)
    setActiveView('mockup')
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

  return (
    <div className="flex h-full overflow-hidden">
      {/* Template grid */}
      <div
        className="flex flex-col w-48 shrink-0 overflow-y-auto"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRight: '1px solid var(--border-subtle)',
        }}
      >
        <p
          className="px-3 py-2 text-xs font-medium shrink-0"
          style={{ color: 'var(--text-muted)' }}
        >
          Background
        </p>
        <div className="grid grid-cols-2 gap-1.5 px-2 pb-3">
          {STYLE_TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTemplate(t)}
              title={t.name}
              className="flex flex-col gap-1 rounded-md overflow-hidden no-drag transition-all"
              style={{
                outline:
                  selectedTemplate.id === t.id
                    ? '2px solid var(--accent)'
                    : '2px solid transparent',
                outlineOffset: '1px',
              }}
            >
              {/* Color swatch */}
              <div
                className="w-full h-12 rounded-sm"
                style={{ background: t.cssBackground }}
              />
              <span
                className="px-1 pb-1 text-center w-full truncate"
                style={{
                  fontSize: '10px',
                  color:
                    selectedTemplate.id === t.id
                      ? 'var(--accent)'
                      : 'var(--text-muted)',
                }}
              >
                {t.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Preview area */}
      <div
        className="flex-1 flex items-center justify-center overflow-hidden relative"
        style={{ backgroundColor: 'var(--bg-base)' }}
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="preview"
            className="max-w-full max-h-full object-contain"
            style={{
              borderRadius: 4,
              boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
              opacity: isGenerating ? 0.5 : 1,
              transition: 'opacity 0.15s',
            }}
          />
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: 'var(--border-default)', borderTopColor: 'var(--accent)' }}
            />
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Generating…
            </p>
          </div>
        )}

        {isGenerating && previewUrl && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
            <div
              className="px-3 py-1 rounded-full text-xs"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-default)',
              }}
            >
              Updating…
            </div>
          </div>
        )}
      </div>

      {/* Right controls panel */}
      <div
        className="flex flex-col gap-4 p-3 w-48 shrink-0 overflow-y-auto"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderLeft: '1px solid var(--border-subtle)',
        }}
      >
        <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
          Style
        </p>

        {/* Actions */}
        <Button
          variant="primary"
          size="md"
          className="w-full justify-center"
          onClick={handleNext}
          disabled={isGenerating}
        >
          Next: Mockup →
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="w-full justify-center"
          onClick={handleExportNow}
          disabled={isGenerating || !previewUrl}
        >
          Export PNG
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

        {/* Padding slider */}
        <SliderField
          label="Padding"
          value={padding}
          min={0}
          max={200}
          step={4}
          onChange={setPadding}
          display={`${padding}px`}
        />

        {/* Corner radius slider */}
        <SliderField
          label="Corners"
          value={cornerRadius}
          min={0}
          max={40}
          step={1}
          onChange={setCornerRadius}
          display={`${cornerRadius}px`}
        />

        {/* Shadow toggle */}
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Shadow
          </span>
          <button
            onClick={() => setShadow((v) => !v)}
            className="w-9 h-5 rounded-full relative transition-all no-drag"
            style={{
              backgroundColor: shadow ? 'var(--accent)' : 'var(--border-default)',
            }}
          >
            <span
              className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
              style={{
                backgroundColor: 'white',
                left: shadow ? 'calc(100% - 18px)' : '2px',
              }}
            />
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Slider field ─────────────────────────────────────────────────────────────

interface SliderFieldProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  display: string
}

function SliderField({ label, value, min, max, step, onChange, display }: SliderFieldProps): JSX.Element {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </span>
        <span
          className="text-xs font-mono"
          style={{ color: 'var(--text-muted)' }}
        >
          {display}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1 rounded-full appearance-none no-drag"
        style={{
          background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${((value - min) / (max - min)) * 100}%, var(--border-default) ${((value - min) / (max - min)) * 100}%, var(--border-default) 100%)`,
          outline: 'none',
          cursor: 'pointer',
        }}
      />
    </div>
  )
}
