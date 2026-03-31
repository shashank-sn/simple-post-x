import { useRef, useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'
import { Stage, Layer, Image as KonvaImage, Line, Arrow, Rect, Ellipse, Text, Group } from 'react-konva'
import useImage from 'use-image'
import Konva from 'konva'
import { useAppStore, AnnotationShape, AnnotationTool } from '@renderer/store/app-store'

export interface AnnotationCanvasHandle {
  exportImage: () => string
}

interface Props {
  containerWidth: number
  containerHeight: number
}

// Padding around the image
const PADDING = 40

let idCounter = 0
function newId(): string {
  return `shape-${Date.now()}-${idCounter++}`
}

export const AnnotationCanvas = forwardRef<AnnotationCanvasHandle, Props>(
  ({ containerWidth, containerHeight }, ref) => {
    const {
      sourceImage,
      shapes,
      addShape,
      updateShape,
      activeAnnotationTool,
      annotationColor,
      strokeWidth,
    } = useAppStore()

    const stageRef = useRef<Konva.Stage>(null)
    const [bgImage] = useImage(sourceImage || '')

    // Active (in-progress) shape while drawing
    const [activeShape, setActiveShape] = useState<AnnotationShape | null>(null)
    const [isDrawing, setIsDrawing] = useState(false)
    const [textEditId, setTextEditId] = useState<string | null>(null)
    const [textEditPos, setTextEditPos] = useState<{ x: number; y: number } | null>(null)

    // Stage dimensions — fit image in container with padding
    const imageWidth = bgImage?.naturalWidth || bgImage?.width || 800
    const imageHeight = bgImage?.naturalHeight || bgImage?.height || 600

    const availW = containerWidth - PADDING * 2
    const availH = containerHeight - PADDING * 2
    const scale = Math.min(availW / imageWidth, availH / imageHeight, 1)

    const stageW = Math.round(imageWidth * scale)
    const stageH = Math.round(imageHeight * scale)

    // Expose export handle to parent
    useImperativeHandle(ref, () => ({
      exportImage: () => {
        if (!stageRef.current) return ''
        // Export at full image resolution
        return stageRef.current.toDataURL({ pixelRatio: 1 / scale })
      },
    }))

    // Convert stage coordinates (accounting for scale) to image coordinates
    const toImageCoords = useCallback(
      (stageX: number, stageY: number) => ({
        x: stageX / scale,
        y: stageY / scale,
      }),
      [scale]
    )

    const getPointerPos = useCallback((): { x: number; y: number } => {
      const pos = stageRef.current?.getPointerPosition()
      return pos ? toImageCoords(pos.x, pos.y) : { x: 0, y: 0 }
    }, [toImageCoords])

    // ── Mouse handlers ──────────────────────────────────────────────────────
    const handleMouseDown = useCallback(() => {
      if (activeAnnotationTool === 'select') return
      const pos = getPointerPos()

      if (activeAnnotationTool === 'text') {
        // Text: just record click position, show input overlay
        const id = newId()
        const shape: AnnotationShape = {
          id,
          type: 'text',
          color: annotationColor,
          strokeWidth,
          x: pos.x,
          y: pos.y,
          text: '',
          fontSize: 18,
        }
        addShape(shape)
        setTextEditId(id)
        setTextEditPos({ x: pos.x * scale, y: pos.y * scale })
        return
      }

      setIsDrawing(true)
      const id = newId()

      if (activeAnnotationTool === 'draw') {
        setActiveShape({
          id,
          type: 'draw',
          color: annotationColor,
          strokeWidth,
          points: [pos.x, pos.y],
        })
      } else if (activeAnnotationTool === 'arrow') {
        setActiveShape({
          id,
          type: 'arrow',
          color: annotationColor,
          strokeWidth,
          x: pos.x,
          y: pos.y,
          x2: pos.x,
          y2: pos.y,
        })
      } else if (
        activeAnnotationTool === 'rectangle' ||
        activeAnnotationTool === 'highlight' ||
        activeAnnotationTool === 'blur'
      ) {
        setActiveShape({
          id,
          type: activeAnnotationTool,
          color: annotationColor,
          strokeWidth,
          x: pos.x,
          y: pos.y,
          width: 0,
          height: 0,
          opacity: activeAnnotationTool === 'highlight' ? 0.35 : 0.6,
        })
      } else if (activeAnnotationTool === 'ellipse') {
        setActiveShape({
          id,
          type: 'ellipse',
          color: annotationColor,
          strokeWidth,
          x: pos.x,
          y: pos.y,
          width: 0,
          height: 0,
        })
      }
    }, [activeAnnotationTool, annotationColor, strokeWidth, addShape, getPointerPos, scale])

    const handleMouseMove = useCallback(() => {
      if (!isDrawing || !activeShape) return
      const pos = getPointerPos()

      if (activeShape.type === 'draw') {
        setActiveShape((prev) =>
          prev
            ? { ...prev, points: [...(prev.points || []), pos.x, pos.y] }
            : null
        )
      } else if (activeShape.type === 'arrow') {
        setActiveShape((prev) => prev ? { ...prev, x2: pos.x, y2: pos.y } : null)
      } else if (
        activeShape.type === 'rectangle' ||
        activeShape.type === 'highlight' ||
        activeShape.type === 'blur' ||
        activeShape.type === 'ellipse'
      ) {
        const w = pos.x - (activeShape.x || 0)
        const h = pos.y - (activeShape.y || 0)
        setActiveShape((prev) => prev ? { ...prev, width: w, height: h } : null)
      }
    }, [isDrawing, activeShape, getPointerPos])

    const handleMouseUp = useCallback(() => {
      if (!isDrawing || !activeShape) return
      setIsDrawing(false)

      // Ignore tiny shapes
      const isSignificant =
        activeShape.type === 'draw'
          ? (activeShape.points?.length ?? 0) > 4
          : Math.abs(activeShape.width || 0) > 5 || Math.abs(activeShape.height || 0) > 5 ||
            Math.abs((activeShape.x2 || 0) - (activeShape.x || 0)) > 5

      if (isSignificant) {
        addShape(activeShape)
      }
      setActiveShape(null)
    }, [isDrawing, activeShape, addShape])

    // ── Render a saved shape ────────────────────────────────────────────────
    const renderShape = (shape: AnnotationShape) => {
      const s = scale
      switch (shape.type) {
        case 'draw':
          return (
            <Line
              key={shape.id}
              points={(shape.points || []).map((p) => p * s)}
              stroke={shape.color}
              strokeWidth={shape.strokeWidth}
              tension={0.4}
              lineCap="round"
              lineJoin="round"
              globalCompositeOperation="source-over"
            />
          )
        case 'arrow':
          return (
            <Arrow
              key={shape.id}
              points={[
                (shape.x || 0) * s,
                (shape.y || 0) * s,
                (shape.x2 || 0) * s,
                (shape.y2 || 0) * s,
              ]}
              stroke={shape.color}
              fill={shape.color}
              strokeWidth={shape.strokeWidth}
              pointerLength={12}
              pointerWidth={10}
            />
          )
        case 'rectangle':
          return (
            <Rect
              key={shape.id}
              x={(shape.x || 0) * s}
              y={(shape.y || 0) * s}
              width={(shape.width || 0) * s}
              height={(shape.height || 0) * s}
              stroke={shape.color}
              strokeWidth={shape.strokeWidth}
              fill="transparent"
            />
          )
        case 'ellipse': {
          const cx = ((shape.x || 0) + (shape.width || 0) / 2) * s
          const cy = ((shape.y || 0) + (shape.height || 0) / 2) * s
          return (
            <Ellipse
              key={shape.id}
              x={cx}
              y={cy}
              radiusX={Math.abs((shape.width || 0) * s) / 2}
              radiusY={Math.abs((shape.height || 0) * s) / 2}
              stroke={shape.color}
              strokeWidth={shape.strokeWidth}
              fill="transparent"
            />
          )
        }
        case 'highlight':
          return (
            <Rect
              key={shape.id}
              x={(shape.x || 0) * s}
              y={(shape.y || 0) * s}
              width={(shape.width || 0) * s}
              height={(shape.height || 0) * s}
              fill={shape.color}
              opacity={shape.opacity ?? 0.35}
              stroke="transparent"
            />
          )
        case 'blur':
          return (
            <BlurRect key={shape.id} shape={shape} scale={s} sourceImage={sourceImage} />
          )
        case 'text':
          if (textEditId === shape.id) return null // rendered as HTML input
          return (
            <Text
              key={shape.id}
              x={(shape.x || 0) * s}
              y={(shape.y || 0) * s}
              text={shape.text || ''}
              fill={shape.color}
              fontSize={(shape.fontSize || 18)}
              fontFamily="Inter, sans-serif"
            />
          )
        default:
          return null
      }
    }

    // ── Render the in-progress (active) shape ───────────────────────────────
    const renderActiveShape = () => {
      if (!activeShape) return null
      return renderShape(activeShape)
    }

    // ── Text editing HTML overlay ───────────────────────────────────────────
    const handleTextCommit = (id: string, value: string) => {
      if (value.trim()) {
        updateShape(id, { text: value })
      } else {
        // Remove empty text shape
        useAppStore.setState((state) => ({
          shapes: state.shapes.filter((s) => s.id !== id),
        }))
      }
      setTextEditId(null)
      setTextEditPos(null)
    }

    const cursor =
      activeAnnotationTool === 'select'
        ? 'default'
        : activeAnnotationTool === 'text'
          ? 'text'
          : 'crosshair'

    return (
      <div
        className="relative flex items-center justify-center w-full h-full"
        style={{ cursor }}
      >
        <Stage
          ref={stageRef}
          width={stageW}
          height={stageH}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          style={{
            borderRadius: '4px',
            boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
          }}
        >
          {/* Background image layer */}
          <Layer>
            {bgImage && (
              <KonvaImage
                image={bgImage}
                width={stageW}
                height={stageH}
              />
            )}
          </Layer>

          {/* Saved shapes layer */}
          <Layer>
            {shapes.map(renderShape)}
            {renderActiveShape()}
          </Layer>
        </Stage>

        {/* HTML text input overlay */}
        {textEditId && textEditPos && (
          <TextInput
            x={textEditPos.x}
            y={textEditPos.y}
            color={annotationColor}
            onCommit={(val) => handleTextCommit(textEditId, val)}
          />
        )}
      </div>
    )
  }
)

AnnotationCanvas.displayName = 'AnnotationCanvas'

// ── BlurRect — renders a pixelated blur effect over a region ───────────────

interface BlurRectProps {
  shape: AnnotationShape
  scale: number
  sourceImage: string | null
}

function BlurRect({ shape, scale, sourceImage }: BlurRectProps): JSX.Element | null {
  const [blurredImage, setBlurredImage] = useState<HTMLImageElement | null>(null)

  useEffect(() => {
    if (!sourceImage || !shape.x || !shape.y || !shape.width || !shape.height) return

    const img = new window.Image()
    img.src = sourceImage
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const w = Math.abs(shape.width || 0)
      const h = Math.abs(shape.height || 0)
      canvas.width = w
      canvas.height = h

      const ctx = canvas.getContext('2d')!
      ctx.filter = 'blur(12px)'

      const srcX = Math.min(shape.x || 0, (shape.x || 0) + (shape.width || 0))
      const srcY = Math.min(shape.y || 0, (shape.y || 0) + (shape.height || 0))

      ctx.drawImage(img, srcX, srcY, w, h, 0, 0, w, h)

      const result = new window.Image()
      result.src = canvas.toDataURL()
      result.onload = () => setBlurredImage(result)
    }
  }, [sourceImage, shape])

  const x = Math.min(shape.x || 0, (shape.x || 0) + (shape.width || 0)) * scale
  const y = Math.min(shape.y || 0, (shape.y || 0) + (shape.height || 0)) * scale
  const w = Math.abs((shape.width || 0) * scale)
  const h = Math.abs((shape.height || 0) * scale)

  if (!blurredImage) {
    return (
      <Rect
        x={x}
        y={y}
        width={w}
        height={h}
        fill="rgba(0,0,0,0.5)"
      />
    )
  }

  return (
    <KonvaImage
      image={blurredImage}
      x={x}
      y={y}
      width={w}
      height={h}
    />
  )
}

// ── Text input HTML overlay ─────────────────────────────────────────────────

interface TextInputProps {
  x: number
  y: number
  color: string
  onCommit: (value: string) => void
}

function TextInput({ x, y, color, onCommit }: TextInputProps): JSX.Element {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <input
      ref={inputRef}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => onCommit(value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onCommit(value)
        if (e.key === 'Escape') onCommit('')
      }}
      className="absolute no-drag"
      style={{
        left: x,
        top: y,
        background: 'transparent',
        border: 'none',
        borderBottom: `2px solid ${color}`,
        outline: 'none',
        color,
        fontSize: 18,
        fontFamily: 'Inter, sans-serif',
        minWidth: 120,
        padding: '2px 4px',
      }}
    />
  )
}
