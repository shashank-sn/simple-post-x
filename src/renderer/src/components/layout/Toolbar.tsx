import { useAppStore } from '@renderer/store/app-store'

export function Toolbar(): JSX.Element {
  const { activeView } = useAppStore()

  const titles: Record<string, string> = {
    capture: 'Capture',
    annotate: 'Annotate',
    style: 'Style',
    mockup: 'Mockup',
    mcp: 'MCP Server',
  }

  return (
    <div
      className="flex items-center h-[52px] px-4 shrink-0 drag-region"
      style={{
        backgroundColor: 'var(--bg-base)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      {/* Spacer for traffic lights */}
      <div className="w-16 shrink-0" />

      <span
        className="text-sm font-medium no-drag"
        style={{ color: 'var(--text-secondary)' }}
      >
        {titles[activeView]}
      </span>
    </div>
  )
}
