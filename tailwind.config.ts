import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/renderer/src/**/*.{js,ts,jsx,tsx,html}', './src/renderer/index.html'],
  theme: {
    extend: {
      colors: {
        // Backgrounds
        'bg-base': '#0D0D0D',
        'bg-surface': '#161616',
        'bg-elevated': '#1F1F1F',
        'bg-hover': '#252525',
        // Borders
        'border-subtle': '#2A2A2A',
        'border-default': '#363636',
        'border-strong': '#4A4A4A',
        // Text
        'text-primary': '#F0F0F0',
        'text-secondary': '#9A9A9A',
        'text-muted': '#5A5A5A',
        'text-inverse': '#0D0D0D',
        // Accent — the only color in the UI
        accent: '#C9A227',
        'accent-hover': '#DEB82E',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'monospace'],
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '20px',
      },
      fontSize: {
        xs: '11px',
        sm: '13px',
        base: '15px',
        lg: '18px',
        xl: '22px',
      },
    },
  },
  plugins: [],
}

export default config
