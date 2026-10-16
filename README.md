# Wizard Chess 3D — Sanctum Edition

An interactive, cinematic 3D Wizard Chess experience set in a vaulted Gothic Cathedral. Built with Three.js, React 19, and procedural Web Audio API, featuring sculpted stone pieces, cinematic melee captures, real-time stone shatter physics, and a single-player chess AI engine.

---

## Highlights & Features

### 1. Gothic Cathedral Sanctum
- **Atmospheric Chiaroscuro Lighting**: High-contrast directional key light, cool hemisphere ambient fill, and twin flickering braziers flanking the stone altar table.
- **PMREM Studio Environment**: Procedural cathedral clerestory and rose-window light panels generating physically based reflections across marble and granite finishes.
- **Solid Stone Architecture**: Fully grounded limestone altar slab, stone pillars, and vaulted cathedral room bounds with anti-clipping collision detection.

### 2. Cinematic Melee Captures & Physics
- **Dynamic Duel Camera Arc**: Unbroken quadratic Bezier camera trajectory smoothly sweeping into an unobstructed 3/4 combat angle.
- **Synchronized Combat Choreography**: Attacking pieces stalk forward, cleave defending statues with physical weapon contact, and trigger bright impact flashes.
- **Stone Shatter Debris Physics**: Defeated statues violently detonate into 32 individual 3D stone shards with ballistic velocity, tumble rotations, and altar surface bounce dampening.
- **Royal Checkmate Fall**: When checkmate occurs, the defeated monarch statue staggers, topples around its pedestal rim, and crashes onto the board with a crown-shattering impact.

### 3. Procedural Sound Effect Manager
- **Stone Sliding Rumble**: Multilayer granitic friction synthesis combining low-frequency mass rumble, band-pass filtered surface grit, and limestone scuff. Durations and pitch dynamically scale with piece weight (King, Queen, and Rook feel noticeably heavier than Pawns) and movement distance.
- **Stone Click & Settle**: Crisp <10ms contact impulse, resonant limestone decay (~240–360 Hz), and sub-bass altar mass thump (~80 Hz) as pieces lock into their destination squares.
- **Cathedral Convolver Reverb**: 1.6-second procedural impulse response modeling vaulted stone arch reflections and high-frequency limestone acoustic absorption.
- **Combat & Crash Acoustics**: Chisel strike impacts, explosive stone shattering debris clatter, and monumental king collapse crashes.
- **Zero External Audio Files**: 100% synthesized in real time via the Web Audio API with zero 404 dependencies. Auto-unlocks on first user interaction and supports persistent mute/volume preferences.

### 4. Chess Engine & AI
- **Full Standard Rules**: Comprehensive legal move generation, check/checkmate detection, castling (with simultaneous King and Rook stone glide), pawn promotion, and en passant.
- **Single-Player AI**: Minimax evaluation with positional piece-square tables and tactical piece weighting.
- **Instant AI Move**: Test positions or let the AI take the next turn immediately via the HUD.

### 5. Multi-View Camera & Free Flight
- **Preset Camera Angles**:
  - **Player Cam**: First-person perspective behind your pieces (click again to flip White / Black view).
  - **Overhead Cam**: Clean 2D-like tactical perspective looking straight down upon the 64 squares.
  - **Side Cam**: Dramatic lateral profile view across the board (flips East / West).
  - **Cathedral Cam**: Sweeping wide architectural view of the sanctuary (flips North Rose / South Narthex).
- **Free-Fly Controls**: Video-game style WASD + R/F camera translation and Arrow-key camera orientation.
- **Shift-Axis Lock**: Hold `Shift` while dragging to constrain Orbit rotation or Panning strictly to horizontal or vertical axes.
- **Cinema / Zen Mode**: Toggle all HUD overlays off (`H` key) for pristine full-screen viewing.

---

## Controls & Shortcuts

| Action | Control / Shortcut |
| :--- | :--- |
| **Select / Move Piece** | Left-Click or Tap on square |
| **Orbit Camera** | Left-Click + Drag / 1-Finger Touch Drag |
| **Pan Camera** | Right-Click + Drag / 2-Finger Touch Drag |
| **Zoom View** | Mouse Scroll Wheel / Touch Pinch |
| **Axis-Locked Drag** | Hold `Shift` + Left/Right Drag |
| **Fly Camera (Move)** | `W` (Forward), `S` (Backward), `A` (Left), `D` (Right), `R` (Up), `F` (Down) |
| **Fly Camera (Look)** | `Up`, `Down`, `Left`, `Right` Arrow keys |
| **Toggle Sound** | `M` (or click `Sound: ON / Muted` in HUD) |
| **Hide / Show HUD** | `H` or `U` (or click `Hide UI` button) |
| **Close / Dismiss** | `Escape` |

---

## Technical Architecture

```
/
├── public/
│   └── assets/glb/          # Gzip-compressed base64 3D models (Cathedral & Pieces)
├── src/
│   ├── soundManager.ts      # Procedural Web Audio API sound effect manager
│   ├── wizardChessEngine.js # Three.js scene, PBR shaders, chess logic & AI
│   ├── App.tsx              # React HUD controls, camera views & status pills
│   ├── main.tsx             # React application entry point
│   ├── styles.css           # Glassmorphic gothic theme styling
│   └── vite-env.d.ts        # TypeScript declarations
├── test/
│   ├── applet.test.mjs      # Model validation & UI element regression tests
│   └── soundManager.test.mjs# Sound effect manager unit tests
├── index.html               # Main HTML entry point & viewport meta
├── vite.config.ts           # Vite build & bundler configuration
└── tsconfig.json            # TypeScript configuration
```

### Tech Stack
- **Framework**: [React 19](https://react.dev/)
- **3D Graphics**: [Three.js r170](https://threejs.org/) (WebGL2, PBR Shaders, PCF Soft Shadows)
- **Audio**: Web Audio API (procedural synthesis, biquad filtering, convolver reverb)
- **Language**: TypeScript & Modern ES2022 JavaScript
- **Build Tool**: [Vite 8](https://vitejs.dev/)

---

## Development & Testing

### Installation
```bash
npm install
```

### Local Dev Server
Runs the Vite development server on port 3000:
```bash
npm run dev
```

### Run Tests
Executes the Node.js test runner suite covering assets, UI constraints, and the sound manager:
```bash
node --test test/*.test.mjs
```

### Type Checking & Linting
```bash
npm run lint
```

### Production Build
```bash
npm run build
```

---

## License

MIT
