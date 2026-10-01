// A tiny pixel canvas for making pixel art in code, plus a PNG writer.
// Used by the art scripts in this folder; never part of the game itself.

import { deflateSync } from 'node:zlib';

export type Rgb = [number, number, number];

export function hex(colour: string): Rgb {
  const n = parseInt(colour.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function mix(a: Rgb, b: Rgb, t: number): Rgb {
  return [0, 1, 2].map((i) => Math.round(a[i] + (b[i] - a[i]) * t)) as Rgb;
}

/** An RGBA image. Pixels outside it are quietly ignored. */
export class Pixels {
  readonly data: Uint8Array;
  constructor(
    readonly width: number,
    readonly height: number,
  ) {
    this.data = new Uint8Array(width * height * 4);
  }

  set(x: number, y: number, colour: Rgb, alpha = 255): void {
    x = Math.floor(x);
    y = Math.floor(y);
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
    const i = (y * this.width + x) * 4;
    if (alpha >= 255) {
      this.data.set([colour[0], colour[1], colour[2], 255], i);
      return;
    }
    // Blend over what's there.
    const a = alpha / 255;
    for (let c = 0; c < 3; c++) this.data[i + c] = Math.round(this.data[i + c] * (1 - a) + colour[c] * a);
    this.data[i + 3] = Math.max(this.data[i + 3], alpha);
  }

  get(x: number, y: number): Rgb | null {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return null;
    const i = (y * this.width + x) * 4;
    return this.data[i + 3] === 0 ? null : [this.data[i], this.data[i + 1], this.data[i + 2]];
  }

  filled(x: number, y: number): boolean {
    return this.get(x, y) !== null;
  }

  fillRect(x: number, y: number, w: number, h: number, colour: Rgb): void {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, colour);
  }

  /** Copies another image on top of this one at (dx, dy). */
  draw(other: Pixels, dx: number, dy: number): void {
    for (let y = 0; y < other.height; y++) {
      for (let x = 0; x < other.width; x++) {
        const c = other.get(x, y);
        if (c) this.set(dx + x, dy + y, c);
      }
    }
  }

  /** A 1-pixel outline around everything drawn so far. */
  outline(colour: Rgb): void {
    const edge: [number, number][] = [];
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.filled(x, y)) continue;
        if (this.filled(x - 1, y) || this.filled(x + 1, y) || this.filled(x, y - 1) || this.filled(x, y + 1)) edge.push([x, y]);
      }
    }
    for (const [x, y] of edge) this.set(x, y, colour);
  }

  /** A bigger copy with every pixel turned into a scale×scale block. */
  scaled(scale: number): Pixels {
    const out = new Pixels(this.width * scale, this.height * scale);
    for (let y = 0; y < out.height; y++) {
      for (let x = 0; x < out.width; x++) {
        const i = (Math.floor(y / scale) * this.width + Math.floor(x / scale)) * 4;
        out.data.set(this.data.subarray(i, i + 4), (y * out.width + x) * 4);
      }
    }
    return out;
  }
}

// ---------- PNG ----------

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (const b of bytes) c = CRC_TABLE[(c ^ b) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, body: Uint8Array): Buffer {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(body.length, 0);
  head.write(type, 4, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), body])), 0);
  return Buffer.concat([head, body, crc]);
}

export function encodePng(image: Pixels): Buffer {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(image.width, 0);
  header.writeUInt32BE(image.height, 4);
  header.set([8, 6, 0, 0, 0], 8); // 8-bit RGBA
  const rows = Buffer.alloc((image.width * 4 + 1) * image.height);
  for (let y = 0; y < image.height; y++) {
    rows[y * (image.width * 4 + 1)] = 0;
    rows.set(image.data.subarray(y * image.width * 4, (y + 1) * image.width * 4), y * (image.width * 4 + 1) + 1);
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(rows)),
    chunk('IEND', new Uint8Array(0)),
  ]);
}
