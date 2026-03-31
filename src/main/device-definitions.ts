export interface DeviceDefinition {
  id: string
  name: string
  category: 'phone' | 'tablet' | 'desktop' | 'browser'
  icon: string
  frameWidth: number
  frameHeight: number
  screenRegion: { x: number; y: number; width: number; height: number; rx: number }
  buildFrameSvg: () => string
}

// ── SVG frame builder helpers ─────────────────────────────────────────────────

function iphoneFrame(): string {
  const W = 430, H = 932
  const SX = 20, SY = 60, SW = 390, SH = 812, SRX = 38
  const FRX = 54
  // Dynamic island pill
  const DIW = 120, DIH = 34, DIX = (W - DIW) / 2, DIY = 72
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <mask id="m">
        <rect width="${W}" height="${H}" fill="white"/>
        <rect x="${SX}" y="${SY}" width="${SW}" height="${SH}" rx="${SRX}" fill="black"/>
      </mask>
      <linearGradient id="fg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#2C2C2E"/>
        <stop offset="100%" stop-color="#1C1C1E"/>
      </linearGradient>
    </defs>
    <!-- Frame body -->
    <rect width="${W}" height="${H}" rx="${FRX}" fill="url(#fg)" mask="url(#m)"/>
    <!-- Side sheen -->
    <rect width="${W}" height="${H}" rx="${FRX}" fill="none"
          stroke="#3A3A3C" stroke-width="1" mask="url(#m)"/>
    <!-- Dynamic Island -->
    <rect x="${DIX}" y="${DIY}" width="${DIW}" height="${DIH}" rx="${DIH / 2}"
          fill="#0A0A0A"/>
    <!-- Volume buttons left -->
    <rect x="-3" y="160" width="6" height="36" rx="3" fill="#2C2C2E"/>
    <rect x="-3" y="210" width="6" height="60" rx="3" fill="#2C2C2E"/>
    <rect x="-3" y="284" width="6" height="60" rx="3" fill="#2C2C2E"/>
    <!-- Power button right -->
    <rect x="${W - 3}" y="210" width="6" height="80" rx="3" fill="#2C2C2E"/>
    <!-- Home indicator -->
    <rect x="${(W - 130) / 2}" y="${H - 28}" width="130" height="5" rx="2.5"
          fill="#3A3A3C"/>
  </svg>`
}

function androidFrame(): string {
  const W = 412, H = 900
  const SX = 16, SY = 48, SW = 380, SH = 804, SRX = 22
  const FRX = 44
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <mask id="m">
        <rect width="${W}" height="${H}" fill="white"/>
        <rect x="${SX}" y="${SY}" width="${SW}" height="${SH}" rx="${SRX}" fill="black"/>
      </mask>
      <linearGradient id="fg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#222222"/>
        <stop offset="100%" stop-color="#1A1A1A"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" rx="${FRX}" fill="url(#fg)" mask="url(#m)"/>
    <rect width="${W}" height="${H}" rx="${FRX}" fill="none"
          stroke="#333333" stroke-width="1" mask="url(#m)"/>
    <!-- Punch-hole camera -->
    <circle cx="${W / 2}" cy="${SY + 28}" r="10" fill="#0A0A0A"/>
    <!-- Volume buttons -->
    <rect x="-3" y="200" width="6" height="80" rx="3" fill="#222222"/>
    <rect x="-3" y="296" width="6" height="80" rx="3" fill="#222222"/>
    <!-- Power button -->
    <rect x="${W - 3}" y="220" width="6" height="70" rx="3" fill="#222222"/>
    <!-- Bottom bar -->
    <rect x="${(W - 100) / 2}" y="${H - 22}" width="100" height="4" rx="2"
          fill="#333333"/>
  </svg>`
}

