// A tiny pixel canvas for drawing the game's pixel art in code, and turning it into
// an image the browser can show. No <canvas>: pixels go straight into a PNG file in memory.

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
      this.data[i] = colour[0];
      this.data[i + 1] = colour[1];
      this.data[i + 2] = colour[2];
      this.data[i + 3] = 255;
      return;
    }
    // Blend over what's there (on an empty pixel, just take the colour at that strength).
    const a = alpha / 255;
    const under = this.data[i + 3] / 255;
    for (let c = 0; c < 3; c++) {
      this.data[i + c] = under > 0 ? Math.round(this.data[i + c] * (1 - a) + colour[c] * a) : colour[c];
    }
    this.data[i + 3] = Math.round(255 * (a + under * (1 - a)));
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
        const i = (y * other.width + x) * 4;
        const alpha = other.data[i + 3];
        if (alpha === 0) continue;
        this.set(dx + x, dy + y, [other.data[i], other.data[i + 1], other.data[i + 2]], alpha);
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

  /** The same picture, mirrored left to right. */
  mirrored(): Pixels {
    const out = new Pixels(this.width, this.height);
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const from = (y * this.width + x) * 4;
        out.data.set(this.data.subarray(from, from + 4), (y * this.width + (this.width - 1 - x)) * 4);
      }
    }
    return out;
  }

  /** The smallest box around the drawn pixels, so sprites carry no empty margin. */
  bounds(): { x: number; y: number; width: number; height: number } | null {
    let x0 = this.width;
    let y0 = this.height;
    let x1 = -1;
    let y1 = -1;
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.data[(y * this.width + x) * 4 + 3] === 0) continue;
        x0 = Math.min(x0, x);
        y0 = Math.min(y0, y);
        x1 = Math.max(x1, x);
        y1 = Math.max(y1, y);
      }
    }
    return x1 < 0 ? null : { x: x0, y: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 };
  }

  /** A piece of this image. */
  crop(x: number, y: number, width: number, height: number): Pixels {
    const out = new Pixels(width, height);
    for (let j = 0; j < height; j++) {
      const from = ((y + j) * this.width + x) * 4;
      out.data.set(this.data.subarray(from, from + width * 4), j * width * 4);
    }
    return out;
  }
}

// ---------- PNG (uncompressed, which is fine for images that only live in memory) ----------

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(bytes: Uint8Array, start: number, end: number): number {
  let c = 0xffffffff;
  for (let i = start; i < end; i++) c = CRC_TABLE[(c ^ bytes[i]) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function adler32(bytes: Uint8Array): number {
  let a = 1;
  let b = 0;
  for (const byte of bytes) {
    a = (a + byte) % 65521;
    b = (b + a) % 65521;
  }
  return ((b << 16) | a) >>> 0;
}

/** Raw bytes wrapped as a zlib stream of "stored" (uncompressed) blocks. */
function zlibStored(raw: Uint8Array): Uint8Array {
  const blocks = Math.max(1, Math.ceil(raw.length / 65535));
  const out = new Uint8Array(2 + raw.length + blocks * 5 + 4);
  out[0] = 0x78;
  out[1] = 0x01;
  let at = 2;
  for (let i = 0; i < blocks; i++) {
    const part = raw.subarray(i * 65535, Math.min(raw.length, (i + 1) * 65535));
    out[at++] = i === blocks - 1 ? 1 : 0;
    out[at++] = part.length & 255;
    out[at++] = part.length >> 8;
    out[at++] = ~part.length & 255;
    out[at++] = (~part.length >> 8) & 255;
    out.set(part, at);
    at += part.length;
  }
  const check = adler32(raw);
  out.set([check >>> 24, (check >>> 16) & 255, (check >>> 8) & 255, check & 255], at);
  return out;
}

function chunk(type: string, body: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + body.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, body.length);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(body, 8);
  view.setUint32(8 + body.length, crc32(out, 4, 8 + body.length));
  return out;
}

/** The image as the bytes of a PNG file. */
export function pngBytes(image: Pixels): Uint8Array {
  const header = new Uint8Array(13);
  const view = new DataView(header.buffer);
  view.setUint32(0, image.width);
  view.setUint32(4, image.height);
  header.set([8, 6, 0, 0, 0], 8); // 8-bit RGBA
  const stride = image.width * 4 + 1;
  const rows = new Uint8Array(stride * image.height);
  for (let y = 0; y < image.height; y++) rows.set(image.data.subarray(y * image.width * 4, (y + 1) * image.width * 4), y * stride + 1);
  const parts = [
    new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header),
    chunk('IDAT', zlibStored(rows)),
    chunk('IEND', new Uint8Array(0)),
  ];
  const out = new Uint8Array(parts.reduce((sum, p) => sum + p.length, 0));
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}

/** A URL the browser can show in an <img>. Revoke it when the picture is no longer needed. */
export function imageUrl(image: Pixels): string {
  return URL.createObjectURL(new Blob([pngBytes(image) as BlobPart], { type: 'image/png' }));
}
