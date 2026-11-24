// Front page for Tuesday 24 November 2026, drawn from scratch by this program.
//
// The program renders a newspaper front page pixel by pixel — masthead, lead
// headline, deck, and four illustrated story panels — into a 1024x1024 RGB
// framebuffer, encodes it as a PNG with the standard library only, and writes
// it to $MAKEFUN_OUTPUT_DIR/entry.png (default /output). No network, no
// bundled image file, no randomness: the same code always produces the same
// bytes. After writing, the output is read back, compared byte for byte with
// what was encoded, and checked against the competition caps (at most 1 MiB,
// at most 1024x1024); any mismatch fails loudly instead of silently leaving
// a broken entry behind.
//
// The stories are the real news of Tuesday 24 November 2026, researched live
// before this program was written:
//   - lead: Ukraine sinks the Russian corvette Merkury in Benghazi, Libya,
//     with seven sea drones, and hits the cargo ship MV Angara; a day
//     earlier drones set fire to the Russian cargo ship Sparta II in the
//     Gulf of Finland, so the war is spreading far beyond Europe;
//   - Nvidia's Jensen Huang returns as CEO after Donald Trump intervenes,
//     and Nvidia's value jumps by almost $1tn as tech stocks rally;
//   - the death toll in the Indonesia candy-factory fire reaches 24, with
//     rescuers still searching for the missing;
//   - Russian strikes on Ukraine's Kyiv region kill at least 14, and NATO
//     sends AWACS early-warning aircraft to Poland; also, South Korea briefly
//     issues an evacuation warning after a Russian aircraft enters its
//     airspace.
//
// Node 22, standard library only. Run it with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { join } from 'node:path';

const W = 1024;
const H = 1024;
const MAX_BYTES = 1024 * 1024;
const OUT_DIR = process.env.MAKEFUN_OUTPUT_DIR || '/output';

type RGB = [number, number, number];
const PAPER: RGB = [252, 250, 244];
const INK: RGB = [18, 18, 20];
const RED: RGB = [176, 32, 32];
const WHITE: RGB = [255, 255, 255];
const GREY: RGB = [110, 110, 108];
const DARK: RGB = [28, 30, 38];
const NAVY: RGB = [24, 48, 84];
const STEEL: RGB = [96, 128, 160];
const SKY: RGB = [168, 184, 200];
const TEAL: RGB = [16, 84, 88];
const CHIP: RGB = [8, 24, 30];
const ORANGE: RGB = [214, 96, 32];
const EMBER: RGB = [240, 164, 48];
const SMOKE: RGB = [140, 140, 136];
const GREEN: RGB = [24, 120, 72];

// 5x7 pixel font, one row per string, '#' is ink, '.' is clear. Only the
// capitals, digits and punctuation this front page needs.
const GLYPHS: Record<string, string[]> = {
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
  C: ['.####', '#....', '#....', '#....', '#....', '#....', '.####'],
  D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
  F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
  G: ['.####', '#....', '#....', '#.###', '#...#', '#...#', '.###.'],
  H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  I: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '#####'],
  J: ['..###', '...#.', '...#.', '...#.', '...#.', '#..#.', '.##..'],
  K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
  L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
  N: ['#...#', '##..#', '##..#', '#.#.#', '#..##', '#..##', '#...#'],
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  Q: ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'],
  R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  V: ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
  W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '##.##', '#...#'],
  X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
  Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
  Z: ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
  '0': ['.###.', '#..##', '#.#.#', '##..#', '#...#', '#...#', '.###.'],
  '1': ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  '2': ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'],
  '3': ['####.', '....#', '....#', '.###.', '....#', '....#', '####.'],
  '4': ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'],
  '5': ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
  '6': ['.###.', '#....', '#....', '####.', '#...#', '#...#', '.###.'],
  '7': ['#####', '....#', '...#.', '...#.', '..#..', '..#..', '..#..'],
  '8': ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
  '9': ['.###.', '#...#', '#...#', '.####', '....#', '....#', '.###.'],
  ' ': ['.....', '.....', '.....', '.....', '.....', '.....', '.....'],
  '-': ['.....', '.....', '.....', '#####', '.....', '.....', '.....'],
  '.': ['.....', '.....', '.....', '.....', '.....', '.##..', '.##..'],
  ',': ['.....', '.....', '.....', '.....', '.##..', '.##..', '.#...'],
  "'": ['..#..', '..#..', '..#..', '.....', '.....', '.....', '.....'],
  ':': ['.....', '.##..', '.##..', '.....', '.##..', '.##..', '.....'],
  '!': ['..#..', '..#..', '..#..', '..#..', '..#..', '.....', '..#..'],
  '?': ['.###.', '#...#', '....#', '...#.', '..#..', '.....', '..#..'],
  '$': ['..#..', '.####', '#.#.#', '.###.', '..#.#', '####.', '..#..'],
};

