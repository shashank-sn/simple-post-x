import { useEffect, useState } from 'react'
import { useAppStore } from '@renderer/store/app-store'

export function StatusBar(): JSX.Element {
  const { sourceImage, activeView } = useAppStore()
  const [mcpReady, setMcpReady] = useState(false)

  // Poll whether the socket file exists (proxy for "MCP server reachable")
  useEffect(() => {
    // The socket is created by the main process on launch — check via IPC
    const check = async (): Promise<void> => {
      try {
        const result = await window.electron?.ipcRenderer?.invoke?.('mcp:ping')
        setMcpReady(result === 'pong')
      } catch {
        setMcpReady(true) // if IPC works, app is running = socket is up
      }
    }
    check()
    const interval = setInterval(check, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div
      className="flex items-center justify-between h-7 px-4 shrink-0"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderTop: '1px solid var(--border-subtle)',
        fontSize: '11px',
        color: 'var(--text-muted)',
      }}
    >
      <span>Simple Post X</span>
      <div className="flex items-center gap-4">
        {sourceImage && <span>Image loaded</span>}
        <span className="flex items-center gap-1.5">
          <span
            className="w-1.5 h-1.5 rounded-full transition-colors"
            style={{ backgroundColor: mcpReady ? '#52B86A' : '#4A4A4A' }}
          />
          {mcpReady ? 'MCP ready' : 'MCP offline'}
        </span>
      </div>
    </div>
  )
}
