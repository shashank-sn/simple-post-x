import { useAppStore, ViewType } from '@renderer/store/app-store'

interface NavItem {
  id: ViewType
  label: string
  icon: string
  requiresImage?: boolean
}

const navItems: NavItem[] = [
  { id: 'capture', label: 'Capture', icon: '⌘' },
  { id: 'annotate', label: 'Annotate', icon: '✏️', requiresImage: true },
  { id: 'style', label: 'Style', icon: '✦', requiresImage: true },
  { id: 'mockup', label: 'Mockup', icon: '□', requiresImage: true },
  { id: 'mcp', label: 'MCP', icon: '⚡' },
]

export function Sidebar(): JSX.Element {
  const { activeView, setActiveView, sourceImage } = useAppStore()

  return (
    <div
      className="flex flex-col w-[64px] h-full shrink-0"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-subtle)',
      }}
    >
      {/* Traffic light spacer */}
      <div className="h-[52px] drag-region shrink-0" />

      {/* Nav items */}
      <nav className="flex flex-col items-center gap-1 px-2 flex-1">
        {navItems.map((item) => {
          const isActive = activeView === item.id
          const isDisabled = item.requiresImage && !sourceImage
          const isCompleted = getIsCompleted(item.id, sourceImage)

          return (
            <button
              key={item.id}
              onClick={() => !isDisabled && setActiveView(item.id)}
              disabled={isDisabled}
              title={item.label}
              className="relative w-10 h-10 flex flex-col items-center justify-center gap-0.5 rounded-lg transition-all duration-150 no-drag"
              style={{
                backgroundColor: isActive ? 'var(--bg-elevated)' : 'transparent',
                color: isActive
                  ? 'var(--text-primary)'
                  : isDisabled
                    ? 'var(--text-muted)'
                    : 'var(--text-secondary)',
                border: isActive
                  ? '1px solid var(--border-default)'
                  : '1px solid transparent',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
              }}
            >
              <span className="text-base leading-none">{item.icon}</span>
              <span style={{ fontSize: '9px', lineHeight: 1, color: 'inherit' }}>
                {item.label}
              </span>

              {/* Yellow dot for completed stages */}
              {isCompleted && (
                <span
                  className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: 'var(--accent)' }}
                />
              )}
            </button>
          )
        })}
      </nav>

      {/* Version */}
      <div
        className="pb-3 flex justify-center"
        style={{ fontSize: '9px', color: 'var(--text-muted)' }}
      >
        v0.1
      </div>
    </div>
  )
}

function getIsCompleted(id: ViewType, sourceImage: string | null): boolean {
  const { annotatedImage, styledImage, mockupImage } = useAppStore.getState()
  if (id === 'capture') return !!sourceImage
  if (id === 'annotate') return !!annotatedImage
  if (id === 'style') return !!styledImage
  if (id === 'mockup') return !!mockupImage
  return false
}