// --- framebuffer helpers -------------------------------------------------

function makeCanvas(): Buffer {
  return Buffer.alloc(W * H * 3);
}

function put(fb: Buffer, x: number, y: number, c: RGB): void {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  fb[i] = c[0];
  fb[i + 1] = c[1];
  fb[i + 2] = c[2];
}

function fill(fb: Buffer, x: number, y: number, w: number, h: number, c: RGB): void {
  const x0 = Math.max(0, x);
  const y0 = Math.max(0, y);
  const x1 = Math.min(W, x + w);
  const y1 = Math.min(H, y + h);
  for (let yy = y0; yy < y1; yy++) {
    for (let xx = x0; xx < x1; xx++) {
      const i = (yy * W + xx) * 3;
      fb[i] = c[0];
      fb[i + 1] = c[1];
      fb[i + 2] = c[2];
    }
  }
}

function disc(fb: Buffer, cx: number, cy: number, r: number, c: RGB): void {
  for (let y = cy - r; y <= cy + r; y++) {
    for (let x = cx - r; x <= cx + r; x++) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= r * r) put(fb, x, y, c);
    }
  }
}

function ring(fb: Buffer, cx: number, cy: number, r: number, t: number, c: RGB): void {
  for (let y = cy - r - t; y <= cy + r + t; y++) {
    for (let x = cx - r - t; x <= cx + r + t; x++) {
      const d = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy));
      if (d >= r - t && d <= r + t) put(fb, x, y, c);
    }
  }
}

function textWidth(s: string, scale: number): number {
  return s.length * 6 * scale - scale;
}

function drawText(fb: Buffer, s: string, x: number, y: number, scale: number, c: RGB): void {
  let cx = x;
  for (const ch of s) {
    const g = GLYPHS[ch] || GLYPHS['?'];
    for (let r = 0; r < 7; r++) {
      for (let col = 0; col < 5; col++) {
        if (g[r][col] === '#') {
          fill(fb, cx + col * scale, y + r * scale, scale, scale, c);
        }
      }
    }
    cx += 6 * scale;
  }
}

function drawCentred(fb: Buffer, s: string, y: number, scale: number, c: RGB): void {
  drawText(fb, s, Math.floor((W - textWidth(s, scale)) / 2), y, scale, c);
}

function wrapText(s: string, scale: number, maxW: number): string[] {
  const words = s.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const trial = cur ? cur + ' ' + w : w;
    if (textWidth(trial, scale) <= maxW || !cur) {
      cur = trial;
    } else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

// --- PNG encoding (zlib + CRC32, standard library only) -------------------

const CRC_TABLE: number[] = (() => {
  const table: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table.push(c >>> 0);
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, 'ascii'), data])), 8 + data.length);
  return out;
}

