import { useAppStore, AnnotationTool } from '@renderer/store/app-store'

interface Tool {
  id: AnnotationTool
  label: string
  icon: string
  shortcut: string
}

const TOOLS: Tool[] = [
  { id: 'select', label: 'Select', icon: '↖', shortcut: 'V' },
  { id: 'draw', label: 'Draw', icon: '✏', shortcut: 'D' },
  { id: 'arrow', label: 'Arrow', icon: '↗', shortcut: 'A' },
  { id: 'rectangle', label: 'Rect', icon: '▭', shortcut: 'R' },
  { id: 'ellipse', label: 'Ellipse', icon: '◯', shortcut: 'E' },
  { id: 'text', label: 'Text', icon: 'T', shortcut: 'T' },
  { id: 'highlight', label: 'Highlight', icon: '▬', shortcut: 'H' },
  { id: 'blur', label: 'Blur', icon: '⬛', shortcut: 'B' },
]

const COLORS = [
  '#F0F0F0', // white
  '#E05252', // red
  '#E0B852', // yellow
  '#52B86A', // green
  '#5290E0', // blue
  '#C9A227', // accent
  '#0D0D0D', // black
]

const STROKE_WIDTHS = [2, 4, 6, 10]

export function AnnotationToolStrip(): JSX.Element {
  const {
    activeAnnotationTool,
    setActiveAnnotationTool,
    annotationColor,
    setAnnotationColor,
    strokeWidth,
    setStrokeWidth,
    undoAnnotation,
    redoAnnotation,
    clearShapes,
    historyIndex,
    history,
  } = useAppStore()

  const canUndo = historyIndex > 0
  const canRedo = historyIndex < history.length - 1

  return (
    <div
      className="flex flex-col items-center gap-1 py-3 w-12 shrink-0 h-full overflow-y-auto"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-subtle)',
      }}
    >
      {/* Tools */}
      {TOOLS.map((tool) => {
        const isActive = activeAnnotationTool === tool.id
        return (
          <button
            key={tool.id}
            onClick={() => setActiveAnnotationTool(tool.id)}
            title={`${tool.label} (${tool.shortcut})`}
            className="w-9 h-9 flex flex-col items-center justify-center rounded-md transition-all duration-100 no-drag shrink-0"
            style={{
              backgroundColor: isActive ? 'var(--bg-elevated)' : 'transparent',
              border: isActive ? '1px solid var(--border-default)' : '1px solid transparent',
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontSize: tool.id === 'text' ? '13px' : '15px',
              fontWeight: tool.id === 'text' ? 700 : 400,
            }}
          >
            {tool.icon}
          </button>
        )
      })}

      {/* Divider */}
      <div className="w-6 h-px my-1 shrink-0" style={{ backgroundColor: 'var(--border-subtle)' }} />

      {/* Color swatches */}
      {COLORS.map((c) => (
        <button
          key={c}
          onClick={() => setAnnotationColor(c)}
          title={c}
          className="w-5 h-5 rounded-full transition-all duration-100 shrink-0 no-drag"
          style={{
            backgroundColor: c,
            outline: annotationColor === c ? '2px solid var(--accent)' : '2px solid transparent',
            outlineOffset: '2px',
            border: c === '#0D0D0D' ? '1px solid var(--border-default)' : 'none',
          }}
        />
      ))}

      {/* Divider */}
      <div className="w-6 h-px my-1 shrink-0" style={{ backgroundColor: 'var(--border-subtle)' }} />

      {/* Stroke widths */}
      {STROKE_WIDTHS.map((w) => (
        <button
          key={w}
          onClick={() => setStrokeWidth(w)}
          title={`${w}px`}
          className="w-9 h-7 flex items-center justify-center no-drag shrink-0"
        >
          <div
            className="w-6 rounded-full transition-all"
            style={{
              height: w,
              backgroundColor:
                strokeWidth === w ? 'var(--text-primary)' : 'var(--text-muted)',
            }}
          />
        </button>
      ))}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Divider */}
      <div className="w-6 h-px mb-1 shrink-0" style={{ backgroundColor: 'var(--border-subtle)' }} />

      {/* Undo */}
      <button
        onClick={undoAnnotation}
        disabled={!canUndo}
        title="Undo (⌘Z)"
        className="w-9 h-9 flex items-center justify-center rounded-md no-drag shrink-0 transition-all"
        style={{
          color: canUndo ? 'var(--text-secondary)' : 'var(--text-muted)',
          fontSize: '14px',
        }}
      >
        ↩
      </button>

      {/* Redo */}
      <button
        onClick={redoAnnotation}
        disabled={!canRedo}
        title="Redo (⌘⇧Z)"
        className="w-9 h-9 flex items-center justify-center rounded-md no-drag shrink-0 transition-all"
        style={{
          color: canRedo ? 'var(--text-secondary)' : 'var(--text-muted)',
          fontSize: '14px',
        }}
      >
        ↪
      </button>

      {/* Clear */}
      <button
        onClick={() => { if (confirm('Clear all annotations?')) clearShapes() }}
        title="Clear all"
        className="w-9 h-9 flex items-center justify-center rounded-md no-drag shrink-0 transition-all"
        style={{ color: 'var(--text-muted)', fontSize: '13px' }}
      >
        🗑
      </button>
    </div>
  )
}
