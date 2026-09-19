/**
 * Procedural Industrial PCB & Assembly Test Sample Generator
 * Generates pristine golden references and realistic defect samples (cracks, pinholes, structural defects)
 * directly in an HTML5 canvas and converts to Blob/File for FastAPI engine testing.
 */

export type SampleType = 
  | "clean_pcb"
  | "crack_scratch"
  | "pinhole_void"
  | "structural_deformation"
  | "pill_blister_missing";

export interface SamplePreset {
  id: SampleType;
  name: string;
  category: string;
  description: string;
  expectedDefect: string;
}

export const SAMPLE_PRESETS: SamplePreset[] = [
  {
    id: "clean_pcb",
    name: "Golden Reference Standard (PCB-A1)",
    category: "Pristine Standard",
    description: "Flawless SMD circuit board with clean copper traces, IC package, and aligned solder pads.",
    expectedDefect: "0 Defects (PASS)",
  },
  {
    id: "crack_scratch",
    name: "Surface Scratch / Hairline Crack",
    category: "Surface Flaw",
    description: "Deep diagonal scratch across primary power bus traces causing potential open circuit.",
    expectedDefect: "scratch_or_crack",
  },
  {
    id: "pinhole_void",
    name: "Solder Pinhole / Copper Void",
    category: "Solder Flaw",
    description: "Micro pinhole & void defect on ground plane pad reducing contact area.",
    expectedDefect: "pinhole_or_void",
  },
  {
    id: "structural_deformation",
    name: "SMD Chip Misalignment / Blob",
    category: "Geometric Flaw",
    description: "Rotated SMD resistor package and foreign solder bridge between pin headers.",
    expectedDefect: "structural_deformation",
  },
  {
    id: "pill_blister_missing",
    name: "Packaging Blister Pack Void",
    category: "Packaging Line",
    description: "Empty blister cavity and crushed foil seal in pharmaceutical packaging.",
    expectedDefect: "pinhole_or_void / structural_deformation",
  }
];

export function generateSampleCanvas(type: SampleType, width = 640, height = 480): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  if (type.startsWith("pill_")) {
    drawPillBlister(ctx, width, height, type === "pill_blister_missing");
  } else {
    drawPcbBoard(ctx, width, height, type);
  }

  return canvas;
}

