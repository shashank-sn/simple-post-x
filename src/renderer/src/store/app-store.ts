import { create } from 'zustand'

export type ViewType = 'capture' | 'annotate' | 'style' | 'mockup' | 'mcp'

export type AnnotationTool =
  | 'select'
  | 'draw'
  | 'arrow'
  | 'rectangle'
  | 'ellipse'
  | 'text'
  | 'highlight'
  | 'blur'

export interface AnnotationShape {
  id: string
  type: AnnotationTool
  color: string
  strokeWidth: number
  // freehand draw
  points?: number[]
  // positioned shapes (arrow, rect, ellipse, text, highlight, blur)
  x?: number
  y?: number
  width?: number
  height?: number
  // arrow endpoints
  x2?: number
  y2?: number
  // text
  text?: string
  fontSize?: number
  // highlight opacity
  opacity?: number
}

interface AppState {
  // Pipeline images
  sourceImage: string | null
  annotatedImage: string | null
  styledImage: string | null
  mockupImage: string | null

  // Navigation
  activeView: ViewType

  // Annotation tool state
  activeAnnotationTool: AnnotationTool
  annotationColor: string
  strokeWidth: number

  // Annotation shapes + undo/redo
  shapes: AnnotationShape[]
  history: AnnotationShape[][]
  historyIndex: number

  // Actions — pipeline
  setSourceImage: (image: string | null) => void
  setAnnotatedImage: (image: string | null) => void
  setStyledImage: (image: string | null) => void
  setMockupImage: (image: string | null) => void
  setActiveView: (view: ViewType) => void
  resetPipeline: () => void

  // Actions — annotation tool
  setActiveAnnotationTool: (tool: AnnotationTool) => void
  setAnnotationColor: (color: string) => void
  setStrokeWidth: (width: number) => void

  // Actions — shapes
  addShape: (shape: AnnotationShape) => void
  updateShape: (id: string, updates: Partial<AnnotationShape>) => void
  undoAnnotation: () => void
  redoAnnotation: () => void
  clearShapes: () => void
}

export const useAppStore = create<AppState>((set, get) => ({
  sourceImage: null,
  annotatedImage: null,
  styledImage: null,
  mockupImage: null,
  activeView: 'capture',
  activeAnnotationTool: 'arrow',
  annotationColor: '#F0F0F0',
  strokeWidth: 3,
  shapes: [],
  history: [[]],
  historyIndex: 0,

  setSourceImage: (image) => set({ sourceImage: image, shapes: [], history: [[]], historyIndex: 0 }),
  setAnnotatedImage: (image) => set({ annotatedImage: image }),
  setStyledImage: (image) => set({ styledImage: image }),
  setMockupImage: (image) => set({ mockupImage: image }),
  setActiveView: (view) => set({ activeView: view }),
  resetPipeline: () =>
    set({
      sourceImage: null,
      annotatedImage: null,
      styledImage: null,
      mockupImage: null,
      activeView: 'capture',
      shapes: [],
      history: [[]],
      historyIndex: 0,
    }),

  setActiveAnnotationTool: (tool) => set({ activeAnnotationTool: tool }),
  setAnnotationColor: (color) => set({ annotationColor: color }),
  setStrokeWidth: (width) => set({ strokeWidth: width }),

  addShape: (shape) => {
    const { shapes, history, historyIndex } = get()
    const newShapes = [...shapes, shape]
    // Truncate redo history on new action
    const newHistory = [...history.slice(0, historyIndex + 1), newShapes]
    set({ shapes: newShapes, history: newHistory, historyIndex: newHistory.length - 1 })
  },

  updateShape: (id, updates) => {
    const { shapes, history, historyIndex } = get()
    const newShapes = shapes.map((s) => (s.id === id ? { ...s, ...updates } : s))
    const newHistory = [...history.slice(0, historyIndex + 1), newShapes]
    set({ shapes: newShapes, history: newHistory, historyIndex: newHistory.length - 1 })
  },

  undoAnnotation: () => {
    const { history, historyIndex } = get()
    if (historyIndex <= 0) return
    const newIndex = historyIndex - 1
    set({ shapes: history[newIndex], historyIndex: newIndex })
  },

  redoAnnotation: () => {
    const { history, historyIndex } = get()
    if (historyIndex >= history.length - 1) return
    const newIndex = historyIndex + 1
    set({ shapes: history[newIndex], historyIndex: newIndex })
  },

  clearShapes: () => {
    set({ shapes: [], history: [[]], historyIndex: 0 })
  },
}))
