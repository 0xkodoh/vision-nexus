# Design System & Style Guide: Modern Industrial Defect Inspection (VISION-OPS / OPENCV 5)

## 1. Design Concept & Philosophy
**Aesthetic World: "Tactical Industrial Cockpit" (Mission-Critical Factory Floor Vision)**
This interface is engineered for high-throughput, low-latency automated optical inspection (AOI) lines. It eschews generic corporate SaaS templates in favor of a precision industrial instrumentation HUD: ultra-dark substrate with milled steel undertones, razor-thin panel delimiters, monospaced telemetry meters, high-visibility signal LEDs, and instant defect alerts.

- **Primary Job of the Interface**: Deliver sub-millisecond situational awareness to factory quality engineers and plant operators monitoring high-speed surface-mount PCB and manufacturing lines.
- **Signature Visual Identity**: Crisp reticle crosshairs, scanline-guided visual inspection viewports, real-time millisecond latency gauges, and synchronized AWS Cloud persistence telemetry.

---

## 2. Color Palette & Token System

### Dark Core Substrate (Cockpit Hull)
- `--bg-canvas`: `#07090E` (Deepest industrial abyss, neutral-blue tint)
- `--bg-surface`: `#0D1117` (Milled steel panel background)
- `--bg-surface-raised`: `#151B23` (Interactive cards, elevated modules)
- `--bg-surface-inset`: `#090C10` (Embedded sensor viewport recess)
- `--border-subtle`: `#1F2937` (1px precision separation rule)
- `--border-focus`: `#374151` (High-contrast structural line)

### Signal & Diagnostic Channels (High-Contrast Neon Status)
- **Nominal / Pass (Signal Green)**:
  - Base: `#10B981` (Emerald 500)
  - Neon Glow: `#00FF9D` (Ultra-bright high-vis phosphor)
  - Dark Glow/Wash: `rgba(16, 185, 129, 0.12)`
  - Border: `rgba(16, 185, 129, 0.4)`
- **Defect Critical / Alarm (Signal Crimson)**:
  - Base: `#EF4444` (Red 500)
  - Neon Alert: `#FF3344` (Laser Red)
  - Dark Glow/Wash: `rgba(239, 68, 68, 0.15)`
  - Border: `rgba(239, 68, 68, 0.6)`
  - Strobe/Pulse: `rgba(255, 51, 68, 0.8)`
- **Cloud Sync / AWS Amber (Industrial Energy)**:
  - Base: `#F59E0B` (Amber 500)
  - AWS Glow: `#FF9900` (AWS Signature Industrial Orange)
  - Dark Glow/Wash: `rgba(245, 158, 11, 0.15)`
- **Inspection HUD / Optical Beam (Cyber Cyan)**:
  - Base: `#06B6D4` (Cyan 500)
  - Laser Cyan: `#22D3EE` (Cyan 400)
  - Dark Wash: `rgba(6, 182, 212, 0.12)`

### Neutral & Data Hierarchy
- `--text-primary`: `#F9FAFB` (98% contrast pure white)
- `--text-secondary`: `#94A3B8` (Slate 400 - telemetry labels, units)
- `--text-muted`: `#64748B` (Slate 500 - minor status, timestamps)
- `--text-code`: `#38BDF8` (Sky 400 - coordinates, bounding box metrics)

---

## 3. Typography & Numerical Scales
1. **Primary UI & Headings**: Inter / System Sans-serif (`font-sans`), tracked slightly tight (`tracking-tight`), uppercase headers with medium weight (`font-semibold` / `font-medium`).
2. **Telemetry, Timestamps & Coordinates**: JetBrains Mono / Monospace (`font-mono`), tabular numerals (`tabular-nums`), unambiguous zero formatting (`0` vs `O`).
3. **Scale Hierarchy**:
   - `text-2xl font-bold tracking-tight` (View Title & Major Status)
   - `text-base font-semibold` (Card & Widget Title)
   - `text-xs font-mono uppercase tracking-wider` (Panel Eyebrows & Field Labels)
   - `text-3xl font-mono font-bold tabular-nums` (Telemetry Readouts: Latency ms, Defect count, FPS)
   - `text-[11px] font-mono` (Log Streams, Bounding Box coordinates, S3 URI readouts)

---

## 4. Layout Architecture & Spatial Grid

```
+---------------------------------------------------------------------------------------+
|  [LOGO: VISION-OPS]  |  OPENCV 5 CV ENGINE  |  AWS S3: CONNECTED  |  FPS: 30  | 22:38:00  |
+---------------------------------------------------------------------------------------+
|                                                           |                           |
|   CAMERA FEED & OPENCV ANNOTATED HUD                      |   LIVE TELEMETRY PANEL    |
|   +---------------------------------------------------+   |   +-------------------+   |
|   |  [LIVE STREAM / RETICLE OVERLAY / BOUNDING BOX]   |   |   | Processing Latency|   |
|   |                                                   |   |   | 3.42 ms (LOW)     |   |
|   |   (Scratch detected #1 [x:50, y:50, w:100, h:10]) |   |   +-------------------+   |
|   |                                                   |   |   | Defect Breakdown  |   |
|   |  [Crosshair]          [Status: DEFECT FLAGGED]    |   |   | - Crack: 1        |   |
|   +---------------------------------------------------+   |   | - Void: 0         |   |
|                                                           |   +-------------------+   |
|   FEED CONTROLS & TEST SAMPLES BENCH                      |   AWS S3 CLOUD SYNC   |
|   [Upload Image] [Simulate Stream] [Preset 1] [Preset 2]  |   - Status: SYNCED    |
|   [Set Reference Standard] [Backend API Config: :8000]    |   - S3 Key: defect_.. |
|                                                           |   - S3 URI & Metadata |
+---------------------------------------------------------------------------------------+
|   REAL-TIME EVENT LOG & INSPECTION TIMELINE (CHRONOLOGICAL EVENT STREAM)              |
+---------------------------------------------------------------------------------------+
```

---

## 5. Micro-Interactions & Component States

1. **Camera Feed Viewport**:
   - Inset shadow with 1px border.
   - Reticle corner ticks `border-t-2 border-l-2 border-cyan-500/50`.
   - Grid scanline background animation when streaming is active.
   - Hover zoom magnifier & interactive bounding box highlight toggle.
2. **Defect Alert State**:
   - Pulsing red halo around the viewport perimeter when `has_defect === true`.
   - Audible or visual beacon flashing "CRITICAL: DEFECT DETECTED".
3. **AWS Sync Badge**:
   - `SYNCING`: Rotating amber circular arc.
   - `SYNCED (S3)`: Solid emerald badge with clickable S3 Object Key copy tool.
   - `OFFLINE / LOCAL`: Muted slate badge.
4. **Button & Control Affordances**:
   - High-tactility mechanical click feel (`active:scale-[0.98] transition-all`).
   - Monospaced badge counters.
   - Precision slider and toggle switches.
