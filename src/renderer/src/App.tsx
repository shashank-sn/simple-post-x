import { useAppStore } from '@renderer/store/app-store'
import { Sidebar } from '@renderer/components/layout/Sidebar'
import { Toolbar } from '@renderer/components/layout/Toolbar'
import { StatusBar } from '@renderer/components/layout/StatusBar'
import { CaptureView } from '@renderer/views/CaptureView'
import { AnnotateView } from '@renderer/views/AnnotateView'
import { StyleView } from '@renderer/views/StyleView'
import { MockupView } from '@renderer/views/MockupView'
import { McpView } from '@renderer/views/McpView'

function ActiveView(): JSX.Element {
  const { activeView } = useAppStore()
  switch (activeView) {
    case 'capture': return <CaptureView />
    case 'annotate': return <AnnotateView />
    case 'style': return <StyleView />
    case 'mockup': return <MockupView />
    case 'mcp': return <McpView />
  }
}

export default function App(): JSX.Element {
  return (
    <div
      className="flex flex-col h-full"
      style={{ backgroundColor: 'var(--bg-base)' }}
    >
      {/* Top toolbar */}
      <Toolbar />

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        {/* Content */}
        <main
          className="flex-1 overflow-hidden"
          style={{ backgroundColor: 'var(--bg-base)' }}
        >
          <ActiveView />
        </main>
      </div>

      {/* Status bar */}
      <StatusBar />
    </div>
  )
}