function drawPcbBoard(
  ctx: CanvasRenderingContext2D, 
  w: number, 
  h: number, 
  defectType: SampleType
) {
  // 1. PCB Substrate (Deep emerald/forest green)
  ctx.fillStyle = "#0c3b24";
  ctx.fillRect(0, 0, w, h);

  // Subtle PCB texture
  ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
  for (let i = 0; i < w; i += 8) {
    ctx.fillRect(i, 0, 1, h);
  }

  // 2. Copper Ground Planes & Silkscreen Border
  ctx.strokeStyle = "#145a32";
  ctx.lineWidth = 4;
  ctx.strokeRect(20, 20, w - 40, h - 40);

  // Silkscreen markings
  ctx.fillStyle = "#e2e8f0";
  ctx.font = "bold 13px monospace";
  ctx.fillText("OPENCV5-AOI-TEST-REV3.2", 35, 45);
  ctx.fillText("U1_MAIN_FPGA", 180, 140);
  ctx.fillText("C10  C11  C12", 420, 100);
  ctx.fillText("J1_HIGH_SPEED_BUS", 35, h - 35);

  // 3. Copper Traces (Gold/Bronze traces)
  ctx.strokeStyle = "#d4af37";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";

  // Bus traces
  for (let i = 0; i < 5; i++) {
    const y = 80 + i * 16;
    ctx.beginPath();
    ctx.moveTo(35, y);
    ctx.lineTo(160, y);
    ctx.lineTo(200, y + 40);
    ctx.lineTo(240, y + 40);
    ctx.stroke();
  }

  for (let i = 0; i < 4; i++) {
    const y = 300 + i * 18;
    ctx.beginPath();
    ctx.moveTo(400, y);
    ctx.lineTo(500, y);
    ctx.lineTo(540, y - 30);
    ctx.lineTo(600, y - 30);
    ctx.stroke();
  }

  // 4. Central IC Chip (QFP Package)
  const icX = 240;
  const icY = 160;
  const icW = 160;
  const icH = 160;

  // IC Body (matte black)
  ctx.fillStyle = "#18181b";
  ctx.fillRect(icX, icY, icW, icH);
  ctx.strokeStyle = "#3f3f46";
  ctx.lineWidth = 2;
  ctx.strokeRect(icX, icY, icW, icH);

  // IC Pin 1 indicator dot
  ctx.fillStyle = "#a1a1aa";
  ctx.beginPath();
  ctx.arc(icX + 16, icY + 16, 4, 0, Math.PI * 2);
  ctx.fill();

  // IC Laser Etching text
  ctx.fillStyle = "#71717a";
  ctx.font = "bold 11px monospace";
  ctx.textAlign = "center";
  ctx.fillText("CV5-NEURAL-DSP", icX + icW / 2, icY + 70);
  ctx.fillText("ARM64 1.8GHz", icX + icW / 2, icY + 90);
  ctx.fillText("LOT #2026-X8", icX + icW / 2, icY + 110);
  ctx.textAlign = "start";

  // IC Pins (Silver/Tin Leads)
  ctx.fillStyle = "#cbd5e1";
  const numPins = 12;
  const pinStep = icW / (numPins + 1);

  for (let i = 1; i <= numPins; i++) {
    // Top & Bottom pins
    ctx.fillRect(icX + i * pinStep - 2, icY - 12, 5, 12);
    ctx.fillRect(icX + i * pinStep - 2, icY + icH, 5, 12);
    // Left & Right pins
    ctx.fillRect(icX - 12, icY + i * pinStep - 2, 12, 5);
    ctx.fillRect(icX + icW, icY + i * pinStep - 2, 12, 5);
  }

  // 5. SMD Capacitors & Resistors (Solder pads)
  const smdComponents = [
    { x: 440, y: 120, w: 28, h: 14, color: "#b45309" },
    { x: 480, y: 120, w: 28, h: 14, color: "#b45309" },
    { x: 520, y: 120, w: 28, h: 14, color: "#b45309" },
    { x: 100, y: 260, w: 32, h: 16, color: "#0284c7" },
    { x: 100, y: 300, w: 32, h: 16, color: "#0284c7" },
    { x: 100, y: 340, w: 32, h: 16, color: "#0284c7" },
    { x: 440, y: 380, w: 40, h: 20, color: "#334155" },
    { x: 500, y: 380, w: 40, h: 20, color: "#334155" },
  ];

  smdComponents.forEach((comp) => {
    // Solder pads
    ctx.fillStyle = "#94a3b8";
    ctx.fillRect(comp.x - 4, comp.y, 4, comp.h);
    ctx.fillRect(comp.x + comp.w, comp.y, 4, comp.h);
    // Component body
    ctx.fillStyle = comp.color;
    ctx.fillRect(comp.x, comp.y, comp.w, comp.h);
  });

  // 6. INJECT INTENTIONAL DEFECTS ACCORDING TO PRESET
  if (defectType === "crack_scratch") {
    // Sharp high-contrast black/dark-red gouge cutting across the bus traces
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(70, 70);
    ctx.lineTo(130, 150);
    ctx.lineTo(180, 160);
    ctx.stroke();

    // Additional secondary fracture
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(110, 120);
    ctx.lineTo(145, 175);
    ctx.stroke();
  } else if (defectType === "pinhole_void") {
    // Solder voids / pinhole spots on pads
    ctx.fillStyle = "#020617";
    ctx.beginPath();
    ctx.arc(442, 127, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(522, 125, 5, 0, Math.PI * 2);
    ctx.fill();

    // Copper void on ground plane
    ctx.beginPath();
    ctx.arc(120, 200, 7, 0, Math.PI * 2);
    ctx.fill();
  } else if (defectType === "structural_deformation") {
    // Displaced component / Huge solder bridge defect
    ctx.fillStyle = "#94a3b8";
    // Solder bridge shorting pins
    ctx.beginPath();
    ctx.ellipse(icX + 60, icY + icH + 5, 18, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Solder spatter blob
    ctx.beginPath();
    ctx.arc(480, 220, 16, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPillBlister(
  ctx: CanvasRenderingContext2D, 
  w: number, 
  h: number, 
  hasMissingPill: boolean
) {
  // Foil Blister Pack Background
  ctx.fillStyle = "#e2e8f0";
  ctx.fillRect(0, 0, w, h);

  // Metallic crosshatch texture
  ctx.fillStyle = "rgba(148, 163, 184, 0.2)";
  for (let i = 0; i < w; i += 6) {
    ctx.fillRect(i, 0, 2, h);
  }
  for (let j = 0; j < h; j += 6) {
    ctx.fillRect(0, j, w, 2);
  }

  // Header branding
  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 14px monospace";
  ctx.fillText("PHARMA-INSPECT: LOT-B4409", 40, 45);

  // Blister cavities (2 rows x 4 cols)
  const rows = 2;
  const cols = 4;
  const startX = 60;
  const startY = 80;
  const colSpacing = 135;
  const rowSpacing = 170;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = startX + c * colSpacing;
      const cy = startY + r * rowSpacing;

      const isDefectCell = hasMissingPill && r === 1 && c === 2;

      // Blister ring
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx + 40, cy + 50, 42, 0, Math.PI * 2);
      ctx.stroke();

      if (isDefectCell) {
        // Crushed empty cavity with black tear
        ctx.fillStyle = "#64748b";
        ctx.beginPath();
        ctx.arc(cx + 40, cy + 50, 36, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "#09090b";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(cx + 20, cy + 40);
        ctx.lineTo(cx + 60, cy + 60);
        ctx.stroke();
      } else {
        // Pristine white tablet with score line
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(cx + 40, cy + 50, 34, 0, Math.PI * 2);
        ctx.fill();

        // Shadow & relief
        ctx.strokeStyle = "#cbd5e1";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Tablet score line
        ctx.strokeStyle = "#94a3b8";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx + 40, cy + 22);
        ctx.lineTo(cx + 40, cy + 78);
        ctx.stroke();
      }
    }
  }
}

export async function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Canvas conversion to Blob failed"));
    }, "image/jpeg", 0.95);
  });
}

export async function getSamplePresetBlob(type: SampleType): Promise<{ blob: Blob; dataUrl: string }> {
  const canvas = generateSampleCanvas(type);
  const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
  const blob = await canvasToBlob(canvas);
  return { blob, dataUrl };
}
