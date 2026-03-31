import { useState, useEffect } from 'react'
import { Button } from '@renderer/components/ui/Button'

export function McpView(): JSX.Element {
  const [copied, setCopied] = useState(false)
  const [mcpServerPath, setMcpServerPath] = useState('')

  useEffect(() => {
    // Build the MCP server path — works in both dev and packaged app
    // In packaged app: process.resourcesPath points to the Resources folder
    const resourcesPath =
      window.electron?.process?.resourcesPath ||
      `${window.electron?.process?.cwd?.() || ''}/resources`
    setMcpServerPath(`${resourcesPath}/mcp-server.js`)
  }, [])

  const config = JSON.stringify(
    {
      mcpServers: {
        'simple-post-x': {
          command: 'node',
          args: [mcpServerPath],
        },
      },
    },
    null,
    2
  )

  const handleCopy = async (): Promise<void> => {
    await navigator.clipboard.writeText(config)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="max-w-xl mx-auto w-full px-8 py-8 flex flex-col gap-8">

        {/* Header */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              MCP Server
            </h1>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Connect Simple Post X to Claude Code so Claude can capture screenshots,
            apply styles, create mockups, and batch-process images automatically.
          </p>
        </div>

        {/* Setup steps */}
        <div className="flex flex-col gap-4">
          <StepCard
            number={1}
            title="Copy the MCP config"
            description="Click the button below to copy the Claude Code config to your clipboard."
          >
            <div
              className="rounded-lg p-3 font-mono text-xs overflow-x-auto"
              style={{
                backgroundColor: 'var(--bg-base)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                whiteSpace: 'pre',
              }}
            >
              {config}
            </div>
            <Button
              variant="primary"
              size="md"
              onClick={handleCopy}
              className="mt-2"
            >
              {copied ? '✓ Copied!' : 'Copy MCP Config'}
            </Button>
          </StepCard>

          <StepCard
            number={2}
            title="Add to Claude Code settings"
            description='Open your Claude Code settings file and paste the config. Usually at ~/.claude/settings.json under the "mcpServers" key.'
          >
            <div
              className="rounded-lg px-3 py-2 text-sm font-mono"
              style={{
                backgroundColor: 'var(--bg-base)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
              }}
            >
              ~/.claude/settings.json
            </div>
          </StepCard>

          <StepCard
            number={3}
            title="Restart Claude Code"
            description="Claude Code needs to restart to pick up the new MCP server. Then look for simple-post-x in the MCP tools list."
          />

          <StepCard
            number={4}
            title="Use it with Claude"
            description="Keep Simple Post X open while using Claude Code. Claude can now call these tools:"
          >
            <div className="flex flex-col gap-2 mt-1">
              {[
                { tool: 'capture_screenshot', desc: 'Take a screenshot (app must be open)' },
                { tool: 'apply_style', desc: 'Style an image with a background template' },
                { tool: 'batch_process', desc: 'Process a whole folder of images at once' },
                { tool: 'list_templates', desc: 'See all available style templates' },
              ].map(({ tool, desc }) => (
                <div key={tool} className="flex items-start gap-2">
                  <code
                    className="px-1.5 py-0.5 rounded text-xs shrink-0"
                    style={{
                      backgroundColor: 'var(--bg-elevated)',
                      color: 'var(--accent)',
                      border: '1px solid var(--border-default)',
                      fontFamily: 'monospace',
                    }}
                  >
                    {tool}
                  </code>
                  <span className="text-xs" style={{ color: 'var(--text-muted)', paddingTop: 2 }}>
                    {desc}
                  </span>
                </div>
              ))}
            </div>
          </StepCard>
        </div>

        {/* Example prompt */}
        <div
          className="rounded-lg p-4 flex flex-col gap-2"
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            Example Claude prompt
          </p>
          <p
            className="text-sm italic"
            style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}
          >
            "Apply the 'midnight' style with 80px padding to every PNG in my{' '}
            <code style={{ color: 'var(--accent)', fontStyle: 'normal' }}>~/Desktop/screenshots</code>{' '}
            folder and save results to a new 'styled' subfolder."
          </p>
        </div>

      </div>
    </div>
  )
}

function StepCard({
  number,
  title,
  description,
  children,
}: {
  number: number
  title: string
  description: string
  children?: React.ReactNode
}): JSX.Element {
  return (
    <div
      className="rounded-lg p-4 flex gap-4"
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
        style={{
          backgroundColor: 'var(--accent-muted)',
          color: 'var(--accent)',
          border: '1px solid var(--accent-border)',
        }}
      >
        {number}
      </div>
      <div className="flex flex-col gap-2 flex-1">
        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          {title}
        </p>
        <p className="text-xs" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {description}
        </p>
        {children}
      </div>
    </div>
  )
}