function ipadFrame(): string {
  const W = 860, H = 1180
  const SX = 44, SY = 64, SW = 772, SH = 1052, SRX = 10
  const FRX = 22
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <mask id="m">
        <rect width="${W}" height="${H}" fill="white"/>
        <rect x="${SX}" y="${SY}" width="${SW}" height="${SH}" rx="${SRX}" fill="black"/>
      </mask>
      <linearGradient id="fg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#2A2A2C"/>
        <stop offset="100%" stop-color="#1C1C1E"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" rx="${FRX}" fill="url(#fg)" mask="url(#m)"/>
    <rect width="${W}" height="${H}" rx="${FRX}" fill="none"
          stroke="#3A3A3C" stroke-width="1" mask="url(#m)"/>
    <!-- Front camera -->
    <circle cx="${W / 2}" cy="${SY - 22}" r="7" fill="#0A0A0A"/>
    <!-- Home button (iPad with home) -->
    <circle cx="${W / 2}" cy="${H - 22}" r="12" fill="#2A2A2C" stroke="#3A3A3C" stroke-width="1"/>
    <!-- Volume on the side -->
    <rect x="-3" y="260" width="6" height="50" rx="3" fill="#2A2A2C"/>
    <rect x="-3" y="324" width="6" height="50" rx="3" fill="#2A2A2C"/>
  </svg>`
}

function macbookFrame(): string {
  const W = 1560, H = 980
  const SX = 80, SY = 48, SW = 1400, SH = 884, SRX = 4
  const FRX = 14
  // Hinge / chin
  const CHIN_H = 36
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H + CHIN_H}">
    <defs>
      <mask id="m">
        <rect width="${W}" height="${H}" fill="white"/>
        <rect x="${SX}" y="${SY}" width="${SW}" height="${SH}" rx="${SRX}" fill="black"/>
      </mask>
      <linearGradient id="lid" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#2C2C2E"/>
        <stop offset="100%" stop-color="#1C1C1E"/>
      </linearGradient>
    </defs>
    <!-- Lid -->
    <rect width="${W}" height="${H}" rx="${FRX}" fill="url(#lid)" mask="url(#m)"/>
    <rect width="${W}" height="${H}" rx="${FRX}" fill="none"
          stroke="#3A3A3C" stroke-width="1" mask="url(#m)"/>
    <!-- Camera dot -->
    <circle cx="${W / 2}" cy="${SY - 16}" r="5" fill="#0A0A0A"/>
    <!-- Chin (hinge area) -->
    <rect x="0" y="${H}" width="${W}" height="${CHIN_H}"
          rx="0" fill="#1A1A1A"/>
    <rect x="${(W - 160) / 2}" y="${H + 12}" width="160" height="10"
          rx="3" fill="#0A0A0A"/>
  </svg>`
}

function browserFrame(): string {
  const W = 1440, CHROME_H = 80, H = 900
  const TOTAL_H = CHROME_H + H
  const FRX = 10
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${TOTAL_H}">
    <defs>
      <mask id="m">
        <rect width="${W}" height="${TOTAL_H}" fill="white"/>
        <!-- Screen area is cut out (below chrome) -->
        <rect x="0" y="${CHROME_H}" width="${W}" height="${H}" fill="black"/>
      </mask>
      <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#2A2A2A"/>
        <stop offset="100%" stop-color="#222222"/>
      </linearGradient>
    </defs>
    <!-- Browser chrome background (only top portion shown due to mask) -->
    <rect width="${W}" height="${TOTAL_H}" rx="${FRX}" fill="url(#bg)" mask="url(#m)"/>
    <!-- Tab bar -->
    <rect x="0" y="0" width="${W}" height="38" rx="${FRX}" fill="#1E1E1E"/>
    <!-- Tab pill -->
    <rect x="80" y="8" width="200" height="24" rx="6" fill="#2E2E2E"/>
    <text x="180" y="24" text-anchor="middle"
          font-family="Inter, sans-serif" font-size="11" fill="#9A9A9A">App Preview</text>
    <!-- Traffic light dots -->
    <circle cx="18" cy="19" r="6" fill="#FF5F57"/>
    <circle cx="38" cy="19" r="6" fill="#FFBD2E"/>
    <circle cx="58" cy="19" r="6" fill="#28C840"/>
    <!-- Address bar -->
    <rect x="${(W - 480) / 2}" y="44" width="480" height="26" rx="13" fill="#1A1A1A"/>
    <text x="${W / 2}" y="62" text-anchor="middle"
          font-family="Inter, sans-serif" font-size="11" fill="#5A5A5A">simplepostx.app</text>
    <!-- Divider line -->
    <line x1="0" y1="${CHROME_H}" x2="${W}" y2="${CHROME_H}"
          stroke="#333333" stroke-width="1"/>
  </svg>`
}

// ── Device definitions ────────────────────────────────────────────────────────

export const DEVICE_DEFINITIONS: DeviceDefinition[] = [
  {
    id: 'iphone',
    name: 'iPhone',
    category: 'phone',
    icon: '📱',
    frameWidth: 430,
    frameHeight: 932,
    screenRegion: { x: 20, y: 60, width: 390, height: 812, rx: 38 },
    buildFrameSvg: iphoneFrame,
  },
  {
    id: 'android',
    name: 'Android',
    category: 'phone',
    icon: '📱',
    frameWidth: 412,
    frameHeight: 900,
    screenRegion: { x: 16, y: 48, width: 380, height: 804, rx: 22 },
    buildFrameSvg: androidFrame,
  },
  {
    id: 'ipad',
    name: 'iPad',
    category: 'tablet',
    icon: '⬜',
    frameWidth: 860,
    frameHeight: 1180,
    screenRegion: { x: 44, y: 64, width: 772, height: 1052, rx: 10 },
    buildFrameSvg: ipadFrame,
  },
  {
    id: 'macbook',
    name: 'MacBook',
    category: 'desktop',
    icon: '💻',
    frameWidth: 1560,
    frameHeight: 1016, // includes chin
    screenRegion: { x: 80, y: 48, width: 1400, height: 884, rx: 4 },
    buildFrameSvg: macbookFrame,
  },
  {
    id: 'browser',
    name: 'Browser',
    category: 'browser',
    icon: '🌐',
    frameWidth: 1440,
    frameHeight: 980,
    screenRegion: { x: 0, y: 80, width: 1440, height: 900, rx: 0 },
    buildFrameSvg: browserFrame,
  },
]

export function getDeviceById(id: string): DeviceDefinition | undefined {
  return DEVICE_DEFINITIONS.find((d) => d.id === id)
}