function encodePng(fb: Buffer): Buffer {
  const raw = Buffer.alloc((W * 3 + 1) * H);
  for (let y = 0; y < H; y++) {
    raw[y * (W * 3 + 1)] = 0;
    fb.copy(raw, y * (W * 3 + 1) + 1, y * W * 3, (y + 1) * W * 3);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// --- story panels ----------------------------------------------------------

function drawHarbourPanel(fb: Buffer): void {
  // Lead illustration: the corvette Merkury burning in Benghazi harbour
  // after the sea-drone strike, with drones still closing in.
  const x0 = 32;
  const y0 = 332;
  const w = W - 64;
  // Night sky in three bands, then a dark harbour sea.
  fill(fb, x0, y0, w, 44, [12, 18, 34]);
  fill(fb, x0, y0 + 44, w, 40, [20, 34, 58]);
  fill(fb, x0, y0 + 84, w, 40, NAVY);
  fill(fb, x0, y0 + 124, w, 144, [18, 42, 72]);
  // Harbour lights along the far quay.
  for (let i = 0; i < 12; i++) {
    fill(fb, x0 + 36 + i * 78, y0 + 116, 6, 8, [250, 220, 90]);
  }
  // Smoke columns rising from the stricken corvette.
  fill(fb, x0 + 420, y0 + 14, 30, 110, SMOKE);
  fill(fb, x0 + 432, y0 + 2, 34, 44, [168, 168, 164]);
  fill(fb, x0 + 560, y0 + 30, 24, 94, SMOKE);
  // The corvette, listing low in the water, bridge picked out in white.
  fill(fb, x0 + 330, y0 + 152, 340, 30, [64, 74, 92]);
  fill(fb, x0 + 350, y0 + 130, 48, 24, WHITE);
  fill(fb, x0 + 358, y0 + 138, 32, 8, DARK);
  fill(fb, x0 + 610, y0 + 118, 8, 36, DARK);
  // Flames bursting from the corvette's deck.
  fill(fb, x0 + 440, y0 + 122, 22, 30, EMBER);
  fill(fb, x0 + 447, y0 + 106, 12, 16, [250, 220, 90]);
  fill(fb, x0 + 500, y0 + 128, 18, 24, EMBER);
  fill(fb, x0 + 505, y0 + 114, 10, 14, [250, 220, 90]);
  // A second, smaller ship — the MV Angara — further along the quay.
  fill(fb, x0 + 700, y0 + 160, 220, 24, [64, 74, 92]);
  fill(fb, x0 + 830, y0 + 142, 34, 20, WHITE);
  fill(fb, x0 + 760, y0 + 142, 14, 18, EMBER);
  // Three sea drones speeding in across the water, wakes behind them.
  for (let i = 0; i < 3; i++) {
    const dx = x0 + 90 + i * 90;
    const dy = y0 + 210 + (i % 2) * 22;
    fill(fb, dx, dy, 34, 10, WHITE);
    fill(fb, dx + 34, dy + 3, 22, 4, WHITE);
    fill(fb, dx - 44, dy + 4, 40, 2, [220, 228, 236]);
  }
  // White wave lines across the harbour.
  for (let i = 0; i < 9; i++) {
    fill(fb, x0 + 40 + i * 96, y0 + 196 + (i % 3) * 14, 64, 3, [220, 228, 236]);
  }
  // Caption strip: what the picture shows.
  fill(fb, x0, y0 + 224, w, 44, DARK);
  drawText(fb, 'SEVEN SEA DRONES SINK THE MERKURY', x0 + 16, y0 + 236, 3, WHITE);
}

function drawNvidiaPanel(fb: Buffer, x: number, y: number, w: number, h: number): void {
  // A green chip and a rising market line: Huang returns to Nvidia.
  fill(fb, x, y, w, h - 80, [10, 40, 30]);
  // Circuit traces across the panel.
  for (let i = 0; i < 5; i++) {
    fill(fb, x + 14, y + 16 + i * 30, w - 28, 2, [30, 96, 66]);
  }
  // The chip, centre left, pins on all four sides.
  const cx = x + 118;
  const cy = y + 92;
  for (let i = 0; i < 5; i++) {
    fill(fb, cx - 58, cy - 40 + i * 18, 16, 4, EMBER);
    fill(fb, cx + 42, cy - 40 + i * 18, 16, 4, EMBER);
    fill(fb, cx - 40 + i * 18, cy - 58, 4, 16, EMBER);
    fill(fb, cx - 40 + i * 18, cy + 42, 4, 16, EMBER);
  }
  fill(fb, cx - 44, cy - 44, 88, 88, CHIP);
  fill(fb, cx - 30, cy - 30, 60, 60, [14, 56, 44]);
  drawText(fb, 'AI', cx - 18, cy - 22, 3, EMBER);
  // Rising market line with an arrowhead, top right.
  fill(fb, x + 196, y + 120, 60, 5, GREEN);
  fill(fb, x + 238, y + 96, 5, 28, GREEN);
  fill(fb, x + 238, y + 72, 44, 5, GREEN);
  fill(fb, x + 262, y + 60, 20, 5, GREEN);
  fill(fb, x + 268, y + 46, 5, 20, GREEN);
  // Caption strip: the story in two lines.
  fill(fb, x, y + h - 80, w, 80, DARK);
  drawText(fb, 'HUANG RETURNS', x + 14, y + h - 68, 3, WHITE);
  drawText(fb, 'NVIDIA UP $1TN', x + 14, y + h - 44, 3, WHITE);
  drawText(fb, 'TRUMP INTERVENES', x + 14, y + h - 18, 2, [200, 200, 196]);
}

function drawFirePanel(fb: Buffer, x: number, y: number, w: number, h: number): void {
  // Flames and smoke over the candy factory in Indonesia.
  fill(fb, x, y, w, 60, [64, 40, 36]);
  fill(fb, x, y + 60, w, 60, [120, 52, 32]);
  fill(fb, x, y + 120, w, 60, ORANGE);
  // Smoke columns.
  fill(fb, x + 40, y + 8, 24, 84, SMOKE);
  fill(fb, x + 210, y + 20, 28, 72, SMOKE);
  // Factory silhouette: low block, sawtooth roof, tall chimney.
  fill(fb, x + 30, y + 128, 180, 52, DARK);
  fill(fb, x + 30, y + 112, 36, 16, DARK);
  fill(fb, x + 84, y + 112, 36, 16, DARK);
  fill(fb, x + 138, y + 112, 36, 16, DARK);
  fill(fb, x + 224, y + 84, 26, 96, DARK);
  // Flames licking from the roofline: stacked narrowing bars.
  fill(fb, x + 60, y + 92, 26, 20, EMBER);
  fill(fb, x + 66, y + 78, 14, 14, [250, 220, 90]);
  fill(fb, x + 150, y + 96, 22, 16, EMBER);
  fill(fb, x + 155, y + 84, 12, 12, [250, 220, 90]);
  // Caption strip: the story in two lines.
  fill(fb, x, y + h - 80, w, 80, DARK);
  drawText(fb, '24 DEAD IN', x + 14, y + h - 68, 3, WHITE);
  drawText(fb, 'FACTORY FIRE', x + 14, y + h - 44, 3, WHITE);
  drawText(fb, 'INDONESIA SEARCH GOES ON', x + 14, y + h - 18, 2, [200, 200, 196]);
}

function drawKyivPanel(fb: Buffer, x: number, y: number, w: number, h: number): void {
  // A Kyiv night skyline under attack: dark towers, orange blasts.
  fill(fb, x, y, w, h - 80, [14, 16, 30]);
  // Stars.
  for (let i = 0; i < 14; i++) {
    fill(fb, x + 18 + ((i * 53) % (w - 36)), y + 12 + ((i * 29) % 40), 3, 3, WHITE);
  }
  // City towers of different heights.
  fill(fb, x + 20, y + 90, 44, 90, DARK);
  fill(fb, x + 76, y + 60, 40, 120, [38, 40, 54]);
  fill(fb, x + 128, y + 100, 48, 80, DARK);
  fill(fb, x + 188, y + 70, 36, 110, [38, 40, 54]);
  fill(fb, x + 236, y + 104, 44, 76, DARK);
  // Lit windows.
  for (let i = 0; i < 10; i++) {
    fill(fb, x + 30 + ((i * 37) % 220), y + 100 + ((i * 23) % 60), 6, 6, [250, 220, 90]);
  }
  // Two explosion bursts over the skyline.
  disc(fb, x + 96, y + 52, 16, EMBER);
  disc(fb, x + 96, y + 52, 8, [250, 220, 90]);
  disc(fb, x + 210, y + 60, 12, ORANGE);
  disc(fb, x + 210, y + 60, 6, [250, 220, 90]);
  // Smoke drifting from the blasts.
  fill(fb, x + 110, y + 20, 22, 30, SMOKE);
  fill(fb, x + 222, y + 28, 18, 28, SMOKE);
  // Caption strip: the story in two lines.
  fill(fb, x, y + h - 80, w, 80, DARK);
  drawText(fb, 'KYIV REGION', x + 14, y + h - 68, 3, WHITE);
  drawText(fb, 'STRIKES KILL 14', x + 14, y + h - 44, 3, WHITE);
  drawText(fb, 'NATO AWACS TO POLAND', x + 14, y + h - 18, 2, [200, 200, 196]);
}

function drawBottomStrip(fb: Buffer): void {
  // One more story from the day, in a black strip along the foot.
  fill(fb, 32, 900, W - 64, 56, DARK);
  drawCentred(fb, 'ALSO: SOUTH KOREA WARNS AFTER RUSSIAN JET ENTERS ITS AIRSPACE', 918, 2, WHITE);
}

// --- front page ------------------------------------------------------------

function buildPage(): Buffer {
  const fb = makeCanvas();
  fill(fb, 0, 0, W, H, PAPER);

  // Masthead: the day, in full.
  drawCentred(fb, 'TUESDAY 24 NOVEMBER 2026', 34, 6, INK);
  fill(fb, 32, 92, W - 64, 6, RED);

  // Lead headline, two lines, left aligned like a broadsheet.
  drawText(fb, 'UKRAINE SINKS', 32, 116, 8, INK);
  drawText(fb, 'RUSSIAN WARSHIP', 32, 180, 8, INK);

  // Deck: what the sinking means, in one breath.
  const deck = wrapText(
    'SEVEN SEA DRONES SINK THE CORVETTE MERKURY IN BENGHAZI AND HIT A SECOND RUSSIAN SHIP, THE MV ANGARA',
    2,
    W - 64,
  );
  deck.forEach((line, i) => drawText(fb, line, 32, 252 + i * 18, 2, INK));
  fill(fb, 32, 318, W - 64, 2, INK);

  // Story panels.
  drawHarbourPanel(fb);
  drawNvidiaPanel(fb, 32, 620, 304, 260);
  drawFirePanel(fb, 360, 620, 304, 260);
  drawKyivPanel(fb, 688, 620, 304, 260);
  drawBottomStrip(fb);

  return fb;
}

function main(): void {
  const png = encodePng(buildPage());
  if (png.length > MAX_BYTES) {
    throw new Error(`entry.png is ${png.length} bytes, over the 1 MiB cap`);
  }
  // PNG header: width and height are big-endian uint32 at bytes 16 and 20.
  const w = png.readUInt32BE(16);
  const h = png.readUInt32BE(20);
  if (w > 1024 || h > 1024) {
    throw new Error(`entry.png is ${w}x${h}, over the 1024x1024 cap`);
  }

  mkdirSync(OUT_DIR, { recursive: true });
  const dest = join(OUT_DIR, 'entry.png');
  writeFileSync(dest, png);

  const written = readFileSync(dest);
  if (!written.equals(png)) throw new Error('output differs from the encoded image');
  if (statSync(dest).size !== png.length) throw new Error('output size mismatch');
}

main();
