export interface StyleTemplate {
  id: string
  name: string
  // CSS gradient string for instant thumbnail rendering in the UI
  cssBackground: string
  // Sharp rendering spec
  spec: GradientSpec | SolidSpec
}

export interface GradientSpec {
  type: 'gradient'
  color1: string
  color2: string
  angleDeg: number
}

export interface SolidSpec {
  type: 'solid'
  color: string
}

export const STYLE_TEMPLATES: StyleTemplate[] = [
  // ── Dark ──────────────────────────────────────────────────────
  {
    id: 'midnight',
    name: 'Midnight',
    cssBackground: 'linear-gradient(135deg, #0D0D0D 0%, #1A1A2E 100%)',
    spec: { type: 'gradient', color1: '#0D0D0D', color2: '#1A1A2E', angleDeg: 135 },
  },
  {
    id: 'carbon',
    name: 'Carbon',
    cssBackground: 'linear-gradient(160deg, #111111 0%, #1C1C1C 100%)',
    spec: { type: 'gradient', color1: '#111111', color2: '#1C1C1C', angleDeg: 160 },
  },
  {
    id: 'obsidian',
    name: 'Obsidian',
    cssBackground: '#0A0A0A',
    spec: { type: 'solid', color: '#0A0A0A' },
  },
  {
    id: 'noir',
    name: 'Noir',
    cssBackground: 'linear-gradient(180deg, #080808 0%, #161616 100%)',
    spec: { type: 'gradient', color1: '#080808', color2: '#161616', angleDeg: 180 },
  },
  {
    id: 'slate',
    name: 'Slate',
    cssBackground: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
    spec: { type: 'gradient', color1: '#0F172A', color2: '#1E293B', angleDeg: 135 },
  },
  {
    id: 'storm',
    name: 'Storm',
    cssBackground: 'linear-gradient(135deg, #111827 0%, #1F2937 100%)',
    spec: { type: 'gradient', color1: '#111827', color2: '#1F2937', angleDeg: 135 },
  },
  // ── Mid ───────────────────────────────────────────────────────
  {
    id: 'iron',
    name: 'Iron',
    cssBackground: 'linear-gradient(135deg, #2A2A2A 0%, #3A3A3A 100%)',
    spec: { type: 'gradient', color1: '#2A2A2A', color2: '#3A3A3A', angleDeg: 135 },
  },
  {
    id: 'fog',
    name: 'Fog',
    cssBackground: 'linear-gradient(135deg, #E8E8E8 0%, #D4D4D4 100%)',
    spec: { type: 'gradient', color1: '#E8E8E8', color2: '#D4D4D4', angleDeg: 135 },
  },
  // ── Light ─────────────────────────────────────────────────────
  {
    id: 'paper',
    name: 'Paper',
    cssBackground: 'linear-gradient(135deg, #F8F6F1 0%, #EDE9E3 100%)',
    spec: { type: 'gradient', color1: '#F8F6F1', color2: '#EDE9E3', angleDeg: 135 },
  },
  {
    id: 'snow',
    name: 'Snow',
    cssBackground: '#FFFFFF',
    spec: { type: 'solid', color: '#FFFFFF' },
  },
  {
    id: 'sand',
    name: 'Sand',
    cssBackground: 'linear-gradient(135deg, #F5E6D3 0%, #EDD5B8 100%)',
    spec: { type: 'gradient', color1: '#F5E6D3', color2: '#EDD5B8', angleDeg: 135 },
  },
  // ── Tinted darks ──────────────────────────────────────────────
  {
    id: 'dusk',
    name: 'Dusk',
    cssBackground: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)',
    spec: { type: 'gradient', color1: '#1A1A2E', color2: '#16213E', angleDeg: 135 },
  },
  {
    id: 'forest',
    name: 'Forest',
    cssBackground: 'linear-gradient(135deg, #0D1B0D 0%, #1A2E1A 100%)',
    spec: { type: 'gradient', color1: '#0D1B0D', color2: '#1A2E1A', angleDeg: 135 },
  },
  {
    id: 'ember',
    name: 'Ember',
    cssBackground: 'linear-gradient(135deg, #1C0E07 0%, #2D1A0A 100%)',
    spec: { type: 'gradient', color1: '#1C0E07', color2: '#2D1A0A', angleDeg: 135 },
  },
]
